-- Per-user liked listings (Clasificados engagement). Mirrors user_saved_listings pattern.
CREATE TABLE IF NOT EXISTS user_liked_listings (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_user_liked_listings_user_id ON user_liked_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_liked_listings_listing_id ON user_liked_listings(listing_id);

ALTER TABLE user_liked_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own liked listings" ON user_liked_listings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
