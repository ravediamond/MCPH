import { supabase } from 'lib/supabaseClient';

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

export async function validateApiKey(apiKey: string, requireAdmin: boolean = false): Promise<{
    valid: boolean;
    key?: ApiKey;
    error?: string;
    isAdmin?: boolean;
}> {
    if (!apiKey || apiKey.trim() === '') {
        return { valid: false, error: 'No API key provided' };
    }

    try {
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

        // Update last_used_at
        await supabase
            .from('api_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', data.id);

        return {
            valid: true,
            key: { ...data as ApiKey, is_admin_key: isAdmin },
            isAdmin
        };
    } catch (error) {
        console.error('Error validating API key:', error);
        return { valid: false, error: 'Error validating API key' };
    }
}