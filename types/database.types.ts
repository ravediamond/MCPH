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
        };
        Enums: {
            [_ in never]: never;
        };
    };
}