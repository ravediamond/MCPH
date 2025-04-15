-- Add a view_count column to the MCPs table with a default value of 0
ALTER TABLE public.mcps
ADD COLUMN view_count INTEGER DEFAULT 0 NOT NULL;

-- Add an index to optimize filtering/sorting by view count
CREATE INDEX idx_mcps_view_count ON public.mcps(view_count);