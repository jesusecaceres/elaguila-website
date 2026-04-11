/**
 * BR publish → discovery — honest readiness notes (demo vs live).
 *
 * Live path (staged): publish API → DB row `clasificados_bienes_raices` (or equivalent) with
 * `status=approved`, `published_at`, seller badges → API feeds `resultados` + landing bands.
 * Demo: `demoData.ts` + `brLaunchListingPolicy` simulate placement only.
 */

export const BR_PUBLISH_TO_DISCOVERY_STEPS = [
  "Seller completes publish flow → row persisted with `sellerType`, geo, price, attributes.",
  "Moderation approves → `published_at` set, row becomes `active`.",
  "Recientes: query `active` ORDER BY `published_at` DESC.",
  "Privado / Negocios: filter `sellerType` + `active`; Negocios eligible for spotlight cap.",
  "Destacadas: editorial/boost flags — not highest bidder only.",
  "Results: same filters as URL contract (`brFilterContract` + `filterBrListings`).",
] as const;

/** Detail pages: placeholder until `/clasificados/bienes-raices/[id]` is implemented. */
export const BR_DETAIL_ROUTE_READY = false;

export type BrLaunchVerdict = "READY" | "NOT_READY";

export const BR_LAUNCH_VERDICT: BrLaunchVerdict = "NOT_READY";

export const BR_LAUNCH_BLOCKERS: string[] = [
  "Listings are demo/sample data — replace with API + DB for production discovery.",
  "Listing detail route is not wired to real IDs.",
];

export const BR_DEMO_VS_LIVE = {
  landingBands: "demo arrays shaped by brLaunchListingPolicy",
  resultsGrid: "client-side filter over demo pool",
  publishPersistence: "staged — wire publish API → same contract fields",
} as const;
