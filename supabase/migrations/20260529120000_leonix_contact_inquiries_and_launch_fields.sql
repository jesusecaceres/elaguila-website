-- Leonix contact inquiries + launch signup field extensions.
-- Writes via Next.js service role only; no public Data API policies.

CREATE TABLE IF NOT EXISTS public.leonix_contact_inquiries (
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
  consent_timestamp timestamptz,
  status text NOT NULL DEFAULT 'new',
  email_notification_sent boolean NOT NULL DEFAULT false,
  email_notification_error text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leonix_contact_inquiries_lang_chk CHECK (lang IN ('es', 'en')),
  CONSTRAINT leonix_contact_inquiries_status_chk CHECK (status IN ('new', 'contacted', 'closed')),
  CONSTRAINT leonix_contact_inquiries_inquiry_type_chk CHECK (
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
  CONSTRAINT leonix_contact_inquiries_preferred_contact_chk CHECK (
    preferred_contact_method IN ('email', 'phone', 'either')
  ),
  CONSTRAINT leonix_contact_inquiries_email_len_chk CHECK (char_length(email) <= 320)
);

CREATE INDEX IF NOT EXISTS leonix_contact_inquiries_created_at_idx
  ON public.leonix_contact_inquiries (created_at DESC);

CREATE INDEX IF NOT EXISTS leonix_contact_inquiries_inquiry_type_idx
  ON public.leonix_contact_inquiries (inquiry_type);

CREATE INDEX IF NOT EXISTS leonix_contact_inquiries_status_idx
  ON public.leonix_contact_inquiries (status);

CREATE INDEX IF NOT EXISTS leonix_contact_inquiries_email_lower_idx
  ON public.leonix_contact_inquiries (lower(email));

ALTER TABLE public.leonix_contact_inquiries ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.leonix_contact_inquiries IS
  'Leonix general contact and business inquiries; writes via service role from POST /api/contact.';

-- Launch signup extensions on existing newsletter table
ALTER TABLE public.leonix_newsletter_subscribers
  ADD COLUMN IF NOT EXISTS business_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS audience_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS wants_launch_updates boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leonix_newsletter_subscribers_audience_type_chk'
  ) THEN
    ALTER TABLE public.leonix_newsletter_subscribers
      ADD CONSTRAINT leonix_newsletter_subscribers_audience_type_chk CHECK (
        audience_type IN ('', 'business', 'reader', 'partner', 'advertiser')
      );
  END IF;
END $$;
