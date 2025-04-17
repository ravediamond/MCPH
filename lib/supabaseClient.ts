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
