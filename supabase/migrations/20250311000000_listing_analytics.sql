-- Listing analytics: events for views, saves, shares, messages
CREATE TABLE IF NOT EXISTS listing_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('listing_view', 'listing_save', 'listing_share', 'message_sent')),
  user_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_analytics_listing_id ON listing_analytics(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_event_type ON listing_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_created_at ON listing_analytics(created_at);

-- Allow anyone to insert (for tracking)
ALTER TABLE listing_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert listing_analytics" ON listing_analytics
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read (for public view count on listing page)
CREATE POLICY "Allow select listing_analytics" ON listing_analytics
  FOR SELECT USING (true);
