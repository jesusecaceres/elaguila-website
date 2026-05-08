-- Idempotent: ensure public.listing_analytics exists and matches app inserts
-- (clasificadosAnalytics.ts, listingAnalytics.ts) and dashboard reads.
-- Safe to re-run. Keeps public INSERT/SELECT RLS for tracking + owner dashboards.

-- 1) Base table (older migrations may have created a narrower version)
CREATE TABLE IF NOT EXISTS public.listing_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NULL,
  event_type text NOT NULL,
  user_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Columns added after the original 202503 migration
ALTER TABLE public.listing_analytics ADD COLUMN IF NOT EXISTS event_source text;
UPDATE public.listing_analytics SET event_source = 'unknown' WHERE event_source IS NULL;
ALTER TABLE public.listing_analytics ALTER COLUMN event_source SET DEFAULT 'unknown';

ALTER TABLE public.listing_analytics ADD COLUMN IF NOT EXISTS anonymous_session_id text;
ALTER TABLE public.listing_analytics ADD COLUMN IF NOT EXISTS category text;

ALTER TABLE public.listing_analytics ADD COLUMN IF NOT EXISTS metadata jsonb;
UPDATE public.listing_analytics SET metadata = '{}'::jsonb WHERE metadata IS NULL;
ALTER TABLE public.listing_analytics ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;
ALTER TABLE public.listing_analytics ALTER COLUMN metadata SET NOT NULL;

-- owner_user_id: app sends UUID strings; store as text. Migrate legacy uuid column if present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listing_analytics' AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE public.listing_analytics ADD COLUMN owner_user_id text NULL;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listing_analytics'
      AND column_name = 'owner_user_id' AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE public.listing_analytics
      ALTER COLUMN owner_user_id TYPE text USING (owner_user_id::text);
  END IF;
END $$;

-- profile_view / listing_open may omit listing_id
ALTER TABLE public.listing_analytics ALTER COLUMN listing_id DROP NOT NULL;

-- 3) CHECK: allow all events used by the app (+ legacy BR helpers from listingAnalytics.ts)
ALTER TABLE public.listing_analytics DROP CONSTRAINT IF EXISTS listing_analytics_event_type_check;
ALTER TABLE public.listing_analytics ADD CONSTRAINT listing_analytics_event_type_check CHECK (event_type IN (
  'listing_view',
  'listing_save',
  'listing_unsave',
  'listing_share',
  'message_sent',
  'profile_view',
  'listing_open',
  'listing_like',
  'listing_unlike',
  'cta_click',
  'phone_click',
  'whatsapp_click',
  'website_click',
  'directions_click',
  'lead_created',
  'apply_started',
  'apply_submitted',
  'contact_click',
  'outbound_click'
));

-- 4) Indexes (IF NOT EXISTS keeps older migration names where they overlap)
CREATE INDEX IF NOT EXISTS idx_listing_analytics_listing_id ON public.listing_analytics(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_event_type ON public.listing_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_created_at ON public.listing_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_user_id ON public.listing_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_owner_user_id ON public.listing_analytics(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_listing_event ON public.listing_analytics(listing_id, event_type);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_owner_created ON public.listing_analytics(owner_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_metadata ON public.listing_analytics USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_event_source ON public.listing_analytics(event_source);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_anonymous_session_id ON public.listing_analytics(anonymous_session_id);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_listing_event_user ON public.listing_analytics(listing_id, event_type, user_id);

-- 5) RLS — same compatibility pattern as 202503: open insert for tracking, open select for rollups
ALTER TABLE public.listing_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert listing_analytics" ON public.listing_analytics;
DROP POLICY IF EXISTS "Allow select listing_analytics" ON public.listing_analytics;

CREATE POLICY "Allow insert listing_analytics" ON public.listing_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select listing_analytics" ON public.listing_analytics
  FOR SELECT USING (true);
