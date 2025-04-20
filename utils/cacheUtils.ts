/**
 * Simplified Redis-based cache implementation using Upstash
 */
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Cache regions for better organization and invalidation
export const CACHE_REGIONS = {
    MCPS: 'mcps',
    TAGS: 'tags',
    SEARCH: 'search',
    FEATURED: 'featured',
    USER: 'user',
    API_KEYS: 'api-keys',
};

// Initialize Upstash Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Builds a cache key with a region prefix for better organization
 */
export function buildCacheKey(region: string, key: string): string {
    return `${region}:${key}`;
}

/**
 * Simplified cache fetch with stale-while-revalidate pattern
 * @param region The cache region (for grouping related items)
 * @param key The specific cache key
 * @param fetcher Function to fetch data if not in cache
 * @param ttl Time to live in seconds (default: 1 hour)
 */
export async function cacheFetch<T>(
    region: string,
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
): Promise<T> {
    const cacheKey = buildCacheKey(region, key);

    try {
        // Try to get from cache first
        const cached = await redis.get<string>(cacheKey);

        if (cached) {
            try {
                // Parse the cached value
                const parsedValue = typeof cached === 'string' && cached.startsWith('{')
                    ? JSON.parse(cached)
                    : cached;

                // Trigger background refresh if more than 80% of TTL has passed
                const metadata = await redis.ttl(cacheKey);
                if (metadata && ttl > 0 && metadata < ttl * 0.2) {
                    // Refresh in background without awaiting
                    refreshCache(region, key, fetcher, ttl).catch(console.error);
                }

                return parsedValue as T;
            } catch (e) {
                console.warn(`Invalid cache format for ${cacheKey}:`, e);
                // Continue to fetch fresh data
            }
        }

        // Cache miss or invalid format, fetch fresh data
        return refreshCache(region, key, fetcher, ttl);
    } catch (error) {
        console.error(`Cache error for ${cacheKey}:`, error);
        // Fallback to direct fetch on any cache error
        return fetcher();
    }
}

/**
 * Refresh the cache with fresh data
 */
async function refreshCache<T>(
    region: string,
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
): Promise<T> {
    const cacheKey = buildCacheKey(region, key);
    const freshData = await fetcher();

    try {
        // Store the data with TTL
        const serialized = typeof freshData === 'string'
            ? freshData
            : JSON.stringify(freshData);

        await redis.set(cacheKey, serialized, { ex: ttl });
    } catch (error) {
        console.error(`Failed to update cache for ${cacheKey}:`, error);
        // Non-blocking error - we still return the fresh data
    }

    return freshData;
}

/**
 * Wrapper for Next.js API routes
 */
export async function cacheApiResponse(
    region: string,
    key: string,
    fetcher: () => Promise<NextResponse>,
    ttl: number = 3600
): Promise<NextResponse> {
    try {
        const cacheKey = buildCacheKey(region, key);
        const cached = await redis.get<string>(cacheKey);

        if (cached) {
            // Return cached response
            return new NextResponse(cached, {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Cache': 'HIT'
                }
            });
        }

        // Cache miss, get fresh response
        const response = await fetcher();

        // Only cache successful responses
        if (response.status >= 200 && response.status < 300) {
            try {
                const clonedResponse = response.clone();
                const responseText = await clonedResponse.text();

                // Verify it's valid JSON before caching
                JSON.parse(responseText);
                await redis.set(cacheKey, responseText, { ex: ttl });
            } catch (error) {
                console.warn(`Not caching invalid JSON response for ${cacheKey}`);
            }
        }

        // Add cache miss header
        const headers = new Headers(response.headers);
        headers.set('X-Cache', 'MISS');

        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
        });
    } catch (error) {
        console.error(`Cache API error:`, error);
        // Fallback to direct fetch
        return fetcher();
    }
}

/**
 * Invalidate a specific cache entry
 */
export async function invalidateCache(region: string, key: string): Promise<boolean> {
    try {
        await redis.del(buildCacheKey(region, key));
        return true;
    } catch (error) {
        console.error(`Failed to invalidate cache:`, error);
        return false;
    }
}

/**
 * Invalidate all cache entries in a region
 */
