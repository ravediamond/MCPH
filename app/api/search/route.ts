import { NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';
import { cachedFetch, cache } from 'utils/cacheUtils';

// Cache TTL for search results (2 minutes)
const SEARCH_CACHE_TTL = 2 * 60 * 1000;

/**
 * Generate a cache key for search queries
 */
function generateSearchCacheKey(query: string | null, page: number, limit: number): string {
    return `search:${query || 'all'}:page:${page}:limit:${limit}`;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    // Add pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Limit to reasonable values to prevent abuse
    const validatedLimit = Math.min(Math.max(limit, 1), 100);
    const validatedPage = Math.max(page, 1);

    // Calculate offset for pagination
    const offset = (validatedPage - 1) * validatedLimit;

    // Generate cache key
    const cacheKey = generateSearchCacheKey(q, validatedPage, validatedLimit);

    // Use cached results if available
    return cachedFetch(
        cacheKey,
        async () => {
            // Select only relevant fields instead of '*'
            const selectFields = [
                'id',
                'name',
                'description',
                'repository_url',
                'tags',
                'version',
                'author',
                'stars',
                'forks',
                'avg_rating',
                'review_count',
                'view_count',
                'last_repo_update'
            ].join(', ');

            // Build the query
            let queryBuilder = supabase
                .from('mcps')
                .select(selectFields, { count: 'exact' });

            // Apply search filter if query exists
            if (q && q.trim() !== '') {
                queryBuilder = queryBuilder.or(
                    `name.ilike.%${q}%,description.ilike.%${q}%`
                );
            }

            // Apply pagination
            queryBuilder = queryBuilder
                .order('stars', { ascending: false })
                .range(offset, offset + validatedLimit - 1);

            // Execute query
            const { data, error, count } = await queryBuilder;

            if (error) {
                return NextResponse.json(
                    { success: false, message: 'Search failed', error },
                    { status: 500 }
                );
            }

            // Return paginated results with metadata
            return NextResponse.json({
                success: true,
                results: data,
                pagination: {
                    total: count || 0,
                    page: validatedPage,
                    limit: validatedLimit,
                    pages: count ? Math.ceil(count / validatedLimit) : 0,
                    hasNext: count ? offset + validatedLimit < count : false,
                    hasPrev: validatedPage > 1
                }
            });
        },
        SEARCH_CACHE_TTL
    );
}