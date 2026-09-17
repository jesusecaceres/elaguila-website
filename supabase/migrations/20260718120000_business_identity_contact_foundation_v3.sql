-- Gate BCO-3R-B.2 — additive Business Identity contact-foundation completion. Purely additive:
-- new columns on businesses/business_contacts, one relabeled-but-preserved CHECK (business_contacts
-- label), one extended CHECK (business_digital_profiles platform), one new child table
-- (business_custom_links), and a new versioned RPC (finalize_business_identity_v3) that coexists
-- with v1/v2 rather than replacing them in place. Touches no existing row's data except the single
-- explicit, safe remap described below.
--
-- NOT executed or tested against a live Postgres instance by the agent that wrote this file — no
-- direct database/CLI access was available in that environment. Written by close structural mirror
-- of the already-applied 20260717120000 migration (same table, same conventions, same RPC shape).
-- Review carefully before applying to staging; consider a scratch/test run first.

-- =============================================================================
-- business_contacts — phone capabilities (additive column).
-- =============================================================================

ALTER TABLE public.business_contacts
  ADD COLUMN IF NOT EXISTS capabilities text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.business_contacts
  ADD CONSTRAINT business_contacts_capabilities_chk CHECK (capabilities <@ ARRAY['calls', 'sms', 'whatsapp']::text[]);

COMMENT ON COLUMN public.business_contacts.capabilities IS
  'Only meaningful for contact_type = phone: which response channels this number actually supports. Independent of the existing preferred_channel/channel_kind pair, which marks the single business-wide preferred contact (unchanged by this migration).';

-- Relabel business_contacts.label: 'support' -> 'customer_service', add 'quotes'. Existing rows
-- are remapped (never discarded) before the constraint changes, so no valid data is lost or made
-- invalid.
UPDATE public.business_contacts SET label = 'customer_service' WHERE label = 'support';

ALTER TABLE public.business_contacts DROP CONSTRAINT IF EXISTS business_contacts_label_chk;
ALTER TABLE public.business_contacts
  ADD CONSTRAINT business_contacts_label_chk CHECK (label IN ('main', 'sales', 'customer_service', 'booking', 'quotes', 'billing', 'other'));

-- =============================================================================
-- businesses — single business-level preferred response method (additive column). Replaces the
-- per-contact "is this contact's channel the preferred one" pattern for the business-wide
-- decision — the existing business_contacts.preferred_channel/channel_kind pair is untouched
-- (still meaningful as "this specific contact's own preferred channel"), this is the separate,
-- single, business-wide answer to "how should Leonix generally reach out."
-- =============================================================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS preferred_response_method text NULL;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_preferred_response_method_chk
    CHECK (preferred_response_method IS NULL OR preferred_response_method IN ('whatsapp', 'phone_call', 'sms', 'email'));

COMMENT ON COLUMN public.businesses.preferred_response_method IS
  'Single business-wide preferred contact method (Gate BCO-3R-B.2). Application layer (finalize_business_identity_v3) enforces that it matches an actually-entered, capable contact — never enforced as a DB CHECK since that would require cross-table validation.';

-- =============================================================================
-- business_digital_profiles — extend platform CHECK to add snapchat, pinterest.
-- =============================================================================

ALTER TABLE public.business_digital_profiles DROP CONSTRAINT IF EXISTS business_digital_profiles_platform_chk;
ALTER TABLE public.business_digital_profiles
  ADD CONSTRAINT business_digital_profiles_platform_chk CHECK (platform IN (
    'google_business', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'x', 'yelp',
    'whatsapp_business', 'snapchat', 'pinterest', 'other'
  ));

