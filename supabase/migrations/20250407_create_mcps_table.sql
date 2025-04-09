-- Create MCPs table with repository integration
create table public.mcps (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now(),
    name text not null,
    description text,
    repository_url text not null,  -- REQUIRED repository link for the MCP (e.g., GitHub, GitLab)
    tags text[] default '{}',        -- metadata tags
    version text not null,           -- e.g. repository release/version
    author text not null,            -- submission author (could be distinct from repository owner)
    user_id uuid references auth.users(id),
    readme text,                     -- OPTIONAL: store fetched README (e.g., for caching or additional processing)
    
    -- Constraints to help enforce data quality
    constraint name_length check (char_length(name) >= 3),
    constraint version_format check (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$')
);

-- Enable Row Level Security (RLS) on the table
alter table public.mcps enable row level security;

-- RLS Policies

-- Public: Allow everyone to view MCPs
create policy "Public MCPs are viewable by everyone"
    on public.mcps for select
    using (true);

-- Insertion policy: Ensure a user can only insert an MCP for their own account
create policy "Users can insert their own MCPs"
    on public.mcps for insert
    with check (auth.uid() = user_id);

-- Update policy: Only allow users to update their own MCPs
create policy "Users can update their own MCPs"
    on public.mcps for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Delete policy: Only allow users to delete their own MCPs
create policy "Users can delete their own MCPs"
    on public.mcps for delete
    using (auth.uid() = user_id);

-- Indexes to boost query performance
create index mcps_user_id_idx on public.mcps(user_id);
create index mcps_name_idx on public.mcps(name);
create index mcps_tags_idx on public.mcps using gin(tags);
create index mcps_repository_url_idx on public.mcps(repository_url);
