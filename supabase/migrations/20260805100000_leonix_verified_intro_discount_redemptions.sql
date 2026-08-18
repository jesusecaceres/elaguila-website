-- Package C Build 2 (C4) — verified-intro-15% discount redemption/lifecycle ledger.
--
-- Distinct from leonix_promo_code_redemptions: this benefit has no typed code (promo_code_id
-- there is NOT NULL FK'd to leonix_promo_codes, and that schema has no code-type value for
-- "identity-verified, no code typed"), and needs identity-hash/business-identity/verification
-- columns that table lacks. Reusing it would either require a schema-breaking nullable FK or a
-- fabricated anchor row — both semantically conflate code-based and identity-based mechanisms.
--
-- Anti-repeat enforcement uses FOUR independent, simultaneously-checked boundaries, each backed
-- by a partial UNIQUE index covering BOTH 'reserved' and 'redeemed' (never 'redeemed'-only —
-- a redeemed-only index does not stop two concurrent checkouts from both creating unresolved
-- reservations for the same identity):
--   1. owner_user_id       — GLOBAL: one authenticated owner gets at most one redemption ever,
--                            across every business/listing they control. Never bypassed by
--                            business identity.
--   2. verified_email_identity_hash  — keyed HMAC of the confirmed auth email (never raw email).
--   3. verified_phone_identity_hash  — keyed HMAC of the Twilio-verified E.164 phone.
--   4. (business_identity_type, business_identity_key) — composite, ADDITIVE to owner_user_id:
--                            blocks a different staff user tied to the same dealer/commercial
--                            parent from claiming a second redemption for that business. The
--                            type discriminator makes cross-namespace key collisions structurally
--                            impossible to matter.
--
-- Raw normalized email/phone are never the anti-repeat index and are never stored on this table
-- — only the keyed hash (uniqueness) and a separately-computed masked value (admin/audit
-- display) are. See app/lib/security/verifiedIdentityHash.ts.
--
-- Status vocabulary is deliberately explicit (not a pending/done binary): reserved | redeemed |
-- released | expired | rejected | reversed. Reservation flow (atomic INSERT, not
-- SELECT-then-INSERT) lives in app/lib/listingPlans/verifiedIntroDiscountRedemptions.ts.
--
-- Additive only. RLS enabled, service-role only, no public policies.

CREATE TABLE IF NOT EXISTS public.leonix_verified_intro_discount_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  owner_user_id uuid NOT NULL,

  verified_email_identity_hash text,
  verified_email_masked text,
  verified_phone_identity_hash text,
  verified_phone_masked text,

  business_identity_type text NOT NULL
    CONSTRAINT leonix_verified_intro_discount_redemptions_biz_type_chk CHECK (
      business_identity_type IN ('dealer_inventory_group', 'commercial_parent_listing', 'owner_user_id_fallback')
    ),
  business_identity_key text NOT NULL,
  business_identity_fallback_reason text,

  category text NOT NULL,
  package_key text NOT NULL,
  listing_id text,
  leonix_ad_id text,

  checkout_attempt_key text NOT NULL,

  verification_method text NOT NULL
    CONSTRAINT leonix_verified_intro_discount_redemptions_method_chk CHECK (
      verification_method IN ('email', 'sms')
    ),
  phone_identity_id uuid,

  payment_record_id uuid REFERENCES public.leonix_payment_records (id) ON DELETE SET NULL,
  stripe_checkout_session_id text,
  stripe_coupon_id text,

  status text NOT NULL DEFAULT 'reserved'
    CONSTRAINT leonix_verified_intro_discount_redemptions_status_chk CHECK (
      status IN ('reserved', 'redeemed', 'released', 'expired', 'rejected', 'reversed')
    ),

  discount_percent numeric NOT NULL DEFAULT 15
    CONSTRAINT leonix_verified_intro_discount_redemptions_pct_chk CHECK (
      discount_percent > 0 AND discount_percent <= 100
    ),
  base_amount_cents integer NOT NULL DEFAULT 0
    CONSTRAINT leonix_verified_intro_discount_redemptions_base_chk CHECK (base_amount_cents >= 0),
  discount_cents integer NOT NULL DEFAULT 0
    CONSTRAINT leonix_verified_intro_discount_redemptions_discount_chk CHECK (discount_cents >= 0),

  reserved_at timestamptz NOT NULL DEFAULT now(),
  reservation_expires_at timestamptz NOT NULL,
  redeemed_at timestamptz,
  released_at timestamptz,
  expired_at timestamptz,
  rejected_at timestamptz,
  reversed_at timestamptz,
  rejection_reason text,
  reversal_reason text,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS leonix_verified_intro_discount_redemptions_owner_idx
  ON public.leonix_verified_intro_discount_redemptions (owner_user_id);
