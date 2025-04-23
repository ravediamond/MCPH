export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    username: string;
                    avatar_url: string | null;
                    is_admin: boolean;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    username?: string;
                    avatar_url?: string | null;
                    is_admin?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    username?: string;
                    avatar_url?: string | null;
                    is_admin?: boolean;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey";
                        columns: ["id"];
                        isOneToOne: true;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            api_keys: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    api_key: string;
                    scopes: string[];
                    description: string | null;
                    created_at: string;
                    expires_at: string | null;
                    last_used_at: string | null;
                    is_active: boolean;
                    created_from_ip: string;
                    is_admin_key: boolean;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    name: string;
                    api_key: string;
                    scopes?: string[];
                    description?: string | null;
                    created_at?: string;
                    expires_at?: string | null;
                    last_used_at?: string | null;
                    is_active?: boolean;
                    created_from_ip: string;
                    is_admin_key?: boolean;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    name?: string;
                    api_key?: string;
                    scopes?: string[];
                    description?: string | null;
                    created_at?: string;
                    expires_at?: string | null;
                    last_used_at?: string | null;
                    is_active?: boolean;
                    created_from_ip?: string;
                    is_admin_key?: boolean;
                };
                Relationships: [
                    {
                        foreignKeyName: "api_keys_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            mcps: {
                Row: {
                    id: string;
                    created_at: string;
                    name: string;
                    description: string;
                    repository_url: string;
                    repository_name: string | null;
                    tags: string[];
                    version: string;
                    author: string;
                    user_id: string;
                    readme: string | null;
                    last_refreshed: string | null;
                    owner_username: string | null;
                    claimed: boolean | null;
                    is_mcph_owned: boolean | null;
                    view_count: number | null;
                    avg_rating: number | null;
                    review_count: number | null;
                    stars: number | null;
                    forks: number | null;
                    open_issues: number | null;
                    last_repo_update: string | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    name: string;
                    description?: string;
                    repository_url: string;
                    repository_name?: string | null;
                    tags?: string[];
                    version: string;
                    author: string;
                    user_id: string;
                    readme?: string | null;
                    last_refreshed?: string | null;
                    owner_username?: string | null;
                    claimed?: boolean | null;
                    is_mcph_owned?: boolean | null;
                    view_count?: number | null;
                    avg_rating?: number | null;
                    review_count?: number | null;
                    stars?: number | null;
                    forks?: number | null;
                    open_issues?: number | null;
                    last_repo_update?: string | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    name?: string;
                    description?: string;
                    repository_url?: string;
                    repository_name?: string | null;
                    tags?: string[];
                    version?: string;
                    author?: string;
                    user_id?: string;
                    readme?: string | null;
                    last_refreshed?: string | null;
                    owner_username?: string | null;
                    claimed?: boolean | null;
                    is_mcph_owned?: boolean | null;
                    view_count?: number | null;
                    avg_rating?: number | null;
                    review_count?: number | null;
                    stars?: number | null;
                    forks?: number | null;
                    open_issues?: number | null;
                    last_repo_update?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "mcps_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            tag_categories: {
                Row: {
                    id: number;
                    name: string;
                    description: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: number;
                    name: string;
                    description?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: number;
                    name?: string;
                    description?: string | null;
                    created_at?: string;
                };
                Relationships: [];
            };
            tags: {
                Row: {
                    id: number;
                    category_id: number;
                    name: string;
                    description: string | null;
                    icon: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: number;
                    category_id: number;
                    name: string;
                    description?: string | null;
                    icon?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: number;
                    category_id?: number;
                    name?: string;
                    description?: string | null;
                    icon?: string | null;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "tags_category_id_fkey";
                        columns: ["category_id"];
                        isOneToOne: false;
                        referencedRelation: "tag_categories";
                        referencedColumns: ["id"];
                    }
                ];
            };
            // Add other tables as needed
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            generate_api_key: {
                Args: Record<string, never>;
                Returns: string;
            };
            get_tags_by_category: {
                Args: { category_name: string };
                Returns: Database['public']['Tables']['tags']['Row'][];
            };
            is_valid_tag: {
                Args: { tag_name: string; category_name: string };
                Returns: boolean;
            };
        };
        Enums: {
            [_ in never]: never;
        };
    };
}