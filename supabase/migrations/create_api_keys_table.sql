-- Create API keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  description TEXT,
  -- Track IP of key creation for security audit
  created_from_ip TEXT
);

-- Add indexes
CREATE INDEX api_keys_user_id_idx ON api_keys(user_id);
CREATE INDEX api_keys_api_key_idx ON api_keys(api_key);

-- Row-level security policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy for users to only see their own API keys
CREATE POLICY api_keys_select_policy 
  ON api_keys 
  FOR SELECT 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Policy for users to only insert their own API keys
CREATE POLICY api_keys_insert_policy 
  ON api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to only update their own API keys
CREATE POLICY api_keys_update_policy 
  ON api_keys 
  FOR UPDATE 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Policy for users to only delete their own API keys
CREATE POLICY api_keys_delete_policy 
  ON api_keys 
  FOR DELETE 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Function to generate secure API keys
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  key TEXT;
BEGIN
  -- Generate a random UUID and encode it as base64
  key := encode(gen_random_bytes(32), 'base64');
  -- Replace characters that might cause issues in URLs
  key := replace(replace(replace(key, '/', '_'), '+', '-'), '=', '');
  -- Add a prefix to make it recognizable
  key := 'mcph_' || key;
  RETURN key;
END;
$$;