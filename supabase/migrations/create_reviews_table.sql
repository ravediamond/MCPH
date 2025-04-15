-- ===========================================
-- Create Reviews Table for MCPs
-- ===========================================
-- This migration adds a table to store user reviews and ratings for MCPs
-- ===========================================

-- Create Reviews Table
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

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS reviews_mcp_id_idx ON public.reviews(mcp_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON public.reviews(created_at);

-- Enable RLS on the reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews table
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

-- Add function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at column
CREATE TRIGGER update_reviews_updated_at_trigger
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_reviews_updated_at();

-- Add average rating column to MCPs table
ALTER TABLE public.mcps ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT NULL;
ALTER TABLE public.mcps ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Create index for the average rating column
CREATE INDEX IF NOT EXISTS mcps_avg_rating_idx ON public.mcps(avg_rating);
CREATE INDEX IF NOT EXISTS mcps_review_count_idx ON public.mcps(review_count);

-- Add comment explaining the purpose of the reviews table
COMMENT ON TABLE public.reviews IS 'Stores user reviews and ratings for MCPs';
COMMENT ON COLUMN public.mcps.avg_rating IS 'Average rating of the MCP (1-5)';
COMMENT ON COLUMN public.mcps.review_count IS 'Number of reviews for the MCP';

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