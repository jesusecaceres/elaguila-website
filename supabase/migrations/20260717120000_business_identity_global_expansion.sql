-- Gate BCO-3R — additive Business Identity expansion for the corrected 9-step onboarding.
-- Purely additive: new columns on businesses/business_memberships/business_contacts/
-- business_service_areas, one new child table (business_digital_profiles), and a new
-- versioned RPC (finalize_business_identity_v2) that coexists with v1 rather than replacing
-- it in place. Touches no existing row, no existing constraint's meaning, no existing RLS
-- policy's behavior for pre-existing columns.

-- =============================================================================
-- businesses — controlled taxonomy + global language + operating model tags.
-- =============================================================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS specific_business_type text NULL,
  ADD COLUMN IF NOT EXISTS custom_specific_type text NULL,
  -- Business's own real-world operating language(s) — deliberately separate from
  -- `primary_language` (the ES/EN app-interface language for this business record).
  ADD COLUMN IF NOT EXISTS business_primary_language text NULL,
  ADD COLUMN IF NOT EXISTS business_additional_languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS year_started integer NULL,
  ADD COLUMN IF NOT EXISTS operating_models text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sales_relationships text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sales_channels text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_year_started_chk CHECK (year_started IS NULL OR (year_started >= 1800 AND year_started <= 2100));

-- Controlled broad-category list (Gate BCO-3R Phase 5). No existing rows on staging or
-- production (Business Identity has never been enabled), so tightening this from
-- unconstrained text to a checked list is safe.
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_broad_business_type_chk CHECK (broad_business_type IN (
    'retail_ecommerce', 'professional_services', 'food_hospitality', 'health_beauty_wellness',
    'construction_trades', 'technology_digital_services', 'education_training_coaching',
    'real_estate_property_services', 'automotive_transportation', 'manufacturing_local_production',
    'arts_entertainment_events', 'home_personal_services', 'nonprofit_faith_community',
    'agriculture_food_production', 'finance_insurance', 'other'
  ));

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_business_stage_chk CHECK (business_stage IN (
    'planning_prelaunch', 'newly_opened', 'operating', 'growing', 'established_mature', 'paused_restructuring'
  ));

COMMENT ON COLUMN public.businesses.business_primary_language IS
  'The business''s own real-world operating language (global, unconstrained) — distinct from primary_language, which is the ES/EN app-interface language for this record.';
COMMENT ON COLUMN public.businesses.operating_models IS
  'Tag array: fixed_location, mobile, online_remote, regional, hybrid, multiple_locations.';
COMMENT ON COLUMN public.businesses.sales_relationships IS 'Tag array: b2c, b2b, b2g, direct_to_consumer, wholesale, marketplace, subscription, nonprofit_community, other.';
COMMENT ON COLUMN public.businesses.sales_channels IS 'Tag array: physical_location, website, social_media, phone, whatsapp, marketplace_platform, mobile_on_site, events, referrals, other.';

-- =============================================================================
-- business_memberships — ownership authorization metadata (founding-owner row).
-- =============================================================================

ALTER TABLE public.business_memberships
  ADD COLUMN IF NOT EXISTS authorization_role text NOT NULL DEFAULT 'owner',
  ADD COLUMN IF NOT EXISTS representative_relationship text NULL,
  ADD COLUMN IF NOT EXISTS representative_contact_email text NULL,
  ADD COLUMN IF NOT EXISTS representative_note text NULL,
  ADD COLUMN IF NOT EXISTS manual_review_flag boolean NOT NULL DEFAULT false;

ALTER TABLE public.business_memberships
  ADD CONSTRAINT business_memberships_authorization_role_chk CHECK (authorization_role IN ('owner', 'authorized_representative'));

COMMENT ON COLUMN public.business_memberships.authorization_role IS
  'Owner-declared relationship to the business at creation time — never implies automated ownership transfer or invitation.';

-- =============================================================================
-- business_contacts — label + visibility, additive.
-- =============================================================================

ALTER TABLE public.business_contacts
  ADD COLUMN IF NOT EXISTS label text NOT NULL DEFAULT 'main',
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

ALTER TABLE public.business_contacts
  ADD CONSTRAINT business_contacts_label_chk CHECK (label IN ('main', 'sales', 'support', 'booking', 'billing', 'other')),
  ADD CONSTRAINT business_contacts_visibility_chk CHECK (visibility IN ('public', 'private'));

-- =============================================================================
-- business_service_areas — country (top-level, queryable) + versioned structured_details.
-- Deliberately additive to the existing raw_text/normalized_text/area_kind/city_hint
-- contract (BCO-1C.1) — no existing column's meaning changes. structured_details is a
-- versioned JSONB shape (schemaVersion: 1) rather than an unbounded blob; its exact shape
-- is validated at the application layer (app/lib/business/validation.ts) per operating model,
-- not by a Postgres CHECK, matching this schema's existing convention of keeping DB CHECKs to
-- simple enumerations and letting the application own compound-shape validation.
-- =============================================================================

