-- Gate SERVICIOS-2 — generalizes the shared `saved_search_match_events` /
-- `saved_search_processing_failures` ledger to also accept Servicios (`servicios`) events.
--
-- Directly mirrors `20260819150000_saved_search_match_events_br_rentas.sql`, which performed the
-- identical widening for Bienes Raíces and Rentas. Additive/minimally-mutating only: no existing
-- row is rewritten, no table is replaced or dropped, no index or dedupe contract changes.
--
-- (1) CATEGORY GENERALIZATION
-- Canonical category identifier, confirmed directly against live source (not guessed):
--   servicios -> app/lib/saved-search/servicios/savedSearchServiciosAdapter.ts:
--                SAVED_SEARCH_SERVICIOS_CATEGORY
-- This is the same string the results page, the public reader and Revenue OS all use for this
-- lane (`category: "servicios"` in revenueCategoryCheckoutPayload.ts / revenueServiciosFulfillment.ts).
--
-- The `listing_id` FK was already dropped by the BR/Rentas migration and is deliberately NOT
-- re-added: Servicios listings live in their own `servicios_public_listings` table, a fourth
-- physical table a single REFERENCES clause still cannot point at. Referential truth stays at the
-- application layer — `runServiciosSavedSearchMatchOrchestration` re-certifies public eligibility
-- by reading the real row immediately before writing a match event
-- (`certifyServiciosPublicEligibleListing`), and the delivery engine re-certifies again before
-- sending, so a match event can never reference a listing that does not currently exist and is
-- not currently publicly eligible.
ALTER TABLE public.saved_search_match_events
  DROP CONSTRAINT IF EXISTS saved_search_match_events_category_check;
ALTER TABLE public.saved_search_match_events
  ADD CONSTRAINT saved_search_match_events_category_check
  CHECK (category IN ('autos', 'bienes-raices', 'rentas', 'servicios'));

ALTER TABLE public.saved_search_processing_failures
  DROP CONSTRAINT IF EXISTS saved_search_processing_failures_category_check;
ALTER TABLE public.saved_search_processing_failures
  ADD CONSTRAINT saved_search_processing_failures_category_check
  CHECK (category IN ('autos', 'bienes-raices', 'rentas', 'servicios'));

-- (2) SELLER-LANE VOCABULARY TRUTH
-- Following the same doctrine the BR/Rentas migration established: each category's own real
-- internal word is accepted rather than forcing a false uniformity. Existing accepted values are
-- 'negocios' (Autos) and 'negocio'/'privado' (BR, Rentas). Servicios' own live vocabulary is
-- 'business' | 'independent' — the exact return type of `inferServiciosSellerPresentation`
-- (app/(site)/clasificados/servicios/lib/serviciosSellerKind.ts), which is also the vocabulary its
-- public `seller` results filter uses. Rewriting the Servicios writer to say 'negocio'/'privado'
-- would misrepresent a distinction that category does not actually draw (Servicios' split is
-- storefront/website presence, not a business-vs-private sales lane).
ALTER TABLE public.saved_search_match_events
  DROP CONSTRAINT IF EXISTS saved_search_match_events_seller_lane_check;
ALTER TABLE public.saved_search_match_events
  ADD CONSTRAINT saved_search_match_events_seller_lane_check
  CHECK (
    seller_lane IS NULL
    OR seller_lane IN ('negocios', 'negocio', 'privado', 'business', 'independent')
  );

-- (3) DEDUPE CONTRACT — UNCHANGED, DELIBERATELY
-- (saved_search_id, listing_id, event_type) remains the sole dedupe key, for exactly the reason
-- the BR/Rentas migration documented: a `saved_search_id` already belongs to exactly one category,
-- so no cross-category collision this key could miss actually exists.
