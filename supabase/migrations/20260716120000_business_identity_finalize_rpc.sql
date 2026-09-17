-- Gate BCO-2 — atomic Business Identity finalization RPC.
-- Purely additive: one new SECURITY DEFINER function, callable by `authenticated`.
-- Touches no existing table. Exists specifically because standard Supabase client calls
-- cannot provide a multi-statement transaction from application code, and
-- businesses/business_memberships/business_contacts/business_service_areas/
-- business_listing_links deliberately have no client INSERT policy (Gate BCO-1C.1) — this
-- function is the one narrow, server-validated path that creates a business and its founding
-- owner atomically, preserving the exactly-one-owner trigger exactly as certified in Package 1.
--
-- No dynamic SQL. Fixed search_path. No payment or entitlement behavior. Listing-ownership
-- verification is done here with static, per-table branches mirroring
-- app/lib/listingPlans/listingEntitlementOwnership.ts's LISTING_SOURCE_OWNERSHIP_CONTRACT
-- exactly (4 known sources) — if that TS map ever changes, this function must be updated to
-- match in the same PR. The function never trusts a client-supplied "already verified" claim;
-- it always re-determines verified/pending itself from the live listing row.

CREATE OR REPLACE FUNCTION public.finalize_business_identity(
  p_display_name text,
  p_normalized_name text,
  p_slug text,
  p_broad_business_type text,
  p_business_stage text,
  p_primary_language text,
  p_contacts jsonb,
  p_service_areas jsonb,
  p_listing_source text DEFAULT NULL,
  p_listing_id text DEFAULT NULL,
  p_draft_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_business_id uuid;
  v_contact jsonb;
  v_area jsonb;
  v_listing_owner uuid;
  v_link_status text;
  v_verified_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'finalize_business_identity requires an authenticated caller' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_display_name IS NULL OR btrim(p_display_name) = '' THEN
    RAISE EXCEPTION 'display_name is required' USING ERRCODE = 'not_null_violation';
  END IF;
  IF p_contacts IS NULL OR jsonb_typeof(p_contacts) <> 'array' OR jsonb_array_length(p_contacts) = 0 THEN
    RAISE EXCEPTION 'at least one contact is required' USING ERRCODE = 'check_violation';
  END IF;
  IF p_service_areas IS NULL OR jsonb_typeof(p_service_areas) <> 'array' OR jsonb_array_length(p_service_areas) = 0 THEN
    RAISE EXCEPTION 'at least one service area is required' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.businesses (
    display_name, normalized_name, slug, broad_business_type, business_stage,
    primary_language, creation_source, created_by_user_id, onboarding_status
  ) VALUES (
    btrim(p_display_name), p_normalized_name, p_slug, p_broad_business_type, p_business_stage,
    p_primary_language, 'onboarding_wizard', v_user_id, 'complete'
  )
  RETURNING id INTO v_business_id;

  INSERT INTO public.business_memberships (business_id, user_id, membership_role, membership_status, is_primary_owner, accepted_at)
  VALUES (v_business_id, v_user_id, 'owner', 'active', true, now());

  FOR v_contact IN SELECT * FROM jsonb_array_elements(p_contacts) LOOP
    INSERT INTO public.business_contacts (business_id, contact_type, value, normalized_value, preferred_channel, channel_kind, is_primary)
    VALUES (
      v_business_id,
      v_contact ->> 'contactType',
      v_contact ->> 'value',
      v_contact ->> 'normalizedValue',
      COALESCE((v_contact ->> 'preferredChannel')::boolean, false),
      v_contact ->> 'channelKind',
      COALESCE((v_contact ->> 'isPrimary')::boolean, false)
    );
  END LOOP;

  FOR v_area IN SELECT * FROM jsonb_array_elements(p_service_areas) LOOP
    INSERT INTO public.business_service_areas (business_id, area_kind, raw_text, normalized_text, city_hint, is_primary)
    VALUES (
      v_business_id,
      v_area ->> 'areaKind',
      v_area ->> 'rawText',
      v_area ->> 'normalizedText',
      v_area ->> 'cityHint',
      COALESCE((v_area ->> 'isPrimary')::boolean, false)
    );
  END LOOP;

  IF p_listing_source IS NOT NULL AND p_listing_id IS NOT NULL THEN
    v_listing_owner := NULL;

    IF p_listing_source = 'listings' THEN
      SELECT owner_id INTO v_listing_owner FROM public.listings WHERE id::text = p_listing_id;
    ELSIF p_listing_source = 'restaurantes_public_listings' THEN
      SELECT owner_user_id INTO v_listing_owner FROM public.restaurantes_public_listings WHERE id::text = p_listing_id;
    ELSIF p_listing_source = 'servicios_public_listings' THEN
      SELECT owner_user_id INTO v_listing_owner FROM public.servicios_public_listings WHERE id::text = p_listing_id OR slug = p_listing_id;
    ELSIF p_listing_source = 'autos_classifieds_listings' THEN
      SELECT owner_user_id INTO v_listing_owner FROM public.autos_classifieds_listings WHERE id::text = p_listing_id;
    END IF;

    IF v_listing_owner IS NOT NULL AND v_listing_owner = v_user_id THEN
      v_link_status := 'verified';
      v_verified_at := now();
    ELSE
      v_link_status := 'pending';
      v_verified_at := NULL;
    END IF;

    INSERT INTO public.business_listing_links (business_id, listing_source, listing_id, relationship_role, linked_by, status, verified_at)
    VALUES (v_business_id, p_listing_source, p_listing_id, 'primary', v_user_id, v_link_status, v_verified_at);
  END IF;

  IF p_draft_id IS NOT NULL THEN
    DELETE FROM public.business_onboarding_drafts WHERE id = p_draft_id AND user_id = v_user_id;
  END IF;

  RETURN v_business_id;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_business_identity(text, text, text, text, text, text, jsonb, jsonb, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_business_identity(text, text, text, text, text, text, jsonb, jsonb, text, text, uuid) TO authenticated;

COMMENT ON FUNCTION public.finalize_business_identity IS
  'Package BCO-2 — atomic Business Identity creation (business + founding owner + contacts + service areas + optional listing link + draft cleanup). SECURITY DEFINER: bypasses the deliberate absence of client INSERT policies on these tables. Re-verifies listing ownership internally; never trusts a caller-supplied verified flag.';
