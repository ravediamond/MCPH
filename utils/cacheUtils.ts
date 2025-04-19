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
                    return new NextResponse(
                        cachedValue,
                        { status: 200, headers: { 'Content-Type': 'application/json' } }
                    );
                }
            } catch (redisError) {
                // Redis is not available, log once and set flag
                if (isRedisAvailable) {
                    console.error(`Redis unavailable: ${redisError.message}. Falling back to direct data fetching.`);
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

                // Store the text response in cache with TTL in seconds
                await redis.set(cacheKey, responseText, { ex: Math.floor(ttlMs / 1000) });
            } catch (cacheError) {
                // Silently fail on cache write errors, but mark Redis as unavailable
                console.warn(`Failed to cache response for key ${cacheKey}: ${cacheError.message}`);
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
            console.error(`Fatal error, both cache and direct fetch failed: ${fetchError.message}`);
            throw fetchError;
        }
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
    },
    // These methods are maintained for API compatibility but shouldn't be used
    set: () => { console.warn('Direct cache.set() is deprecated. Use cachedFetch instead.'); },
    get: () => { console.warn('Direct cache.get() is deprecated. Use cachedFetch instead.'); return undefined; }
};

// Add a health check method to test Redis connection
export async function checkRedisHealth(): Promise<boolean> {
    try {
        // Simple ping-pong check
        await redis.ping();
        isRedisAvailable = true;
        return true;
    } catch (error) {
        console.error('Redis health check failed:', error.message);
        isRedisAvailable = false;
        return false;
    }
}