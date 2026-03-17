-- Structured detail pairs for listing (property type, bedrooms, bathrooms, etc.).
-- Used by open card and list view to show facts without parsing description.
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS detail_pairs jsonb NULL;

COMMENT ON COLUMN listings.detail_pairs IS 'Array of { label, value } for category-specific facts (e.g. BR: bedrooms, bathrooms, sqft)';
