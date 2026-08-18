-- Package C Build 1 (C3) — M2: durable subscription lifecycle records.
-- C1 proved no subscription table/columns exist anywhere (only a bare stripe_subscription_id
-- text column on leonix_payment_records). This is the canonical Leonix commercial subscription
-- state — Stripe's raw status is mirrored but never authoritative. Additive only.

CREATE TABLE IF NOT EXISTS public.leonix_subscription_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Stripe identity
  stripe_subscription_id text NOT NULL,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  stripe_price_id text,
  stripe_product_id text,
  latest_invoice_id text,
  last_paid_invoice_id text,
  last_failed_invoice_id text,

  -- Leonix identity
  payment_record_id uuid REFERENCES public.leonix_payment_records(id) ON DELETE SET NULL,
  package_entitlement_id uuid REFERENCES public.listing_package_entitlements(id) ON DELETE SET NULL,
  consent_record_id uuid,
  owner_user_id uuid,
  category text,
  listing_source text,
  listing_id text,
  package_key text,
  amount_cents integer,
  currency text NOT NULL DEFAULT 'usd',

  -- Canonical Leonix lifecycle. Deliberately minimal:
  --   cancel_at_period_end is a flag on an active sub, not a state (Stripe models it this way);
  --   past_due folds into grace (the locked 7-day clock starts at first unresolved failure);
  --   dispute = suspended + suspension_reason 'chargeback'; expired is derivable from dates.
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','grace','suspended','canceled')),
  stripe_status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  cancel_at timestamptz,
  canceled_at timestamptz,
  ended_reason text,

  -- Locked 7-calendar-day failed-payment grace (Advertising Agreement + Bible).
  grace_started_at timestamptz,
  grace_ends_at timestamptz,
  suspended_at timestamptz,
  recovered_at timestamptz,
  suspension_reason text CHECK (suspension_reason IS NULL OR suspension_reason IN ('payment_failure','chargeback','admin')),

  -- Suspension precedence memory: what the payment engine saw and what it wrote, so restore is
  -- a compare-and-swap that can never override moderation/owner/admin listing states.
  listing_prior_status text,
  listing_suspended_status text,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS leonix_subscription_records_stripe_sub_key
  ON public.leonix_subscription_records (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS leonix_subscription_records_listing_idx
  ON public.leonix_subscription_records (listing_source, listing_id);
CREATE INDEX IF NOT EXISTS leonix_subscription_records_owner_idx
  ON public.leonix_subscription_records (owner_user_id);
CREATE INDEX IF NOT EXISTS leonix_subscription_records_status_idx
  ON public.leonix_subscription_records (status);
-- Powers the grace sweep: rows whose grace window has lapsed.
CREATE INDEX IF NOT EXISTS leonix_subscription_records_grace_sweep_idx
  ON public.leonix_subscription_records (grace_ends_at)
  WHERE status = 'grace';

ALTER TABLE public.leonix_subscription_records ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: access via service role only.

-- Reverse pointer for entitlement-side joins (dashboards, lifecycle readers).
ALTER TABLE public.listing_package_entitlements
  ADD COLUMN IF NOT EXISTS subscription_record_id uuid REFERENCES public.leonix_subscription_records(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS listing_package_entitlements_subscription_record_idx
  ON public.listing_package_entitlements (subscription_record_id);

COMMENT ON TABLE public.leonix_subscription_records IS
  'Canonical Leonix subscription lifecycle (Package C Build 1). One row per Stripe subscription. Billing truth lives here; the linked listing_package_entitlements row is the durable capability being kept alive; lane listing status columns are only the public-visibility projection.';
