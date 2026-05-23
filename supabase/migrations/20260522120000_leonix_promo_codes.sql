-- Admin-managed Leonix promo code lifecycle (discount/attribution handles; not public Cupones CMS).
-- Access via service role from Next.js admin only; no public self-service policies.

CREATE TABLE IF NOT EXISTS public.leonix_promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  revoked_by uuid,
  revoked_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  code text NOT NULL,
  code_type text NOT NULL DEFAULT 'entitlement',
  non_stackable boolean NOT NULL DEFAULT true,
  one_time_use boolean NOT NULL DEFAULT false,
  max_redemptions integer,
  redemption_count integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  package_tier text,
  contract_term text,
  category text,
  listing_source text,
  listing_id text,
  package_entitlement_id uuid REFERENCES public.listing_package_entitlements (id) ON DELETE SET NULL,
  customer_email text,
  customer_phone text,
  customer_name text,
  business_name text,
  sales_rep_id text,
  sales_rep_name text,
  requires_owner_approval boolean NOT NULL DEFAULT false,
  approved_by uuid,
  approved_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT leonix_promo_codes_code_unique UNIQUE (code),
  CONSTRAINT leonix_promo_codes_status_chk CHECK (
    status IN ('draft', 'active', 'expired', 'revoked', 'redeemed')
  ),
  CONSTRAINT leonix_promo_codes_code_type_chk CHECK (
    code_type IN (
      'entitlement',
      'discount',
      'newsletter',
      'sms',
      'sales_rep',
      'contract',
      'founding_partner',
      'owner_override',
      'unknown'
    )
  ),
  CONSTRAINT leonix_promo_codes_redemption_count_chk CHECK (redemption_count >= 0),
  CONSTRAINT leonix_promo_codes_max_redemptions_chk CHECK (
    max_redemptions IS NULL OR max_redemptions >= 1
  ),
  CONSTRAINT leonix_promo_codes_dates_chk CHECK (
    ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at
  )
);

CREATE INDEX IF NOT EXISTS leonix_promo_codes_status_idx ON public.leonix_promo_codes (status);

CREATE INDEX IF NOT EXISTS leonix_promo_codes_code_type_idx ON public.leonix_promo_codes (code_type);

CREATE INDEX IF NOT EXISTS leonix_promo_codes_category_idx ON public.leonix_promo_codes (category);

CREATE INDEX IF NOT EXISTS leonix_promo_codes_package_tier_idx ON public.leonix_promo_codes (package_tier);

CREATE INDEX IF NOT EXISTS leonix_promo_codes_contract_term_idx ON public.leonix_promo_codes (contract_term);

CREATE INDEX IF NOT EXISTS leonix_promo_codes_sales_rep_id_idx ON public.leonix_promo_codes (sales_rep_id);

CREATE INDEX IF NOT EXISTS leonix_promo_codes_sales_rep_name_idx ON public.leonix_promo_codes (sales_rep_name);

CREATE INDEX IF NOT EXISTS leonix_promo_codes_customer_email_idx ON public.leonix_promo_codes (customer_email);

CREATE INDEX IF NOT EXISTS leonix_promo_codes_customer_phone_idx ON public.leonix_promo_codes (customer_phone);

CREATE INDEX IF NOT EXISTS leonix_promo_codes_business_name_idx ON public.leonix_promo_codes (business_name);

CREATE INDEX IF NOT EXISTS leonix_promo_codes_package_entitlement_id_idx
  ON public.leonix_promo_codes (package_entitlement_id);

CREATE INDEX IF NOT EXISTS leonix_promo_codes_starts_at_idx ON public.leonix_promo_codes (starts_at);

CREATE INDEX IF NOT EXISTS leonix_promo_codes_ends_at_idx ON public.leonix_promo_codes (ends_at);

ALTER TABLE public.leonix_promo_codes ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: access via service role only.

COMMENT ON TABLE public.leonix_promo_codes IS
  'Admin-managed promo code lifecycle (discount/attribution); distinct from package entitlements and public Cupones CMS.';

COMMENT ON COLUMN public.leonix_promo_codes.package_entitlement_id IS
  'Optional link to listing_package_entitlements when code grants or tracks package access.';

COMMENT ON COLUMN public.leonix_promo_codes.metadata IS
  'Source, promo_rule snapshot, notes; public redemption and Stripe refs are future gates.';
