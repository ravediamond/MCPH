-- ===========================================
-- Add Version History Table for MCPs
-- ===========================================
-- This migration adds a table to track version history of MCPs
-- and relationship to the main mcps table
-- ===========================================

-- Create MCP Versions Table
CREATE TABLE IF NOT EXISTS public.mcp_versions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    mcp_id uuid REFERENCES public.mcps(id) ON DELETE CASCADE,
    version text NOT NULL,
    change_summary text,
    change_details text,
    changed_by uuid REFERENCES auth.users(id),
    
    -- Ensure versions follow semver format like main mcps table
    CONSTRAINT version_format CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$')
);

-- Create index for efficient queries by MCP ID
CREATE INDEX IF NOT EXISTS mcp_versions_mcp_id_idx ON public.mcp_versions(mcp_id);
CREATE INDEX IF NOT EXISTS mcp_versions_created_at_idx ON public.mcp_versions(created_at);

-- Enable RLS on the new table
ALTER TABLE public.mcp_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mcp_versions table
-- Allow everyone to view version history
CREATE POLICY "Public MCP versions are viewable by everyone"
    ON public.mcp_versions FOR SELECT
    USING (true);

-- Only allow users to insert version history for MCPs they own
CREATE POLICY "Users can insert version history for own MCPs"
    ON public.mcp_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.mcps 
            WHERE mcps.id = mcp_versions.mcp_id 
            AND mcps.user_id = auth.uid()
        )
    );

-- Only allow admins to delete version history
CREATE POLICY "Only admins can delete version history"
    ON public.mcp_versions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Add a function to auto-record initial version when an MCP is created
CREATE OR REPLACE FUNCTION public.record_initial_mcp_version()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.mcp_versions (mcp_id, version, change_summary, changed_by)
    VALUES (NEW.id, NEW.version, 'Initial version', NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to record initial version
CREATE TRIGGER record_initial_mcp_version_trigger
AFTER INSERT ON public.mcps
FOR EACH ROW
EXECUTE FUNCTION public.record_initial_mcp_version();

-- Add a comment explaining the table's purpose
COMMENT ON TABLE public.mcp_versions IS 'Stores version history for MCPs, including change details and who made the changes';

-- Add index for faster querying by user
CREATE INDEX IF NOT EXISTS mcp_versions_changed_by_idx ON public.mcp_versions(changed_by);