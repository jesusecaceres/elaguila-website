-- Admin-managed Print-to-Digital package entitlements (listing-level visibility contracts).
-- Access via service role from Next.js admin only; no public self-service policies.

CREATE TABLE IF NOT EXISTS public.listing_package_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  revoked_by uuid,
  revoked_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  category text NOT NULL,
  listing_source text NOT NULL,
  listing_id text NOT NULL,
  package_tier text NOT NULL,
  entitlement_code text UNIQUE,
  contract_code text,
  customer_name text,
  business_name text,
  notes text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  placement_scope text[] NOT NULL DEFAULT '{}',
  benefits jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT listing_package_entitlements_status_chk CHECK (
    status IN ('active', 'scheduled', 'expired', 'revoked')
  ),
  CONSTRAINT listing_package_entitlements_tier_chk CHECK (
    package_tier IN (
      'premium',
      'full_page',
      'half_page',
      'quarter_page',
      'classified_print',
      'digital_only'
    )
  ),
  CONSTRAINT listing_package_entitlements_dates_chk CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS listing_package_entitlements_category_idx
  ON public.listing_package_entitlements (category);

CREATE INDEX IF NOT EXISTS listing_package_entitlements_listing_idx
  ON public.listing_package_entitlements (listing_source, listing_id);

CREATE INDEX IF NOT EXISTS listing_package_entitlements_status_idx
  ON public.listing_package_entitlements (status);

CREATE INDEX IF NOT EXISTS listing_package_entitlements_starts_at_idx
  ON public.listing_package_entitlements (starts_at);

CREATE INDEX IF NOT EXISTS listing_package_entitlements_ends_at_idx
  ON public.listing_package_entitlements (ends_at);

CREATE INDEX IF NOT EXISTS listing_package_entitlements_entitlement_code_idx
  ON public.listing_package_entitlements (entitlement_code)
  WHERE entitlement_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS listing_package_entitlements_active_lookup_idx
  ON public.listing_package_entitlements (category, listing_source, listing_id, status);

ALTER TABLE public.listing_package_entitlements ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: access via service role only.

COMMENT ON TABLE public.listing_package_entitlements IS
  'Duration-based Print-to-Digital package entitlements for classified listings; admin-managed.';

COMMENT ON COLUMN public.listing_package_entitlements.entitlement_code IS
  'Internal handle for staff/ops; may link to a future promo code but is not public coupon CMS.';

COMMENT ON COLUMN public.listing_package_entitlements.benefits IS
  'Snapshot of packageEntitlements benefit flags at grant time.';

COMMENT ON COLUMN public.listing_package_entitlements.metadata IS
  'Future Stripe Checkout references (session, intent, customer, subscription, payment_status, source).';
