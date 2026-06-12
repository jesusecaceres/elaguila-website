-- Gate G2A — Global analytics identity columns + expanded event types (additive only).
-- Does not tighten RLS, drop constraints, or remove legacy tables.

-- ---------------------------------------------------------------------------
-- 1) listing_analytics — identity columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.listing_analytics
  ADD COLUMN IF NOT EXISTS source_table text,
  ADD COLUMN IF NOT EXISTS source_id text,
  ADD COLUMN IF NOT EXISTS canonical_ad_id text;

UPDATE public.listing_analytics
SET canonical_ad_id = listing_id
WHERE canonical_ad_id IS NULL
  AND listing_id IS NOT NULL
  AND btrim(listing_id) <> '';

CREATE INDEX IF NOT EXISTS idx_listing_analytics_owner_category_created
  ON public.listing_analytics (owner_user_id, category, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_analytics_source_table_id_event
  ON public.listing_analytics (source_table, source_id, event_type);

CREATE INDEX IF NOT EXISTS idx_listing_analytics_canonical_event_created
  ON public.listing_analytics (canonical_ad_id, event_type, created_at DESC);

-- ---------------------------------------------------------------------------
-- 2) saved_listings — identity columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.saved_listings
  ADD COLUMN IF NOT EXISTS source_table text,
  ADD COLUMN IF NOT EXISTS source_id text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS canonical_ad_id text;

UPDATE public.saved_listings
SET canonical_ad_id = listing_id::text
WHERE canonical_ad_id IS NULL
  AND listing_id IS NOT NULL
  AND btrim(listing_id::text) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_listings_user_source_unique
  ON public.saved_listings (user_id, source_table, source_id)
  WHERE source_table IS NOT NULL
    AND source_id IS NOT NULL
    AND btrim(source_table) <> ''
    AND btrim(source_id) <> '';

-- ---------------------------------------------------------------------------
-- 3) user_liked_listings — identity columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_liked_listings
  ADD COLUMN IF NOT EXISTS source_table text,
  ADD COLUMN IF NOT EXISTS source_id text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS canonical_ad_id text;

UPDATE public.user_liked_listings
SET canonical_ad_id = listing_id::text
WHERE canonical_ad_id IS NULL
  AND listing_id IS NOT NULL
  AND btrim(listing_id::text) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_liked_listings_user_source_unique
  ON public.user_liked_listings (user_id, source_table, source_id)
  WHERE source_table IS NOT NULL
    AND source_id IS NOT NULL
    AND btrim(source_table) <> ''
    AND btrim(source_id) <> '';

-- ---------------------------------------------------------------------------
-- 4) listing_analytics event_type CHECK — preserve all existing + four new types
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  conname text;
BEGIN
  FOR conname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'listing_analytics'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%event_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.listing_analytics DROP CONSTRAINT IF EXISTS %I', conname);
  END LOOP;
END $$;

ALTER TABLE public.listing_analytics DROP CONSTRAINT IF EXISTS listing_analytics_event_type_check;

ALTER TABLE public.listing_analytics
  ADD CONSTRAINT listing_analytics_event_type_check
  CHECK (event_type IN (
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
    'outbound_click',
    'listing_impression',
    'result_card_click',
    'email_click',
    'message_click'
  ));

COMMENT ON COLUMN public.listing_analytics.source_table IS
  'Published ad source table (e.g. listings, servicios_public_listings). Gate G2A identity.';
COMMENT ON COLUMN public.listing_analytics.source_id IS
  'Primary row id in source_table (UUID or slug). Gate G2A identity.';
COMMENT ON COLUMN public.listing_analytics.canonical_ad_id IS
  'Canonical analytics key; backfilled from listing_id for legacy rows.';
