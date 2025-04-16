import { supabase } from 'lib/supabaseClient';
import { cachedFetch } from './cacheUtils';

// Cache TTL for API keys (15 minutes)
const API_KEY_CACHE_TTL = 15 * 60 * 1000;

interface ApiKey {
    id: string;
    key: string;
    name: string;
    created_at: string;
    expires_at: string | null;
    user_id: string;
    rate_limit_per_minute: number;
    scopes: string[];
    is_active: boolean;
    is_admin_key?: boolean;
}

/**
 * Create a cache key for an API key validation
 */
function createApiKeyCacheKey(apiKey: string): string {
    // We use an SHA-256 hash of the API key for security
    // But for simplicity in this implementation, we'll use a prefix approach
    return `apikey:${apiKey}`;
}

export async function validateApiKey(apiKey: string, requireAdmin: boolean = false): Promise<{
    valid: boolean;
    key?: ApiKey;
    error?: string;
    isAdmin?: boolean;
}> {
    if (!apiKey || apiKey.trim() === '') {
        return { valid: false, error: 'No API key provided' };
    }

    // Create a cache key for this API key
    const cacheKey = createApiKeyCacheKey(apiKey);

    try {
        // Use cachedFetch to potentially skip database query
        return await cachedFetch<{
            valid: boolean;
            key?: ApiKey;
            error?: string;
            isAdmin?: boolean;
        }>(
            cacheKey,
            async () => {
                // This function only runs on cache miss
                // Fetch the API key and verify it's active
                const { data, error } = await supabase
                    .from('api_keys')
                    .select('*')
                    .eq('api_key', apiKey)
                    .eq('is_active', true)
                    .single();

                if (error || !data) {
                    return { valid: false, error: 'Invalid API key' };
                }

                // Check if key has expired
                if (data.expires_at && new Date(data.expires_at) < new Date()) {
                    // Update key status to inactive since it's expired
                    await supabase
                        .from('api_keys')
                        .update({ is_active: false })
                        .eq('id', data.id);

                    return { valid: false, error: 'API key has expired' };
                }

                // Get the user's admin status
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', data.user_id)
                    .single();

                const isAdmin = profile?.is_admin === true;

                // Check if admin status is required but the key owner is not an admin
                if (requireAdmin && !isAdmin) {
                    return {
                        valid: false,
                        error: 'This operation requires an admin API key',
                        isAdmin: false
                    };
                }

                // Update last_used_at periodically (not on every request to reduce DB writes)
                // We only update the timestamp if it's been more than 5 minutes since the last update
                const lastUsedAt = data.last_used_at ? new Date(data.last_used_at) : new Date(0);
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

                if (lastUsedAt < fiveMinutesAgo) {
                    await supabase
                        .from('api_keys')
                        .update({ last_used_at: new Date().toISOString() })
                        .eq('id', data.id);
                }

                return {
                    valid: true,
                    key: { ...data as ApiKey, is_admin_key: isAdmin },
                    isAdmin
                };
            },
            API_KEY_CACHE_TTL
        );
    } catch (error) {
        console.error('Error validating API key:', error);
        return { valid: false, error: 'Error validating API key' };
    }
}

/**
 * Invalidate the cache for a specific API key
 * Call this function when an API key is updated or deleted
 */
export function invalidateApiKeyCache(apiKey: string): void {
    const cacheKey = createApiKeyCacheKey(apiKey);
    // Import cache directly here to avoid circular dependency
    const { cache } = require('./cacheUtils');
    cache.delete(cacheKey);
}