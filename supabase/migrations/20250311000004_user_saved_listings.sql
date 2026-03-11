-- User saved listings (sync with backend when logged in)
CREATE TABLE IF NOT EXISTS user_saved_listings (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_listings_user_id ON user_saved_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_listings_listing_id ON user_saved_listings(listing_id);

ALTER TABLE user_saved_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved listings" ON user_saved_listings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
