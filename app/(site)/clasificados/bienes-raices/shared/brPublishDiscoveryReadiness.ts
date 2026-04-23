/**
 * BR publish → discovery — **code-path** readiness notes (source of truth: repo wiring).
 *
 * Live path today:
 * - Publish: `publishLeonixRealEstateListingCore` → `public.listings` (`category=bienes-raices`, `detail_pairs`, images, contact).
 * - Browse: `fetchBrPublishedListingsForBrowse` + `mapBrListingRowToNegocioCard` (landing + resultados).
 * - Detail: canonical live listing route under Clasificados (`leonixLiveAnuncioPath`) with `EnVentaAnuncioLayout` + `BrLiveFactsStrip` when `surface === "bienes-raices"`.
 * - Dev: `brShouldMergeDemoInventoryWithLive()` may merge demo cards with live rows in `next dev` only.
 *
 * **Runtime QA** (signed-in publish, admin session, inquiry clicks) is separate from this file — see `npm run verify:br` + `verify:br:catalog-smoke`.
 */

export const BR_PUBLISH_TO_DISCOVERY_STEPS = [
  "Seller completes publish flow → `listings` row with `detail_pairs` machine facets + images.",
  "Browse: `fetchBrPublishedListingsForBrowse` filters `category=bienes-raices`, `is_published=true`, `status=active`.",
  "Resultados: URL contract `parseBrResultsUrl` + `filterBrListings` on mapped `BrNegocioListing` rows.",
  "Landing: `buildBrLandingInventorySections` over the same browse pool; production avoids demo merge (`brPublicInventoryMode`).",
  "Detail: public anuncio layout + `BrLiveFactsStrip` for BR machine + branch summary.",
] as const;

/** Live detail is served via shared canonical listing route (not a BR-only `[id]` tree). */
export const BR_DETAIL_ROUTE_READY = true;

export type BrLaunchVerdict = "READY" | "NOT_READY";

/** Code-complete for publish→persist→browse→detail wiring; final go-live still needs human/runtime QA. */
export const BR_LAUNCH_VERDICT: BrLaunchVerdict = "READY";

/** Empty when no *code-level* launch wiring gaps are tracked here (runtime blockers use Gate 2/3). */
export const BR_LAUNCH_BLOCKERS: string[] = [];

export const BR_DEMO_VS_LIVE = {
  landingBands: "live pool + optional dev demo merge (`brShouldMergeDemoInventoryWithLive`)",
  resultsGrid: "`filterBrListings` over browse pool (URL-backed filters)",
  publishPersistence: "`listings` insert via `publishLeonixRealEstateListingCore`",
} as const;
