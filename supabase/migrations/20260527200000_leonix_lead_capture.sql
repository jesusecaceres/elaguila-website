-- Leonix marketing lead capture (newsletter + media kit).
-- Inserts via Next.js service role only; no public Data API policies.

CREATE TABLE IF NOT EXISTS public.leonix_newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  zip_code text NOT NULL DEFAULT '',
  preferred_language text NOT NULL DEFAULT 'es',
  interests text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'newsletter_page',
  lang text NOT NULL DEFAULT 'es',
  status text NOT NULL DEFAULT 'subscribed',
  consent_timestamp timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leonix_newsletter_subscribers_lang_chk CHECK (lang IN ('es', 'en')),
  CONSTRAINT leonix_newsletter_subscribers_status_chk CHECK (status IN ('subscribed', 'unsubscribed')),
  CONSTRAINT leonix_newsletter_subscribers_pref_lang_chk CHECK (preferred_language IN ('es', 'en', 'both')),
  CONSTRAINT leonix_newsletter_subscribers_email_len_chk CHECK (char_length(email) <= 320)
);

CREATE UNIQUE INDEX IF NOT EXISTS leonix_newsletter_subscribers_email_unique_idx
  ON public.leonix_newsletter_subscribers (email);

CREATE INDEX IF NOT EXISTS leonix_newsletter_subscribers_created_at_idx
  ON public.leonix_newsletter_subscribers (created_at DESC);

CREATE INDEX IF NOT EXISTS leonix_newsletter_subscribers_status_idx
  ON public.leonix_newsletter_subscribers (status);

CREATE TABLE IF NOT EXISTS public.leonix_media_kit_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  business text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  lang text NOT NULL DEFAULT 'es',
  source text NOT NULL DEFAULT 'media_kit_page',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leonix_media_kit_leads_lang_chk CHECK (lang IN ('es', 'en')),
  CONSTRAINT leonix_media_kit_leads_status_chk CHECK (status IN ('new', 'contacted', 'closed')),
  CONSTRAINT leonix_media_kit_leads_email_len_chk CHECK (char_length(email) <= 320)
);

CREATE INDEX IF NOT EXISTS leonix_media_kit_leads_created_at_idx
  ON public.leonix_media_kit_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS leonix_media_kit_leads_email_lower_idx
  ON public.leonix_media_kit_leads (lower(email));

CREATE INDEX IF NOT EXISTS leonix_media_kit_leads_status_idx
  ON public.leonix_media_kit_leads (status);

ALTER TABLE public.leonix_newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leonix_media_kit_leads ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.leonix_newsletter_subscribers IS
  'Leonix launch newsletter interest list; writes via service role from /api/newsletter/subscribe.';
COMMENT ON TABLE public.leonix_media_kit_leads IS
  'Leonix media kit requests; writes via service role from /api/media-kit/request.';
