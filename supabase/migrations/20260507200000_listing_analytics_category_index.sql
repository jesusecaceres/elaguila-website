-- Optional index for owner/category rollups (idempotent)
CREATE INDEX IF NOT EXISTS idx_listing_analytics_category ON public.listing_analytics (category);
