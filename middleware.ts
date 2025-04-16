import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { API } from './app/config/constants';
import { validateApiKey } from './utils/apiKeyValidation';

// In-memory rate limiting (consider using Redis for production)
const rateLimit = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // limit each IP to 30 requests per windowMs
    cache: new Map<string, { count: number; resetTime: number }>(),
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only apply to public API routes
    if (pathname.startsWith(API.PUBLIC.BASE_PATH)) {
        // 1. API Key Authentication
        const apiKey = request.headers.get('x-api-key');
        const apiKeyValidation = await validateApiKey(apiKey || '');

        if (!apiKeyValidation.valid) {
            return new NextResponse(
                JSON.stringify({
                    success: false,
                    message: `Authentication failed: ${apiKeyValidation.error}`,
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
        const maxRequests = apiKeyValidation.key?.rate_limit_per_minute || rateLimit.maxRequests;
        const keyIdentifier = apiKey || request.ip || 'unknown';
        const currentTime = Date.now();
        const clientRateLimit = rateLimit.cache.get(keyIdentifier);

        // If the client has exceeded their rate limit and the reset time hasn't passed
        if (
            clientRateLimit &&
            clientRateLimit.count >= maxRequests &&
            currentTime < clientRateLimit.resetTime
        ) {
            const resetTime = new Date(clientRateLimit.resetTime);
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
                        'X-RateLimit-Reset': Math.ceil(clientRateLimit.resetTime / 1000).toString(),
                    }
                }
            );
        }

        // If this is the client's first request or the reset time has passed
        if (!clientRateLimit || currentTime > clientRateLimit.resetTime) {
            rateLimit.cache.set(keyIdentifier, {
                count: 1,
                resetTime: currentTime + rateLimit.windowMs,
            });
        } else {
            // Increment the request count
            clientRateLimit.count += 1;
            rateLimit.cache.set(keyIdentifier, clientRateLimit);
        }

        // Add rate limit headers to the response
        const remaining = clientRateLimit
            ? Math.max(0, maxRequests - clientRateLimit.count)
            : maxRequests - 1;

        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset',
            Math.ceil((clientRateLimit?.resetTime || (currentTime + rateLimit.windowMs)) / 1000).toString()
        );

        return response;
    }

    // Continue processing for internal API routes and non-API routes
    return NextResponse.next();
}