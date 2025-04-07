-- Create MCPs table
create table public.mcps (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now(),
    name text not null,
    description text,
    deployment_url text,
    documentation_url text,
    author text not null,
    tags text[] default '{}',
    version text not null,
    user_id uuid references auth.users(id),
    
    -- Add constraints
    constraint name_length check (char_length(name) >= 3),
    constraint version_format check (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$')
);

-- Enable RLS (Row Level Security)
alter table public.mcps enable row level security;

-- Create policies
create policy "Public MCPs are viewable by everyone"
    on public.mcps for select
    using (true);

create policy "Users can insert their own MCPs"
    on public.mcps for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own MCPs"
    on public.mcps for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own MCPs"
    on public.mcps for delete
    using (auth.uid() = user_id);

-- Create indexes
create index mcps_user_id_idx on public.mcps(user_id);
create index mcps_name_idx on public.mcps(name);
create index mcps_tags_idx on public.mcps using gin(tags);
