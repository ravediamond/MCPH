import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { cacheFetch, CACHE_REGIONS } from 'utils/cacheUtils';

// Cache TTL for search results (2 minutes)
const SEARCH_CACHE_TTL = 2 * 60;

/**
 * Generate a cache key for search queries
 */
function generateSearchCacheKey(query: string | null, page: number, limit: number): string {
    return `${query || 'all'}:page:${page}:limit:${limit}`;
}

export async function GET(request: Request) {
    const requestId = Math.random().toString(36).substring(2, 10); // Create a unique ID for this request
    console.log(`[${requestId}] API Search request received:`, new URL(request.url).toString());

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    // Add pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    console.log(`[${requestId}] Search params: query="${q || ''}", page=${page}, limit=${limit}`);

    // Limit to reasonable values to prevent abuse
    const validatedLimit = Math.min(Math.max(limit, 1), 100);
    const validatedPage = Math.max(page, 1);

    // Calculate offset for pagination
    const offset = (validatedPage - 1) * validatedLimit;

    try {
        // Use the new cacheFetch with proper region
        const resultData = await cacheFetch(
            CACHE_REGIONS.SEARCH,
            generateSearchCacheKey(q, validatedPage, validatedLimit),
            async () => {
                console.log(`[${requestId}] Executing database query`);

                // Select only relevant fields instead of '*'
                const selectFields = [
                    'id',
                    'name',
                    'description',
                    'repository_url',
                    'tags',
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
                    console.error(`[${requestId}] Database query error:`, error);
                    throw new Error(`Database query error: ${error.message}`);
                }

                console.log(`[${requestId}] Query successful. Found ${data?.length || 0} results, total count: ${count || 0}`);

                // Return data object
                return {
                    success: true,
                    results: data || [],
                    pagination: {
                        total: count || 0,
                        page: validatedPage,
                        limit: validatedLimit,
                        pages: count ? Math.ceil(count / validatedLimit) : 0,
                        hasNext: count ? offset + validatedLimit < count : false,
                        hasPrev: validatedPage > 1
                    }
                };
            },
            SEARCH_CACHE_TTL
        );

        console.log(`[${requestId}] Response ready to be returned to client`);
        // Create a fresh NextResponse from the cached data
        return NextResponse.json(resultData);
    } catch (error) {
        console.error(`[${requestId}] Unexpected error in search endpoint:`, error);
        return NextResponse.json(
            { success: false, message: 'Internal server error', error: String(error) },
            { status: 500 }
        );
    }
}