CREATE INDEX IF NOT EXISTS leonix_verified_intro_discount_redemptions_business_idx
  ON public.leonix_verified_intro_discount_redemptions (business_identity_type, business_identity_key);
CREATE INDEX IF NOT EXISTS leonix_verified_intro_discount_redemptions_payment_record_idx
  ON public.leonix_verified_intro_discount_redemptions (payment_record_id);
CREATE INDEX IF NOT EXISTS leonix_verified_intro_discount_redemptions_status_idx
  ON public.leonix_verified_intro_discount_redemptions (status);
CREATE INDEX IF NOT EXISTS leonix_verified_intro_discount_redemptions_attempt_key_idx
  ON public.leonix_verified_intro_discount_redemptions (checkout_attempt_key);

-- Four anti-repeat boundaries. All WHERE status IN ('reserved','redeemed') — protects the
-- unresolved-reservation window, not just completed redemptions.
CREATE UNIQUE INDEX IF NOT EXISTS leonix_verified_intro_discount_redemptions_owner_uniq
  ON public.leonix_verified_intro_discount_redemptions (owner_user_id)
  WHERE status IN ('reserved', 'redeemed');
CREATE UNIQUE INDEX IF NOT EXISTS leonix_verified_intro_discount_redemptions_email_hash_uniq
  ON public.leonix_verified_intro_discount_redemptions (verified_email_identity_hash)
  WHERE status IN ('reserved', 'redeemed') AND verified_email_identity_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS leonix_verified_intro_discount_redemptions_phone_hash_uniq
  ON public.leonix_verified_intro_discount_redemptions (verified_phone_identity_hash)
  WHERE status IN ('reserved', 'redeemed') AND verified_phone_identity_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS leonix_verified_intro_discount_redemptions_business_uniq
  ON public.leonix_verified_intro_discount_redemptions (business_identity_type, business_identity_key)
  WHERE status IN ('reserved', 'redeemed');

ALTER TABLE public.leonix_verified_intro_discount_redemptions ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: access via service role only.

COMMENT ON TABLE public.leonix_verified_intro_discount_redemptions IS
  'Package C Build 2 (C4) — server-verified 15% intro discount redemption ledger. Four simultaneous anti-repeat boundaries (owner_user_id global + email/phone identity hashes + composite business identity, additive not substitutive). Distinct from leonix_promo_code_redemptions.';
COMMENT ON COLUMN public.leonix_verified_intro_discount_redemptions.business_identity_key IS
  'Reuses the commercial-parent-listing identity commercialWriteGuard.ts already resolves for Autos Dealer / Bienes Negocio (Package C Build 1). Falls back to owner_user_id for lanes with no parent/dealer structure (Autos Privado, BR Privado, Restaurantes, Servicios) — business_identity_fallback_reason is always stamped when the fallback is used.';
COMMENT ON COLUMN public.leonix_verified_intro_discount_redemptions.verified_email_identity_hash IS
  'HMAC-SHA256 of the confirmed authenticated email, keyed by LEONIX_IDENTITY_HASH_KEY. Raw email is never stored here.';
COMMENT ON COLUMN public.leonix_verified_intro_discount_redemptions.verified_phone_identity_hash IS
  'HMAC-SHA256 of the Twilio-verified E.164 phone, keyed by LEONIX_IDENTITY_HASH_KEY. Raw phone is never stored here (see leonix_verified_phone_identities for the durable raw-E.164 identity, which providers require).';
