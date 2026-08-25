-- Package 1 (Gate 6) — Revenue OS canonical listing_source backfill + integrity protection.
--
-- CANONICAL SOURCE DOCTRINE (mirrors app/lib/listingPlans/revenueListingSourceResolver.ts —
-- keep both in sync if a category's canonical table is ever renamed):
--   autos                -> autos_classifieds_listings
--   bienes-raices         -> listings
--   rentas                -> listings
--   restaurantes          -> restaurantes_public_listings
--   servicios              -> servicios_public_listings
--   empleos                -> empleos_public_listings
--   ofertas-locales        -> ofertas_locales
--   viajes                 -> viajes_staged_listings
--   en-venta               -> listings
--   clases                 -> listings
--   comunidad              -> listings
--   mascotas-y-perdidos    -> listings
--   busco                  -> listings
--   comida-local           -> comida_local_public_listings
--
-- ROOT DEFECT THIS CLOSES: before this build, several Revenue OS write sites either wrote no
-- listing_source at all (checkout-originated and subscription-renewal-originated
-- leonix_payment_records rows), or wrote the bare category slug instead of the durable table
-- name (the generic listing_package_entitlements/leonix_subscription_records writers). Code
-- (Gate 3/4/5 of this same package) now writes the canonical value going forward. This migration
-- backfills EXISTING rows deterministically where the canonical value can be derived safely from
-- the row's own already-trustworthy `category` column, and otherwise leaves ambiguous rows
-- untouched for manual review — it never guesses.
--
-- ADDITIVE / NON-DESTRUCTIVE: no rows are deleted; no payment, entitlement, or subscription
-- history is removed. Every UPDATE below only ever narrows a NULL or a known-legacy-alias value
-- to its canonical equivalent; it never touches a row that already holds a value outside its
-- documented legacy-alias set (that would be a guess, not a backfill).
--
-- NOT APPLIED to any database by this migration file's presence in the repo — application is a
-- separate, later, explicitly-authorized step outside this build's scope (same doctrine as
-- 20260810120000_autos_br_negocio_capacity_activation_rpc.sql).

-- ── Step 1 — backfill NULL leonix_payment_records.listing_source from the row's own trustworthy
-- category column. Only categories with a proven, unambiguous canonical mapping are touched;
-- any category not listed here (or any row with category IS NULL) is left untouched.
UPDATE public.leonix_payment_records
   SET listing_source = CASE category
         WHEN 'autos' THEN 'autos_classifieds_listings'
         WHEN 'bienes-raices' THEN 'listings'
         WHEN 'rentas' THEN 'listings'
         WHEN 'restaurantes' THEN 'restaurantes_public_listings'
         WHEN 'servicios' THEN 'servicios_public_listings'
         WHEN 'empleos' THEN 'empleos_public_listings'
         WHEN 'ofertas-locales' THEN 'ofertas_locales'
         WHEN 'viajes' THEN 'viajes_staged_listings'
         WHEN 'en-venta' THEN 'listings'
         WHEN 'clases' THEN 'listings'
         WHEN 'comunidad' THEN 'listings'
         WHEN 'mascotas-y-perdidos' THEN 'listings'
         WHEN 'busco' THEN 'listings'
         WHEN 'comida-local' THEN 'comida_local_public_listings'
         ELSE NULL
       END
 WHERE listing_source IS NULL
   AND category IS NOT NULL
   AND category IN (
     'autos','bienes-raices','rentas','restaurantes','servicios','empleos','ofertas-locales',
     'viajes','en-venta','clases','comunidad','mascotas-y-perdidos','busco','comida-local'
   );