ALTER TABLE public.business_service_areas
  ADD COLUMN IF NOT EXISTS country text NULL,
  ADD COLUMN IF NOT EXISTS structured_details jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.business_service_areas.country IS
  'ISO 3166-1 alpha-2 country code. Required by application validation for every operating-model path; kept as a real column (not buried in JSONB) because it is filtered/queried directly.';
COMMENT ON COLUMN public.business_service_areas.structured_details IS
  'Versioned JSONB (schemaVersion: 1). Holds operating-model-specific structured fields: street_number, street_name, unit, neighborhood, city, state_province, postal_code, visibility, coverage_type, service_radius, radius_unit, cities_served, regions_served, countries_served, timezone, languages_served, nationwide, international, multiple_locations, interaction_mode, base_city, base_state_province, base_postal_code.';

-- =============================================================================
-- business_digital_profiles — new child table, mirrors business_contacts' shape/RLS exactly.
-- Kept separate from business_contacts because social/platform profiles are a distinct
-- concept from phone/email/website core contacts (Gate BCO-3R Phase 8).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.business_digital_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  platform text NOT NULL,
  handle_or_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_digital_profiles_platform_chk CHECK (platform IN (
    'google_business', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'x', 'yelp', 'whatsapp_business', 'other'
  ))
);

COMMENT ON TABLE public.business_digital_profiles IS
  'Social/platform digital presence, separate from core contacts (Gate BCO-3R). No public SELECT policy — same server-only-mutation, member-only-read shape as business_contacts.';

CREATE INDEX IF NOT EXISTS business_digital_profiles_business_id_idx ON public.business_digital_profiles (business_id);

CREATE OR REPLACE FUNCTION public.business_digital_profiles_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_digital_profiles_updated_at ON public.business_digital_profiles;
CREATE TRIGGER business_digital_profiles_updated_at
  BEFORE UPDATE ON public.business_digital_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.business_digital_profiles_set_updated_at();

ALTER TABLE public.business_digital_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS business_digital_profiles_select_active_member ON public.business_digital_profiles;
CREATE POLICY business_digital_profiles_select_active_member
  ON public.business_digital_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_active_business_member(business_id));

-- =============================================================================
-- finalize_business_identity_v2 — additive, versioned replacement RPC (Gate BCO-3R Phase 15).
-- v1 (finalize_business_identity) is left completely untouched for compatibility/rollback.
-- Same SECURITY DEFINER / fixed search_path / no-dynamic-SQL / auth.uid()-derived-identity
-- contract as v1. Extends v1's write set with: specific type, business language(s), year
-- started, operating model tags, structured location (country + structured_details),
-- labeled/visible contacts, digital profiles, authorization metadata, and multiple listing
-- links instead of one.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.finalize_business_identity_v2(
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
  v_listing_owner uuid;
  v_link_status text;
  v_verified_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'finalize_business_identity_v2 requires an authenticated caller' USING ERRCODE = 'insufficient_privilege';
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
    display_name, normalized_name, slug, broad_business_type, specific_business_type, custom_specific_type,
    business_stage, primary_language, business_primary_language, business_additional_languages, year_started,
    operating_models, sales_relationships, sales_channels,
    creation_source, created_by_user_id, onboarding_status
  ) VALUES (
    btrim(p_display_name), p_normalized_name, p_slug, p_broad_business_type, p_specific_business_type, p_custom_specific_type,
    p_business_stage, p_primary_language, p_business_primary_language, COALESCE(p_business_additional_languages, '{}'), p_year_started,
    COALESCE(p_operating_models, '{}'), COALESCE(p_sales_relationships, '{}'), COALESCE(p_sales_channels, '{}'),
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
    INSERT INTO public.business_contacts (business_id, contact_type, value, normalized_value, preferred_channel, channel_kind, is_primary, label, visibility)
    VALUES (
      v_business_id,
      v_contact ->> 'contactType',
      v_contact ->> 'value',
      v_contact ->> 'normalizedValue',
      COALESCE((v_contact ->> 'preferredChannel')::boolean, false),
      v_contact ->> 'channelKind',
      COALESCE((v_contact ->> 'isPrimary')::boolean, false),
      COALESCE(v_contact ->> 'label', 'main'),
      COALESCE(v_contact ->> 'visibility', 'public')
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

REVOKE ALL ON FUNCTION public.finalize_business_identity_v2(
  text, text, text, text, text, text, text, text, text, text[], integer, text[], text[], text[], jsonb, jsonb, jsonb, text, text, text, text, boolean, jsonb, uuid
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_business_identity_v2(
  text, text, text, text, text, text, text, text, text, text[], integer, text[], text[], text[], jsonb, jsonb, jsonb, text, text, text, text, boolean, jsonb, uuid
) TO authenticated;

COMMENT ON FUNCTION public.finalize_business_identity_v2 IS
  'Gate BCO-3R — versioned atomic Business Identity creation supporting the corrected 9-step onboarding. Coexists with finalize_business_identity (v1); neither replaces the other. Same SECURITY DEFINER / fixed search_path / auth.uid()-derived-identity / internal listing re-verification contract as v1.';
