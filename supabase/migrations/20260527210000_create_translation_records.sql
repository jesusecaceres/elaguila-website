-- SQL1: Durable server-side Translate Ad cache (service-role only; no public policies).
-- Stores already-masked translatable field values after /api/translate-ad validation — never raw contact data.

CREATE TABLE IF NOT EXISTS public.translation_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  listing_key text NOT NULL,
  field_key text NOT NULL,
  source_locale text NOT NULL
    CONSTRAINT translation_records_source_locale_chk CHECK (source_locale IN ('es', 'en', 'unknown')),
  target_locale text NOT NULL
    CONSTRAINT translation_records_target_locale_chk CHECK (target_locale IN ('es', 'en')),
  source_text_hash text NOT NULL
    CONSTRAINT translation_records_source_text_hash_chk CHECK (char_length(source_text_hash) > 0),
  source_text_version text NOT NULL DEFAULT 'v1',
  translated_text text NOT NULL
    CONSTRAINT translation_records_translated_text_chk CHECK (char_length(translated_text) > 0),
  provider text NOT NULL DEFAULT 'google-cloud-translation',
  provider_model text,
  quality_status text NOT NULL DEFAULT 'machine'
    CONSTRAINT translation_records_quality_status_chk CHECK (
      quality_status IN ('machine', 'reviewed', 'rejected', 'stale')
    ),
  reviewed_at timestamptz,
  reviewed_by uuid,
  stale_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT translation_records_cache_key_unique UNIQUE (
    category,
    listing_key,
    field_key,
    source_locale,
    target_locale,
    source_text_hash,
    source_text_version
  )
);

CREATE INDEX IF NOT EXISTS translation_records_category_listing_key_idx
  ON public.translation_records (category, listing_key);

CREATE INDEX IF NOT EXISTS translation_records_target_locale_idx
  ON public.translation_records (target_locale);

CREATE INDEX IF NOT EXISTS translation_records_stale_at_idx
  ON public.translation_records (stale_at)
  WHERE stale_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS translation_records_quality_status_idx
  ON public.translation_records (quality_status);

ALTER TABLE public.translation_records ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.translation_records IS
  'Server-side Translate Ad translation cache. Access via service role only (SUPABASE_SERVICE_ROLE_KEY). No anon/authenticated policies — public clients must use POST /api/translate-ad.';

COMMENT ON COLUMN public.translation_records.category IS
  'Listing/content category slug from translate-ad request (e.g. servicios, empleos).';

COMMENT ON COLUMN public.translation_records.listing_key IS
  'Stable listing identifier from translate-ad request (slug, ad id, etc.).';

COMMENT ON COLUMN public.translation_records.field_key IS
  'Translatable field name (title, description, body, …) after route allowlist validation.';

COMMENT ON COLUMN public.translation_records.source_text_hash IS
  'SHA-256 of masked source prose — cache invalidates when masked content changes.';

COMMENT ON COLUMN public.translation_records.source_text_version IS
  'Masking/payload version (default v1). Bump when masking rules change.';

COMMENT ON COLUMN public.translation_records.translated_text IS
  'Provider output for the masked field only — never store unmasked contact/business data.';

COMMENT ON COLUMN public.translation_records.stale_at IS
  'When set, server cache treats the row as a miss and may retranslate on next request.';

COMMENT ON COLUMN public.translation_records.quality_status IS
  'machine = default provider output; reviewed/rejected/stale for future human QA workflows.';