-- ── Step 2 — normalize the known bare-category-slug legacy alias to canonical on
-- listing_package_entitlements. Scoped to the exact categories previously proven (Gate 0/2) to
-- have been written under the bare-category alias by the generic entitlement writer; every other
-- existing value (including any value already canonical) is left untouched.
UPDATE public.listing_package_entitlements
   SET listing_source = CASE listing_source
         WHEN 'autos' THEN 'autos_classifieds_listings'
         WHEN 'bienes-raices' THEN 'listings'
         WHEN 'rentas' THEN 'listings'
         WHEN 'restaurantes' THEN 'restaurantes_public_listings'
         WHEN 'servicios' THEN 'servicios_public_listings'
         WHEN 'empleos' THEN 'empleos_public_listings'
         WHEN 'ofertas-locales' THEN 'ofertas_locales'
         WHEN 'viajes' THEN 'viajes_staged_listings'
         WHEN 'en-venta' THEN 'listings'
         WHEN 'clases' THEN 'listings'
         WHEN 'comunidad' THEN 'listings'
         WHEN 'mascotas-y-perdidos' THEN 'listings'
         WHEN 'busco' THEN 'listings'
         WHEN 'comida-local' THEN 'comida_local_public_listings'
         ELSE listing_source
       END
 WHERE listing_source IN (
   'autos','bienes-raices','rentas','restaurantes','servicios','empleos','ofertas-locales',
   'viajes','en-venta','clases','comunidad','mascotas-y-perdidos','busco','comida-local'
 );

-- ── Step 3 — same normalization on leonix_subscription_records (metadata.leonix_category-derived
-- listing_source, same legacy-alias class).
UPDATE public.leonix_subscription_records
   SET listing_source = CASE listing_source
         WHEN 'autos' THEN 'autos_classifieds_listings'
         WHEN 'bienes-raices' THEN 'listings'
         WHEN 'rentas' THEN 'listings'
         WHEN 'restaurantes' THEN 'restaurantes_public_listings'
         WHEN 'servicios' THEN 'servicios_public_listings'
         WHEN 'empleos' THEN 'empleos_public_listings'
         WHEN 'ofertas-locales' THEN 'ofertas_locales'
         WHEN 'viajes' THEN 'viajes_staged_listings'
         WHEN 'en-venta' THEN 'listings'
         WHEN 'clases' THEN 'listings'
         WHEN 'comunidad' THEN 'listings'
         WHEN 'mascotas-y-perdidos' THEN 'listings'
         WHEN 'busco' THEN 'listings'
         WHEN 'comida-local' THEN 'comida_local_public_listings'
         ELSE listing_source
       END
 WHERE listing_source IN (
   'autos','bienes-raices','rentas','restaurantes','servicios','empleos','ofertas-locales',
   'viajes','en-venta','clases','comunidad','mascotas-y-perdidos','busco','comida-local'
 );

-- ── Step 4 — future integrity protection on leonix_payment_records. A category/listing-scoped
-- payment record (listing_id IS NOT NULL) must carry a listing_source; a genuinely non-listing
-- commercial row (manual contract, print-only, campaign revenue with no listing — listing_id IS
-- NULL) is explicitly permitted to remain NULL. Added NOT VALID: existing rows are not
-- retroactively checked by this migration (Step 1 backfills what is safely derivable, but any
-- row left ambiguous by Step 1 must not block this migration from being authored/reviewed).
-- Validating the constraint (VALIDATE CONSTRAINT ...) against live data is a separate,
-- explicitly-authorized follow-up step once Step 1's backfill coverage is confirmed complete.
ALTER TABLE public.leonix_payment_records
  ADD CONSTRAINT leonix_payment_records_listing_source_required_when_listed
  CHECK (listing_id IS NULL OR listing_source IS NOT NULL) NOT VALID;

COMMENT ON COLUMN public.leonix_payment_records.listing_source IS
  'Canonical Revenue OS listing_source (see app/lib/listingPlans/revenueListingSourceResolver.ts). Required whenever listing_id is set; NULL is only valid for non-listing commercial rows (manual contract/print/campaign revenue with no listing). Written server-side only — never trust a client-supplied value.';

-- Diagnostic only (not enforced by this migration): rows where category is set but has no
-- canonical mapping above, or where listing_id is set but listing_source is still NULL after
-- Step 1, require manual review before the constraint above is validated. Example query for that
-- review (not executed here):
--   SELECT id, category, listing_id, listing_source, created_at
--     FROM public.leonix_payment_records
--    WHERE listing_id IS NOT NULL AND listing_source IS NULL;
