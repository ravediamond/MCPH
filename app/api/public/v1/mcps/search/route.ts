import { NextRequest, NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';
import { validateApiKey } from 'utils/apiKeyValidation';
import { cachedFetch } from 'utils/cacheUtils';

// Cache TTL for public API search results (5 minutes)
// Public API usually has more stable/less frequent data changes
const SEARCH_CACHE_TTL = 5 * 60 * 1000;

/**
 * Generate a cache key for public API search queries
 * We include the API key hash to ensure separate caching for different users
 */
function generateSearchCacheKey(query: string | null, tags: string | null, offset: number, limit: number, apiKeyHash: string): string {
    // Simple hash function for API key (for cache key only)
    const hash = apiKeyHash.substring(0, 8); // Use first 8 chars as a simple hash
    return `public:search:${query || 'all'}:tags:${tags || 'none'}:offset:${offset}:limit:${limit}:user:${hash}`;
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

    // Create cache key based on query parameters
    const cacheKey = generateSearchCacheKey(
        query,
        tags,
        offset,
        limit,
        apiKey // Using apiKey directly for cache key generation
    );

    // Use cached search results if available
    return cachedFetch(
        cacheKey,
        async () => {
            try {
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
                    console.error('Search error:', error);
                    return NextResponse.json({
                        success: false,
                        error: 'Failed to search MCPs',
                    }, { status: 500 });
                }

                return NextResponse.json({
                    success: true,
                    results: data,
                    pagination: {
                        total: count || 0,
                        offset,
                        limit,
                        hasMore: (offset + limit) < (count || 0)
                    }
                });
            } catch (error) {
                console.error('Unexpected error in MCP search:', error);
                return NextResponse.json({
                    success: false,
                    error: 'An unexpected error occurred',
                }, { status: 500 });
            }
        },
        SEARCH_CACHE_TTL
    );
}