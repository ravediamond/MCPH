-- Simplify the API keys table by removing unused columns and keeping only essential ones
-- First, ensure the is_admin_key column exists (in case this migration runs before the add_is_admin_key_column migration)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'api_keys' 
          AND column_name = 'is_admin_key'
    ) THEN
        ALTER TABLE api_keys ADD COLUMN is_admin_key BOOLEAN DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_api_keys_is_admin_key ON api_keys(is_admin_key);
        COMMENT ON COLUMN api_keys.is_admin_key IS 'Indicates if this API key has admin privileges';
    END IF;
END$$;

-- Remove the scopes column and rate limiting as they're not being used
ALTER TABLE api_keys DROP COLUMN IF EXISTS scopes;
ALTER TABLE api_keys DROP COLUMN IF EXISTS rate_limit_per_minute;

-- Add a comment to document the simplified structure
COMMENT ON TABLE api_keys IS 'API keys for authentication with simplified structure - admin or regular keys only';