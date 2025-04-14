-- ===========================================
-- Create MCPs Table with Repository Integration
-- ===========================================
create table public.mcps (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now(),
    name text not null,
    description text,
    repository_url text not null,  -- REQUIRED repository link (e.g., GitHub, GitLab)
    tags text[] default '{}',       -- metadata tags
    version text not null,          -- e.g. repository release/version
    author text not null,           -- submission author (could be distinct from repository owner)
    user_id uuid references auth.users(id),
    readme text,                    -- OPTIONAL: store fetched README for caching/additional processing
    deployment_url text,            -- OPTIONAL: URL to the deployed MCP (if applicable)
    last_refreshed timestamptz,     -- Timestamp when the README was fetched
    owner_username text,            -- GitHub repository owner's username
    repository_name text,           -- GitHub repository name

    -- Data quality constraints
    constraint name_length check (char_length(name) >= 3),
    constraint version_format check (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$')
);

-- ===========================================
-- Enable Row Level Security on mcps Table
-- ===========================================
alter table public.mcps enable row level security;

-- ===========================================
-- RLS Policies for mcps Table
-- ===========================================
-- Allow everyone to view MCPs
create policy "Public MCPs are viewable by everyone"
    on public.mcps for select
    using (true);

-- Ensure that users can only insert MCPs for their own account
create policy "Users can insert their own MCPs"
    on public.mcps for insert
    with check (auth.uid() = user_id);

-- Only allow users to update their own MCPs
create policy "Users can update their own MCPs"
    on public.mcps for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Only allow users to delete their own MCPs
create policy "Users can delete their own MCPs"
    on public.mcps for delete
    using (auth.uid() = user_id);

-- ===========================================
-- Create Indexes for MCPs Table
-- ===========================================
create index mcps_user_id_idx on public.mcps(user_id);
create index mcps_name_idx on public.mcps(name);
create index mcps_tags_idx on public.mcps using gin(tags);
create index mcps_repository_url_idx on public.mcps(repository_url);

-- ===========================================
-- Create Error Logs Table for API and System Errors
-- ===========================================
create table if not exists public.error_logs (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now(),
    type text not null,
    message text not null,
    details text,
    stack text,
    resolved boolean default false
);

-- ===========================================
-- Create Admin Logs Table to Track Administrative Actions
-- ===========================================
create table if not exists public.admin_logs (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now(),
    action text not null,
    admin_id uuid references auth.users(id) not null,
    details jsonb
);

-- ===========================================
-- Create Profiles Table if It Does Not Exist
-- ===========================================
create table if not exists public.profiles (
    id uuid primary key references auth.users(id),
    username text not null,
    -- Add any additional profile-specific columns here
    is_admin boolean DEFAULT false
);

-- ===========================================
-- Ensure is_admin Column Exists in Profiles Table
-- (For cases where the profiles table exists but is missing the is_admin column)
-- ===========================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'profiles' 
              AND column_name = 'is_admin'
        ) THEN
            ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
        END IF;
    END IF;
END$$;

-- ===========================================
-- Create Indexes for Error Logs and Admin Logs Tables
-- ===========================================
create index if not exists error_logs_type_idx on public.error_logs(type);
create index if not exists error_logs_created_at_idx on public.error_logs(created_at);
create index if not exists admin_logs_admin_id_idx on public.admin_logs(admin_id);
create index if not exists admin_logs_action_idx on public.admin_logs(action);
create index if not exists admin_logs_created_at_idx on public.admin_logs(created_at);
