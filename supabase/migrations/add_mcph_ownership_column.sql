-- Add is_mcph_owned column to mcps table
ALTER TABLE public.mcps ADD COLUMN IF NOT EXISTS is_mcph_owned BOOLEAN DEFAULT false;

-- Create index for faster queries on the is_mcph_owned column
CREATE INDEX IF NOT EXISTS idx_mcps_is_mcph_owned ON public.mcps(is_mcph_owned);

-- Add comment
COMMENT ON COLUMN public.mcps.is_mcph_owned IS 'Indicates that this MCP is owned by MCPH organization rather than an individual user';