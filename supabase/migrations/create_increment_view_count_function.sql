-- Create the increment_view_count function
CREATE OR REPLACE FUNCTION increment_view_count(row_id UUID)
RETURNS INTEGER
LANGUAGE SQL
AS $$
  UPDATE public.mcps
  SET view_count = view_count + 1
  WHERE id = row_id
  RETURNING view_count;
$$;