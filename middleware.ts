import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { API } from './app/config/constants';
import { validateApiKey } from './utils/apiKeyValidation';
import { cache } from './utils/cacheUtils';

// Rate limiting constants
const DEFAULT_RATE_LIMIT = 30; // Default requests per minute
const WINDOW_MS = 60 * 1000; // 1 minute window
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up every 5 minutes

// Create a rate limiter class with better memory management
class RateLimiter {
    private static instance: RateLimiter;
    private cache: Map<string, { count: number; resetTime: number }>;
    private cleanupInterval: NodeJS.Timeout | null = null;

    private constructor() {
        this.cache = new Map();
        // Set an interval to periodically clean expired entries
        this.cleanupInterval = setInterval(() => this.cleanup(), CACHE_CLEANUP_INTERVAL);
    }

    public static getInstance(): RateLimiter {
        if (!RateLimiter.instance) {
            RateLimiter.instance = new RateLimiter();
        }
        return RateLimiter.instance;
    }

    /**
     * Check if a client has exceeded their rate limit
     */
    public check(identifier: string, maxRequests: number): {
        limited: boolean;
        remaining: number;
        resetTime: number;
    } {
        const currentTime = Date.now();
        const clientRateLimit = this.cache.get(identifier);

        // If no entry found or reset time has passed, create a new entry
        if (!clientRateLimit || currentTime > clientRateLimit.resetTime) {
            const newEntry = {
                count: 1,
                resetTime: currentTime + WINDOW_MS
            };
            this.cache.set(identifier, newEntry);

            return {
                limited: false,
                remaining: maxRequests - 1,
                resetTime: newEntry.resetTime
            };
        }

        // Check if client has exceeded their rate limit
        if (clientRateLimit.count >= maxRequests) {
            return {
                limited: true,
                remaining: 0,
                resetTime: clientRateLimit.resetTime
            };
        }

        // Increment the request count and return remaining requests
        clientRateLimit.count += 1;
        this.cache.set(identifier, clientRateLimit);

        return {
            limited: false,
            remaining: maxRequests - clientRateLimit.count,
            resetTime: clientRateLimit.resetTime
        };
    }

    /**
     * Remove expired entries to prevent memory leaks
     */
    private cleanup(): void {
        const now = Date.now();
        // Fix for TypeScript iterator issue - convert to array first
        const keysToCheck = Array.from(this.cache.keys());

        for (const key of keysToCheck) {
            const entry = this.cache.get(key);
            if (entry && now > entry.resetTime) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get the size of the cache for monitoring purposes
     */
    public size(): number {
        return this.cache.size;
    }

    /**
     * Clean up resources when shutting down
     */
    public dispose(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Get an instance of the rate limiter
const rateLimiter = RateLimiter.getInstance();

// Create a cache key for API key validation results to avoid redundant checks
function createApiKeyCheckCacheKey(apiKey: string): string {
    return `middleware:apikey:${apiKey}`;
}

/**
 * Get client IP address from request headers
 */
function getClientIp(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        // Get the first IP if there are multiple in the header
        return forwardedFor.split(',')[0].trim();
    }

    // Fallbacks for different header formats
    const xRealIp = request.headers.get('x-real-ip');
    if (xRealIp) {
        return xRealIp;
    }

    // If all else fails, use a placeholder
    return 'unknown-ip';
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only apply to public API routes
    if (pathname.startsWith(API.PUBLIC.BASE_PATH)) {
        // 1. API Key Authentication with short-lived cache (5 seconds)
        // This prevents multiple validation checks within the same request chain
        const apiKey = request.headers.get('x-api-key') || '';
        const apiKeyCacheKey = createApiKeyCheckCacheKey(apiKey);

        // Try to get the validation result from the short-lived cache
        let apiKeyValidation = cache.get<{
            valid: boolean;
            key?: any;
            error?: string;
            isAdmin?: boolean;
        }>(apiKeyCacheKey);

        // If not in cache, validate the API key
        if (!apiKeyValidation) {
            apiKeyValidation = await validateApiKey(apiKey);

            // Cache the result for 5 seconds to avoid redundant checks
            // within the same request chain or very rapid successive requests
            if (apiKeyValidation) {
                cache.set(apiKeyCacheKey, apiKeyValidation, { ttl: 5000 });
            }
        }

        if (!apiKeyValidation?.valid) {
            return new NextResponse(
                JSON.stringify({
                    success: false,
                    message: `Authentication failed: ${apiKeyValidation?.error || 'Invalid API key'}`,
                }),
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
        }

        // 2. Rate Limiting - customized per API key if available
        const maxRequests = apiKeyValidation.key?.rate_limit_per_minute || DEFAULT_RATE_LIMIT;
        // Fix: Use getClientIp helper instead of request.ip
        const clientIp = getClientIp(request);
        const keyIdentifier = apiKey || clientIp || 'unknown';

        // Check if the client has exceeded their rate limit
        const rateCheck = rateLimiter.check(keyIdentifier, maxRequests);

        if (rateCheck.limited) {
            const resetTime = new Date(rateCheck.resetTime);
            return new NextResponse(
                JSON.stringify({
                    success: false,
                    message: 'Rate limit exceeded',
                    resetAt: resetTime.toISOString(),
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RateLimit-Limit': maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': Math.ceil(rateCheck.resetTime / 1000).toString(),
                    }
                }
            );
        }

        // Add rate limit headers to the response
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', rateCheck.remaining.toString());
        response.headers.set('X-RateLimit-Reset', Math.ceil(rateCheck.resetTime / 1000).toString());

        return response;
    }

    // Continue processing for internal API routes and non-API routes
    return NextResponse.next();
}