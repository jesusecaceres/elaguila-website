/**
 * En Venta results browse surface — URL query contract (`/clasificados/en-venta/results`).
 * URL is the source of truth for filters, sort, view, and pagination.
 *
 * Wiring: `EnVentaResultsClient.tsx` (state), `components/EnVentaResultsChipsRow.tsx` (active filters),
 * `components/EnVentaResultsListingSections.tsx` (promoted + catalog), `utils/enVentaLocationMatch.ts` (city/ZIP).
 */

export const EV_RESULTS_PARAM = {
  lang: "lang",
  q: "q",
  city: "city",
  zip: "zip",
  evDept: "evDept",
  evSub: "evSub",
  cond: "cond",
  priceMin: "priceMin",
  priceMax: "priceMax",
  pickup: "pickup",
  ship: "ship",
  delivery: "delivery",
  seller: "seller",
  /** Free listings only (`listings.is_free`). */
  free: "free",
  /** Negotiable / OBO (`Leonix:negotiable` or legacy text). */
  nego: "nego",
  /** Seller offers meetup (`Leonix:meetup` / Encuentro pair). */
  meetup: "meetup",
  sort: "sort",
  view: "view",
  page: "page",
  /** Boosted / Pro-featured placements only (matches active `boost_expires`). */
  featured: "featured",
} as const;

/** Listing detail query: `evReturn` = full `/clasificados/en-venta/results?...` path for back navigation (see `enVentaListingLinks.ts`). */
export const EV_LISTING_PARAM = {
  evReturn: "evReturn",
} as const;

export type EvResultsParamKey = (typeof EV_RESULTS_PARAM)[keyof typeof EV_RESULTS_PARAM];
