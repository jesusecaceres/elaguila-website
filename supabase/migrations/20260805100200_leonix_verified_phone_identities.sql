-- Package C Build 2 (C4) — durable per-user verified-phone truth, separate from the ephemeral
-- challenge/rate-limit log. One row per (owner_user_id, phone_e164) that has successfully
-- completed a Twilio Verify 'check' with outcome 'approved'. This — not the challenge table —
-- is the read source for "is this phone verified" at checkout eligibility time.
--
-- Raw E.164 is permitted here (unlike the redemption ledger, which stores only a keyed hash):
-- Twilio Verify's API requires the actual phone number to operate, and this table is the
-- correct, access-controlled (RLS/service-role-only) place for it.
--
-- Additive only. RLS enabled, service-role only, no public policies.

CREATE TABLE IF NOT EXISTS public.leonix_verified_phone_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  owner_user_id uuid NOT NULL,
  phone_e164 text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  verification_challenge_id uuid REFERENCES public.leonix_phone_verification_challenges (id) ON DELETE SET NULL,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT leonix_verified_phone_identities_owner_phone_unique UNIQUE (owner_user_id, phone_e164)
);

CREATE INDEX IF NOT EXISTS leonix_verified_phone_identities_owner_idx
  ON public.leonix_verified_phone_identities (owner_user_id);
CREATE INDEX IF NOT EXISTS leonix_verified_phone_identities_phone_idx
  ON public.leonix_verified_phone_identities (phone_e164);

ALTER TABLE public.leonix_verified_phone_identities ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: access via service role only.

COMMENT ON TABLE public.leonix_verified_phone_identities IS
  'Package C Build 2 (C4) — durable per-user verified-phone truth (post successful Twilio Verify check). Source of truth for "is this phone verified" at checkout time.';
