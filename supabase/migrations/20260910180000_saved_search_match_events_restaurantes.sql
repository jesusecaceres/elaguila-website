-- Gate RESTAURANTES-2 — generalizes the shared `saved_search_match_events` /
-- `saved_search_processing_failures` ledger to also accept Restaurantes (`restaurantes`) events.
--
-- Directly mirrors `20260819150000_saved_search_match_events_br_rentas.sql` (Autos -> +BR/Rentas)
-- and `20260910120000_saved_search_match_events_servicios.sql` (+Servicios), which performed the
-- identical widening. Additive/minimally-mutating only: no existing row is rewritten, no table is
-- replaced or dropped, no index or dedupe contract changes.
--
-- (1) CATEGORY GENERALIZATION
-- Canonical category identifier, confirmed directly against live source (not guessed):
--   restaurantes -> app/lib/saved-search/restaurantes/savedSearchRestaurantesAdapter.ts:
--                   SAVED_SEARCH_RESTAURANTES_CATEGORY
-- This is the same string the results filter, the public readers and Revenue OS all use for this
-- lane (`category: "restaurantes"` in revenueCategoryCheckoutPayload.ts /
-- revenueRestaurantFulfillment.ts).
--
-- The `listing_id` FK was already dropped by the BR/Rentas migration and is deliberately NOT
-- re-added: Restaurantes listings live in their own `restaurantes_public_listings` table, a fifth
-- physical table a single REFERENCES clause still cannot point at. Referential truth stays at the
-- application layer — `runRestaurantesSavedSearchMatchOrchestration` re-certifies public
-- eligibility by reading the real row immediately before writing a match event
-- (`certifyRestaurantesPublicEligibleListing`), and the delivery engine re-certifies again before
-- sending, so a match event can never reference a listing that does not currently exist and is not
-- currently publicly eligible.
ALTER TABLE public.saved_search_match_events
  DROP CONSTRAINT IF EXISTS saved_search_match_events_category_check;
ALTER TABLE public.saved_search_match_events
  ADD CONSTRAINT saved_search_match_events_category_check
  CHECK (category IN ('autos', 'bienes-raices', 'rentas', 'servicios', 'restaurantes'));

ALTER TABLE public.saved_search_processing_failures
  DROP CONSTRAINT IF EXISTS saved_search_processing_failures_category_check;
ALTER TABLE public.saved_search_processing_failures
  ADD CONSTRAINT saved_search_processing_failures_category_check
  CHECK (category IN ('autos', 'bienes-raices', 'rentas', 'servicios', 'restaurantes'));

-- (2) SELLER LANE — NO CHANGE NEEDED
-- Unlike Autos ('negocios'), BR/Rentas ('negocio'/'privado') and Servicios
-- ('business'/'independent'), Restaurantes draws no business-vs-private seller distinction: every
-- listing is a food business. Its orchestrator therefore writes `seller_lane: null`, which the
-- existing `seller_lane IS NULL OR ...` constraint already accepts. No vocabulary is added here,
-- because inventing one would misrepresent a distinction this category does not make.

-- (3) DEDUPE CONTRACT — UNCHANGED, DELIBERATELY
-- (saved_search_id, listing_id, event_type) remains the sole dedupe key, for exactly the reason the
-- BR/Rentas migration documented: a `saved_search_id` already belongs to exactly one category, so
-- no cross-category collision this key could miss actually exists.
