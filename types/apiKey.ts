export interface ApiKey {
    id: string;
    user_id: string;
    name: string;
    api_key: string;
    scopes: string[];
    created_at: string;
    expires_at?: string | null;
    last_used_at?: string | null;
    is_active: boolean;
    description?: string | null;
    created_from_ip?: string | null;
    is_admin_key?: boolean;
    user?: {
        email: string;
        username?: string;
    };
}

export interface CreateApiKeyRequest {
    name: string;
    description?: string;
    expires_at?: string | null;
    scopes?: string[];
    isAdminKey?: boolean;
}

export interface ApiKeyResponse {
    success: boolean;
    message?: string;
    apiKey?: ApiKey;
    plainTextKey?: string; // Only provided once upon creation
}