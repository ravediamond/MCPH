-- Version Fix Migration
-- Choose and uncomment one of the following approaches:

-- Option 1: Make the version field nullable
ALTER TABLE public.mcps ALTER COLUMN version DROP NOT NULL;

-- Option 2: Provide a default value for version field
-- ALTER TABLE public.mcps ALTER COLUMN version SET DEFAULT '0.1.0';

-- Update version constraint to allow for null (if using Option 1)
ALTER TABLE public.mcps DROP CONSTRAINT version_format;
ALTER TABLE public.mcps ADD CONSTRAINT version_format 
  CHECK (version IS NULL OR version ~ '^[0-9]+\.[0-9]+\.[0-9]+$');

-- Handle existing NULLs in mcp_versions table as needed
ALTER TABLE public.mcp_versions DROP CONSTRAINT version_format;
ALTER TABLE public.mcp_versions ADD CONSTRAINT version_format 
  CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$');

-- Update version trigger to handle nulls
CREATE OR REPLACE FUNCTION public.record_initial_mcp_version()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.mcp_versions (mcp_id, version, change_summary, changed_by)
    VALUES (NEW.id, COALESCE(NEW.version, '0.1.0'), 'Initial version', NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;