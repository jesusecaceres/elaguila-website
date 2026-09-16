-- =================================================================================================
-- Staff-Created Business Profile -> Private Preview -> Client Claim -> Owner Publish Pipeline
--
-- Adds the ONE missing piece proven absent by source trace: a standalone, cross-category
-- "Leonix Business Profile" presentation layer keyed to the canonical businesses.id. Every
-- identity field it could have duplicated (contacts, service areas, digital profiles, custom
-- links) already has a canonical home and is NOT repeated here — this table holds only
-- genuine profile-presentation content with no existing canonical column.
--
-- Lifecycle is deliberately the minimal two real states: draft -> published. "Preview" is not a
-- stored status — staff and the owner can preview the draft (or the live published profile) at
-- any time via a route, never a database state, which is the simplest way to guarantee staff can
-- always show a prospect their profile without ever risking an accidental public flip.
--
-- Write-path split (matches the existing Systemic Repair Build convention exactly):
--   - Staff writes go through the service-role admin client, gated by the
--     manage_business_profile capability at the API-route layer (identical to
--     app/lib/business/ownership/repository.ts createOwnershipClaim). Staff can never publish —
--     the staff API route never accepts or forwards a status field.
--   - Owner writes run as the authenticated owner via two SECURITY DEFINER RPCs (identical
--     pattern to accept_business_ownership_claim): one for draft edits, one for the
--     publish/unpublish state transition, so the commercial-entitlement check for publication
--     can never be bypassed by a client-trusted direct table write. RLS therefore carries ZERO
--     client-writable policy on this table, matching business_contacts/business_service_areas/etc.
-- =================================================================================================

-- A. business_profiles
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft',
  headline text,
  short_description text,
  about_description text,
  logo_url text,
  hero_image_url text,
  gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  featured_highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by_type text NOT NULL DEFAULT 'staff',
  created_by_ref text,
  updated_by_type text,
  updated_by_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  first_published_at timestamptz,

  CONSTRAINT business_profiles_business_id_uk UNIQUE (business_id),
  CONSTRAINT business_profiles_status_chk CHECK (status IN ('draft', 'published')),
  CONSTRAINT business_profiles_created_by_type_chk CHECK (created_by_type IN ('staff', 'owner')),
  CONSTRAINT business_profiles_updated_by_type_chk CHECK (updated_by_type IS NULL OR updated_by_type IN ('staff', 'owner')),
  CONSTRAINT business_profiles_published_atomic_chk CHECK (
    (status = 'published' AND published_at IS NOT NULL) OR (status = 'draft')
  )
);

CREATE INDEX IF NOT EXISTS business_profiles_business_id_idx ON public.business_profiles (business_id);
CREATE INDEX IF NOT EXISTS business_profiles_status_idx ON public.business_profiles (status);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_profiles FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_profiles FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_profiles FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_profiles FROM service_role;

GRANT SELECT ON TABLE public.business_profiles TO anon;
GRANT SELECT ON TABLE public.business_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_profiles TO service_role;

-- Public: only a published profile is readable by anyone, matching the exact
-- restaurantes_public_listings_select_public precedent.
CREATE POLICY "business_profiles_select_public"
  ON public.business_profiles
  FOR SELECT
  USING (status = 'published');

-- Member: an active business member can always read their own profile, published or not
-- (this is what makes the owner-side preview/edit routes work before anything is public).
CREATE POLICY "business_profiles_select_member"
  ON public.business_profiles
  FOR SELECT
  USING (public.is_active_business_member(business_id));

-- No INSERT/UPDATE/DELETE policy for authenticated at all -- every owner write goes through the
-- two RPCs below so the publish-entitlement check can never be bypassed by a direct table write.

COMMENT ON TABLE public.business_profiles IS
  'Staff-Created Business Profile pipeline -- standalone, cross-category public "Leonix Business Profile" presentation layer keyed 1:1 to businesses.id. Never duplicates canonical identity (contacts/service areas/digital profiles/custom links). RLS: public can read only status=''published''; an active member can always read their own. No client-writable policy -- writes go through service-role (staff) or the two SECURITY DEFINER RPCs below (owner).';

