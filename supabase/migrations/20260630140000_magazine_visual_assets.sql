-- Magazine visual asset registry: durable store/track/QA/approve path for translated magazine visuals.
-- Spanish source remains the official original. Provider output starts private/local.
-- Public serving requires qa_approved = true AND publicly_available = true.
-- This table is for magazine visual assets only — not classified/listing/ad text translation.

CREATE TABLE IF NOT EXISTS public.magazine_visual_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  issue_id text NOT NULL,
  year integer,
  month text,
  source_locale text NOT NULL DEFAULT 'es',
  target_locale text NOT NULL,
  asset_kind text NOT NULL,

  source_pdf_hash text NOT NULL,
  source_page_hash text,
  ad_asset_hash text,
  source_version text,

  provider text,
  provider_job_id text,
  provider_status text,

  storage_bucket text,
  storage_path text,
  public_url text,

  status text NOT NULL DEFAULT 'planned',
  qa_status text NOT NULL DEFAULT 'not_started',
  qa_approved boolean NOT NULL DEFAULT false,
  publicly_available boolean NOT NULL DEFAULT false,
  fallback_reason text,

  reviewed_by text,
  reviewed_at timestamptz,
  approval_notes text,

  file_size_bytes bigint,
  mime_type text,
  page_count integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT magazine_visual_assets_target_locale_nonempty_chk
    CHECK (target_locale <> ''),

  CONSTRAINT magazine_visual_assets_target_locale_active_chk
    CHECK (target_locale IN ('es', 'en', 'vi', 'pt', 'tl', 'km', 'zh', 'ja', 'ko', 'hi', 'hy', 'ru', 'pa')),

  CONSTRAINT magazine_visual_assets_asset_kind_nonempty_chk
    CHECK (asset_kind <> ''),

  CONSTRAINT magazine_visual_assets_asset_kind_chk
    CHECK (asset_kind IN (
      'source_pdf',
      'translated_pdf',
      'page_image',
      'cover_image',
      'ad_page_asset',
      'companion_html'
    )),

  CONSTRAINT magazine_visual_assets_status_chk
    CHECK (status IN (
      'planned',
      'provider_pending',
      'translated_local',
      'uploaded_private',
      'qa_pending',
      'approved',
      'rejected',
      'public',
      'archived'
    )),

  CONSTRAINT magazine_visual_assets_qa_status_chk
    CHECK (qa_status IN ('not_started', 'pending', 'approved', 'rejected', 'needs_fix')),

  CONSTRAINT magazine_visual_assets_qa_approved_consistency_chk
    CHECK (qa_approved = false OR qa_status = 'approved'),

  CONSTRAINT magazine_visual_assets_public_consistency_chk
    CHECK (publicly_available = false OR qa_approved = true),

  CONSTRAINT magazine_visual_assets_storage_public_consistency_chk
    CHECK (storage_path IS NOT NULL OR publicly_available = false)
);

CREATE UNIQUE INDEX IF NOT EXISTS magazine_visual_assets_identity_unique_idx
  ON public.magazine_visual_assets (
    issue_id,
    target_locale,
    asset_kind,
    source_pdf_hash,
    coalesce(source_page_hash, ''),
    coalesce(ad_asset_hash, ''),
    coalesce(source_version, '')
  );

CREATE INDEX IF NOT EXISTS magazine_visual_assets_issue_locale_idx
  ON public.magazine_visual_assets (issue_id, target_locale);

CREATE INDEX IF NOT EXISTS magazine_visual_assets_issue_locale_public_idx
  ON public.magazine_visual_assets (issue_id, target_locale, publicly_available);

CREATE INDEX IF NOT EXISTS magazine_visual_assets_qa_status_idx
  ON public.magazine_visual_assets (qa_status);

CREATE INDEX IF NOT EXISTS magazine_visual_assets_status_idx
  ON public.magazine_visual_assets (status);

CREATE INDEX IF NOT EXISTS magazine_visual_assets_source_pdf_hash_idx
  ON public.magazine_visual_assets (source_pdf_hash);

CREATE OR REPLACE FUNCTION public.magazine_visual_assets_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS magazine_visual_assets_updated_at ON public.magazine_visual_assets;

CREATE TRIGGER magazine_visual_assets_updated_at
  BEFORE UPDATE ON public.magazine_visual_assets
  FOR EACH ROW
  EXECUTE PROCEDURE public.magazine_visual_assets_set_updated_at();

COMMENT ON TABLE public.magazine_visual_assets IS
  'Leonix magazine visual asset registry. Spanish source remains the official original. Provider output starts private/local. Public serving requires qa_approved = true and publicly_available = true. Not for classified/listing/ad text translation.';

COMMENT ON COLUMN public.magazine_visual_assets.source_locale IS
  'Canonical source locale for the visual asset (default es — Spanish original).';

COMMENT ON COLUMN public.magazine_visual_assets.qa_approved IS
  'Must be true before any row may be publicly served. Enforced with qa_status = approved.';

COMMENT ON COLUMN public.magazine_visual_assets.publicly_available IS
  'Public serving flag. Must remain false until QA approval and explicit publish step.';

COMMENT ON COLUMN public.magazine_visual_assets.storage_path IS
  'Private storage object path. Required when publicly_available = true.';

ALTER TABLE public.magazine_visual_assets ENABLE ROW LEVEL SECURITY;

-- Anon/authenticated may read only QA-approved, publicly available rows with a resolvable URL/path.
CREATE POLICY magazine_visual_assets_public_select
  ON public.magazine_visual_assets
  FOR SELECT
  TO anon, authenticated
  USING (
    publicly_available = true
    AND qa_approved = true
    AND qa_status = 'approved'
    AND (storage_path IS NOT NULL OR public_url IS NOT NULL)
  );

-- No public insert/update/delete policies. Service role bypasses RLS for admin/registry writes.
