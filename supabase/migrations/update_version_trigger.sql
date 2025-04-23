-- ===========================================
-- Update version history trigger after removing version column
-- ===========================================
-- This migration updates the record_initial_mcp_version trigger function
-- to handle MCPs without a version field
-- ===========================================

-- First, drop the existing trigger
DROP TRIGGER IF EXISTS record_initial_mcp_version_trigger ON public.mcps;

-- Update the function to use a default version
CREATE OR REPLACE FUNCTION public.record_initial_mcp_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Use a default version of 1.0.0 since version field no longer exists
    INSERT INTO public.mcp_versions (mcp_id, version, change_summary, changed_by)
    VALUES (NEW.id, '1.0.0', 'Initial version', NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create the trigger with the updated function
CREATE TRIGGER record_initial_mcp_version_trigger
AFTER INSERT ON public.mcps
FOR EACH ROW
EXECUTE FUNCTION public.record_initial_mcp_version();

-- Add a comment explaining the update
COMMENT ON FUNCTION public.record_initial_mcp_version IS 'Records the initial version of an MCP when created, using a default version of 1.0.0';