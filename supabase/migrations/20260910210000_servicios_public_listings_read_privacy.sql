-- Gate SERVICIOS-P7-BLOCKER-REPAIR-01 — Repair C (SERVICIOS-ADDRESS-PRIVACY-1). Forward-only.
--
-- B5: `servicios_public_listings` had ONE read policy — `servicios_public_listings_select_public`,
-- USING (true), for every role — and Supabase grants table-level SELECT to anon/authenticated by
-- default. So anyone holding the PUBLIC anon key (it ships in every browser bundle) could read every
-- row in every status (pending_payment, paused, suspended, rejected), internal columns
-- (moderation_notes, suspended_reason, republish audit fields, owner_user_id) and the full
-- profile_json — including the exact street of an owner who chose "hide my exact address", because
-- that choice was honoured only when rendering.
--
-- This migration makes the database the privacy boundary:
--   (1) `private_contact` — service-role-only home for the exact-location fields (street, suite,
--       Google place id) of owners who hid them. The app writes it only for hidden-address saves.
--   (2) Row visibility — published rows for everyone; an authenticated owner also sees their OWN
--       rows in any status (the owner dashboard reads those directly with the user's session).
--   (3) Column exposure — anon gets only the public listing contract; authenticated additionally gets
--       owner_user_id (required to filter "my listings"). Neither gets moderation / suspension /
--       republish-audit fields or private_contact.
--   (4) Idempotent backfill — moves exact-location fields out of profile_json for any row whose owner
--       hid them. Zero rows qualify at authoring time; kept so the invariant holds whenever this is
--       applied. Re-runnable.
--
-- Unchanged: writes (no anon/authenticated INSERT/UPDATE/DELETE policy exists, so RLS keeps denying
-- them), the service role (bypasses RLS and keeps its own grants), and every server reader (all use
-- the service role). Browser readers verified against this contract: the Guardados dashboard selects
-- slug, leonix_ad_id, business_name, city, profile_json of published rows by id/leonix_ad_id/slug;
-- ownerEngagementListingKeys selects id, slug, leonix_ad_id of the owner's rows filtered by
-- owner_user_id / listing_status. Both stay within the grants below.

-- (1) Private exact-address record ----------------------------------------------------------------
ALTER TABLE public.servicios_public_listings ADD COLUMN IF NOT EXISTS private_contact jsonb;

COMMENT ON COLUMN public.servicios_public_listings.private_contact IS
  'Gate SERVICIOS-P7-BLOCKER-REPAIR-01 (B5) — exact-location contact fields (physicalStreet, physicalSuite, physicalProviderPlaceId) of an owner who chose to hide their exact address. Service-role only: never granted to anon/authenticated. Merged back only for the verified owner (my-listing API).';

-- (2) Row visibility ------------------------------------------------------------------------------
DROP POLICY IF EXISTS servicios_public_listings_select_public ON public.servicios_public_listings;

DROP POLICY IF EXISTS servicios_public_listings_select_published ON public.servicios_public_listings;
CREATE POLICY servicios_public_listings_select_published ON public.servicios_public_listings
  FOR SELECT TO anon, authenticated
  USING (listing_status = 'published');

DROP POLICY IF EXISTS servicios_public_listings_select_own ON public.servicios_public_listings;
CREATE POLICY servicios_public_listings_select_own ON public.servicios_public_listings
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

-- (3) Column exposure -----------------------------------------------------------------------------
REVOKE SELECT ON public.servicios_public_listings FROM anon, authenticated;

GRANT SELECT (
  id, slug, business_name, city, profile_json, leonix_verified, published_at, updated_at,
  internal_group, listing_status, republished_at, leonix_ad_id, promoted
) ON public.servicios_public_listings TO anon;

GRANT SELECT (
  id, slug, business_name, city, profile_json, leonix_verified, published_at, updated_at,
  internal_group, listing_status, republished_at, leonix_ad_id, promoted,
  owner_user_id
) ON public.servicios_public_listings TO authenticated;

-- (4) Idempotent backfill -------------------------------------------------------------------------
UPDATE public.servicios_public_listings
SET
  private_contact = COALESCE(private_contact, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
    'physicalStreet',          NULLIF(profile_json -> 'contact' ->> 'physicalStreet', ''),
    'physicalSuite',           NULLIF(profile_json -> 'contact' ->> 'physicalSuite', ''),
    'physicalProviderPlaceId', NULLIF(profile_json -> 'contact' ->> 'physicalProviderPlaceId', '')
  )),
  profile_json = jsonb_set(
    profile_json,
    '{contact}',
    (profile_json -> 'contact') - 'physicalStreet' - 'physicalSuite' - 'physicalProviderPlaceId'
  )
WHERE (profile_json -> 'contact' ->> 'showExactAddress') = 'false'
  AND (profile_json -> 'contact') ?| ARRAY['physicalStreet', 'physicalSuite', 'physicalProviderPlaceId'];
