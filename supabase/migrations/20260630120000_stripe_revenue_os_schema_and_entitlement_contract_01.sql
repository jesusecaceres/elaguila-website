-- Gate: STRIPE-REVENUE-OS-SCHEMA-AND-ENTITLEMENT-CONTRACT-01
-- Additive Revenue OS schema contract: payment records alignment, promo redemptions,
-- placement entitlements, package entitlement linkage. No destructive changes.

-- ---------------------------------------------------------------------------
-- A. leonix_payment_records — contract alignment (base table from 20260526120000)
-- ---------------------------------------------------------------------------

ALTER TABLE public.leonix_payment_records
  ADD COLUMN IF NOT EXISTS owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS leonix_ad_id text,
  ADD COLUMN IF NOT EXISTS package_key text,
  ADD COLUMN IF NOT EXISTS placement_tier text,
  ADD COLUMN IF NOT EXISTS billing_mode text NOT NULL DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS amount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contract_source text,
  ADD COLUMN IF NOT EXISTS promo_redemption_id uuid,
  ADD COLUMN IF NOT EXISTS placement_entitlement_id uuid;

COMMENT ON COLUMN public.leonix_payment_records.payment_status IS
  'Revenue OS financial status; maps to contract field `status` for checkout/webhook gates.';
COMMENT ON COLUMN public.leonix_payment_records.source IS
  'Revenue OS payment source; maps to contract field `payment_source` (stripe_checkout, admin_manual, etc.).';
COMMENT ON COLUMN public.leonix_payment_records.package_key IS
  'Category SKU key (e.g. autos_dealer_monthly); complements package_tier for Revenue OS checkout.';
COMMENT ON COLUMN public.leonix_payment_records.placement_entitlement_id IS
  'Optional FK to leonix_placement_entitlements once fulfillment creates placement.';

CREATE INDEX IF NOT EXISTS leonix_payment_records_owner_user_id_idx
  ON public.leonix_payment_records (owner_user_id);

CREATE INDEX IF NOT EXISTS leonix_payment_records_package_key_idx
  ON public.leonix_payment_records (package_key);

CREATE INDEX IF NOT EXISTS leonix_payment_records_leonix_ad_id_idx
  ON public.leonix_payment_records (leonix_ad_id);

CREATE INDEX IF NOT EXISTS leonix_payment_records_promo_redemption_id_idx
  ON public.leonix_payment_records (promo_redemption_id);

CREATE INDEX IF NOT EXISTS leonix_payment_records_placement_entitlement_id_idx
  ON public.leonix_payment_records (placement_entitlement_id);

-- ---------------------------------------------------------------------------
-- B. leonix_promo_codes — contract alignment (base table from 20260522120000)
-- ---------------------------------------------------------------------------

ALTER TABLE public.leonix_promo_codes
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS promo_type text,
  ADD COLUMN IF NOT EXISTS percent_off numeric,
  ADD COLUMN IF NOT EXISTS amount_off_cents integer,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS category_scope text[],
  ADD COLUMN IF NOT EXISTS package_scope text[],
  ADD COLUMN IF NOT EXISTS placement_scope text[],
  ADD COLUMN IF NOT EXISTS per_customer_limit integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

COMMENT ON COLUMN public.leonix_promo_codes.code_type IS
  'Legacy admin lifecycle type; Revenue OS contract also uses promo_type for checkout validation.';
COMMENT ON COLUMN public.leonix_promo_codes.promo_type IS
  'Revenue OS promo type: percent_off, amount_off, free_comp, print_client, staff_comp, newsletter, sales_rep, manual.';
COMMENT ON COLUMN public.leonix_promo_codes.category_scope IS
  'Allowed category slugs; null means unrestricted until checkout validation gate.';

CREATE INDEX IF NOT EXISTS leonix_promo_codes_promo_type_idx
  ON public.leonix_promo_codes (promo_type);

CREATE INDEX IF NOT EXISTS leonix_promo_codes_is_active_idx
  ON public.leonix_promo_codes (is_active);

-- ---------------------------------------------------------------------------
-- C. leonix_promo_code_redemptions — durable per-redemption audit trail
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.leonix_promo_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.leonix_promo_codes (id) ON DELETE RESTRICT,
  owner_user_id uuid,
  email text,
  listing_id text,
  leonix_ad_id text,
  category text,
  package_key text,
  placement_tier text,
  stripe_checkout_session_id text,
  payment_record_id uuid REFERENCES public.leonix_payment_records (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  discount_cents integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leonix_promo_code_redemptions_status_chk CHECK (
    status IN ('pending', 'validated', 'redeemed', 'failed', 'cancelled', 'expired')
  ),
  CONSTRAINT leonix_promo_code_redemptions_discount_chk CHECK (discount_cents >= 0)
);

