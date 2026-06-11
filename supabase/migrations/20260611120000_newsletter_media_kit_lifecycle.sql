-- Newsletter + media kit admin lifecycle (LEADS-CRM-03): soft archive/delete for Launch Leads ops.

ALTER TABLE public.leonix_newsletter_subscribers
  ADD COLUMN IF NOT EXISTS internal_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by text;

ALTER TABLE public.leonix_media_kit_leads
  ADD COLUMN IF NOT EXISTS internal_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by text;

CREATE INDEX IF NOT EXISTS leonix_newsletter_subscribers_archived_at_idx
  ON public.leonix_newsletter_subscribers (archived_at)
  WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS leonix_newsletter_subscribers_deleted_at_idx
  ON public.leonix_newsletter_subscribers (deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS leonix_media_kit_leads_archived_at_idx
  ON public.leonix_media_kit_leads (archived_at)
  WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS leonix_media_kit_leads_deleted_at_idx
  ON public.leonix_media_kit_leads (deleted_at)
  WHERE deleted_at IS NOT NULL;
