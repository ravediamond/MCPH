-- ===========================================
-- Create Tags Categories Table
-- ===========================================
create table if not exists public.tag_categories (
    id serial primary key,
    name text not null unique,
    description text,
    created_at timestamptz default now()
);

-- Initial Tag Categories
insert into public.tag_categories (name, description) values
('domain', 'Domain/Functional Categories - Describe the main function or sector that an MCP targets'),
('deployment', 'Deployment Types - Indicate whether the solution is typically available as a hosted service or requires installation');

-- ===========================================
-- Create Tags Reference Table
-- ===========================================
create table if not exists public.tags (
    id serial primary key,
    category_id integer references public.tag_categories(id),
    name text not null,
    description text,
    icon text,
    created_at timestamptz default now(),
    unique (category_id, name)
);

-- ===========================================
-- Enable Row Level Security
-- ===========================================
alter table public.tag_categories enable row level security;
alter table public.tags enable row level security;

-- ===========================================
-- RLS Policies for Tag Tables
-- ===========================================

-- Everyone can view tags
create policy "Tags are viewable by everyone"
    on public.tags for select
    using (true);

create policy "Tag categories are viewable by everyone"
    on public.tag_categories for select
    using (true);

-- Only admins can insert/update/delete tags

-- Insert policy: using WITH CHECK for INSERT operations
create policy "Only admins can insert tags"
    on public.tags for insert
    with check ((select is_admin from public.profiles where id = auth.uid()));

create policy "Only admins can update tags"
    on public.tags for update
    using ((select is_admin from public.profiles where id = auth.uid()));

create policy "Only admins can delete tags"
    on public.tags for delete
    using ((select is_admin from public.profiles where id = auth.uid()));

-- Only admins can insert/update/delete tag categories

create policy "Only admins can insert tag categories"
    on public.tag_categories for insert
    with check ((select is_admin from public.profiles where id = auth.uid()));

create policy "Only admins can update tag categories"
    on public.tag_categories for update
    using ((select is_admin from public.profiles where id = auth.uid()));

create policy "Only admins can delete tag categories"
    on public.tag_categories for delete
    using ((select is_admin from public.profiles where id = auth.uid()));

-- ===========================================
-- Insert Domain/Functional Categories
-- ===========================================
insert into public.tags (category_id, name, description) values
((select id from public.tag_categories where name = 'domain'), 'Aggregators', 'Services that combine data from multiple sources'),
((select id from public.tag_categories where name = 'domain'), 'Art & Culture', 'Services related to art, media, and cultural content'),
((select id from public.tag_categories where name = 'domain'), 'Browser Automation', 'Tools for automating browser interactions'),
((select id from public.tag_categories where name = 'domain'), 'Cloud Platforms', 'Services operating on cloud infrastructure'),
((select id from public.tag_categories where name = 'domain'), 'Code Execution', 'Services that execute code remotely'),
((select id from public.tag_categories where name = 'domain'), 'Coding Agents', 'AI agents that assist with or generate code'),
((select id from public.tag_categories where name = 'domain'), 'Command Line', 'Tools operated via command line interfaces'),
((select id from public.tag_categories where name = 'domain'), 'Communication', 'Services for messaging, email, and other communications'),
((select id from public.tag_categories where name = 'domain'), 'Customer Data Platforms', 'Tools for managing customer data and interactions'),
((select id from public.tag_categories where name = 'domain'), 'Databases', 'Database services and storage solutions'),
((select id from public.tag_categories where name = 'domain'), 'Data Platforms', 'Platforms for data processing and analytics'),
((select id from public.tag_categories where name = 'domain'), 'Developer Tools', 'Tools specifically built for developers'),
((select id from public.tag_categories where name = 'domain'), 'Data Science Tools', 'Tools for data analysis and scientific computing'),
((select id from public.tag_categories where name = 'domain'), 'Embedded Systems', 'Services for edge devices and embedded computing'),
((select id from public.tag_categories where name = 'domain'), 'File Systems', 'Tools for file management and storage'),
((select id from public.tag_categories where name = 'domain'), 'Finance & Fintech', 'Financial services and technologies'),
((select id from public.tag_categories where name = 'domain'), 'Gaming', 'Game development and gaming-related services'),
((select id from public.tag_categories where name = 'domain'), 'Knowledge & Memory', 'Tools for knowledge management and retrieval'),
((select id from public.tag_categories where name = 'domain'), 'Location Services', 'Geographic and location-based services'),
((select id from public.tag_categories where name = 'domain'), 'Marketing', 'Marketing automation and analytics tools'),
((select id from public.tag_categories where name = 'domain'), 'Monitoring', 'System monitoring and observability tools'),
((select id from public.tag_categories where name = 'domain'), 'Search & Data Extraction', 'Tools for searching and extracting information'),
((select id from public.tag_categories where name = 'domain'), 'Security', 'Security-related services and tools'),
((select id from public.tag_categories where name = 'domain'), 'Sports', 'Sports-related services and applications'),
((select id from public.tag_categories where name = 'domain'), 'Support & Service Management', 'Customer support and service management tools'),
((select id from public.tag_categories where name = 'domain'), 'Translation Services', 'Language translation and localization tools'),
((select id from public.tag_categories where name = 'domain'), 'Travel & Transportation', 'Travel planning and transportation services'),
((select id from public.tag_categories where name = 'domain'), 'Version Control', 'Version control systems and related tools'),
((select id from public.tag_categories where name = 'domain'), 'Other Tools and Integrations', 'Miscellaneous tools and integrations'),
((select id from public.tag_categories where name = 'domain'), 'Frameworks', 'Software frameworks and platforms'),
((select id from public.tag_categories where name = 'domain'), 'Utilities', 'Utility tools and services');

-- ===========================================
-- Insert Deployment Types
-- ===========================================
insert into public.tags (category_id, name, description, icon) values
((select id from public.tag_categories where name = 'deployment'), 'Deployed', 'Solution is already available as a managed service', '☁️'),
((select id from public.tag_categories where name = 'deployment'), 'Self-Hosted', 'Solution is provided as code that you must install locally', '🏠');

-- ===========================================
-- Create Helper Functions
-- ===========================================
-- Function to get all tags of a specific category
create or replace function get_tags_by_category(category_name text)
returns setof public.tags as $$
begin
  return query
  select t.*
  from public.tags t
  join public.tag_categories tc on t.category_id = tc.id
  where tc.name = category_name
  order by t.name;
end;
$$ language plpgsql security definer;

-- Function to validate if a tag is in the correct category
create or replace function is_valid_tag(tag_name text, category_name text)
returns boolean as $$
begin
  return exists (
    select 1
    from public.tags t
    join public.tag_categories tc on t.category_id = tc.id
    where t.name = tag_name and tc.name = category_name
  );
end;
$$ language plpgsql security definer;

-- ===========================================
-- Create Indexes
-- ===========================================
create index tags_category_id_idx on public.tags(category_id);
create index tags_name_idx on public.tags(name);
