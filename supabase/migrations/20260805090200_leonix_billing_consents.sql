-- Package C Build 1 (C3) — M3: durable affirmative recurring-billing consent evidence.
-- Advertising Agreement v1.2 §17: no automatic renewal unless the advertiser separately gives
-- affirmative consent. Rows are append-only evidence; a plan change creates a new row and marks
-- the prior one superseded. The consent row is written BEFORE the Stripe session is created and
-- the checkout route hard-refuses subscription-mode sessions without one. Additive only.

CREATE TABLE IF NOT EXISTS public.leonix_billing_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  owner_user_id uuid NOT NULL,
  customer_email text,
  category text,
  listing_source text,
  listing_id text,
  package_key text NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  billing_interval text NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly')),

  -- Exact disclosure evidence: version id of the copy shown + hash of the rendered text.
  consent_text_version text NOT NULL,
  consent_text_sha256 text,
  agreement_version text NOT NULL DEFAULT 'v1.2',
  consented_at timestamptz NOT NULL DEFAULT now(),
  source_surface text NOT NULL
    CHECK (source_surface IN ('checkout_web','dashboard_upgrade','admin_assisted')),

  -- Stripe linkage: session id at creation; subscription/customer attached post-hoc by webhook.
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  stripe_customer_id text,
  payment_record_id uuid REFERENCES public.leonix_payment_records(id) ON DELETE SET NULL,

  status text NOT NULL DEFAULT 'granted' CHECK (status IN ('granted','revoked','superseded')),
  revoked_at timestamptz,
  revoked_by uuid,
  revoked_reason text,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS leonix_billing_consents_stripe_sub_key
  ON public.leonix_billing_consents (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS leonix_billing_consents_listing_idx
  ON public.leonix_billing_consents (listing_id, package_key);
CREATE INDEX IF NOT EXISTS leonix_billing_consents_owner_idx
  ON public.leonix_billing_consents (owner_user_id);

ALTER TABLE public.leonix_billing_consents ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: access via service role only.

COMMENT ON TABLE public.leonix_billing_consents IS
  'Affirmative recurring-billing consent evidence (Package C Build 1; Agreement v1.2 §17). Append-only; consent precedes Stripe session creation for every subscription-mode checkout.';
