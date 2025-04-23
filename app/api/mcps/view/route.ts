import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cache } from 'utils/cacheUtils';

// Create a Supabase client with direct URL and key access
// This approach doesn't require cookies/auth which can be problematic
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cache keys and constants
const VIEW_COUNT_CACHE_PREFIX = 'view-count:';
const VIEW_BATCH_SIZE = 5; // Update DB after this many views
const VIEW_UPDATE_INTERVAL = 60 * 1000; // Force update every minute
const VIEW_USER_COOLDOWN = 30 * 1000; // Prevent counting multiple views from same user within 30s

/**
 * Creates a cache key for tracking view counts
 */
function createViewCountCacheKey(mcpId: string): string {
    return `${VIEW_COUNT_CACHE_PREFIX}${mcpId}`;
}

/**
 * Creates a user-specific cooldown cache key to prevent counting multiple views
 */
function createUserViewCooldownKey(mcpId: string, userId: string): string {
    return `user-view:${mcpId}:${userId}`;
}

interface ViewCountCache {
    pendingViews: number;
    lastUpdated: number;
    currentCount: number;
}

/**
 * Asynchronously updates the view count in Supabase
 * Returns the new view count
 */
async function updateViewCountInDb(mcpId: string, increment: number): Promise<number> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Try using the RPC function first (most efficient)
        let result;

        if (increment === 1) {
            // For single increments, use the RPC function
            const { data, error } = await supabase.rpc('increment_view_count', { row_id: mcpId });

            if (!error) {
                return data;
            }
        }

        // Fall back to manual update for batched increments or if RPC fails
        // First get the current count
        const { data: mcpData, error: fetchError } = await supabase
            .from('mcps')
            .select('view_count')
            .eq('id', mcpId)
            .single();

        if (fetchError) {
            throw new Error(`Failed to fetch current view count: ${fetchError.message}`);
        }

        const currentViewCount = mcpData.view_count || 0;
        const newViewCount = currentViewCount + increment;

        // Update with the new count
        const { data: updateData, error: updateError } = await supabase
            .from('mcps')
            .update({ view_count: newViewCount })
            .eq('id', mcpId)
            .select('view_count')
            .single();

        if (updateError) {
            throw new Error(`Failed to update view count: ${updateError.message}`);
        }

        return updateData.view_count;
    } catch (error) {
        console.error(`Error updating view count for MCP ${mcpId}:`, error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mcpId } = body;

        if (!mcpId) {
            return NextResponse.json(
                { error: 'MCP ID is required' },
                { status: 400 }
            );
        }

        // Get a unique identifier for the user (IP + user agent hash)
        // This prevents artificial inflation of view counts
        // Using headers to get IP since NextRequest.ip may not be available
        const forwardedFor = request.headers.get('x-forwarded-for');
        const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        const userId = `${clientIp}:${userAgent.substring(0, 20)}`; // Simplified user ID

        // Check if this user has viewed this MCP recently
        const userCooldownKey = createUserViewCooldownKey(mcpId, userId);
        const hasRecentView = cache.get(userCooldownKey);

        if (hasRecentView) {
            // User has viewed this MCP recently, don't count it as a new view
            // But return the current view count
            const cacheKey = createViewCountCacheKey(mcpId);
            const viewCache = cache.get<ViewCountCache>(cacheKey);

            return NextResponse.json({
                success: true,
                viewCount: viewCache?.currentCount || null,
                cached: true
            });
        }

        // Set user cooldown to prevent multiple views
        cache.set(userCooldownKey, true, { ttl: VIEW_USER_COOLDOWN });

        // Get or initialize the view count cache
        const cacheKey = createViewCountCacheKey(mcpId);
        let viewCache = cache.get<ViewCountCache>(cacheKey);

        if (!viewCache) {
            viewCache = {
                pendingViews: 0,
                lastUpdated: Date.now(),
                currentCount: 0
            };
        }

        // Increment pending views
        viewCache.pendingViews += 1;

        const shouldUpdateDatabase =
            viewCache.pendingViews >= VIEW_BATCH_SIZE || // Batch size reached
            (Date.now() - viewCache.lastUpdated) > VIEW_UPDATE_INTERVAL; // Time interval exceeded

        if (shouldUpdateDatabase) {
            try {
                // Perform the actual database update
                const pendingViewsToUpdate = viewCache.pendingViews;

                // Reset pending views before the async operation to avoid double counting
                viewCache.pendingViews = 0;
                viewCache.lastUpdated = Date.now();

                // Update the database asynchronously
                const newCount = await updateViewCountInDb(mcpId, pendingViewsToUpdate);

                // Update the cache with the new count
                viewCache.currentCount = newCount;
                cache.set(cacheKey, viewCache, { ttl: 24 * 60 * 60 * 1000 }); // Cache for 24 hours

                return NextResponse.json({
                    success: true,
                    viewCount: newCount,
                    updated: true
                });
            } catch (error) {
                console.error('Error updating view count in database:', error);

                // Don't lose the pending views on error
                viewCache.pendingViews += 1;
                cache.set(cacheKey, viewCache, { ttl: 24 * 60 * 60 * 1000 });

                return NextResponse.json({
                    success: false,
                    error: 'Failed to update view count'
                }, { status: 500 });
            }
        } else {
            // Just update the cache, no database update yet
            cache.set(cacheKey, viewCache, { ttl: 24 * 60 * 60 * 1000 });

            // Return the estimated count (current known count + pending views)
            return NextResponse.json({
                success: true,
                viewCount: (viewCache.currentCount || 0) + viewCache.pendingViews,
                cached: true
            });
        }
    } catch (error) {
        console.error('Error processing view count:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}