CREATE INDEX IF NOT EXISTS leonix_promo_code_redemptions_promo_code_id_idx
  ON public.leonix_promo_code_redemptions (promo_code_id);

CREATE INDEX IF NOT EXISTS leonix_promo_code_redemptions_owner_user_id_idx
  ON public.leonix_promo_code_redemptions (owner_user_id);

CREATE INDEX IF NOT EXISTS leonix_promo_code_redemptions_listing_id_idx
  ON public.leonix_promo_code_redemptions (listing_id);

CREATE INDEX IF NOT EXISTS leonix_promo_code_redemptions_stripe_session_idx
  ON public.leonix_promo_code_redemptions (stripe_checkout_session_id);

CREATE INDEX IF NOT EXISTS leonix_promo_code_redemptions_payment_record_id_idx
  ON public.leonix_promo_code_redemptions (payment_record_id);

CREATE INDEX IF NOT EXISTS leonix_promo_code_redemptions_status_idx
  ON public.leonix_promo_code_redemptions (status);

CREATE UNIQUE INDEX IF NOT EXISTS leonix_promo_code_redemptions_session_promo_unique_idx
  ON public.leonix_promo_code_redemptions (promo_code_id, stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

ALTER TABLE public.leonix_promo_code_redemptions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.leonix_promo_code_redemptions IS
  'Per-redemption audit trail for promo codes; idempotency target for Stripe Checkout and webhook gates.';

-- Link payment records to redemptions after redemptions table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leonix_payment_records_promo_redemption_id_fkey'
  ) THEN
    ALTER TABLE public.leonix_payment_records
      ADD CONSTRAINT leonix_payment_records_promo_redemption_id_fkey
      FOREIGN KEY (promo_redemption_id)
      REFERENCES public.leonix_promo_code_redemptions (id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- D. leonix_placement_entitlements — placement source of truth
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.leonix_placement_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid,
  listing_id text,
  leonix_ad_id text,
  business_name text,
  category text NOT NULL,
  placement_tier text NOT NULL,
  placement_source text NOT NULL,
  surfaces text[] NOT NULL DEFAULT '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  manual_priority integer NOT NULL DEFAULT 100,
  rotation_weight integer NOT NULL DEFAULT 1,
  print_contract_id text,
  stripe_payment_record_id uuid REFERENCES public.leonix_payment_records (id) ON DELETE SET NULL,
  promo_code_id uuid REFERENCES public.leonix_promo_codes (id) ON DELETE SET NULL,
  included_with_print boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leonix_placement_entitlements_tier_chk CHECK (
    placement_tier IN (
      'partner_premium',
      'print_full_page',
      'print_half_page',
      'print_quarter_page',
      'website_business',
      'paid_private',
      'free',
      'affiliate'
    )
  ),
  CONSTRAINT leonix_placement_entitlements_source_chk CHECK (
    placement_source IN (
      'stripe_paid',
      'included_with_print',
      'promo_code',
      'admin_comp',
      'affiliate',
      'free',
      'manual_contract'
    )
  ),
  CONSTRAINT leonix_placement_entitlements_status_chk CHECK (
    status IN ('active', 'scheduled', 'expired', 'cancelled', 'comped')
  ),
  CONSTRAINT leonix_placement_entitlements_dates_chk CHECK (
    ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at
  ),
  CONSTRAINT leonix_placement_entitlements_manual_priority_chk CHECK (manual_priority >= 0),
  CONSTRAINT leonix_placement_entitlements_rotation_weight_chk CHECK (rotation_weight >= 0)
);

CREATE INDEX IF NOT EXISTS leonix_placement_entitlements_category_idx
  ON public.leonix_placement_entitlements (category);

CREATE INDEX IF NOT EXISTS leonix_placement_entitlements_placement_tier_idx
  ON public.leonix_placement_entitlements (placement_tier);

CREATE INDEX IF NOT EXISTS leonix_placement_entitlements_status_idx
  ON public.leonix_placement_entitlements (status);

CREATE INDEX IF NOT EXISTS leonix_placement_entitlements_owner_user_id_idx
  ON public.leonix_placement_entitlements (owner_user_id);

CREATE INDEX IF NOT EXISTS leonix_placement_entitlements_listing_id_idx
  ON public.leonix_placement_entitlements (listing_id);

