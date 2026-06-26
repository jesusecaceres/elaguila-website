-- Leonix Safety & Trust policy fields (ADMIN-AI-MODERATION-POLICY-02).
-- Idempotent column adds only; existing v1 rows remain valid.

ALTER TABLE public.listing_moderation_reviews
  ADD COLUMN IF NOT EXISTS risk_level text NULL,
  ADD COLUMN IF NOT EXISTS recommended_action text NULL,
  ADD COLUMN IF NOT EXISTS policy_flags jsonb NULL,
  ADD COLUMN IF NOT EXISTS keyword_flags jsonb NULL,
  ADD COLUMN IF NOT EXISTS category_rules jsonb NULL,
  ADD COLUMN IF NOT EXISTS scanner_result jsonb NULL,
  ADD COLUMN IF NOT EXISTS prompt_version text NULL,
  ADD COLUMN IF NOT EXISTS policy_version text NULL;

CREATE INDEX IF NOT EXISTS idx_listing_moderation_reviews_risk_level
  ON public.listing_moderation_reviews (risk_level)
  WHERE risk_level IS NOT NULL;

COMMENT ON COLUMN public.listing_moderation_reviews.risk_level IS
  'Policy scanner + AI risk: low | medium | high | critical';

COMMENT ON COLUMN public.listing_moderation_reviews.recommended_action IS
  'Advisory admin action only — never executed automatically';
