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
}

export async function validateApiKey(apiKey: string): Promise<{
    valid: boolean;
    key?: ApiKey;
    error?: string;
}> {
    if (!apiKey || apiKey.trim() === '') {
        return { valid: false, error: 'No API key provided' };
    }

    try {
        // In a real implementation, you'd query from a database table of API keys
        // For now, we'll simulate with a Supabase query to an api_keys table that you'd create
        const { data, error } = await supabase
            .from('api_keys')
            .select('*')
            .eq('key', apiKey)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            return { valid: false, error: 'Invalid API key' };
        }

        // Check if key has expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            return { valid: false, error: 'API key has expired' };
        }

        return { valid: true, key: data as ApiKey };
    } catch (error) {
        console.error('Error validating API key:', error);
        return { valid: false, error: 'Error validating API key' };
    }
}