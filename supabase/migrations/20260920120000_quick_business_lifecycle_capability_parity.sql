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

-- -----------------------------------------------------------------------------
-- 3. PROVE THE WIDENING ACTUALLY TOOK EFFECT.
--
-- Both widenings above are `DROP CONSTRAINT IF EXISTS <one exact name>` followed by an `ADD`. That
-- is correct only while the deployed constraint carries the name written here — and the two
-- families genuinely differ (`_chk` for Servicios, `_status_check` for Restaurantes), which is how
-- fragile the assumption is. If a deployed constraint carries any other name, the `DROP ... IF
-- EXISTS` matches nothing, the old constraint SURVIVES alongside the new one, and both are
-- enforced: the migration reports success, the capability is switched on, and the first customer
-- who pauses their listing gets a check violation from a constraint nobody remembered.
--
-- Verified against a throwaway PostgreSQL 16: with the documented names the widening works; with a
-- differently-named constraint the migration still exits 0 and the new value is still rejected.
--
-- So the migration asserts its own post-condition. No row is written — this reads the constraint
-- definitions and refuses to commit if any CHECK on the status column would still reject the value
-- this gate exists to permit. A name mismatch becomes a loud, pre-commit failure instead of a dead
-- control in production.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_col text;
  v_tbl text;
  v_val text;
  v_con record;
  v_rejected boolean;
BEGIN
  -- EVALUATE THE CONSTRAINTS, DO NOT READ THEM.
  --
  -- The first version of this block matched constraint TEXT, and text matching was wrong in both
  -- directions. It aborted a perfectly good migration whenever the table carried any other check
  -- mentioning a column whose name merely ends in `status` (`payment_status = ANY (...)` contains
  -- the substring `status = ANY`), and it missed a surviving constraint written as
  -- `status = 'a' OR status = 'b'`, which is the dead-control outcome this block exists to
  -- prevent. Both measured against PostgreSQL 16.
  --
  -- So each SINGLE-COLUMN check on the status column is recreated on a one-column temporary table
  -- and the candidate value is inserted under a savepoint. That is a verdict, not a guess: IN,
  -- OR, ANY and single-value forms are all evaluated by the database itself. Multi-column checks
  -- (`published_at IS NULL OR status IN (...)`) are deliberately out of scope — they cannot reject
  -- the value on its own, so treating them as blocking is exactly the false positive above.
  FOREACH v_tbl IN ARRAY ARRAY['servicios_public_listings', 'restaurantes_public_listings'] LOOP
    v_col := CASE WHEN v_tbl = 'servicios_public_listings' THEN 'listing_status' ELSE 'status' END;
    v_val := CASE WHEN v_tbl = 'servicios_public_listings' THEN 'archived' ELSE 'paused' END;

    EXECUTE format('CREATE TEMP TABLE leonix_qb_probe (%I text)', v_col);
    FOR v_con IN
      SELECT c.conname, pg_catalog.pg_get_constraintdef(c.oid) AS def
        FROM pg_catalog.pg_constraint c
        JOIN pg_catalog.pg_attribute a
          ON a.attrelid = c.conrelid AND a.attname = v_col
       WHERE c.conrelid = ('public.' || v_tbl)::regclass
         AND c.contype = 'c'
         -- EXACTLY this one column, so the check stands or falls on the value alone.
         AND c.conkey = ARRAY[a.attnum]
    LOOP
      EXECUTE format('ALTER TABLE leonix_qb_probe ADD CONSTRAINT %I %s', v_con.conname, v_con.def);
    END LOOP;

    v_rejected := false;
    BEGIN
      EXECUTE format('INSERT INTO leonix_qb_probe (%I) VALUES (%L)', v_col, v_val);
    EXCEPTION WHEN check_violation THEN
      v_rejected := true;
    END;
    DROP TABLE leonix_qb_probe;

    IF v_rejected THEN
      RAISE EXCEPTION 'QB-LIFECYCLE-02: public.%.% still rejects %L after the widening — a differently-named CHECK constraint survived the DROP above, so the capability would be dead in production',
        v_tbl, v_col, v_val
        USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;
END $$;

-- PostgREST caches the schema (including CHECK constraint bodies it reports on violation).
-- Without this notify, the first write using a newly-permitted value after this migration is
-- applied can still be rejected against the cached definition until the pooler recycles. Safe to
-- run unconditionally and a no-op where PostgREST is not listening.
NOTIFY pgrst, 'reload schema';

COMMIT;
