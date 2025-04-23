-- Add is_admin_key column to the api_keys table
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS is_admin_key BOOLEAN DEFAULT FALSE;

-- Create an index on the new column to improve query performance
CREATE INDEX IF NOT EXISTS idx_api_keys_is_admin_key ON api_keys(is_admin_key);

-- Comments for documentation
COMMENT ON COLUMN api_keys.is_admin_key IS 'Indicates if this API key has admin privileges';