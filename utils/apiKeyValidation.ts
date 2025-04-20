import { supabase } from 'lib/supabaseClient';
import { ApiKey } from '../types/apiKey';

interface ApiKeyValidationResult {
    valid: boolean;
    key?: ApiKey;
    error?: string;
    isAdmin?: boolean;
}

export async function validateApiKey(apiKey: string, requireAdmin: boolean = false): Promise<ApiKeyValidationResult> {
    if (!apiKey || apiKey.trim() === '') {
        return { valid: false, error: 'No API key provided' };
    }

    try {
        // Perform the validation query
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

        // Check if admin status is required but the key is not an admin key
        if (requireAdmin && !data.is_admin_key) {
            return {
                valid: false,
                error: 'This operation requires an admin API key',
                isAdmin: false
            };
        }

        // Update last_used_at
        await supabase
            .from('api_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', data.id);

        return {
            valid: true,
            key: data as ApiKey,
            isAdmin: data.is_admin_key
        };
    } catch (error) {
        return { valid: false, error: 'Error validating API key' };
    }
}