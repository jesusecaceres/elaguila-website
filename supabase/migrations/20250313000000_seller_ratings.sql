-- Seller reputation: ratings from buyers after a sale
CREATE TABLE IF NOT EXISTS seller_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id text NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_ratings_seller_id ON seller_ratings(seller_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_seller_ratings_buyer_listing ON seller_ratings(buyer_id, listing_id);

ALTER TABLE seller_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own rating" ON seller_ratings
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Anyone can read ratings" ON seller_ratings
  FOR SELECT USING (true);
