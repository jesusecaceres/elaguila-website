-- Saved Search 06 — generalizes the shared `saved_search_match_events` / `saved_search_processing_failures`
-- ledger beyond Autos to also accept Bienes Raíces (`bienes-raices`) and Rentas (`rentas`) events.
--
-- Additive/minimally-mutating only. No existing row is rewritten. No table is replaced or dropped.
--
-- (1) LISTING IDENTITY GENERALIZATION (Gate 10/11)
-- Autos listings live in their own `autos_classifieds_listings` table. Bienes Raíces and Rentas
-- listings both live in the SHARED `public.listings` table (confirmed by direct source read —
-- `fetchBrPublishedListingsForBrowse`, `rentasListingPublicSelect.ts` both query `.from("listings")`
-- filtered by `category`). A single `REFERENCES` clause cannot point at two different physical
-- tables depending on a sibling column's value, so `listing_id`'s Autos-only FK is dropped — NOT
-- replaced with a second/third FK, and NOT replaced with a fake/always-satisfied constraint.
--
-- Per Gate 11's explicitly sanctioned option: `listing_id` remains a plain `uuid`, `category`
-- identifies the source namespace, and referential truth is provided at the APPLICATION layer —
-- every orchestrator (Autos/BR/Rentas) re-certifies public eligibility by reading the real row
-- immediately before writing a match event (see `certifyAutosPublicEligibleListing`,
-- `certifyBienesRaicesPublicEligibleListing`, `certifyRentasPublicEligibleListing`), so a match
-- event can never be written for a listing id that doesn't genuinely, currently exist and is
-- currently publicly eligible. A stale FK to a single table would have been LESS safe here, not
-- more — it would have silently permitted BR/Rentas writes to reference an Autos-only table's ids.
ALTER TABLE public.saved_search_match_events
  DROP CONSTRAINT IF EXISTS saved_search_match_events_listing_id_fkey;

ALTER TABLE public.saved_search_processing_failures
  DROP CONSTRAINT IF EXISTS saved_search_processing_failures_listing_id_fkey;

-- (2) CATEGORY GENERALIZATION (Gate 12)
-- Canonical category identifiers, confirmed directly against live source (not guessed):
--   autos          -> app/lib/saved-search/autos/savedSearchAutosAdapter.ts: SAVED_SEARCH_AUTOS_CATEGORY
--   bienes-raices  -> listings.category live value, e.g. fetchBrPublishedListingsForBrowse.ts
--   rentas         -> listings.category live value, e.g. rentasListingPublicSelect.ts
ALTER TABLE public.saved_search_match_events
  DROP CONSTRAINT IF EXISTS saved_search_match_events_category_check;
ALTER TABLE public.saved_search_match_events
  ALTER COLUMN category DROP DEFAULT;
ALTER TABLE public.saved_search_match_events
  ADD CONSTRAINT saved_search_match_events_category_check
  CHECK (category IN ('autos', 'bienes-raices', 'rentas'));

ALTER TABLE public.saved_search_processing_failures
  DROP CONSTRAINT IF EXISTS saved_search_processing_failures_category_check;
ALTER TABLE public.saved_search_processing_failures
  ALTER COLUMN category DROP DEFAULT;
ALTER TABLE public.saved_search_processing_failures
  ADD CONSTRAINT saved_search_processing_failures_category_check
  CHECK (category IN ('autos', 'bienes-raices', 'rentas'));

-- (3) SELLER-LANE VOCABULARY TRUTH
-- Autos's existing rows/writer use 'negocios' (plural — confirmed in
-- autosSavedSearchMatchOrchestrator.ts: `seller_lane: certified.sellerType === "dealer" ?
-- "negocios" : "privado"`). BR and Rentas's own real, live vocabulary is 'negocio' (singular —
-- confirmed in both `getSellerKind()` (BR) and `branchToSeller()` (Rentas), both returning
-- "privado" | "negocio"). Neither term is invented; both are the category's own real internal
-- word. Rewriting either category's writer to match the other's spelling would misrepresent that
-- category's actual vocabulary, so the CHECK is widened to accept both real spellings rather than
-- forcing a false uniformity.
ALTER TABLE public.saved_search_match_events
  DROP CONSTRAINT IF EXISTS saved_search_match_events_seller_lane_check;
ALTER TABLE public.saved_search_match_events
  ADD CONSTRAINT saved_search_match_events_seller_lane_check
  CHECK (seller_lane IS NULL OR seller_lane IN ('negocios', 'negocio', 'privado'));

-- (4) DEDUPE CONTRACT — UNCHANGED, DELIBERATELY (Gate 24)
-- (saved_search_id, listing_id, event_type) remains the sole dedupe key. Widening it to include
-- `category` was considered and rejected as unnecessary: `saved_search_id` already uniquely
-- belongs to exactly one category (a saved search's own `category` column never changes across
-- categories), so two different categories can never legitimately share a `saved_search_id` in the
-- first place — there is no real collision this ledger could produce that adding `category` to the
-- key would prevent. Do not weaken or complicate dedupe for a risk that does not exist.

-- (5) EVENT-TYPE / STATUS / CLAIM RPC — UNCHANGED (Gate 19/25)
-- `event_type` stays 'listing_activated_match' only (BR/Rentas orchestrators use the exact same
-- activation-only semantics as Autos — no relisted/price_drop invention here either). `status`'s
-- pending/processing/delivered/failed/skipped set and `claim_saved_search_match_event` RPC are
-- already fully category-agnostic (they operate on `id` alone, never branch on category) — no
-- change required for BR/Rentas to use them safely.

COMMENT ON COLUMN public.saved_search_match_events.listing_id IS
  'Saved Search 06 — plain uuid, intentionally no FK. Autos listings live in '
  'autos_classifieds_listings; Bienes Raíces and Rentas listings both live in the shared '
  'public.listings table (discriminated by category). A single FK cannot reference both physical '
  'tables, so referential truth is enforced at the application layer: every orchestrator '
  're-certifies public eligibility from a real row read immediately before writing this column.';

COMMENT ON COLUMN public.saved_search_match_events.category IS
  'One of autos | bienes-raices | rentas — must match the identical string used by the '
  'corresponding saved_searches.category value and by that category''s own live listings.category '
  'convention.';
