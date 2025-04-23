-- ====================================================
-- Add Repository Metrics Columns to MCPs Table
-- ====================================================
-- This migration adds columns to store GitHub repository metrics
-- including star count, fork count, open issues, and last update time
-- ====================================================

-- Add stars column to store GitHub stargazers count
ALTER TABLE public.mcps ADD COLUMN IF NOT EXISTS stars integer DEFAULT 0;

-- Add forks column to store GitHub fork count
ALTER TABLE public.mcps ADD COLUMN IF NOT EXISTS forks integer DEFAULT 0;

-- Add open_issues column to store GitHub open issues count
ALTER TABLE public.mcps ADD COLUMN IF NOT EXISTS open_issues integer DEFAULT 0;

-- Add last_repo_update column to track when the repository was last updated on GitHub
ALTER TABLE public.mcps ADD COLUMN IF NOT EXISTS last_repo_update timestamptz;

-- Add indexes for the new columns to improve query performance
CREATE INDEX IF NOT EXISTS mcps_stars_idx ON public.mcps(stars);
CREATE INDEX IF NOT EXISTS mcps_forks_idx ON public.mcps(forks);

-- Comment to explain the purpose of these columns
COMMENT ON COLUMN public.mcps.stars IS 'Number of stars the GitHub repository has';
COMMENT ON COLUMN public.mcps.forks IS 'Number of forks the GitHub repository has';
COMMENT ON COLUMN public.mcps.open_issues IS 'Number of open issues in the GitHub repository';
COMMENT ON COLUMN public.mcps.last_repo_update IS 'Timestamp of when the GitHub repository was last updated';