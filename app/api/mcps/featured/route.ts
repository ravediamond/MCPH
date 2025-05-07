import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { cacheFetch, CACHE_REGIONS } from 'utils/cacheUtils';

// Cache TTL for featured MCPs (10 minutes)
// Featured content doesn't change as frequently
const FEATURED_CACHE_TTL = 10 * 60;

/**
 * Creates a cache key for featured MCP results
 */
function createFeaturedCacheKey(type: string, limit: number): string {
    return `${type}:limit:${limit}`;
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const type = url.searchParams.get('type') || 'starred';
        const limit = parseInt(url.searchParams.get('limit') || '5', 10);

        // Validate limit to prevent abuse (between 1 and 20)
        const safeLimit = Math.min(Math.max(limit, 1), 20);

        // Use the new cache system with featured region
        const resultData = await cacheFetch(
            CACHE_REGIONS.FEATURED,
            createFeaturedCacheKey(type, safeLimit),
            async () => {
                // Fields to select, reused across queries
                const selectFields = `
                    id, 
                    name, 
                    description, 
                    repository_url, 
                    tags, 
                    author, 
                    owner_username, 
                    repository_name, 
                    stars, 
                    avg_rating, 
                    review_count, 
                    view_count, 
                    last_repo_update
                `;

                // Process based on type
                if (type === 'starred') {
                    const { data, error } = await supabase
                        .from('mcps')
                        .select(selectFields)
                        .order('stars', { ascending: false })
                        .limit(safeLimit);

                    if (error) {
                        throw error;
                    }

                    return {
                        mcps: data,
                        meta: {
                            type: 'starred',
                            limit: safeLimit,
                            count: data.length
                        }
                    };
                }
                else if (type === 'trending') {
                    // Get date from 30 days ago
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    // Create a more sophisticated trending algorithm
                    const { data, error } = await supabase
                        .from('mcps')
                        .select(selectFields)
                        .gt('stars', 0) // Only MCPs with at least 1 star
                        .gt('last_repo_update', thirtyDaysAgo.toISOString()) // Updated in the last 30 days
                        // Use a combination of sorting criteria to determine "trending" status
                        .order('stars', { ascending: false }) // Popular repos first
                        .order('last_repo_update', { ascending: false }) // Recently updated second
                        .limit(safeLimit);

                    if (error) {
                        throw error;
                    }

                    return {
                        mcps: data,
                        meta: {
                            type: 'trending',
                            limit: safeLimit,
                            count: data.length,
                            timeRange: '30 days'
                        }
                    };
                }
                else if (type === 'most-viewed') {
                    const { data, error } = await supabase
                        .from('mcps')
                        .select(selectFields)
                        .gt('view_count', 0) // Only MCPs with some views
                        .order('view_count', { ascending: false }) // Most viewed first
                        .limit(safeLimit);

                    if (error) {
                        throw error;
                    }

                    return {
                        mcps: data,
                        meta: {
                            type: 'most-viewed',
                            limit: safeLimit,
                            count: data.length
                        }
                    };
                }
                else if (type === 'highest-rated') {
                    const { data, error } = await supabase
                        .from('mcps')
                        .select(selectFields)
                        .gt('avg_rating', 0) // Only MCPs with ratings
                        .gt('review_count', 1) // At least 2 reviews for statistical significance
                        .order('avg_rating', { ascending: false }) // Highest rated first
                        .order('review_count', { ascending: false }) // With more reviews prioritized
                        .limit(safeLimit);

                    if (error) {
                        throw error;
                    }

                    return {
                        mcps: data,
                        meta: {
                            type: 'highest-rated',
                            limit: safeLimit,
                            count: data.length
                        }
                    };
                }

                return {
                    error: 'Invalid type parameter',
                    validTypes: ['starred', 'trending', 'most-viewed', 'highest-rated']
                };
            },
            FEATURED_CACHE_TTL
        );

        // Handle error case separately
        if (resultData.error) {
            return NextResponse.json(resultData, { status: 400 });
        }

        // Return fresh NextResponse with the cached data
        return NextResponse.json(resultData);
    } catch (error) {
        console.error('Error fetching featured MCPs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch featured MCPs' },
            { status: 500 }
        );
    }
}