export async function invalidateRegion(region: string): Promise<boolean> {
    try {
        const keys = await redis.keys(`${region}:*`);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
        return true;
    } catch (error) {
        console.error(`Failed to invalidate region ${region}:`, error);
        return false;
    }
}

/**
 * Check if Redis is available
 */
export async function checkRedisHealth(): Promise<boolean> {
    try {
        await redis.ping();
        return true;
    } catch (error) {
        console.error('Redis health check failed:', error);
        return false;
    }
}

// ----- BACKWARD COMPATIBILITY LAYER -----

/**
 * Compatibility for old getFromCache function
 * @deprecated Use cacheFetch instead with proper region
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
    try {
        const result = await redis.get<string>(key);
        if (!result) return null;

        try {
            return JSON.parse(result) as T;
        } catch (e) {
            // If not JSON, return as is
            return result as unknown as T;
        }
    } catch (error) {
        console.error(`Error getting cache for key ${key}:`, error);
        return null;
    }
}

/**
 * Compatibility for old setInCache function
 * @deprecated Use cacheFetch instead with proper region
 */
export async function setInCache<T>(key: string, value: T, options?: { ttl?: number }): Promise<boolean> {
    try {
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        if (options?.ttl) {
            await redis.set(key, serializedValue, { ex: Math.floor(options.ttl / 1000) });
        } else {
            await redis.set(key, serializedValue);
        }
        return true;
    } catch (error) {
        console.error(`Error setting cache for key ${key}:`, error);
        return false;
    }
}

/**
 * Compatibility for old cachedFetch function
 * @deprecated Use cacheFetch with proper region or cacheApiResponse for API routes
 */
export async function cachedFetch<T>(
    cacheKey: string,
    fetchFunction: () => Promise<NextResponse | T>,
    ttlMs: number = 60 * 60 * 1000 // Default to 1 hour TTL
): Promise<NextResponse | T> {
    // Determine if this is being used for an API response
    let isNextResponse = false;

    try {
        // Use the legacy key format directly
        const cached = await redis.get<string>(cacheKey);

        if (cached) {
            try {
                const parsedValue = JSON.parse(cached);
                return isNextResponse
                    ? new NextResponse(cached, { status: 200, headers: { 'Content-Type': 'application/json' } })
                    : parsedValue;
            } catch (e) {
                // If it's a string but not JSON
                if (typeof cached === 'string' && isNextResponse) {
                    return new NextResponse(cached, { status: 200 });
                }
            }
        }

        // Cache miss, get fresh data
        const result = await fetchFunction();

        // Check if result is NextResponse
        if (result instanceof NextResponse) {
            isNextResponse = true;
            try {
                const clonedResponse = result.clone();
                const responseText = await clonedResponse.text();

                try {
                    // Verify it's valid JSON before caching
                    JSON.parse(responseText);
                    await redis.set(cacheKey, responseText, { ex: Math.floor(ttlMs / 1000) });
                } catch (parseError) {
                    console.warn(`Response for key ${cacheKey} is not valid JSON, not caching`);
                }
            } catch (error) {
                console.warn(`Failed to cache response: ${error}`);
            }

            return result;
        } else {
            // For non-NextResponse data
            try {
                const serialized = typeof result === 'string' ? result : JSON.stringify(result);
                await redis.set(cacheKey, serialized, { ex: Math.floor(ttlMs / 1000) });
            } catch (error) {
                console.warn(`Failed to cache data: ${error}`);
            }

            return result;
        }
    } catch (error) {
        console.error(`Error in cachedFetch for ${cacheKey}:`, error);
        // If there's an error, still try the direct fetch as last resort
        return await fetchFunction();
    }
}

// Legacy cache object for backward compatibility
export const cache = {
    get: getFromCache,
    set: setInCache,
    delete: async (key: string): Promise<boolean> => {
        try {
            await redis.del(key);
            return true;
        } catch (error) {
            console.error(`Failed to delete cache key ${key}:`, error);
            return false;
        }
    },
    clear: async (): Promise<boolean> => {
        try {
            const keys = await redis.keys('*');
            if (keys.length > 0) {
                await redis.del(...keys);
            }
            return true;
        } catch (error) {
            console.error('Failed to clear cache:', error);
            return false;
        }
    }
};