-- Recently viewed listings per user (max 10 kept in app logic)
CREATE TABLE IF NOT EXISTS recently_viewed (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_created ON recently_viewed(user_id, created_at DESC);

ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recently viewed" ON recently_viewed
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
