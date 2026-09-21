-- =============================================================================
-- Gate QB-LIFECYCLE-02 — Quick Business lifecycle capability parity.
--
-- STATUS: AUTHORED, NOT APPLIED. This migration has deliberately NOT been run against any
-- remote Supabase project. Until it is applied, `quickBusinessLifecycleCapabilities.ts` reports
-- `unsupported_by_schema` for the two intents below and the customer doorway renders NO control
-- for them. That ordering is the point: shipping a control whose status value the database would
-- reject is exactly the "control that cannot perform its action" failure this gate exists to
-- prevent.
--
-- WHAT IT ADDS, AND WHY EACH IS SAFE:
--
-- 1. servicios_public_listings.listing_status += 'archived'
--    Servicios today has a real pause (`paused_unpublished`) but NO owner-facing end state; the
--    only terminal values are `rejected` and `suspended`, which are staff moderation semantics.
--    An owner asking to end their listing currently has nowhere to land.
--    Reader safety: the public directory filters `listing_status = 'published'`
--    (serviciosPublicListingsServer.ts) so an `archived` row is hidden automatically. NOTE the
--    one reader that must be updated in the SAME change as enabling the capability:
--    `SLUG_PAGE_STATUSES` in that file enumerates statuses a slug page will still render, and
--    `archived` must NOT be added there.
--
-- 2. restaurantes_public_listings.status += 'paused'
--    Restaurantes today has `archived` (a real end) but NO pause. `suspended` is staff
--    moderation and must not be repurposed as a customer pause.
--    Reader safety: every public query is `.eq("status","published")`
--    (restaurantesPublicListingsServer.ts), so a `paused` row is hidden automatically.
--    READERS THAT MUST BE UPDATED IN THE SAME CHANGE as enabling the capability — each of these
--    enumerates the four current values and several FAIL CLOSED on an unknown status:
--      - app/lib/clasificados/restaurantes/restauranteOwnerEditStatusAuthority.ts
--        (KNOWN_RESTAURANTE_STATUSES — fails closed, would REJECT owner edits of a paused row)
--      - app/lib/listingIdentity/restaurantesLifecycleAdapter.ts (status → lifecycle mapping)
--      - app/admin/_lib/publicationSemantics.ts (admin display semantics)
--
-- ROLLBACK: both changes are pure CHECK-constraint widenings. To reverse, restore the previous
-- constraint bodies shown in the `-- previous:` comments. A rollback fails only if rows already
-- hold a newly-added value, which is the correct safety behaviour — reclassify those rows first.
--
-- ORDER OF OPERATIONS TO ENABLE A CAPABILITY:
--   1. apply this migration
--   2. update the readers listed above
--   3. flip the matching entry in quickBusinessLifecycleCapabilities.ts to `supported`
--   4. add the action to the matching manage route's allowed-action list
-- =============================================================================

BEGIN;

-- 1. SERVICIOS — add an owner-facing archived state.
-- previous: check (listing_status in ('draft','preview_ready','publish_ready','pending_payment',
--                  'pending_review','published','paused_unpublished','rejected','suspended'))
ALTER TABLE public.servicios_public_listings
  DROP CONSTRAINT IF EXISTS servicios_public_listings_listing_status_chk;

ALTER TABLE public.servicios_public_listings
  ADD CONSTRAINT servicios_public_listings_listing_status_chk
  CHECK (listing_status IN (
    'draft',
    'preview_ready',
    'publish_ready',
    'pending_payment',
    'pending_review',
    'published',
    'paused_unpublished',
    'archived',
    'rejected',
    'suspended'
  ));

COMMENT ON CONSTRAINT servicios_public_listings_listing_status_chk
  ON public.servicios_public_listings IS
  'Gate QB-LIFECYCLE-02 added ''archived'' as the owner-facing end state. ''rejected'' and ''suspended'' remain staff-moderation-only and are never written by a customer control.';

-- 2. RESTAURANTES — add an owner-facing paused state.
-- previous: check (status in ('pending_payment','published','suspended','archived'))
-- NB: this family's constraint is named `_status_check` (not `_status_chk` like Servicios).
ALTER TABLE public.restaurantes_public_listings
  DROP CONSTRAINT IF EXISTS restaurantes_public_listings_status_check;

ALTER TABLE public.restaurantes_public_listings
  ADD CONSTRAINT restaurantes_public_listings_status_check
  CHECK (status IN (
    'pending_payment',
    'published',
    'paused',
    'archived',
    'suspended'
  ));

COMMENT ON CONSTRAINT restaurantes_public_listings_status_check
  ON public.restaurantes_public_listings IS
  'Gate QB-LIFECYCLE-02 added ''paused'' as the owner-facing pause state, distinct from ''suspended'' which remains staff moderation. Public reads filter status = ''published'', so a paused row is hidden with no reader change.';

-- PostgREST caches the schema (including CHECK constraint bodies it reports on violation).
-- Without this notify, the first write using a newly-permitted value after this migration is
-- applied can still be rejected against the cached definition until the pooler recycles. Safe to
-- run unconditionally and a no-op where PostgREST is not listening.
NOTIFY pgrst, 'reload schema';

COMMIT;
