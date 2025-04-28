import { NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';
import { fetchRepoDetails, invalidateGitHubCache, fetchReadmeFromGitHub } from 'services/githubService';
import { Redis } from '@upstash/redis';
import lunr from 'lunr';
import { CACHE_REGIONS } from 'utils/cacheUtils';

// Initialize Upstash Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Define an interface for error tracking
interface RefreshError {
    mcpId: string;
    error: string;
}

// This endpoint refreshes GitHub star counts and READMEs for all MCPs
export async function POST(request: Request) {
    try {
        // Check if it's a valid API key request
        // Note: Implement proper authorization if needed
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : undefined;
        const forceFresh = searchParams.get('forceFresh') === 'true';

        // Default and max batch sizes
        const defaultBatchSize = 5;
        const maxBatchSize = 10;
        const validBatchSize = limit ? Math.min(limit, maxBatchSize) : defaultBatchSize;

        // Base query to fetch MCPs
        let query = supabase.from('mcps').select('id, owner_username, repository_name, last_repo_update, last_refreshed');

        if (!forceFresh) {
            // Only fetch repos that haven't been updated in the last 24 hours (changed from 6 hours)
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
            query = query.lt('last_repo_update', twentyFourHoursAgo.toISOString());
        }

        // Add ordering by last update - refresh older ones first
        query = query.order('last_repo_update', { ascending: true });

        // Apply limit if specified
        if (limit) {
            query = query.limit(limit);
        }

        const { data: mcps, error: fetchError } = await query;

        if (fetchError) {
            throw new Error(`Failed to fetch MCPs: ${fetchError.message}`);
        }

        console.log(`Found ${mcps.length} MCPs to process`);

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        let readmeUpdatedCount = 0;
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

                    // Invalidate the GitHub cache to ensure fresh data
                    invalidateGitHubCache(mcp.owner_username, mcp.repository_name);

                    // Fetch the latest repository details from GitHub
                    const repoDetails = await fetchRepoDetails(mcp.owner_username, mcp.repository_name);

                    // Fetch the latest README content
                    const readme = await fetchReadmeFromGitHub(mcp.owner_username, mcp.repository_name);

                    // Update the MCP with the new star count and README
                    const { error: updateError } = await supabase
                        .from('mcps')
                        .update({
                            stars: repoDetails.stargazers_count,
                            forks: repoDetails.forks_count,
                            open_issues: repoDetails.open_issues_count,
                            readme: readme,
                            last_refreshed: new Date().toISOString(),
                            last_repo_update: new Date().toISOString() // Use current time to prevent race conditions
                        })
                        .eq('id', mcp.id);

                    if (updateError) {
                        throw new Error(`Failed to update MCP ${mcp.id}: ${updateError.message}`);
                    }

                    successCount++;
                    readmeUpdatedCount++;
                    console.log(`Updated repository metrics and README for MCP ${mcp.id}: ${mcp.owner_username}/${mcp.repository_name}`);

                } catch (error) {
                    errorCount++;
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error(`Error updating MCP ${mcp.id}:`, errorMessage);
                    errors.push({
                        mcpId: mcp.id,
                        error: errorMessage
                    });
                }
            });

            // Wait for all promises in this batch to resolve
            await Promise.all(batchPromises);
        }

        // After refreshing MCPs, update the search index
        await updateSearchIndex();

        return NextResponse.json({
            success: true,
            message: `GitHub metrics and README refresh completed. Processed ${mcps.length} MCPs: ${successCount} updated, ${readmeUpdatedCount} READMEs refreshed, ${skippedCount} skipped, ${errorCount} errors. Search index updated.`,
            stats: {
                total: mcps.length,
                success: successCount,
                readmeUpdated: readmeUpdatedCount,
                skipped: skippedCount,
                errors: errorCount
            },
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Error in refresh-stars endpoint:', error);
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'An unknown error occurred',
        }, { status: 500 });
    }
}

/**
 * Function to update the Lunr search index and store it in Upstash
 */
async function updateSearchIndex() {
    try {
        console.log('Building Lunr search index...');

        // Fetch all MCPs for indexing
        const { data: mcps, error } = await supabase
            .from('mcps')
            .select(`
                id, 
                name, 
                description, 
                owner_username,
                repository_name,
                tags,
                author,
                stars,
                forks,
                avg_rating,
                review_count
            `);

        if (error) {
            throw new Error(`Failed to fetch MCPs for indexing: ${error.message}`);
        }

        if (!mcps || mcps.length === 0) {
            console.log('No MCPs found to index');
            return;
        }

        console.log(`Indexing ${mcps.length} MCPs`);

        // Build the Lunr index
        const index = lunr(function (this: lunr.Builder) {
            // Define fields with their boost values
            this.field('name', { boost: 10 });
            this.field('description', { boost: 5 });
            this.field('owner_username', { boost: 2 });
            this.field('repository_name', { boost: 2 });
            this.field('tags', { boost: 3 });
            this.field('author', { boost: 2 });

            // Add ref for document lookup
            this.ref('id');

            // Add documents to the index
            mcps.forEach(mcp => {
                const indexDoc = {
                    id: mcp.id,
                    name: mcp.name || '',
                    description: mcp.description || '',
                    owner_username: mcp.owner_username || '',
                    repository_name: mcp.repository_name || '',
                    tags: Array.isArray(mcp.tags) ? mcp.tags.join(' ') : (mcp.tags || ''),
                    author: mcp.author || ''
                };

                this.add(indexDoc);
            });
        });

        // Serialize the index
        const serializedIndex = JSON.stringify(index);

        // Store search documents for retrieval when displaying results
        const documents = mcps.reduce((acc, mcp) => {
            acc[mcp.id] = {
                id: mcp.id,
                name: mcp.name,
                description: mcp.description,
                owner_username: mcp.owner_username,
                repository_name: mcp.repository_name,
                tags: mcp.tags,
                author: mcp.author,
                stars: mcp.stars,
                forks: mcp.forks,
                avg_rating: mcp.avg_rating,
                review_count: mcp.review_count
            };
            return acc;
        }, {} as Record<string, any>);

        // Save both the index and documents to Upstash
        await redis.set(`${CACHE_REGIONS.SEARCH}:lunr-index`, serializedIndex);
        await redis.set(`${CACHE_REGIONS.SEARCH}:lunr-documents`, JSON.stringify(documents));

        // Set metadata about the index
        await redis.set(`${CACHE_REGIONS.SEARCH}:lunr-meta`, JSON.stringify({
            lastUpdated: new Date().toISOString(),
            documentCount: mcps.length
        }));

        console.log(`Successfully built and stored Lunr index with ${mcps.length} documents`);
        return true;

    } catch (error) {
        console.error('Error updating search index:', error);
        return false;
    }
}