-- =============================================================================
-- business_custom_links — new child table for repeatable, labeled business links (booking, menu,
-- order online, portfolio, request-a-quote, reviews, other). Dedicated normalized table rather
-- than JSON, per Gate BCO-3R-B.2 architecture preference for repeatable records — mirrors
-- business_digital_profiles' exact shape/RLS/trigger pattern.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.business_custom_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  link_type text NOT NULL,
  custom_label text NULL,
  display_url text NOT NULL,
  normalized_url text NOT NULL,
  visibility text NOT NULL DEFAULT 'public',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_custom_links_link_type_chk CHECK (link_type IN (
    'booking', 'menu_catalog', 'order_online', 'portfolio', 'request_quote', 'reviews', 'other'
  )),
  CONSTRAINT business_custom_links_visibility_chk CHECK (visibility IN ('public', 'private')),
  CONSTRAINT business_custom_links_custom_label_chk CHECK (
    link_type <> 'other' OR (custom_label IS NOT NULL AND btrim(custom_label) <> '')
  )
);

COMMENT ON TABLE public.business_custom_links IS
  'Repeatable, owner-labeled business links (Gate BCO-3R-B.2) — e.g. booking page, menu, online store. Same server-only-mutation, member-only-read shape as business_contacts/business_digital_profiles.';

CREATE INDEX IF NOT EXISTS business_custom_links_business_id_idx ON public.business_custom_links (business_id);

CREATE OR REPLACE FUNCTION public.business_custom_links_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_custom_links_updated_at ON public.business_custom_links;
CREATE TRIGGER business_custom_links_updated_at
  BEFORE UPDATE ON public.business_custom_links
  FOR EACH ROW
  EXECUTE PROCEDURE public.business_custom_links_set_updated_at();

ALTER TABLE public.business_custom_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS business_custom_links_select_active_member ON public.business_custom_links;
CREATE POLICY business_custom_links_select_active_member
  ON public.business_custom_links
  FOR SELECT
  TO authenticated
  USING (public.is_active_business_member(business_id));

