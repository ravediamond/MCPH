-- ===========================================
-- MCPHub Complete Database Schema
-- Aggregated Migration File
-- Generated on: April 23, 2025
-- ===========================================

-- ===========================================
-- Create Base Tables
-- ===========================================

-- Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE
);

-- Create MCPs Table
CREATE TABLE IF NOT EXISTS public.mcps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT,
    repository_url TEXT NOT NULL,  -- REQUIRED repository link (e.g., GitHub, GitLab)
    tags TEXT[] DEFAULT '{}',      -- metadata tags
    version TEXT NOT NULL,         -- e.g. repository release/version
    author TEXT NOT NULL,          -- submission author (could be distinct from repository owner)
    user_id UUID REFERENCES auth.users(id),
    readme TEXT,                    -- OPTIONAL: store fetched README for caching/additional processing
    deployment_url TEXT,            -- OPTIONAL: URL to the deployed MCP (if applicable)
    last_refreshed TIMESTAMPTZ,     -- Timestamp when the README was fetched
    owner_username TEXT,            -- GitHub repository owner's username
    repository_name TEXT,           -- GitHub repository name
    avg_rating NUMERIC(3,2) DEFAULT NULL,  -- Average rating of the MCP (1-5)
    review_count INTEGER DEFAULT 0,        -- Number of reviews for the MCP
    is_mcph_owned BOOLEAN DEFAULT FALSE,   -- Indicates ownership by MCPH org
    stars INTEGER DEFAULT 0,               -- Number of stars on GitHub
    forks INTEGER DEFAULT 0,               -- Number of forks on GitHub
    open_issues INTEGER DEFAULT 0,         -- Number of open issues on GitHub
    last_repo_update TIMESTAMPTZ,          -- Timestamp of the last GitHub repo update
    view_count INTEGER DEFAULT 0,          -- Number of page views
    
    -- Data quality constraints
    CONSTRAINT name_length CHECK (char_length(name) >= 3),
    CONSTRAINT version_format CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$')
);

-- Create Tag Categories Table
CREATE TABLE IF NOT EXISTS public.tag_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES public.tag_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (category_id, name)
);

-- Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    mcp_id UUID REFERENCES public.mcps(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    rating INTEGER NOT NULL,
    comment TEXT,
    
    -- Ensure rating is between 1 and 5
    CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
    
    -- Each user can only review each MCP once
    CONSTRAINT unique_user_mcp_review UNIQUE (user_id, mcp_id)
);

-- Create MCP Versions Table
CREATE TABLE IF NOT EXISTS public.mcp_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    mcp_id UUID REFERENCES public.mcps(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    change_summary TEXT,
    change_details TEXT,
    changed_by UUID REFERENCES auth.users(id),
    
    -- Ensure versions follow semver format like main mcps table
    CONSTRAINT version_format CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$')
);

-- Create API Keys Table
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
    created_from_ip TEXT,
    is_admin_key BOOLEAN DEFAULT FALSE
);

-- Create Error Logs Table
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    details TEXT,
    stack TEXT,
    resolved BOOLEAN DEFAULT FALSE
);

-- Create Admin Logs Table
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    action TEXT NOT NULL,
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    details JSONB
);

-- ===========================================
-- Enable Row Level Security on all tables
-- ===========================================
ALTER TABLE public.mcps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- Create RLS Policies
-- ===========================================

-- MCPs Table Policies
CREATE POLICY "Public MCPs are viewable by everyone"
    ON public.mcps FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own MCPs"
    ON public.mcps FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MCPs"
    ON public.mcps FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own MCPs"
    ON public.mcps FOR DELETE
    USING (auth.uid() = user_id);

-- Tag Categories Policies
CREATE POLICY "Tag categories are viewable by everyone"
    ON public.tag_categories FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert tag categories"
    ON public.tag_categories FOR INSERT
    WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Only admins can update tag categories"
    ON public.tag_categories FOR UPDATE
    USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Only admins can delete tag categories"
    ON public.tag_categories FOR DELETE
    USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- Tags Policies
