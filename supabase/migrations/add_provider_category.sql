-- ===========================================
-- Add Provider Category
-- ===========================================

-- Insert the new provider category
INSERT INTO public.tag_categories (name, description)
VALUES ('provider', 'Provider Type - Indicates whether the MCP is officially supported by service providers or contributed by the community')
ON CONFLICT (name) DO NOTHING;

-- Insert the provider types
INSERT INTO public.tags (category_id, name, description, icon)
VALUES
  ((SELECT id FROM public.tag_categories WHERE name = 'provider'), 'Official', 'MCP created and maintained by official service providers', '✓'),
  ((SELECT id FROM public.tag_categories WHERE name = 'provider'), 'Community', 'MCP contributed by the community', '👥');

-- Create the partial index using dynamic SQL in a DO block
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
