-- =======================================================================
-- MCPHub - Consolidated Migration Script
-- Created: April 16, 2025
-- Description: A complete database setup script combining all migrations
-- =======================================================================

-- ===========================================
-- Core Tables Creation
-- ===========================================

-- Create MCPs Table with Repository Integration
CREATE TABLE IF NOT EXISTS public.mcps (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    name text NOT NULL,
    description text,
    repository_url text NOT NULL,  -- REQUIRED repository link (e.g., GitHub, GitLab)
    tags text[] DEFAULT '{}',       -- metadata tags
    version text NOT NULL,          -- e.g. repository release/version
    author text NOT NULL,           -- submission author (could be distinct from repository owner)
    user_id uuid REFERENCES auth.users(id),
    readme text,                    -- OPTIONAL: store fetched README for caching/additional processing
    deployment_url text,            -- OPTIONAL: URL to the deployed MCP (if applicable)
    last_refreshed timestamptz,     -- Timestamp when the README was fetched
    owner_username text,            -- GitHub repository owner's username
    repository_name text,           -- GitHub repository name
    view_count INTEGER DEFAULT 0 NOT NULL, -- Number of times this MCP has been viewed
    is_mcph_owned BOOLEAN DEFAULT false, -- Indicates that this MCP is owned by MCPH organization rather than an individual user
    stars integer DEFAULT 0,         -- Number of stars the GitHub repository has
    forks integer DEFAULT 0,         -- Number of forks the GitHub repository has
    open_issues integer DEFAULT 0,   -- Number of open issues in the GitHub repository
    last_repo_update timestamptz,    -- Timestamp of when the GitHub repository was last updated
    avg_rating NUMERIC(3,2) DEFAULT NULL, -- Average rating of the MCP (1-5)
    review_count INTEGER DEFAULT 0,  -- Number of reviews for the MCP

    -- Data quality constraints
    CONSTRAINT name_length CHECK (char_length(name) >= 3),
    CONSTRAINT version_format CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$')
);

-- Create Profiles Table if It Does Not Exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    username text NOT NULL,
    is_admin boolean DEFAULT false
);

-- ===========================================
-- Create Tags Categories Table
-- ===========================================
CREATE TABLE IF NOT EXISTS public.tag_categories (
    id serial PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now()
);

-- ===========================================
-- Create Tags Reference Table
-- ===========================================
CREATE TABLE IF NOT EXISTS public.tags (
    id serial PRIMARY KEY,
    category_id integer REFERENCES public.tag_categories(id),
    name text NOT NULL,
    description text,
    icon text,
    created_at timestamptz DEFAULT now(),
    UNIQUE (category_id, name)
);

-- ===========================================
-- Create Reviews Table for MCPs
-- ===========================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    mcp_id uuid REFERENCES public.mcps(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    rating INTEGER NOT NULL,
    comment TEXT,
    
    -- Ensure rating is between 1 and 5
    CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
    
    -- Each user can only review each MCP once
    CONSTRAINT unique_user_mcp_review UNIQUE (user_id, mcp_id)
);

-- ===========================================
-- Create MCP Version History Table
-- ===========================================
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

-- ===========================================
-- Create API Keys Table
-- ===========================================
CREATE TABLE IF NOT EXISTS public.api_keys (
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

-- ===========================================
-- Create Error Logs Table for API and System Errors
-- ===========================================
CREATE TABLE IF NOT EXISTS public.error_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    type text NOT NULL,
    message text NOT NULL,
    details text,
    stack text,
    resolved boolean DEFAULT false
);

-- ===========================================
-- Create Admin Logs Table to Track Administrative Actions
-- ===========================================
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    action text NOT NULL,
    admin_id uuid REFERENCES auth.users(id) NOT NULL,
    details jsonb
);

-- ===========================================
-- Create Functions
-- ===========================================

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

-- Function to increment view count for an MCP
CREATE OR REPLACE FUNCTION increment_view_count(row_id UUID)
RETURNS INTEGER
LANGUAGE SQL
AS $$
  UPDATE public.mcps
  SET view_count = view_count + 1
  WHERE id = row_id
  RETURNING view_count;
$$;