-- =================================================================================================
-- B. update_own_business_profile_draft -- the owner's own draft-edit path. Never accepts or sets
-- `status` -- an owner can never publish through this function, only through
-- publish_business_profile() below, which additionally enforces the commercial-entitlement check.
-- =================================================================================================
CREATE OR REPLACE FUNCTION public.update_own_business_profile_draft(
  p_business_id uuid,
  p_headline text,
  p_short_description text,
  p_about_description text,
  p_logo_url text,
  p_hero_image_url text,
  p_gallery_images jsonb,
  p_featured_highlights jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'update_own_business_profile_draft requires an authenticated caller' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT public.is_active_business_member(p_business_id) THEN
    RAISE EXCEPTION 'not_a_member' USING ERRCODE = 'insufficient_privilege';
  END IF;

  INSERT INTO public.business_profiles (
    business_id, headline, short_description, about_description, logo_url, hero_image_url,
    gallery_images, featured_highlights, created_by_type, created_by_ref, updated_by_type, updated_by_ref
  )
  VALUES (
    p_business_id, p_headline, p_short_description, p_about_description, p_logo_url, p_hero_image_url,
    COALESCE(p_gallery_images, '[]'::jsonb), COALESCE(p_featured_highlights, '[]'::jsonb),
    'owner', v_caller::text, 'owner', v_caller::text
  )
  ON CONFLICT (business_id) DO UPDATE SET
    headline = EXCLUDED.headline,
    short_description = EXCLUDED.short_description,
    about_description = EXCLUDED.about_description,
    logo_url = EXCLUDED.logo_url,
    hero_image_url = EXCLUDED.hero_image_url,
    gallery_images = EXCLUDED.gallery_images,
    featured_highlights = EXCLUDED.featured_highlights,
    updated_by_type = 'owner',
    updated_by_ref = v_caller::text,
    updated_at = now();

  RETURN p_business_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_own_business_profile_draft(uuid, text, text, text, text, text, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_own_business_profile_draft(uuid, text, text, text, text, text, jsonb, jsonb) TO authenticated;

COMMENT ON FUNCTION public.update_own_business_profile_draft IS
  'Staff-Created Business Profile pipeline -- the owner''s own draft-edit path. Upserts business_profiles for a business the caller is an active member of. Never sets status -- publication is only possible through publish_business_profile(), which enforces commercial entitlement.';

-- =================================================================================================
-- B2. business_profile_entitlements -- the missing business-level commercial-benefit layer.
--
-- Trace proved (Gate 07 MRI) that every existing commercial-truth table is keyed by
-- listing_id/listing_source (leonix_payment_records, listing_package_entitlements,
-- leonix_promo_codes/redemptions) or by owner_user_id (leonix_placement_entitlements,
-- leonix_subscription_records) -- NONE is keyed by businesses.id. A prospect who buys only a
-- print/digital magazine package (no Servicios/Restaurantes/etc. category listing at all) has no
-- business_listing_links row and can never satisfy the listing-based entitlement check below.
--
-- This table is a business-level BENEFIT record, not a pricing/checkout system: it answers only
-- "is business X commercially authorized to have its Business Profile released/published?" It
-- never stores a dollar amount or a package name/price -- pricing stays entirely in the existing
-- Revenue OS tables. Status vocabulary matches listing_package_entitlements.status exactly
-- (active/scheduled/expired/revoked); source_type reuses three of
-- listing_package_entitlements.grant_source's exact existing values (admin_manual/comp/partner)
-- plus manual_cleared_payment, so a staff-attested grant here uses the SAME vocabulary as every
-- other Leonix commercial grant, not a new one invented for this table alone.
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_profile_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  source_type text NOT NULL,
  -- Free-text traceable pointer (e.g. a leonix_payment_records.id, an invoice/contract number, or
  -- a staff description of the real record reviewed) -- never a fabricated "paid=true" boolean
  -- with no underlying reference.
  source_reference text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by_roster_id uuid,
  granted_by_email text,
  revoked_at timestamptz,
  revoked_by_roster_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_profile_entitlements_status_chk CHECK (status IN ('active', 'scheduled', 'expired', 'revoked')),
  CONSTRAINT business_profile_entitlements_source_type_chk CHECK (source_type IN ('admin_manual', 'comp', 'partner', 'manual_cleared_payment')),
  CONSTRAINT business_profile_entitlements_revoked_atomic_chk CHECK (
    (status = 'revoked' AND revoked_at IS NOT NULL) OR (status <> 'revoked')
  )
);

CREATE INDEX IF NOT EXISTS business_profile_entitlements_business_id_idx ON public.business_profile_entitlements (business_id);
CREATE INDEX IF NOT EXISTS business_profile_entitlements_status_idx ON public.business_profile_entitlements (status);

ALTER TABLE public.business_profile_entitlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_profile_entitlements FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_profile_entitlements FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_profile_entitlements FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_profile_entitlements FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_profile_entitlements TO service_role;
-- No policy at all for anon/authenticated -- this is a purely internal, staff-attested commercial
-- record, never read directly by the client-facing profile or the owner dashboard. Every access
-- goes through the service-role admin client, gated by the grant_business_profile_entitlement
-- capability (staff writes) or referenced read-only inside publish_business_profile() below
-- (SECURITY DEFINER, so it can read this table even though authenticated has no grant on it).

COMMENT ON TABLE public.business_profile_entitlements IS
  'Staff-Created Business Profile pipeline -- business-level (not listing-level) commercial benefit record answering only "is business X authorized to publish its Business Profile." Never stores price/package name -- pricing stays in the existing Revenue OS tables. RLS enabled, zero client policies (staff-only via service-role, read internally by publish_business_profile()).';

-- =================================================================================================
-- C. publish_business_profile / unpublish_business_profile -- the ONLY path that can flip a
-- profile public. Enforces the existing commercial-entitlement truth -- EITHER (A) a verified
-- business_listing_links row pointing at a listing with an active listing_package_entitlements
-- row, OR (B) an active business_profile_entitlements row for this business_id directly (the
-- magazine/digital-package-only case, Gate 07) -- rather than fabricating a new pricing rule. If
-- neither path is satisfied, publication is truthfully refused.
-- =================================================================================================
CREATE OR REPLACE FUNCTION public.publish_business_profile(p_business_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_has_profile boolean;
  v_has_entitlement boolean;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'publish_business_profile requires an authenticated caller' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT public.is_active_business_member(p_business_id) THEN
    RAISE EXCEPTION 'not_a_member' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.business_profiles WHERE business_id = p_business_id) INTO v_has_profile;
  IF NOT v_has_profile THEN
    RAISE EXCEPTION 'profile_not_found' USING ERRCODE = 'raise_exception';
  END IF;

  SELECT
    EXISTS (
      SELECT 1
      FROM public.business_listing_links bll
      JOIN public.listing_package_entitlements lpe
        ON lpe.listing_source = bll.listing_source AND lpe.listing_id = bll.listing_id
      WHERE bll.business_id = p_business_id
        AND bll.status = 'verified'
        AND lpe.status = 'active'
        AND (lpe.ends_at IS NULL OR lpe.ends_at > now())
    )
    OR EXISTS (
      SELECT 1
      FROM public.business_profile_entitlements bpe
      WHERE bpe.business_id = p_business_id
        AND bpe.status = 'active'
        AND (bpe.expires_at IS NULL OR bpe.expires_at > now())
    )
  INTO v_has_entitlement;

  IF NOT v_has_entitlement THEN
    RAISE EXCEPTION 'no_active_entitlement' USING ERRCODE = 'raise_exception';
  END IF;

  UPDATE public.business_profiles
  SET status = 'published',
      published_at = now(),
      first_published_at = COALESCE(first_published_at, now()),
      updated_by_type = 'owner',
      updated_by_ref = v_caller::text,
      updated_at = now()
  WHERE business_id = p_business_id;

  RETURN p_business_id;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_business_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_business_profile(uuid) TO authenticated;

COMMENT ON FUNCTION public.publish_business_profile IS
  'Staff-Created Business Profile pipeline -- the sole path that can make a profile public. SECURITY DEFINER; requires an active membership AND (A) a verified business_listing_links row pointing at a listing with an active listing_package_entitlements row, OR (B) an active business_profile_entitlements row for this business directly. Raises no_active_entitlement (never fabricates a substitute commercial rule) when neither path is satisfied.';

CREATE OR REPLACE FUNCTION public.unpublish_business_profile(p_business_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'unpublish_business_profile requires an authenticated caller' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT public.is_active_business_member(p_business_id) THEN
    RAISE EXCEPTION 'not_a_member' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.business_profiles
  SET status = 'draft',
      updated_by_type = 'owner',
      updated_by_ref = v_caller::text,
      updated_at = now()
  WHERE business_id = p_business_id;

  RETURN p_business_id;
END;
$$;

REVOKE ALL ON FUNCTION public.unpublish_business_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unpublish_business_profile(uuid) TO authenticated;

COMMENT ON FUNCTION public.unpublish_business_profile IS
  'Staff-Created Business Profile pipeline -- lets an active member take a published profile back to draft (non-public) without losing its content. published_at/first_published_at history is preserved.';

-- =================================================================================================
-- D. get_public_business_profile -- the ONLY way an anonymous visitor reads anything about a
-- business. `businesses` and its identity child tables (business_contacts/
-- business_service_areas/business_digital_profiles/business_custom_links) intentionally carry NO
-- public SELECT policy (member-only, by design, per the existing Business Identity foundation) --
-- this migration does not add one. Instead this SECURITY DEFINER function returns a hand-picked,
-- already-privacy-filtered projection (contacts/custom links: visibility='public' rows only;
-- service areas: city/area-kind summary only, never the raw structured street address) for a
-- business that has an ACTIVE status AND a PUBLISHED business_profiles row. Anything else (a
-- draft profile, an archived/suspended business, an unknown slug) returns NULL.
-- =================================================================================================
CREATE OR REPLACE FUNCTION public.get_public_business_profile(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business record;
  v_profile record;
  v_result jsonb;
BEGIN
  SELECT id, display_name, public_name, slug, broad_business_type, specific_business_type,
         custom_specific_type, business_stage, primary_language, business_primary_language,
         business_additional_languages
    INTO v_business
    FROM public.businesses
    WHERE slug = p_slug AND status = 'active'
    LIMIT 1;

  IF v_business.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id, headline, short_description, about_description, logo_url, hero_image_url,
         gallery_images, featured_highlights, published_at, first_published_at
    INTO v_profile
    FROM public.business_profiles
    WHERE business_id = v_business.id AND status = 'published'
    LIMIT 1;

  IF v_profile.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'business', jsonb_build_object(
      'id', v_business.id,
      'displayName', v_business.display_name,
      'publicName', v_business.public_name,
      'slug', v_business.slug,
      'broadBusinessType', v_business.broad_business_type,
      'specificBusinessType', v_business.specific_business_type,
      'customSpecificType', v_business.custom_specific_type,
      'businessStage', v_business.business_stage,
      'primaryLanguage', v_business.primary_language,
      'businessPrimaryLanguage', v_business.business_primary_language,
      'businessAdditionalLanguages', to_jsonb(v_business.business_additional_languages)
    ),
    'profile', jsonb_build_object(
      'headline', v_profile.headline,
      'shortDescription', v_profile.short_description,
      'aboutDescription', v_profile.about_description,
      'logoUrl', v_profile.logo_url,
      'heroImageUrl', v_profile.hero_image_url,
      'galleryImages', COALESCE(v_profile.gallery_images, '[]'::jsonb),
      'featuredHighlights', COALESCE(v_profile.featured_highlights, '[]'::jsonb),
      'publishedAt', v_profile.published_at,
      'firstPublishedAt', v_profile.first_published_at
    ),
    'contacts', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'contactType', c.contact_type, 'value', c.value, 'label', c.label, 'isPrimary', c.is_primary, 'channelKind', c.channel_kind
      ))
      FROM public.business_contacts c
      WHERE c.business_id = v_business.id AND c.visibility = 'public'
    ), '[]'::jsonb),
    'digitalProfiles', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('platform', d.platform, 'handleOrUrl', d.handle_or_url))
      FROM public.business_digital_profiles d
      WHERE d.business_id = v_business.id
    ), '[]'::jsonb),
    'customLinks', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('linkType', l.link_type, 'customLabel', l.custom_label, 'displayUrl', l.display_url, 'sortOrder', l.sort_order))
      FROM public.business_custom_links l
      WHERE l.business_id = v_business.id AND l.visibility = 'public'
    ), '[]'::jsonb),
    'serviceAreas', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('country', a.country, 'cityHint', a.city_hint, 'areaKind', a.area_kind, 'isPrimary', a.is_primary))
      FROM public.business_service_areas a
      WHERE a.business_id = v_business.id
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_business_profile(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_business_profile(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_business_profile(text) TO authenticated;

COMMENT ON FUNCTION public.get_public_business_profile IS
  'Staff-Created Business Profile pipeline -- the sole public-read path. Returns a hand-picked, already-privacy-filtered projection (public-visibility contacts/custom links only; service areas reduced to city/area-kind, never the raw structured street address) for an ACTIVE business with a PUBLISHED business_profiles row, or NULL otherwise. businesses and its identity child tables keep their existing member-only RLS unchanged -- no public policy was added to any of them.';

-- =================================================================================================
-- E. Feature flag -- reuses the existing business_identity_flags table/convention. Seeded ENABLED
-- (unlike business_ownership_claim's disabled-by-default seed): this is the immediate deliverable
-- for tomorrow's sales visits, not a staged rollout, but the emergency_disabled kill switch is
-- still wired through isBusinessProfileEnabled() if it ever needs to be pulled quickly.
-- =================================================================================================
INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES ('business_profile_builder', true, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;