CREATE INDEX IF NOT EXISTS leonix_placement_entitlements_starts_at_idx
  ON public.leonix_placement_entitlements (starts_at);

CREATE INDEX IF NOT EXISTS leonix_placement_entitlements_ends_at_idx
  ON public.leonix_placement_entitlements (ends_at);

CREATE INDEX IF NOT EXISTS leonix_placement_entitlements_stripe_payment_record_id_idx
  ON public.leonix_placement_entitlements (stripe_payment_record_id);

CREATE INDEX IF NOT EXISTS leonix_placement_entitlements_promo_code_id_idx
  ON public.leonix_placement_entitlements (promo_code_id);

CREATE INDEX IF NOT EXISTS leonix_placement_entitlements_active_lookup_idx
  ON public.leonix_placement_entitlements (category, status, placement_tier);

ALTER TABLE public.leonix_placement_entitlements ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.leonix_placement_entitlements IS
  'Revenue OS placement source of truth: tier, surfaces, dates, ranking inputs. Admin/service role only.';

-- Link payment records.placement_entitlement_id after placement table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leonix_payment_records_placement_entitlement_id_fkey'
  ) THEN
    ALTER TABLE public.leonix_payment_records
      ADD CONSTRAINT leonix_payment_records_placement_entitlement_id_fkey
      FOREIGN KEY (placement_entitlement_id)
      REFERENCES public.leonix_placement_entitlements (id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- E. listing_package_entitlements — Revenue OS linkage columns
-- ---------------------------------------------------------------------------

ALTER TABLE public.listing_package_entitlements
  ADD COLUMN IF NOT EXISTS placement_entitlement_id uuid,
  ADD COLUMN IF NOT EXISTS payment_record_id uuid,
  ADD COLUMN IF NOT EXISTS promo_code_id uuid,
  ADD COLUMN IF NOT EXISTS promo_redemption_id uuid,
  ADD COLUMN IF NOT EXISTS package_key text,
  ADD COLUMN IF NOT EXISTS billing_mode text;

COMMENT ON COLUMN public.listing_package_entitlements.package_tier IS
  'Print-to-digital tier; package_key holds Revenue OS SKU when distinct from tier.';
COMMENT ON COLUMN public.listing_package_entitlements.placement_entitlement_id IS
  'Optional link to leonix_placement_entitlements for surface/ranking truth.';

CREATE INDEX IF NOT EXISTS listing_package_entitlements_placement_entitlement_id_idx
  ON public.listing_package_entitlements (placement_entitlement_id);

CREATE INDEX IF NOT EXISTS listing_package_entitlements_payment_record_id_idx
  ON public.listing_package_entitlements (payment_record_id);

CREATE INDEX IF NOT EXISTS listing_package_entitlements_promo_code_id_idx
  ON public.listing_package_entitlements (promo_code_id);

CREATE INDEX IF NOT EXISTS listing_package_entitlements_promo_redemption_id_idx
  ON public.listing_package_entitlements (promo_redemption_id);

CREATE INDEX IF NOT EXISTS listing_package_entitlements_package_key_idx
  ON public.listing_package_entitlements (package_key);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listing_package_entitlements_placement_entitlement_id_fkey'
  ) THEN
    ALTER TABLE public.listing_package_entitlements
      ADD CONSTRAINT listing_package_entitlements_placement_entitlement_id_fkey
      FOREIGN KEY (placement_entitlement_id)
      REFERENCES public.leonix_placement_entitlements (id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listing_package_entitlements_payment_record_id_fkey'
  ) THEN
    ALTER TABLE public.listing_package_entitlements
      ADD CONSTRAINT listing_package_entitlements_payment_record_id_fkey
      FOREIGN KEY (payment_record_id)
      REFERENCES public.leonix_payment_records (id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listing_package_entitlements_promo_code_id_fkey'
  ) THEN
    ALTER TABLE public.listing_package_entitlements
      ADD CONSTRAINT listing_package_entitlements_promo_code_id_fkey
      FOREIGN KEY (promo_code_id)
      REFERENCES public.leonix_promo_codes (id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listing_package_entitlements_promo_redemption_id_fkey'
  ) THEN
    ALTER TABLE public.listing_package_entitlements
      ADD CONSTRAINT listing_package_entitlements_promo_redemption_id_fkey
      FOREIGN KEY (promo_redemption_id)
      REFERENCES public.leonix_promo_code_redemptions (id)
      ON DELETE SET NULL;
  END IF;
END $$;