-- =============================================================================
-- finalize_business_identity_v3 — additive, versioned replacement RPC (Gate BCO-3R-B.2).
-- v1 and v2 are left completely untouched for compatibility/rollback. Same SECURITY DEFINER /
-- fixed search_path / no-dynamic-SQL / auth.uid()-derived-identity contract as v1/v2. Extends v2's
-- write set with: contact capabilities, business-level preferred response method (validated
-- against the entered contacts before any row is written), and custom business links.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.finalize_business_identity_v3(
  p_display_name text,
  p_normalized_name text,
  p_slug text,
  p_broad_business_type text,
  p_specific_business_type text,
  p_custom_specific_type text,
  p_business_stage text,
  p_primary_language text,
  p_business_primary_language text,
  p_business_additional_languages text[],
  p_year_started integer,
  p_operating_models text[],
  p_sales_relationships text[],
  p_sales_channels text[],
  p_contacts jsonb,
  p_service_areas jsonb,
  p_digital_profiles jsonb,
  p_authorization_role text,
  p_representative_relationship text,
  p_representative_contact_email text,
  p_representative_note text,
  p_manual_review_flag boolean,
  p_preferred_response_method text DEFAULT NULL,
  p_custom_links jsonb DEFAULT '[]'::jsonb,
  p_listing_links jsonb DEFAULT '[]'::jsonb,
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
  v_profile jsonb;
  v_link jsonb;
  v_custom_link jsonb;
  v_listing_owner uuid;
  v_link_status text;
  v_verified_at timestamptz;
  v_preference_satisfied boolean := false;
  v_contact_type text;
  v_capabilities text[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'finalize_business_identity_v3 requires an authenticated caller' USING ERRCODE = 'insufficient_privilege';
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

  -- Preferred response method must match an actually-entered, capable contact — never trusted
  -- from the client alone (the client already gates this in the UI, but the RPC is the real
  -- boundary). whatsapp/sms/phone_call require a phone contact with that capability; email
  -- requires an email contact.
  IF p_preferred_response_method IS NOT NULL THEN
    FOR v_contact IN SELECT * FROM jsonb_array_elements(p_contacts) LOOP
      v_contact_type := v_contact ->> 'contactType';
      v_capabilities := ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_contact -> 'capabilities', '[]'::jsonb)));
      IF p_preferred_response_method = 'email' AND v_contact_type = 'email' THEN
        v_preference_satisfied := true;
      ELSIF p_preferred_response_method = 'whatsapp' AND v_contact_type = 'phone' AND 'whatsapp' = ANY (v_capabilities) THEN
        v_preference_satisfied := true;
      ELSIF p_preferred_response_method = 'sms' AND v_contact_type = 'phone' AND 'sms' = ANY (v_capabilities) THEN
        v_preference_satisfied := true;
      ELSIF p_preferred_response_method = 'phone_call' AND v_contact_type = 'phone' AND 'calls' = ANY (v_capabilities) THEN
        v_preference_satisfied := true;
      END IF;
    END LOOP;
    IF NOT v_preference_satisfied THEN
      RAISE EXCEPTION 'preferred_response_method does not match any entered contact capability' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  INSERT INTO public.businesses (
    display_name, normalized_name, slug, broad_business_type, specific_business_type, custom_specific_type,
    business_stage, primary_language, business_primary_language, business_additional_languages, year_started,
    operating_models, sales_relationships, sales_channels, preferred_response_method,
    creation_source, created_by_user_id, onboarding_status
  ) VALUES (
    btrim(p_display_name), p_normalized_name, p_slug, p_broad_business_type, p_specific_business_type, p_custom_specific_type,
    p_business_stage, p_primary_language, p_business_primary_language, COALESCE(p_business_additional_languages, '{}'), p_year_started,
    COALESCE(p_operating_models, '{}'), COALESCE(p_sales_relationships, '{}'), COALESCE(p_sales_channels, '{}'), p_preferred_response_method,
    'onboarding_wizard', v_user_id, 'complete'
  )
  RETURNING id INTO v_business_id;

  INSERT INTO public.business_memberships (
    business_id, user_id, membership_role, membership_status, is_primary_owner, accepted_at,
    authorization_role, representative_relationship, representative_contact_email, representative_note, manual_review_flag
  ) VALUES (
    v_business_id, v_user_id, 'owner', 'active', true, now(),
    COALESCE(p_authorization_role, 'owner'), p_representative_relationship, p_representative_contact_email, p_representative_note, COALESCE(p_manual_review_flag, false)
  );

  FOR v_contact IN SELECT * FROM jsonb_array_elements(p_contacts) LOOP
    INSERT INTO public.business_contacts (business_id, contact_type, value, normalized_value, preferred_channel, channel_kind, is_primary, label, visibility, capabilities)
    VALUES (
      v_business_id,
      v_contact ->> 'contactType',
      v_contact ->> 'value',
      v_contact ->> 'normalizedValue',
      COALESCE((v_contact ->> 'preferredChannel')::boolean, false),
      v_contact ->> 'channelKind',
      COALESCE((v_contact ->> 'isPrimary')::boolean, false),
      COALESCE(v_contact ->> 'label', 'main'),
      COALESCE(v_contact ->> 'visibility', 'public'),
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_contact -> 'capabilities', '[]'::jsonb)))
    );
  END LOOP;

  FOR v_area IN SELECT * FROM jsonb_array_elements(p_service_areas) LOOP
    INSERT INTO public.business_service_areas (business_id, area_kind, raw_text, normalized_text, city_hint, is_primary, country, structured_details)
    VALUES (
      v_business_id,
      v_area ->> 'areaKind',
      v_area ->> 'rawText',
      v_area ->> 'normalizedText',
      v_area ->> 'cityHint',
      COALESCE((v_area ->> 'isPrimary')::boolean, false),
      v_area ->> 'country',
      COALESCE(v_area -> 'structuredDetails', '{}'::jsonb)
    );
  END LOOP;

  IF p_digital_profiles IS NOT NULL AND jsonb_typeof(p_digital_profiles) = 'array' THEN
    FOR v_profile IN SELECT * FROM jsonb_array_elements(p_digital_profiles) LOOP
      INSERT INTO public.business_digital_profiles (business_id, platform, handle_or_url)
      VALUES (v_business_id, v_profile ->> 'platform', v_profile ->> 'handleOrUrl');
    END LOOP;
  END IF;

  IF p_custom_links IS NOT NULL AND jsonb_typeof(p_custom_links) = 'array' THEN
    FOR v_custom_link IN SELECT * FROM jsonb_array_elements(p_custom_links) LOOP
      INSERT INTO public.business_custom_links (business_id, link_type, custom_label, display_url, normalized_url, visibility, sort_order)
      VALUES (
        v_business_id,
        v_custom_link ->> 'linkType',
        v_custom_link ->> 'customLabel',
        v_custom_link ->> 'displayUrl',
        v_custom_link ->> 'normalizedUrl',
        COALESCE(v_custom_link ->> 'visibility', 'public'),
        COALESCE((v_custom_link ->> 'sortOrder')::integer, 0)
      );
    END LOOP;
  END IF;

  IF p_listing_links IS NOT NULL AND jsonb_typeof(p_listing_links) = 'array' THEN
    FOR v_link IN SELECT * FROM jsonb_array_elements(p_listing_links) LOOP
      v_listing_owner := NULL;

      IF v_link ->> 'listingSource' = 'listings' THEN
        SELECT owner_id INTO v_listing_owner FROM public.listings WHERE id::text = (v_link ->> 'listingId');
      ELSIF v_link ->> 'listingSource' = 'restaurantes_public_listings' THEN
        SELECT owner_user_id INTO v_listing_owner FROM public.restaurantes_public_listings WHERE id::text = (v_link ->> 'listingId');
      ELSIF v_link ->> 'listingSource' = 'servicios_public_listings' THEN
        SELECT owner_user_id INTO v_listing_owner FROM public.servicios_public_listings WHERE id::text = (v_link ->> 'listingId') OR slug = (v_link ->> 'listingId');
      ELSIF v_link ->> 'listingSource' = 'autos_classifieds_listings' THEN
        SELECT owner_user_id INTO v_listing_owner FROM public.autos_classifieds_listings WHERE id::text = (v_link ->> 'listingId');
      END IF;

      IF v_listing_owner IS NOT NULL AND v_listing_owner = v_user_id THEN
        v_link_status := 'verified';
        v_verified_at := now();
      ELSE
        v_link_status := 'pending';
        v_verified_at := NULL;
      END IF;

      INSERT INTO public.business_listing_links (business_id, listing_source, listing_id, relationship_role, linked_by, status, verified_at)
      VALUES (v_business_id, v_link ->> 'listingSource', v_link ->> 'listingId', 'primary', v_user_id, v_link_status, v_verified_at);
    END LOOP;
  END IF;

  IF p_draft_id IS NOT NULL THEN
    DELETE FROM public.business_onboarding_drafts WHERE id = p_draft_id AND user_id = v_user_id;
  END IF;

  RETURN v_business_id;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_business_identity_v3(
  text, text, text, text, text, text, text, text, text, text[], integer, text[], text[], text[],
  jsonb, jsonb, jsonb, text, text, text, text, boolean, text, jsonb, jsonb, uuid
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_business_identity_v3(
  text, text, text, text, text, text, text, text, text, text[], integer, text[], text[], text[],
  jsonb, jsonb, jsonb, text, text, text, text, boolean, text, jsonb, jsonb, uuid
) TO authenticated;

COMMENT ON FUNCTION public.finalize_business_identity_v3 IS
  'Gate BCO-3R-B.2 — versioned atomic Business Identity creation. Coexists with finalize_business_identity (v1) and finalize_business_identity_v2; none replace each other. Adds contact capabilities, a server-validated business-wide preferred response method, and custom business links to v2''s write set. Same SECURITY DEFINER / fixed search_path / auth.uid()-derived-identity / internal listing re-verification contract as v1/v2.';
