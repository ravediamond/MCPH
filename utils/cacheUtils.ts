/**
 * Simple Redis-based cache implementation using Upstash
 */
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Cache regions for better organization
export const CACHE_REGIONS = {
    MCPS: 'mcps',
    TAGS: 'tags',
    SEARCH: 'search',
    FEATURED: 'featured',
    INTERNAL: 'internal',
};

// Initialize Upstash Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Builds a cache key with a region prefix
 */
export function buildCacheKey(region: string, key: string): string {
    return `${region}:${key}`;
}

/**
 * Simple cache fetch function
 * @param region The cache region (for grouping related items)
 * @param key The specific cache key
 * @param fetcher Function to fetch data if not in cache
 * @param ttl Time to live in seconds (default: 1 hour)
 * @param shouldCache Optional function to determine if this response should be cached
 */
export async function cacheFetch<T>(
    region: string,
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600,
    shouldCache?: (data: T) => boolean
): Promise<T> {
    // Skip caching for admin or public API endpoints
    if (isExcludedFromCache(region, key)) {
        return fetcher();
    }

    const cacheKey = buildCacheKey(region, key);

    try {
        // Try to get from cache first
        const cached = await redis.get<string>(cacheKey);

        if (cached) {
            try {
                // Parse the cached value if it's JSON
                return typeof cached === 'string' && cached.startsWith('{')
                    ? JSON.parse(cached) as T
                    : cached as unknown as T;
            } catch (e) {
                // Continue to fetch fresh data if parse error
            }
        }

        // Cache miss or invalid format, fetch fresh data
        const freshData = await fetcher();

        // Check if we should cache this response
        if (shouldCache && !shouldCache(freshData)) {
            return freshData;
        }

        try {
            // Store the data with TTL
            const serialized = typeof freshData === 'string'
                ? freshData
                : JSON.stringify(freshData);

            await redis.set(cacheKey, serialized, { ex: ttl });
        } catch (error) {
            // Non-blocking error - we still return the fresh data
        }

        return freshData;
    } catch (error) {
        // Fallback to direct fetch on any cache error
        return fetcher();
    }
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
    // Skip caching for admin or public API endpoints
    if (isExcludedFromCache(region, key)) {
        return fetcher();
    }

    const cacheKey = buildCacheKey(region, key);

    try {
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
                // Skip caching invalid responses
            }
        }

        return response;
    } catch (error) {
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
        return false;
    }
}

/**
 * Check if the given region/key should be excluded from caching
 */
function isExcludedFromCache(region: string, key: string): boolean {
    // Exclude admin operations
    if (key.includes('admin') || region === 'admin') {
        return true;
    }

    // Exclude public API endpoints
    if (key.startsWith('public/') || region.startsWith('public')) {
        return true;
    }

    // Exclude API key related operations
    if (key.includes('apikey') || region.includes('api-key') || key.startsWith('key:')) {
        return true;
    }

    return false;
}

// Simple cache interface for backward compatibility
export const cache = {
    get: async <T>(key: string): Promise<T | null> => {
        if (isExcludedFromCache('', key)) {
            return null;
        }
        try {
            const result = await redis.get<string>(key);
            if (!result) return null;

            try {
                return JSON.parse(result) as T;
            } catch (e) {
                return result as unknown as T;
            }
        } catch (error) {
            return null;
        }
    },
    set: async <T>(key: string, value: T, options?: { ttl?: number }): Promise<boolean> => {
        if (isExcludedFromCache('', key)) {
            return false;
        }
        try {
            const serializedValue = typeof value === 'string'
                ? value
                : JSON.stringify(value);

            if (options?.ttl) {
                await redis.set(key, serializedValue, { ex: Math.floor(options.ttl / 1000) });
            } else {
                await redis.set(key, serializedValue);
            }
            return true;
        } catch (error) {
            return false;
        }
    },
    delete: async (key: string): Promise<boolean> => {
        try {
            await redis.del(key);
            return true;
        } catch (error) {
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
            return false;
        }
    }
};