-- Function to automatically update the updated_at column for reviews
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update the MCP's average rating and review count
CREATE OR REPLACE FUNCTION update_mcp_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating_val NUMERIC(3,2);
    review_count_val INTEGER;
BEGIN
    -- Calculate the new average rating and count for this MCP
    SELECT 
        AVG(rating)::NUMERIC(3,2),
        COUNT(*)
    INTO 
        avg_rating_val,
        review_count_val
    FROM 
        public.reviews
    WHERE 
        mcp_id = COALESCE(NEW.mcp_id, OLD.mcp_id);

    -- Update the MCP record with new average and count
    UPDATE public.mcps
    SET 
        avg_rating = avg_rating_val,
        review_count = review_count_val
    WHERE 
        id = COALESCE(NEW.mcp_id, OLD.mcp_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to record initial MCP version
CREATE OR REPLACE FUNCTION record_initial_mcp_version()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.mcp_versions (mcp_id, version, change_summary, changed_by)
    VALUES (NEW.id, NEW.version, 'Initial version', NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get all tags of a specific category
CREATE OR REPLACE FUNCTION get_tags_by_category(category_name text)
RETURNS SETOF public.tags AS $$
BEGIN
  RETURN QUERY
  SELECT t.*
  FROM public.tags t
  JOIN public.tag_categories tc ON t.category_id = tc.id
  WHERE tc.name = category_name
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate if a tag is in the correct category
CREATE OR REPLACE FUNCTION is_valid_tag(tag_name text, category_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.tags t
    JOIN public.tag_categories tc ON t.category_id = tc.id
    WHERE t.name = tag_name AND tc.name = category_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- Create Triggers
-- ===========================================

-- Create trigger to update the updated_at column for reviews
CREATE TRIGGER update_reviews_updated_at_trigger
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_reviews_updated_at();

-- Create trigger to record initial version when MCP is created
CREATE TRIGGER record_initial_mcp_version_trigger
AFTER INSERT ON public.mcps
FOR EACH ROW
EXECUTE FUNCTION record_initial_mcp_version();

-- Create triggers to update MCP ratings when reviews change
CREATE TRIGGER update_mcp_rating_on_insert
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_mcp_rating();

CREATE TRIGGER update_mcp_rating_on_update
AFTER UPDATE ON public.reviews
FOR EACH ROW
WHEN (OLD.rating IS DISTINCT FROM NEW.rating)
EXECUTE FUNCTION update_mcp_rating();

CREATE TRIGGER update_mcp_rating_on_delete
AFTER DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_mcp_rating();

-- ===========================================
-- Create Indexes
-- ===========================================

-- MCPs table indexes
CREATE INDEX IF NOT EXISTS mcps_user_id_idx ON public.mcps(user_id);
CREATE INDEX IF NOT EXISTS mcps_name_idx ON public.mcps(name);
CREATE INDEX IF NOT EXISTS mcps_tags_idx ON public.mcps USING gin(tags);
CREATE INDEX IF NOT EXISTS mcps_repository_url_idx ON public.mcps(repository_url);
CREATE INDEX IF NOT EXISTS idx_mcps_view_count ON public.mcps(view_count);
CREATE INDEX IF NOT EXISTS idx_mcps_is_mcph_owned ON public.mcps(is_mcph_owned);
CREATE INDEX IF NOT EXISTS mcps_stars_idx ON public.mcps(stars);
CREATE INDEX IF NOT EXISTS mcps_forks_idx ON public.mcps(forks);
CREATE INDEX IF NOT EXISTS mcps_avg_rating_idx ON public.mcps(avg_rating);
CREATE INDEX IF NOT EXISTS mcps_review_count_idx ON public.mcps(review_count);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS reviews_mcp_id_idx ON public.reviews(mcp_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON public.reviews(created_at);

-- MCP versions table indexes
CREATE INDEX IF NOT EXISTS mcp_versions_mcp_id_idx ON public.mcp_versions(mcp_id);
CREATE INDEX IF NOT EXISTS mcp_versions_created_at_idx ON public.mcp_versions(created_at);
CREATE INDEX IF NOT EXISTS mcp_versions_changed_by_idx ON public.mcp_versions(changed_by);

-- API keys table indexes
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_api_key_idx ON public.api_keys(api_key);

-- Tags and tag categories indexes
CREATE INDEX IF NOT EXISTS tags_category_id_idx ON public.tags(category_id);
CREATE INDEX IF NOT EXISTS tags_name_idx ON public.tags(name);

-- Error and admin logs indexes
CREATE INDEX IF NOT EXISTS error_logs_type_idx ON public.error_logs(type);
CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON public.error_logs(created_at);
CREATE INDEX IF NOT EXISTS admin_logs_admin_id_idx ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS admin_logs_action_idx ON public.admin_logs(action);
CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx ON public.admin_logs(created_at);

-- ===========================================
-- Enable Row Level Security
-- ===========================================
ALTER TABLE public.mcps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS Policies for MCPs Table
-- ===========================================
-- Allow everyone to view MCPs
CREATE POLICY "Public MCPs are viewable by everyone"
    ON public.mcps FOR SELECT
    USING (true);

-- Ensure that users can only insert MCPs for their own account
CREATE POLICY "Users can insert their own MCPs"
    ON public.mcps FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Only allow users to update their own MCPs
CREATE POLICY "Users can update their own MCPs"
    ON public.mcps FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Only allow users to delete their own MCPs
CREATE POLICY "Users can delete their own MCPs"
    ON public.mcps FOR DELETE
    USING (auth.uid() = user_id);

-- ===========================================
-- RLS Policies for API Keys Table
-- ===========================================
-- Policy for users to only see their own API keys
CREATE POLICY api_keys_select_policy 
  ON public.api_keys 
  FOR SELECT 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Policy for users to only insert their own API keys
CREATE POLICY api_keys_insert_policy 
  ON public.api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to only update their own API keys
CREATE POLICY api_keys_update_policy 
  ON public.api_keys 
  FOR UPDATE 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Policy for users to only delete their own API keys
CREATE POLICY api_keys_delete_policy 
  ON public.api_keys 
  FOR DELETE 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- ===========================================
-- RLS Policies for MCP Versions Table
-- ===========================================
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

-- ===========================================
-- RLS Policies for Reviews Table
-- ===========================================
-- Allow everyone to view reviews
CREATE POLICY "Public reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    USING (true);

-- Only allow users to insert their own reviews
CREATE POLICY "Users can insert their own reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Only allow users to update their own reviews
CREATE POLICY "Users can update their own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Only allow users to delete their own reviews
CREATE POLICY "Users can delete their own reviews"
    ON public.reviews FOR DELETE
    USING (auth.uid() = user_id);

-- ===========================================
-- RLS Policies for Tags and Tag Categories
-- ===========================================
-- Everyone can view tags
CREATE POLICY "Tags are viewable by everyone"
    ON public.tags FOR SELECT
    USING (true);

CREATE POLICY "Tag categories are viewable by everyone"
    ON public.tag_categories FOR SELECT
    USING (true);

-- Only admins can insert/update/delete tags
CREATE POLICY "Only admins can insert tags"
    ON public.tags FOR INSERT
    WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Only admins can update tags"
    ON public.tags FOR UPDATE
    USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Only admins can delete tags"
    ON public.tags FOR DELETE
    USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- Only admins can insert/update/delete tag categories
CREATE POLICY "Only admins can insert tag categories"
    ON public.tag_categories FOR INSERT
    WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Only admins can update tag categories"
    ON public.tag_categories FOR UPDATE
    USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Only admins can delete tag categories"
    ON public.tag_categories FOR DELETE
    USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ===========================================
-- Insert Initial Data - Tag Categories
-- ===========================================
INSERT INTO public.tag_categories (name, description) VALUES
('domain', 'Domain/Functional Categories - Describe the main function or sector that an MCP targets'),
('deployment', 'Deployment Types - Indicate whether the solution is typically available as a hosted service or requires installation'),
('provider', 'Provider Type - Indicates whether the MCP is officially supported by service providers or contributed by the community')
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- Insert Initial Data - Deployment Tags
-- ===========================================
INSERT INTO public.tags (category_id, name, description, icon) VALUES
((SELECT id FROM public.tag_categories WHERE name = 'deployment'), 'Deployed', 'Solution is already available as a managed service', '☁️'),
((SELECT id FROM public.tag_categories WHERE name = 'deployment'), 'Self-Hosted', 'Solution is provided as code that you must install locally', '🏠')
ON CONFLICT (category_id, name) DO NOTHING;

-- ===========================================
-- Insert Initial Data - Provider Tags
-- ===========================================
INSERT INTO public.tags (category_id, name, description, icon) VALUES
((SELECT id FROM public.tag_categories WHERE name = 'provider'), 'Official', 'MCP created and maintained by official service providers', '✓'),
((SELECT id FROM public.tag_categories WHERE name = 'provider'), 'Community', 'MCP contributed by the community', '👥')
ON CONFLICT (category_id, name) DO NOTHING;

-- ===========================================
-- Insert Initial Data - Domain Tags
-- ===========================================
INSERT INTO public.tags (category_id, name, description) VALUES
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Aggregators', 'Services that combine data from multiple sources'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Art & Culture', 'Services related to art, media, and cultural content'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Browser Automation', 'Tools for automating browser interactions'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Cloud Platforms', 'Services operating on cloud infrastructure'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Code Execution', 'Services that execute code remotely'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Coding Agents', 'AI agents that assist with or generate code'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Command Line', 'Tools operated via command line interfaces'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Communication', 'Services for messaging, email, and other communications'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Customer Data Platforms', 'Tools for managing customer data and interactions'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Databases', 'Database services and storage solutions'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Data Platforms', 'Platforms for data processing and analytics'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Developer Tools', 'Tools specifically built for developers'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Data Science Tools', 'Tools for data analysis and scientific computing'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Embedded Systems', 'Services for edge devices and embedded computing'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'File Systems', 'Tools for file management and storage'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Finance & Fintech', 'Financial services and technologies'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Gaming', 'Game development and gaming-related services'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Knowledge & Memory', 'Tools for knowledge management and retrieval'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Location Services', 'Geographic and location-based services'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Marketing', 'Marketing automation and analytics tools'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Monitoring', 'System monitoring and observability tools'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Search & Data Extraction', 'Tools for searching and extracting information'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Security', 'Security-related services and tools'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Sports', 'Sports-related services and applications'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Support & Service Management', 'Customer support and service management tools'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Translation Services', 'Language translation and localization tools'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Travel & Transportation', 'Travel planning and transportation services'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Version Control', 'Version control systems and related tools'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Other Tools and Integrations', 'Miscellaneous tools and integrations'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Frameworks', 'Software frameworks and platforms'),
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Utilities', 'Utility tools and services')
ON CONFLICT (category_id, name) DO NOTHING;

-- Create provider tag index
DO $$
DECLARE
    provider_id integer;
BEGIN
    SELECT id INTO provider_id FROM public.tag_categories WHERE name = 'provider';
    IF provider_id IS NOT NULL THEN
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS tags_provider_idx ON public.tags(name) WHERE category_id = %s;',
            provider_id
        );
    END IF;
END $$;

-- ===========================================
-- Add Column Comments
-- ===========================================
COMMENT ON COLUMN public.mcps.is_mcph_owned IS 'Indicates that this MCP is owned by MCPH organization rather than an individual user';
COMMENT ON COLUMN public.mcps.stars IS 'Number of stars the GitHub repository has';
COMMENT ON COLUMN public.mcps.forks IS 'Number of forks the GitHub repository has';
COMMENT ON COLUMN public.mcps.open_issues IS 'Number of open issues in the GitHub repository';
COMMENT ON COLUMN public.mcps.last_repo_update IS 'Timestamp of when the GitHub repository was last updated';
COMMENT ON COLUMN public.mcps.avg_rating IS 'Average rating of the MCP (1-5)';
COMMENT ON COLUMN public.mcps.review_count IS 'Number of reviews for the MCP';

COMMENT ON TABLE public.mcp_versions IS 'Stores version history for MCPs, including change details and who made the changes';
COMMENT ON TABLE public.reviews IS 'Stores user reviews and ratings for MCPs';