import { NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';
import { fetchRepoDetails } from 'services/githubService';

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

        // Fetch all MCPs with repository info
        const { data: mcps, error: fetchError } = await supabase
            .from('mcps')
            .select('id, repository_url, owner_username, repository_name')
            .order('created_at', { ascending: false });

        if (fetchError) {
            throw new Error(`Failed to fetch MCPs: ${fetchError.message}`);
        }

        // Log start of the process
        const startTime = new Date();
        console.log(`Starting star count refresh for ${mcps.length} MCPs at ${startTime.toISOString()}`);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Process each MCP - We'll process them sequentially to avoid GitHub API rate limits
        for (const mcp of mcps) {
            try {
                // Skip if missing required repository info
                if (!mcp.owner_username || !mcp.repository_name) {
                    console.log(`Skipping MCP ${mcp.id}: Missing repository info`);
                    continue;
                }

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

                // Add a small delay to prevent hitting GitHub API rate limits
                await new Promise(resolve => setTimeout(resolve, 500));
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

                // Continue with the next MCP even if one fails
            }
        }

        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;

        // Log completion
        console.log(`Completed star count refresh at ${endTime.toISOString()}.`);
        console.log(`Total processed: ${mcps.length}, Successful: ${successCount}, Failed: ${errorCount}, Duration: ${duration}s`);

        // Record the execution in admin_logs
        await supabase.from('admin_logs').insert({
            action: 'refresh_star_counts',
            admin_id: null, // System action
            details: {
                total: mcps.length,
                successful: successCount,
                failed: errorCount,
                duration_seconds: duration,
                timestamp: endTime.toISOString()
            }
        });

        return NextResponse.json({
            success: true,
            message: `Updated star counts for ${successCount} MCPs. Failed: ${errorCount}.`,
            details: {
                total: mcps.length,
                successful: successCount,
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