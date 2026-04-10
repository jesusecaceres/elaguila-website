/**
 * En Venta results browse surface — URL query contract (`/clasificados/en-venta/results`).
 * URL is the source of truth for filters, sort, view, and pagination.
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
  sort: "sort",
  view: "view",
  page: "page",
  /** Boosted / Pro-featured placements only (matches active `boost_expires`). */
  featured: "featured",
} as const;

export type EvResultsParamKey = (typeof EV_RESULTS_PARAM)[keyof typeof EV_RESULTS_PARAM];
