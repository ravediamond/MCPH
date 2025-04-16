import { NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';
import { fetchRepoDetails, invalidateGitHubCache } from 'services/githubService';

// Define an interface for error tracking
interface RefreshError {
    mcpId: string;
    error: string;
}

// This endpoint refreshes GitHub star counts for all MCPs
export async function POST(request: Request) {
    try {
        // Authenticate the request - in production you might want to use a secure API key
        const { searchParams } = new URL(request.url);
        const apiKey = searchParams.get('apiKey');

        // Simple API key check - you should use a more secure method in production
        const validApiKey = process.env.STARS_UPDATE_API_KEY;
        if (!validApiKey || apiKey !== validApiKey) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get optional parameters for more flexible operation
        const priorityOnly = searchParams.get('priorityOnly') === 'true';
        const batchSize = parseInt(searchParams.get('batchSize') || '25', 10);
        const validBatchSize = Math.min(Math.max(1, batchSize), 100); // Between 1 and 100
        const minStars = parseInt(searchParams.get('minStars') || '0', 10);

        // Log start of the process
        const startTime = new Date();
        console.log(`Starting star count refresh at ${startTime.toISOString()} with parameters:`, {
            priorityOnly,
            batchSize: validBatchSize,
            minStars
        });

        // Fetch MCPs with repository info
        let query = supabase
            .from('mcps')
            .select('id, repository_url, owner_username, repository_name, view_count, stars, last_repo_update');

        // If priorityOnly is true, prioritize popular and recently viewed MCPs
        if (priorityOnly) {
            query = query
                .or(`view_count.gt.10,stars.gt.${minStars}`)  // Popular by views or stars
                .order('view_count', { ascending: false });    // Most viewed first
        } else {
            // Otherwise, just filter by minimum stars if specified
            if (minStars > 0) {
                query = query.gt('stars', minStars);
            }

            // Add ordering by last update - refresh older ones first
            query = query.order('last_repo_update', { ascending: true });
        }

        const { data: mcps, error: fetchError } = await query;

        if (fetchError) {
            throw new Error(`Failed to fetch MCPs: ${fetchError.message}`);
        }

        console.log(`Found ${mcps.length} MCPs to process`);

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        const errors: RefreshError[] = []; // Explicitly typed array

        // Process MCPs in batches to limit concurrency
        for (let i = 0; i < mcps.length; i += validBatchSize) {
            const batch = mcps.slice(i, i + validBatchSize);

            // Log batch progress
            console.log(`Processing batch ${Math.floor(i / validBatchSize) + 1}/${Math.ceil(mcps.length / validBatchSize)}`);

            // Process batch with controlled concurrency
            const batchPromises = batch.map(async mcp => {
                try {
                    // Skip if missing required repository info
                    if (!mcp.owner_username || !mcp.repository_name) {
                        console.log(`Skipping MCP ${mcp.id}: Missing repository info`);
                        skippedCount++;
                        return;
                    }

                    // Check if this repo was updated recently (within the last 6 hours)
                    // GitHub doesn't update stats more frequently than this anyway
                    const sixHoursAgo = new Date();
                    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

                    if (mcp.last_repo_update && new Date(mcp.last_repo_update) > sixHoursAgo) {
                        console.log(`Skipping MCP ${mcp.id}: Recently updated (${mcp.last_repo_update})`);
                        skippedCount++;
                        return;
                    }

                    // Invalidate the GitHub cache to ensure fresh data
                    invalidateGitHubCache(mcp.owner_username, mcp.repository_name);

                    // Fetch the latest repository details from GitHub
                    const repoDetails = await fetchRepoDetails(mcp.owner_username, mcp.repository_name);

                    // Update the MCP with the new star count
                    const { error: updateError } = await supabase
                        .from('mcps')
                        .update({
                            stars: repoDetails.stargazers_count,
                            forks: repoDetails.forks_count,
                            open_issues: repoDetails.open_issues_count,
                            last_repo_update: repoDetails.updated_at
                        })
                        .eq('id', mcp.id);

                    if (updateError) {
                        throw new Error(`Failed to update MCP ${mcp.id}: ${updateError.message}`);
                    }

                    successCount++;
                } catch (err) {
                    errorCount++;
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    console.error(`Error updating MCP ${mcp.id}:`, errorMessage);
                    errors.push({ mcpId: mcp.id, error: errorMessage });

                    // Log the error to the database
                    try {
                        await supabase.from('error_logs').insert({
                            type: 'Star Count Update',
                            message: `Failed to update star count for MCP ${mcp.id}`,
                            details: errorMessage
                        });
                    } catch (logError) {
                        console.error('Failed to log error:', logError);
                    }
                }
            });

            // Wait for all promises in this batch to complete
            await Promise.all(batchPromises);

            // Add a small delay between batches to prevent rate limiting
            if (i + validBatchSize < mcps.length) {
                console.log('Waiting a moment before processing next batch...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;

        // Log completion
        console.log(`Completed star count refresh at ${endTime.toISOString()}.`);
        console.log(`Total processed: ${mcps.length}, Successful: ${successCount}, Skipped: ${skippedCount}, Failed: ${errorCount}, Duration: ${duration}s`);

        // Record the execution in admin_logs
        await supabase.from('admin_logs').insert({
            action: 'refresh_star_counts',
            admin_id: null, // System action
            details: {
                total: mcps.length,
                successful: successCount,
                skipped: skippedCount,
                failed: errorCount,
                duration_seconds: duration,
                timestamp: endTime.toISOString(),
                batch_size: validBatchSize,
                priority_only: priorityOnly
            }
        });

        return NextResponse.json({
            success: true,
            message: `Updated star counts for ${successCount} MCPs. Skipped: ${skippedCount}. Failed: ${errorCount}.`,
            details: {
                total: mcps.length,
                successful: successCount,
                skipped: skippedCount,
                failed: errorCount,
                errors: errors.length > 0 ? errors : undefined,
                duration_seconds: duration
            }
        });
    } catch (error) {
        console.error('Error in refresh-stars endpoint:', error);
        return NextResponse.json(
            { error: 'Failed to refresh star counts', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}