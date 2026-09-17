-- =================================================================================================
-- Systemic Repair Build — Owner Claim / Handoff foundation.
--
-- Closes the missing staff-prospect -> real-owner handoff flow. A staff-canvassed business
-- (creation_source='staff_assisted', onboarding_status='not_started', zero owners — see the
-- prospect-stage exemption in 20260810120000_field_discovery_canvassing_foundation.sql) has no
-- mechanism today for a real owner to attach themselves to it. finalize_business_identity(_v2/_v3)
-- is NOT reused for this — it always INSERTs a brand-new businesses row, which would silently
-- duplicate every canvassed business the moment its owner tried to "sign up." This migration adds
-- a dedicated, additive, token-based invitation table plus one narrow SECURITY DEFINER RPC that
-- attaches a real owner to the EXISTING business_id and never creates a second one.
--
-- Doctrine enforced structurally:
-- - business_id is the one immutable anchor — the RPC only ever INSERTs one business_memberships
--   row and UPDATEs businesses.onboarding_status on the SAME row; every other table already keys
--   off business_id and is untouched by a claim event.
-- - Exactly one live (pending) invitation per business at a time — enforced by a partial unique
--   index, not application logic.
-- - The raw token is never persisted — only its SHA-256 hash — computed in application code
--   (app/lib/business/ownership/tokens.ts) and passed in already-hashed.
-- - RLS enabled, zero client policies (deny-all), matching every other Business Concierge table.
--   Staff-side operations (create/list/revoke) go through the existing service-role admin client
--   like every other admin write. The ONLY authenticated-callable surface is the accept RPC below,
--   which never exposes the table directly — only an opaque business_id return value.
-- - Row lock on redemption (FOR UPDATE) plus a defensive existing-primary-owner check make
--   double-claim and claim/finalize races fail closed rather than silently duplicate ownership —
--   in addition to (not instead of) the pre-existing businesses_owner_guard /
--   assert_business_has_one_active_owner_for_membership_change triggers, which independently
--   reject a second active primary owner at commit regardless.
-- =================================================================================================

BEGIN;

-- =================================================================================================
-- A. business_ownership_claims
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_ownership_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- SHA-256 hex digest of the raw invitation token. The raw token itself is never stored anywhere
  -- and is returned to the staff caller exactly once, at creation time.
  claim_token_hash text NOT NULL,

  -- Optional binding: when set, only an authenticated caller whose verified auth.users email
  -- matches (case-insensitively) may redeem this claim.
  intended_owner_email text NULL,

  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),

  created_by_roster_id uuid NOT NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL CHECK (char_length(btrim(created_by_email)) > 0),
  created_by_role text NOT NULL CHECK (char_length(btrim(created_by_role)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),

  revoked_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  revoked_at timestamptz NULL,
  revoke_reason text NULL,

  accepted_by_auth_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_by_email text NULL,
  accepted_at timestamptz NULL,
  resulting_membership_id uuid NULL REFERENCES public.business_memberships(id) ON DELETE SET NULL,

  CONSTRAINT business_ownership_claims_token_hash_uk UNIQUE (claim_token_hash),

  -- accepted_* fields are only ever set together, and only when status = 'accepted'.
  CONSTRAINT business_ownership_claims_accepted_atomic_chk CHECK (
    (status <> 'accepted' AND accepted_by_auth_user_id IS NULL AND accepted_by_email IS NULL AND accepted_at IS NULL AND resulting_membership_id IS NULL) OR
    (status = 'accepted' AND accepted_by_auth_user_id IS NOT NULL AND accepted_by_email IS NOT NULL AND accepted_at IS NOT NULL AND resulting_membership_id IS NOT NULL)
  ),

  -- revoked_* fields are only ever set together, and only when status = 'revoked'.
  CONSTRAINT business_ownership_claims_revoked_atomic_chk CHECK (
    (status <> 'revoked' AND revoked_by_roster_id IS NULL AND revoked_at IS NULL) OR
    (status = 'revoked' AND revoked_by_roster_id IS NOT NULL AND revoked_at IS NOT NULL)
  )
);

