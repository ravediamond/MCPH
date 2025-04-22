-- ===========================================
-- Remove version column from MCPs Table
-- ===========================================
-- This migration removes the version column and related constraints
-- Since all MCPs will be removed, we can simply drop the column without data migration
-- ===========================================

-- First, drop the constraint that enforces the version format
ALTER TABLE public.mcps DROP CONSTRAINT IF EXISTS version_format;

-- Then, drop the version column
ALTER TABLE public.mcps DROP COLUMN IF EXISTS version;

-- Add comment explaining the change
COMMENT ON TABLE public.mcps IS 'Store MCP metadata. Version information is now tracked in version history table rather than on the MCP itself';