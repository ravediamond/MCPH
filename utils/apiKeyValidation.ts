import { supabase } from 'lib/supabaseClient';
import { cacheFetch, CACHE_REGIONS } from './cacheUtils';

// Cache TTL for API keys (15 minutes)
const API_KEY_CACHE_TTL = 15 * 60;

// Update interface to match the actual database structure
interface ApiKey {
    id: string;
    api_key: string;
    name: string;
    created_at: string;
    expires_at: string | null;
    last_used_at: string | null;
    user_id: string;
    rate_limit_per_minute?: number;
    scopes: string[];
    is_active: boolean;
    created_from_ip?: string;
    description?: string | null;
    is_admin_key?: boolean;
}

interface ApiKeyValidationResult {
    valid: boolean;
    key?: ApiKey;
    error?: string;
    isAdmin?: boolean;
}

/**
 * Create a cache key for an API key validation
 */
function createApiKeyCacheKey(apiKey: string): string {
    return apiKey.substring(0, 10); // Only use part of the key for the cache key
}

export async function validateApiKey(apiKey: string, requireAdmin: boolean = false): Promise<ApiKeyValidationResult> {
    if (!apiKey || apiKey.trim() === '') {
        return { valid: false, error: 'No API key provided' };
    }

    try {
        // Use the new cacheFetch function to potentially skip database query
        return await cacheFetch<ApiKeyValidationResult>(
            'api-keys', // Use the separate region for API keys
            createApiKeyCacheKey(apiKey),
            async () => {
                // This function only runs on cache miss
                let result: ApiKeyValidationResult;

                // Perform the validation query
                const { data, error } = await supabase
                    .from('api_keys')
                    .select('*')
                    .eq('api_key', apiKey)
                    .eq('is_active', true)
                    .single();

                if (error || !data) {
                    result = { valid: false, error: 'Invalid API key' };
                } else {
                    // Check if key has expired
                    if (data.expires_at && new Date(data.expires_at) < new Date()) {
                        // Update key status to inactive since it's expired
                        await supabase
                            .from('api_keys')
                            .update({ is_active: false })
                            .eq('id', data.id);

                        result = { valid: false, error: 'API key has expired' };
                    } else {
                        // Get the user's admin status
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('is_admin')
                            .eq('id', data.user_id)
                            .single();

                        const isAdmin = profile?.is_admin === true;

                        // Check if admin status is required but the key owner is not an admin
                        if (requireAdmin && !isAdmin) {
                            result = {
                                valid: false,
                                error: 'This operation requires an admin API key',
                                isAdmin: false
                            };
                        } else {
                            // Update last_used_at periodically (not on every request)
                            const lastUsedAt = data.last_used_at ? new Date(data.last_used_at) : new Date(0);
                            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

                            if (lastUsedAt < fiveMinutesAgo) {
                                await supabase
                                    .from('api_keys')
                                    .update({ last_used_at: new Date().toISOString() })
                                    .eq('id', data.id);
                            }

                            // Now data directly matches our ApiKey interface with the admin flag added
                            const keyWithAdmin: ApiKey = {
                                ...data as ApiKey,
                                is_admin_key: isAdmin
                            };

                            result = {
                                valid: true,
                                key: keyWithAdmin,
                                isAdmin
                            };
                        }
                    }
                }

                return result;
            },
            API_KEY_CACHE_TTL,
            // Don't cache failed validations for as long
            (result) => result.valid ? true : false
        );
    } catch (error) {
        return { valid: false, error: 'Error validating API key' };
    }
}

/**
 * Invalidate the cache for a specific API key
 * Call this function when an API key is updated or deleted
 */
export function invalidateApiKeyCache(apiKey: string): void {
    const { invalidateCache } = require('./cacheUtils');
    invalidateCache('api-keys', createApiKeyCacheKey(apiKey)).catch((error: Error) => {
        console.error('Error invalidating API key cache:', error);
    });
}