-- At most one LIVE (pending) invitation per business — staff must revoke before re-issuing.
CREATE UNIQUE INDEX IF NOT EXISTS business_ownership_claims_one_pending_per_business_uk
  ON public.business_ownership_claims (business_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS business_ownership_claims_business_id_idx ON public.business_ownership_claims (business_id);
CREATE INDEX IF NOT EXISTS business_ownership_claims_status_idx ON public.business_ownership_claims (status);

ALTER TABLE public.business_ownership_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_ownership_claims FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_ownership_claims FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_ownership_claims FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_ownership_claims FROM service_role;
-- Staff-side create/list/revoke goes through the service-role admin client, matching every other
-- Business Concierge table. No DELETE grant — a claim is status-transitioned, never hard-deleted,
-- for permanent audit history.
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_ownership_claims TO service_role;

COMMENT ON TABLE public.business_ownership_claims IS
  'Systemic Repair Build — staff-issued, hashed-token invitations that let a real owner claim an EXISTING staff-canvassed business (never create a new one). RLS enabled, zero client policies. Staff operations go through the service-role admin client; the only authenticated-callable surface is accept_business_ownership_claim().';

-- =================================================================================================
-- B. accept_business_ownership_claim — the sole redemption path. Attaches a real owner to the
-- EXISTING business_id; never creates a business row. SECURITY DEFINER so it can write through
-- RLS-enabled-with-zero-policies tables exactly like the finalize_business_identity family, but
-- identity is derived exclusively from auth.uid() — never a client-supplied user id.
-- =================================================================================================
CREATE OR REPLACE FUNCTION public.accept_business_ownership_claim(
  p_claim_token_hash text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_claim record;
  v_existing_owner_count integer;
  v_membership_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'accept_business_ownership_claim requires an authenticated caller' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_claim_token_hash IS NULL OR btrim(p_claim_token_hash) = '' THEN
    RAISE EXCEPTION 'empty_claim_token_hash' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'auth_user_not_found' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Lock the claim row so two simultaneous redemption attempts serialize — the second sees
  -- status <> 'pending' once the first commits and fails cleanly below.
  SELECT * INTO v_claim
  FROM public.business_ownership_claims
  WHERE claim_token_hash = btrim(p_claim_token_hash)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'claim_not_found' USING ERRCODE = 'no_data_found';
  END IF;
  IF v_claim.status <> 'pending' THEN
    RAISE EXCEPTION 'claim_not_pending' USING ERRCODE = 'check_violation';
  END IF;
  -- Note: an unhandled RAISE EXCEPTION rolls back the whole call, including any prior UPDATE in
  -- this same invocation — so a lazy "flip to expired" write cannot happen on this path. Staff-side
  -- listing (listOwnershipClaimsForBusiness) instead treats status='pending' AND expires_at <= now()
  -- as effectively expired for display; a genuinely expired claim can never be accepted regardless,
  -- since this check runs on every redemption attempt.
  IF v_claim.expires_at <= now() THEN
    RAISE EXCEPTION 'claim_expired' USING ERRCODE = 'check_violation';
  END IF;
  IF v_claim.intended_owner_email IS NOT NULL AND lower(btrim(v_claim.intended_owner_email)) <> lower(v_user_email) THEN
    RAISE EXCEPTION 'claim_email_mismatch' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Defense in depth: the businesses_owner_guard/assert_business_has_one_active_owner_for_
  -- membership_change triggers independently reject a second active primary owner at commit
  -- regardless, but failing early here gives a clean, specific error instead of a raw constraint
  -- violation.
  SELECT count(*) INTO v_existing_owner_count
  FROM public.business_memberships
  WHERE business_id = v_claim.business_id
    AND is_primary_owner = true
    AND membership_status = 'active';
  IF v_existing_owner_count > 0 THEN
    RAISE EXCEPTION 'business_already_owned' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.business_memberships (
    business_id, user_id, membership_role, membership_status, is_primary_owner, accepted_at,
    authorization_role, manual_review_flag
  ) VALUES (
    v_claim.business_id, v_user_id, 'owner', 'active', true, now(),
    'owner', false
  )
  RETURNING id INTO v_membership_id;

  UPDATE public.businesses
  SET onboarding_status = 'in_progress', updated_at = now()
  WHERE id = v_claim.business_id
    AND onboarding_status = 'not_started';

  UPDATE public.business_ownership_claims
  SET status = 'accepted',
      accepted_by_auth_user_id = v_user_id,
      accepted_by_email = v_user_email,
      accepted_at = now(),
      resulting_membership_id = v_membership_id
  WHERE id = v_claim.id;

  RETURN v_claim.business_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_business_ownership_claim(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_business_ownership_claim(text) TO authenticated;

COMMENT ON FUNCTION public.accept_business_ownership_claim IS
  'Systemic Repair Build — the sole redemption path for a business_ownership_claims invitation. Attaches auth.uid() as the real, active primary owner of the EXISTING claim.business_id and never inserts a new businesses row. SECURITY DEFINER, fixed search_path, identity derived exclusively from auth.uid(). Row-locks the claim (FOR UPDATE) so concurrent redemption attempts serialize.';

-- =================================================================================================
-- C. Feature flag — reuses the existing business_identity_flags table/convention. Default
-- disabled, no pilot users, matching every prior Business Concierge flag insert exactly.
-- =================================================================================================
INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES ('business_ownership_claim', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;

COMMIT;
