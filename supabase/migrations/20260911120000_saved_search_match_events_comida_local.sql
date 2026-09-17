-- Gate COMIDA-LOCAL-2 — generalizes the shared `saved_search_match_events` /
-- `saved_search_processing_failures` ledger to also accept Comida Local (`comida-local`) events.
--
-- Directly mirrors `20260819150000_saved_search_match_events_br_rentas.sql` (Autos -> +BR/Rentas),
-- `20260910120000_saved_search_match_events_servicios.sql` (+Servicios) and
-- `20260910180000_saved_search_match_events_restaurantes.sql` (+Restaurantes), which performed the
-- identical widening. Additive/minimally-mutating only: no existing row is rewritten, no table is
-- replaced or dropped, no index or dedupe contract changes.
--
-- (1) CATEGORY GENERALIZATION
-- Canonical category identifier, confirmed directly against live source (not guessed):
--   comida-local -> app/lib/saved-search/comida-local/savedSearchComidaLocalAdapter.ts:
--                   SAVED_SEARCH_COMIDA_LOCAL_CATEGORY
-- This is the same string the Revenue OS lane uses (`category: "comida-local"` in
-- revenueCategoryCheckoutPayload.ts), the same key `laneSuspensionSpecForCategory` was registered
-- under in Gate COMIDA-LOCAL-1, and the same slug the public route path uses.
--
-- The `listing_id` FK was already dropped by the BR/Rentas migration and is deliberately NOT
-- re-added: Comida Local listings live in their own `comida_local_public_listings` table, a sixth
-- physical table a single REFERENCES clause still cannot point at. Referential truth stays at the
-- application layer — `runComidaLocalSavedSearchMatchOrchestration` re-certifies public eligibility
-- by reading the real row immediately before writing a match event
-- (`certifyComidaLocalPublicEligibleListing`), and the delivery engine re-certifies again before
-- sending, so a match event can never reference a listing that does not currently exist and is not
-- currently publicly eligible.
ALTER TABLE public.saved_search_match_events
  DROP CONSTRAINT IF EXISTS saved_search_match_events_category_check;
ALTER TABLE public.saved_search_match_events
  ADD CONSTRAINT saved_search_match_events_category_check
  CHECK (category IN ('autos', 'bienes-raices', 'rentas', 'servicios', 'restaurantes', 'comida-local'));

ALTER TABLE public.saved_search_processing_failures
  DROP CONSTRAINT IF EXISTS saved_search_processing_failures_category_check;
ALTER TABLE public.saved_search_processing_failures
  ADD CONSTRAINT saved_search_processing_failures_category_check
  CHECK (category IN ('autos', 'bienes-raices', 'rentas', 'servicios', 'restaurantes', 'comida-local'));

-- (2) SELLER LANE — NO CHANGE NEEDED
-- Like Restaurantes, Comida Local draws no business-vs-private seller distinction: every listing is
-- a food seller (stand, pop-up, home kitchen, mobile vendor). Its orchestrator therefore writes
-- `seller_lane: null`, which the existing `seller_lane IS NULL OR ...` constraint already accepts.
-- No vocabulary is added here, because inventing one would misrepresent a distinction this category
-- does not make.
--
-- (3) DEDUPE CONTRACT — UNCHANGED, DELIBERATELY
-- (saved_search_id, listing_id, event_type) remains the sole dedupe key, for exactly the reason the
-- BR/Rentas migration documented: a `saved_search_id` already belongs to exactly one category, so
-- no cross-category collision this key could miss actually exists.
--
-- (4) `saved_searches.category` NEEDS NO WIDENING
-- Verified against `20260817120000_saved_searches_v1_reconcile.sql`: that table constrains
-- `category` only to NOT NULL / non-empty, with no value enum. Saving a `comida-local` search
-- requires no schema change at all.
