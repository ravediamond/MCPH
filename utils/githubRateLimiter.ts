/**
 * GitHub Rate Limiter Utility
 * 
 * This utility helps manage GitHub API rate limits by tracking remaining API calls
 * and applying delays when necessary to avoid hitting the limits.
 */

interface RateLimitState {
    remaining: number;
    limit: number;
    reset: number;
    lastUpdated: number;
}

export class GitHubRateLimiter {
    private static instance: GitHubRateLimiter;
    private state: RateLimitState = {
        remaining: 5000, // Default GitHub API limit with a token
        limit: 5000,
        reset: Date.now() + 3600000, // Default 1 hour from now
        lastUpdated: 0
    };

    // Safety threshold - when remaining goes below this, start applying delays
    private safetyThreshold = 100;

    // Minimum delay between requests when we're near the limit (in ms)
    private minDelay = 1000;

    private constructor() { }

    public static getInstance(): GitHubRateLimiter {
        if (!GitHubRateLimiter.instance) {
            GitHubRateLimiter.instance = new GitHubRateLimiter();
        }
        return GitHubRateLimiter.instance;
    }

    /**
     * Update rate limit info based on GitHub API response headers
     */
    public updateFromHeaders(headers: Headers): void {
        if (!headers) return;

        try {
            const limit = parseInt(headers.get('x-ratelimit-limit') || '0', 10);
            const remaining = parseInt(headers.get('x-ratelimit-remaining') || '0', 10);
            const reset = parseInt(headers.get('x-ratelimit-reset') || '0', 10);

            if (limit > 0 && remaining >= 0) {
                this.state = {
                    limit,
                    remaining,
                    reset: reset * 1000, // Convert to milliseconds
                    lastUpdated: Date.now()
                };

                // Log when we're getting close to the limit
                if (remaining < this.safetyThreshold) {
                    console.warn(
                        `GitHub API rate limit warning: ${remaining}/${limit} remaining requests. ` +
                        `Resets at ${new Date(reset * 1000).toLocaleString()}`
                    );
                }
            }
        } catch (error) {
            console.warn('Failed to parse GitHub rate limit headers:', error);
        }
    }

    /**
     * Check if we're close to hitting the rate limit
     */
    public isApproachingLimit(): boolean {
        return this.state.remaining < this.safetyThreshold;
    }

    /**
     * Check if we've hit the rate limit
     */
    public isRateLimited(): boolean {
        // If reset time has passed, we're not rate limited anymore
        if (Date.now() > this.state.reset) {
            return false;
        }
        return this.state.remaining <= 0;
    }

    /**
     * Get the time when the rate limit resets
     */
    public getResetTime(): Date {
        return new Date(this.state.reset);
    }

    /**
     * Get the number of remaining requests
     */
    public getRemaining(): number {
        return this.state.remaining;
    }

    /**
     * Apply appropriate delay based on remaining rate limit
     * Returns a promise that resolves after the delay
     */
    public async applyRateLimitDelay(): Promise<void> {
        // If we're rate limited, throw an error - we should wait until reset
        if (this.isRateLimited()) {
            const resetTime = this.getResetTime().toLocaleString();
            throw new Error(`GitHub API rate limit exceeded. Try again after ${resetTime}`);
        }

        // If we're approaching the limit, add an increasing delay
        if (this.isApproachingLimit()) {
            // Calculate delay based on remaining requests - the closer to 0, the longer the delay
            const factor = Math.max(0, this.safetyThreshold - this.state.remaining) / this.safetyThreshold;
            const delay = this.minDelay + (factor * 2000); // Max delay around 3 seconds

            console.log(`Applied rate limit delay: ${Math.round(delay)}ms (${this.state.remaining} requests remaining)`);

            return new Promise(resolve => setTimeout(resolve, delay));
        }

        // No delay needed
        return Promise.resolve();
    }

    /**
     * Get current rate limit state (for logging/debugging)
     */
    public getRateLimitInfo(): { remaining: number; limit: number; resetTime: string } {
        return {
            remaining: this.state.remaining,
            limit: this.state.limit,
            resetTime: new Date(this.state.reset).toLocaleString()
        };
    }
}

// Export singleton instance
export const githubRateLimiter = GitHubRateLimiter.getInstance();