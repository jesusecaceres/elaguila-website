-- Additive, unapplied. Do not apply from this mission.
-- Extends accept_business_ownership_claim so verified linked listings that are still
-- owner-null become the claiming customer's same-row ownership. Never copies a listing.
-- Existing membership/claim behavior is preserved.

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
  v_link record;
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
  IF v_claim.expires_at <= now() THEN
    RAISE EXCEPTION 'claim_expired' USING ERRCODE = 'check_violation';
  END IF;
  IF v_claim.intended_owner_email IS NOT NULL AND lower(btrim(v_claim.intended_owner_email)) <> lower(v_user_email) THEN
    RAISE EXCEPTION 'claim_email_mismatch' USING ERRCODE = 'insufficient_privilege';
  END IF;

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

  -- Same-row listing transfer: owner-null organizational rows only. Foreign owners are left
  -- untouched. Replay is idempotent because already-claimer rows fail the IS NULL predicate.
  FOR v_link IN
    SELECT listing_source, listing_id
    FROM public.business_listing_links
    WHERE business_id = v_claim.business_id
      AND status = 'verified'
  LOOP
    IF v_link.listing_source = 'servicios_public_listings' THEN
      UPDATE public.servicios_public_listings SET owner_user_id = v_user_id
      WHERE id = v_link.listing_id AND owner_user_id IS NULL;
    ELSIF v_link.listing_source = 'restaurantes_public_listings' THEN
      UPDATE public.restaurantes_public_listings SET owner_user_id = v_user_id
      WHERE id = v_link.listing_id AND owner_user_id IS NULL;
    ELSIF v_link.listing_source = 'autos_classifieds_listings' THEN
      UPDATE public.autos_classifieds_listings SET owner_user_id = v_user_id
      WHERE id = v_link.listing_id AND owner_user_id IS NULL;
    ELSIF v_link.listing_source = 'listings' THEN
      UPDATE public.listings SET owner_id = v_user_id
      WHERE id = v_link.listing_id AND owner_id IS NULL;
    ELSIF v_link.listing_source = 'empleos_public_listings' THEN
      UPDATE public.empleos_public_listings SET owner_user_id = v_user_id
      WHERE id = v_link.listing_id AND owner_user_id IS NULL;
    ELSIF v_link.listing_source = 'comida_local_public_listings' THEN
      UPDATE public.comida_local_public_listings SET owner_user_id = v_user_id
      WHERE id = v_link.listing_id AND owner_user_id IS NULL;
    END IF;
  END LOOP;

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

COMMENT ON FUNCTION public.accept_business_ownership_claim IS
  'Owner claim redemption plus same-row transfer of verified linked listings that are still owner-null. Never inserts a businesses row or copies a listing. SECURITY DEFINER, identity from auth.uid().';
