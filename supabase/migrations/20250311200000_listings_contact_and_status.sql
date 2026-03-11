-- Contact fields and status for listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_method text;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Allow values: active, pending, removed, flagged
COMMENT ON COLUMN listings.status IS 'active | pending | removed | flagged';
