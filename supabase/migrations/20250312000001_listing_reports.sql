-- User reports for listings (moderation)
CREATE TABLE IF NOT EXISTS listing_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id text NOT NULL,
  reporter_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_listing_reports_listing_id ON listing_reports(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_reports_status ON listing_reports(status);
CREATE INDEX IF NOT EXISTS idx_listing_reports_created_at ON listing_reports(created_at DESC);

ALTER TABLE listing_reports ENABLE ROW LEVEL SECURITY;

-- Allow inserts for reporting; admin uses service role (bypasses RLS) to read/update
CREATE POLICY "Anyone can insert report" ON listing_reports
  FOR INSERT WITH CHECK (true);
