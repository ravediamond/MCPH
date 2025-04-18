import { supabase } from 'lib/supabaseClient';
import { cachedFetch } from './cacheUtils';
import { NextResponse } from 'next/server';

// Cache TTL for API keys (15 minutes)
const API_KEY_CACHE_TTL = 15 * 60 * 1000;

// Update interface to match the actual database structure
interface ApiKey {
    id: string;
    api_key: string; // Changed from 'key' to match database
    name: string;
    created_at: string;
    expires_at: string | null;
    last_used_at: string | null;
    user_id: string;
    rate_limit_per_minute?: number; // Made optional since it might not exist in all records
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
    // We use an SHA-256 hash of the API key for security
    // But for simplicity in this implementation, we'll use a prefix approach
    return `apikey:${apiKey}`;
}

export async function validateApiKey(apiKey: string, requireAdmin: boolean = false): Promise<ApiKeyValidationResult> {
    if (!apiKey || apiKey.trim() === '') {
        return { valid: false, error: 'No API key provided' };
    }

    // Create a cache key for this API key
    const cacheKey = createApiKeyCacheKey(apiKey);

    try {
        // Use cachedFetch to potentially skip database query
        const response = await cachedFetch<ApiKeyValidationResult>(
            cacheKey,
            async () => {
                // This function only runs on cache miss
                let result: ApiKeyValidationResult;
                
                // Fetch the API key and verify it's active
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
                        const { data: profile, error: profileError } = await supabase
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
                
                // Return as NextResponse to match the cachedFetch expected return type
                return NextResponse.json(result);
            },
            API_KEY_CACHE_TTL
        );
        
        // Parse the response to get the validation result
        const result = await response.json();
        return result as ApiKeyValidationResult;
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