CREATE POLICY "Tags are viewable by everyone"
    ON public.tags FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert tags"
    ON public.tags FOR INSERT
    WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Only admins can update tags"
    ON public.tags FOR UPDATE
    USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Only admins can delete tags"
    ON public.tags FOR DELETE
    USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- Reviews Policies
CREATE POLICY "Public reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
    ON public.reviews FOR DELETE
    USING (auth.uid() = user_id);

-- MCP Versions Policies
CREATE POLICY "Public MCP versions are viewable by everyone"
    ON public.mcp_versions FOR SELECT
    USING (true);

CREATE POLICY "Users can insert version history for own MCPs"
    ON public.mcp_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.mcps 
            WHERE mcps.id = mcp_versions.mcp_id 
            AND mcps.user_id = auth.uid()
        )
    );

CREATE POLICY "Only admins can delete version history"
    ON public.mcp_versions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- API Keys Policies
CREATE POLICY "api_keys_select_policy"
    ON public.api_keys FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    ));

CREATE POLICY "api_keys_insert_policy"
    ON public.api_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_keys_update_policy"
    ON public.api_keys FOR UPDATE
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    ));

CREATE POLICY "api_keys_delete_policy"
    ON public.api_keys FOR DELETE
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    ));

-- ===========================================
-- Create Indexes
-- ===========================================

-- MCPs Table Indexes
CREATE INDEX IF NOT EXISTS mcps_user_id_idx ON public.mcps(user_id);
CREATE INDEX IF NOT EXISTS mcps_name_idx ON public.mcps(name);
CREATE INDEX IF NOT EXISTS mcps_tags_idx ON public.mcps USING gin(tags);
CREATE INDEX IF NOT EXISTS mcps_repository_url_idx ON public.mcps(repository_url);
CREATE INDEX IF NOT EXISTS mcps_avg_rating_idx ON public.mcps(avg_rating);
CREATE INDEX IF NOT EXISTS mcps_review_count_idx ON public.mcps(review_count);
CREATE INDEX IF NOT EXISTS mcps_stars_idx ON public.mcps(stars);
CREATE INDEX IF NOT EXISTS mcps_forks_idx ON public.mcps(forks);
CREATE INDEX IF NOT EXISTS idx_mcps_is_mcph_owned ON public.mcps(is_mcph_owned);
CREATE INDEX IF NOT EXISTS mcps_view_count_idx ON public.mcps(view_count);

-- Tags Table Indexes
CREATE INDEX IF NOT EXISTS tags_category_id_idx ON public.tags(category_id);
CREATE INDEX IF NOT EXISTS tags_name_idx ON public.tags(name);

