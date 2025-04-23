import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../types/database.types';

// Environment variables check
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase URL or ANON KEY in environment variables.");
}

// Use createClientComponentClient for all client-side operations for consistent cookie handling
export const supabase = createClientComponentClient<Database>();

// This is a helper function for cases where a new client instance is needed
export const createClientSupabase = () => {
    // Use same configuration to ensure consistent cookie handling
    return createClientComponentClient<Database>();
};

// Create a server-side client with service role for admin functions that need to bypass RLS
export const createServiceRoleClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error("Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Make sure the service role key is set in your .env file or environment variables.");
    }

    return createClient<Database>(
        supabaseUrl,
        supabaseServiceRoleKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            }
        }
    );
};
