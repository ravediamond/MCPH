import { NextRequest, NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';
import { validateApiKey } from 'utils/apiKeyValidation';
import { cacheFetch, CACHE_REGIONS } from 'utils/cacheUtils';

// Cache TTL for public API search results (5 minutes)
// Note: Our caching system will auto-skip this cache for public API endpoints
const SEARCH_CACHE_TTL = 5 * 60;

/**
 * Generate a cache key for public API search queries
 * Note: Public API requests will bypass cache anyway due to our isExcludedFromCache function
 */
function generateSearchCacheKey(query: string | null, tags: string | null, offset: number, limit: number): string {
    return `${query || 'all'}:tags:${tags || 'none'}:offset:${offset}:limit:${limit}`;
}

/**
 * Public API endpoint to search for MCPs
 * This endpoint requires an API key for authentication
 * Follows REST principles and uses the same versioning as other public APIs
 */
export async function GET(request: NextRequest) {
    // Validate API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
        return NextResponse.json({
            success: false,
            error: 'API key is required'
        }, { status: 401 });
    }

    // Validate the API key (this is already optimized with caching in the apiKeyValidation utility)
    const keyValidation = await validateApiKey(apiKey);
    if (!keyValidation.valid || !keyValidation.key) {
        return NextResponse.json({
            success: false,
            error: 'Invalid or expired API key'
        }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const tags = searchParams.get('tags');

    // Parse and validate pagination parameters
    const requestedLimit = parseInt(searchParams.get('limit') || '20');
    const requestedOffset = parseInt(searchParams.get('offset') || '0');

    // Validate limits for API abuse protection
    const limit = Math.min(Math.max(1, requestedLimit), 100); // Between 1 and 100
    const offset = Math.max(0, requestedOffset);

    try {
        // Create search function that will be executed
        const executeSearch = async () => {
            // Start building our query - select only needed fields
            const selectFields = `
                id, 
                name, 
                description, 
                repository_url, 
                tags, 
                version,
                author,
                owner_username,
                repository_name,
                stars,
                avg_rating,
                review_count,
                view_count
            `;

            // More efficient query construction
            let queryBuilder = supabase
                .from('mcps')
                .select(selectFields, { count: 'exact' });

            // Apply search filters if provided
            if (query && query.trim() !== '') {
                queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
            }

            // Filter by tags if provided
            if (tags) {
                const tagArray = tags.split(',').map(tag => tag.trim());
                queryBuilder = queryBuilder.contains('tags', tagArray);
            }

            // Apply pagination - combine with a single efficient query
            queryBuilder = queryBuilder
                .order('stars', { ascending: false })
                .range(offset, offset + limit - 1);

            // Execute the query - the count is returned along with the data
            const { data, error, count } = await queryBuilder;

            if (error) {
                throw new Error(`Failed to search MCPs: ${error.message}`);
            }

            return {
                success: true,
                results: data,
                pagination: {
                    total: count || 0,
                    offset,
                    limit,
                    hasMore: (offset + limit) < (count || 0)
                }
            };
        };

        // Use the new cacheFetch function
        // Note: Our caching system will automatically skip caching public API endpoints
        const result = await cacheFetch(
            'public-api',  // Will be skipped by our caching system
            generateSearchCacheKey(query, tags, offset, limit),
            executeSearch,
            SEARCH_CACHE_TTL
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Unexpected error in MCP search:', error);
        return NextResponse.json({
            success: false,
            error: 'An unexpected error occurred',
        }, { status: 500 });
    }
}