-- Reviews Table Indexes
CREATE INDEX IF NOT EXISTS reviews_mcp_id_idx ON public.reviews(mcp_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON public.reviews(created_at);

-- MCP Versions Table Indexes
CREATE INDEX IF NOT EXISTS mcp_versions_mcp_id_idx ON public.mcp_versions(mcp_id);
CREATE INDEX IF NOT EXISTS mcp_versions_created_at_idx ON public.mcp_versions(created_at);
CREATE INDEX IF NOT EXISTS mcp_versions_changed_by_idx ON public.mcp_versions(changed_by);

-- API Keys Table Indexes
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_api_key_idx ON public.api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_admin_key ON public.api_keys(is_admin_key);

-- Error Logs Table Indexes
CREATE INDEX IF NOT EXISTS error_logs_type_idx ON public.error_logs(type);
CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON public.error_logs(created_at);

-- Admin Logs Table Indexes
CREATE INDEX IF NOT EXISTS admin_logs_admin_id_idx ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS admin_logs_action_idx ON public.admin_logs(action);
CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx ON public.admin_logs(created_at);

-- ===========================================
-- Create Functions and Triggers
-- ===========================================

-- Function to update the updated_at column in reviews
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at column in reviews
CREATE TRIGGER update_reviews_updated_at_trigger
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_reviews_updated_at();

-- Function to update MCP ratings
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

-- Create triggers to update MCP ratings
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

-- Function to record initial MCP version
CREATE OR REPLACE FUNCTION public.record_initial_mcp_version()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.mcp_versions (mcp_id, version, change_summary, changed_by)
    VALUES (NEW.id, NEW.version, 'Initial version', NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to record initial MCP version
CREATE TRIGGER record_initial_mcp_version_trigger
AFTER INSERT ON public.mcps
FOR EACH ROW
EXECUTE FUNCTION public.record_initial_mcp_version();

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

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(mcp_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.mcps
  SET view_count = view_count + 1
  WHERE id = mcp_id;
END;
$$;

-- Function to get tags by category
CREATE OR REPLACE FUNCTION get_tags_by_category(category_name TEXT)
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
CREATE OR REPLACE FUNCTION is_valid_tag(tag_name TEXT, category_name TEXT)
RETURNS BOOLEAN AS $$
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
-- Insert Initial Data
-- ===========================================

-- Initial Tag Categories
INSERT INTO public.tag_categories (name, description)
VALUES
('domain', 'Domain/Functional Categories - Describe the main function or sector that an MCP targets'),
('deployment', 'Deployment Types - Indicate whether the solution is typically available as a hosted service or requires installation'),
('provider', 'Provider Type - Indicates whether the MCP is officially supported by service providers or contributed by the community')
ON CONFLICT (name) DO NOTHING;

-- Insert Domain Tags
INSERT INTO public.tags (category_id, name, description)
VALUES
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
((SELECT id FROM public.tag_categories WHERE name = 'domain'), 'Utilities', 'Utility tools and services');

-- Insert Deployment Tags
INSERT INTO public.tags (category_id, name, description, icon)
VALUES
((SELECT id FROM public.tag_categories WHERE name = 'deployment'), 'Deployed', 'Solution is already available as a managed service', '☁️'),
((SELECT id FROM public.tag_categories WHERE name = 'deployment'), 'Self-Hosted', 'Solution is provided as code that you must install locally', '🏠');

-- Insert Provider Tags
INSERT INTO public.tags (category_id, name, description, icon)
VALUES
((SELECT id FROM public.tag_categories WHERE name = 'provider'), 'Official', 'MCP created and maintained by official service providers', '✓'),
((SELECT id FROM public.tag_categories WHERE name = 'provider'), 'Community', 'MCP contributed by the community', '👥');

-- Create the partial index for provider tag
DO $$
DECLARE
    provider_id INTEGER;
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
-- Add Comments
-- ===========================================

-- Table Comments
COMMENT ON TABLE public.mcps IS 'Stores Model Context Protocol implementations';
COMMENT ON TABLE public.reviews IS 'Stores user reviews and ratings for MCPs';
COMMENT ON TABLE public.mcp_versions IS 'Stores version history for MCPs, including change details and who made the changes';
COMMENT ON TABLE public.api_keys IS 'Stores API keys for authenticated access to the MCPHub API';
COMMENT ON TABLE public.error_logs IS 'Stores system error logs for debugging and monitoring';
COMMENT ON TABLE public.admin_logs IS 'Tracks administrative actions performed by admins';
COMMENT ON TABLE public.tag_categories IS 'Stores categories for organizing tags';
COMMENT ON TABLE public.tags IS 'Stores tags for categorizing MCPs';

-- Column Comments
COMMENT ON COLUMN public.mcps.avg_rating IS 'Average rating of the MCP (1-5)';
COMMENT ON COLUMN public.mcps.review_count IS 'Number of reviews for the MCP';
COMMENT ON COLUMN public.mcps.is_mcph_owned IS 'Indicates that this MCP is owned by MCPH organization rather than an individual user';
COMMENT ON COLUMN public.mcps.stars IS 'Number of stars the GitHub repository has';
COMMENT ON COLUMN public.mcps.forks IS 'Number of forks the GitHub repository has';
COMMENT ON COLUMN public.mcps.open_issues IS 'Number of open issues in the GitHub repository';
COMMENT ON COLUMN public.mcps.last_repo_update IS 'Timestamp of when the GitHub repository was last updated';
COMMENT ON COLUMN public.mcps.view_count IS 'Number of times this MCP page has been viewed';
COMMENT ON COLUMN public.api_keys.is_admin_key IS 'Indicates if this API key has admin privileges';