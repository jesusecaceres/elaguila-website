-- Price drop fields for listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS original_price numeric NULL,
  ADD COLUMN IF NOT EXISTS current_price numeric NULL,
  ADD COLUMN IF NOT EXISTS price_last_updated timestamptz NULL;
