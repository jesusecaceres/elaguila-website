-- Engagement and boost columns for listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saves integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boosted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS boost_expires timestamptz NULL;

COMMENT ON COLUMN listings.boost_expires IS 'When boost ends; boosted is true while now() < boost_expires';
