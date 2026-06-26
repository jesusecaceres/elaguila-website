-- Leonix listing AI moderation reviews (ADMIN-AI-MODERATION-ENGINE-01).
-- Service-role writes only; admin UI reads via getAdminSupabase.

CREATE TABLE IF NOT EXISTS public.listing_moderation_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NOT NULL,
  leonix_ad_id text NULL,
  source_table text NULL DEFAULT 'public.listings',
  category_slug text NULL,
  listing_title text NULL,
  decision text NOT NULL DEFAULT 'needs_review'
    CHECK (decision IN ('approved', 'needs_review', 'rejected', 'unavailable')),
  source text NOT NULL DEFAULT 'ai',
  reason_category text NULL,
  reason_text text NULL,
  confidence text NULL,
  model text NULL,
  reviewed_by text NULL DEFAULT 'ai',
  reviewed_at timestamptz NULL DEFAULT now(),
  raw_input jsonb NULL,
  raw_result jsonb NULL,
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_moderation_reviews_listing_id
  ON public.listing_moderation_reviews (listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_moderation_reviews_leonix_ad_id
  ON public.listing_moderation_reviews (leonix_ad_id)
  WHERE leonix_ad_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listing_moderation_reviews_decision
  ON public.listing_moderation_reviews (decision);

CREATE INDEX IF NOT EXISTS idx_listing_moderation_reviews_reviewed_at
  ON public.listing_moderation_reviews (reviewed_at DESC NULLS LAST);

COMMENT ON TABLE public.listing_moderation_reviews IS
  'Append-style AI/human moderation review results for generic listings. Human admin remains final.';

ALTER TABLE public.listing_moderation_reviews ENABLE ROW LEVEL SECURITY;
