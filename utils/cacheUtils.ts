/**
 * Redis-based cache implementation using Upstash
 */
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Upstash Redis client
// You'll need to add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to your environment variables
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Flag to track Redis availability
let isRedisAvailable = true;

/**
 * A wrapper function to implement a cache-first strategy with Redis
 * Will fetch from Redis if available, otherwise call the fetcher function and cache the result
 */
export async function cachedFetch<T>(
    cacheKey: string,
    fetchFunction: () => Promise<NextResponse>,
    ttlMs: number = 60 * 60 * 1000 // Default to 1 hour TTL
): Promise<NextResponse> {
    try {
        if (isRedisAvailable) {
            try {
                // Check if we have a cached value in Redis
                const cachedValue = await redis.get<string>(cacheKey);

                if (cachedValue) {
                    // Ensure we return a proper NextResponse when using cached value
                    try {
                        // Make sure we can parse the cached value as JSON before returning it
                        JSON.parse(cachedValue);
                        return new NextResponse(
                            cachedValue,
                            { status: 200, headers: { 'Content-Type': 'application/json' } }
                        );
                    } catch (parseError) {
                        console.warn(`Cached value for key ${cacheKey} is not valid JSON, ignoring cache`);
                        // Invalid JSON in cache, we'll ignore it and continue with direct fetch
                    }
                }
            } catch (redisError) {
                // Redis is not available, log once and set flag
                if (isRedisAvailable) {
                    console.error(`Redis unavailable: ${(redisError as Error).message}. Falling back to direct data fetching.`);
                    isRedisAvailable = false;
                }
                // Continue with direct fetch
            }
        }

        // Call the fetch function to get fresh data
        const response = await fetchFunction();

        // Only try to cache successful responses if Redis is available
        if (isRedisAvailable && response.status >= 200 && response.status < 300) {
            try {
                // Clone the response and cache its text content
                const clonedResponse = response.clone();
                const responseText = await clonedResponse.text();

                // Verify the response is valid JSON before caching
                try {
                    JSON.parse(responseText);

                    // Store the text response in cache with TTL in seconds
                    await redis.set(cacheKey, responseText, { ex: Math.floor(ttlMs / 1000) });
                } catch (parseError) {
                    console.warn(`Response for key ${cacheKey} is not valid JSON, not caching:`, parseError);
                }
            } catch (cacheError) {
                // Silently fail on cache write errors, but mark Redis as unavailable
                console.warn(`Failed to cache response for key ${cacheKey}: ${(cacheError as Error).message}`);
                isRedisAvailable = false;
            }
        }

        return response;
    } catch (error) {
        console.error(`Error in cachedFetch for key ${cacheKey}:`, error);
        // If there's an error in the entire process, still try the direct fetch as last resort
        try {
            return await fetchFunction();
        } catch (fetchError) {
            console.error(`Fatal error, both cache and direct fetch failed: ${(fetchError as Error).message}`);
            throw fetchError;
        }
    }
}

/**
 * Get a value directly from the cache with proper type handling
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
    if (!isRedisAvailable) return null;

    try {
        const value = await redis.get<string>(key);
        if (!value) return null;

        // Handle both string and JSON object types
        try {
            return JSON.parse(value) as T;
        } catch (e) {
            // If it's not JSON, return as is
            return value as unknown as T;
        }
    } catch (error) {
        console.error(`Error getting cache for key ${key}:`, error);
        isRedisAvailable = false;
        return null;
    }
}

/**
 * Set a value directly in the cache with proper serialization
 */
export async function setInCache<T>(key: string, value: T, options?: { ttl?: number }): Promise<boolean> {
    if (!isRedisAvailable) return false;

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
        isRedisAvailable = false;
        return false;
    }
}

/**
 * Remove a specific key from the cache
 */
export async function invalidateCache(key: string): Promise<boolean> {
    if (!isRedisAvailable) return true; // Pretend it worked if Redis is offline

    try {
        await redis.del(key);
        return true;
    } catch (error) {
        console.error(`Error invalidating cache for key ${key}:`, error);
        isRedisAvailable = false;
        return false;
    }
}

// For backward compatibility
export const cache = {
    get: async <T>(key: string): Promise<T | null> => {
        console.warn('Direct cache.get() is deprecated. Use cachedFetch instead.');
        return getFromCache<T>(key);
    },
    set: async <T>(key: string, value: T, options?: { ttl?: number }): Promise<boolean> => {
        console.warn('Direct cache.set() is deprecated. Use cachedFetch instead.');
        return setInCache(key, value, options);
    },
    delete: invalidateCache,
    clear: async () => {
        if (!isRedisAvailable) return true;

        try {
            await redis.flushdb();
            return true;
        } catch (error) {
            console.error('Error clearing cache:', error);
            isRedisAvailable = false;
            return false;
        }
    }
};

// Add a health check method to test Redis connection
export async function checkRedisHealth(): Promise<boolean> {
    try {
        // Simple ping-pong check
        await redis.ping();
        isRedisAvailable = true;
        return true;
    } catch (error) {
        console.error('Redis health check failed:', (error as Error).message);
        isRedisAvailable = false;
        return false;
    }
}