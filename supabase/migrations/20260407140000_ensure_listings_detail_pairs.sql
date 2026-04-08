-- Idempotent: safe if 20250316200000_listings_detail_pairs.sql was already applied.
-- Ensures production DBs that never ran the older migration get `detail_pairs` for Clasificados + admin.
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS detail_pairs jsonb NULL;

COMMENT ON COLUMN public.listings.detail_pairs IS 'Array of { label, value } for category-specific facts (e.g. BR: bedrooms, bathrooms, sqft)';
