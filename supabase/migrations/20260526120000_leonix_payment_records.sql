-- Global Stripe payment tracker (foundation — no payment collection in this gate).
-- Admin/service role only; no public policies.

CREATE TABLE IF NOT EXISTS public.leonix_payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,

  -- Core linkage
  category text,
  listing_source text,
  listing_id text,
  package_tier text,
  contract_term text,
  package_entitlement_id uuid REFERENCES public.listing_package_entitlements (id) ON DELETE SET NULL,
  promo_code_id uuid REFERENCES public.leonix_promo_codes (id) ON DELETE SET NULL,
  promo_code text,
  sales_rep_id text,
  sales_rep_name text,

  -- Customer / business
  customer_name text,
  customer_email text,
  customer_phone text,
  business_name text,

  -- Stripe future fields
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_invoice_id text,
  stripe_price_id text,
  stripe_product_id text,

  -- Payment fields
  source text NOT NULL DEFAULT 'admin_manual'
    CONSTRAINT leonix_payment_records_source_chk CHECK (
      source IN ('admin_manual', 'stripe_checkout', 'stripe_webhook', 'owner_override', 'unknown')
    ),
  payment_status text NOT NULL DEFAULT 'pending'
    CONSTRAINT leonix_payment_records_payment_status_chk CHECK (
      payment_status IN (
        'pending', 'unpaid', 'paid', 'succeeded', 'failed',
        'canceled', 'refunded', 'disputed', 'requires_action', 'unknown'
      )
    ),
  currency text NOT NULL DEFAULT 'usd',
  amount_subtotal_cents integer,
  amount_discount_cents integer,
  amount_total_cents integer,
  amount_paid_cents integer,
  discount_percent numeric,
  paid_at timestamptz,
  refunded_at timestamptz,
  canceled_at timestamptz,

  -- Commission preview
  commission_eligible boolean NOT NULL DEFAULT false,
  commission_status text NOT NULL DEFAULT 'not_eligible'
    CONSTRAINT leonix_payment_records_commission_status_chk CHECK (
      commission_status IN ('not_eligible', 'pending_payment', 'eligible', 'blocked', 'paid', 'unknown')
    ),
  estimated_commission_cents integer,

  -- Metadata
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Amount constraints
  CONSTRAINT leonix_payment_records_subtotal_chk CHECK (amount_subtotal_cents IS NULL OR amount_subtotal_cents >= 0),
  CONSTRAINT leonix_payment_records_discount_chk CHECK (amount_discount_cents IS NULL OR amount_discount_cents >= 0),
  CONSTRAINT leonix_payment_records_total_chk CHECK (amount_total_cents IS NULL OR amount_total_cents >= 0),
  CONSTRAINT leonix_payment_records_paid_chk CHECK (amount_paid_cents IS NULL OR amount_paid_cents >= 0),
  CONSTRAINT leonix_payment_records_commission_chk CHECK (estimated_commission_cents IS NULL OR estimated_commission_cents >= 0),
  CONSTRAINT leonix_payment_records_discount_pct_chk CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100))
);

-- Indexes
CREATE INDEX IF NOT EXISTS leonix_payment_records_package_entitlement_id_idx
  ON public.leonix_payment_records (package_entitlement_id);

CREATE INDEX IF NOT EXISTS leonix_payment_records_promo_code_id_idx
  ON public.leonix_payment_records (promo_code_id);

CREATE INDEX IF NOT EXISTS leonix_payment_records_promo_code_idx
  ON public.leonix_payment_records (promo_code);

CREATE INDEX IF NOT EXISTS leonix_payment_records_sales_rep_id_idx
  ON public.leonix_payment_records (sales_rep_id);

CREATE INDEX IF NOT EXISTS leonix_payment_records_category_idx
  ON public.leonix_payment_records (category);

CREATE INDEX IF NOT EXISTS leonix_payment_records_listing_source_idx
  ON public.leonix_payment_records (listing_source);

CREATE INDEX IF NOT EXISTS leonix_payment_records_listing_id_idx
  ON public.leonix_payment_records (listing_id);

CREATE INDEX IF NOT EXISTS leonix_payment_records_payment_status_idx
  ON public.leonix_payment_records (payment_status);

CREATE INDEX IF NOT EXISTS leonix_payment_records_commission_status_idx
  ON public.leonix_payment_records (commission_status);

CREATE INDEX IF NOT EXISTS leonix_payment_records_stripe_payment_intent_idx
  ON public.leonix_payment_records (stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS leonix_payment_records_customer_email_idx
  ON public.leonix_payment_records (customer_email);

CREATE INDEX IF NOT EXISTS leonix_payment_records_business_name_idx
  ON public.leonix_payment_records (business_name);

CREATE INDEX IF NOT EXISTS leonix_payment_records_created_at_idx
  ON public.leonix_payment_records (created_at);

CREATE INDEX IF NOT EXISTS leonix_payment_records_paid_at_idx
  ON public.leonix_payment_records (paid_at);

ALTER TABLE public.leonix_payment_records ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.leonix_payment_records IS
  'Global payment tracker for Stripe Checkout, package entitlements, promo codes, and sales attribution. Admin/service role only.';

COMMENT ON COLUMN public.leonix_payment_records.stripe_checkout_session_id IS
  'Stripe Checkout session ID (unique). Populated by webhook or checkout flow in later gate.';

COMMENT ON COLUMN public.leonix_payment_records.commission_eligible IS
  'True only after payment clears (paid/succeeded) and sales_rep_id exists. No payout in this gate.';

COMMENT ON COLUMN public.leonix_payment_records.metadata IS
  'Checkout metadata, webhook payload snapshot, and future payment-related fields.';
