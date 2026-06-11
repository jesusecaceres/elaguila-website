-- Leonix unified lead inbox (leonix_leads) + soft archive/delete lifecycle (LEADS-UI-02).
-- Writes via Next.js service role from POST /api/leads; admin reads/updates via service role.

CREATE TABLE IF NOT EXISTS public.leonix_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  business_name text NOT NULL DEFAULT '',
  inquiry_type text NOT NULL DEFAULT 'general',
  preferred_contact_method text NOT NULL DEFAULT 'email',
  city_area text NOT NULL DEFAULT '',
  website_or_social text NOT NULL DEFAULT '',
  business_category text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  source_page text NOT NULL DEFAULT '/contacto',
  source_cta text NOT NULL DEFAULT '',
  lang text NOT NULL DEFAULT 'es',
  wants_launch_updates boolean NOT NULL DEFAULT false,
  consent_to_contact boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'new',
  internal_notes text NOT NULL DEFAULT '',
  archived_at timestamptz,
  archived_by text,
  deleted_at timestamptz,
  deleted_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leonix_leads_lang_chk CHECK (lang IN ('es', 'en')),
  CONSTRAINT leonix_leads_status_chk CHECK (
    status IN ('new', 'contacted', 'qualified', 'closed', 'archived')
  ),
  CONSTRAINT leonix_leads_inquiry_type_chk CHECK (
    inquiry_type IN (
      'advertising',
      'launch',
      'mediaKit',
      'general',
      'promotionalProducts',
      'businessListing',
      'partnership'
    )
  ),
  CONSTRAINT leonix_leads_preferred_contact_chk CHECK (
    preferred_contact_method IN ('email', 'phone', 'either')
  ),
  CONSTRAINT leonix_leads_email_len_chk CHECK (char_length(email) <= 320)
);

ALTER TABLE public.leonix_leads
  ADD COLUMN IF NOT EXISTS internal_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by text;

CREATE INDEX IF NOT EXISTS leonix_leads_created_at_idx
  ON public.leonix_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS leonix_leads_status_idx
  ON public.leonix_leads (status);

CREATE INDEX IF NOT EXISTS leonix_leads_archived_at_idx
  ON public.leonix_leads (archived_at)
  WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS leonix_leads_deleted_at_idx
  ON public.leonix_leads (deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS leonix_leads_email_lower_idx
  ON public.leonix_leads (lower(email));

ALTER TABLE public.leonix_leads ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.leonix_leads IS
  'Leonix marketing/business leads inbox; writes via service role from POST /api/leads.';

COMMENT ON COLUMN public.leonix_leads.archived_at IS
  'Soft archive timestamp; archived leads hidden from active inbox.';

COMMENT ON COLUMN public.leonix_leads.deleted_at IS
  'Soft delete timestamp; deleted leads hidden from active and archived views.';
