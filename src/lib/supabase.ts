import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type MCP = {
    id: string;
    created_at: string;
    name: string;
    description: string;
    deployment_url: string;
    documentation_url: string;
    author: string;
    tags: string[];
    version: string;
    user_id: string;
};
