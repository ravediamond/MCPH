import { NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';
import { Redis } from '@upstash/redis';
import lunr from 'lunr';
import { CACHE_REGIONS } from 'utils/cacheUtils';

// Initialize Upstash Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * API endpoint to manually rebuild the Lunr search index
 * This can be triggered when needed to refresh the search index
 */
export async function POST(request: Request) {
    try {
        // Optional: Add authentication here to protect this endpoint
        // For example, check for an admin API key in headers

        console.log('Starting manual rebuild of Lunr search index');

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
            return NextResponse.json({
                success: false,
                message: 'No MCPs found to index'
            }, { status: 404 });
        }

        console.log(`Building Lunr index with ${mcps.length} MCPs`);

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
        const now = new Date().toISOString();
        await redis.set(`${CACHE_REGIONS.SEARCH}:lunr-meta`, JSON.stringify({
            lastUpdated: now,
            documentCount: mcps.length,
            manualRebuild: true,
            rebuildTime: now
        }));

        // Now try to get the size of the index to report in the response
        const indexSize = Buffer.byteLength(serializedIndex, 'utf8');
        const documentsSize = Buffer.byteLength(JSON.stringify(documents), 'utf8');

        return NextResponse.json({
            success: true,
            message: `Successfully rebuilt Lunr search index with ${mcps.length} documents`,
            stats: {
                documentCount: mcps.length,
                indexSize: `${(indexSize / 1024 / 1024).toFixed(2)} MB`,
                documentsSize: `${(documentsSize / 1024 / 1024).toFixed(2)} MB`,
                totalSize: `${((indexSize + documentsSize) / 1024 / 1024).toFixed(2)} MB`,
                lastUpdated: now
            }
        });

    } catch (error) {
        console.error('Error rebuilding search index:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to rebuild search index',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}