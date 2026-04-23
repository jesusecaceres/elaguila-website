/**
 * Empleos — public ranking / fairness policy (landing + results).
 *
 * **Results (`EmpleosResultsView` + `sortEmpleosJobs`)**
 * - Filtered set is whatever `filterEmpleosJobs` returns from persisted `EmpleosJobRecord` rows (plus marketing seed when policy allows).
 * - **Relevance sort:** promoted tier first, then featured, then standard; ties break on `publishedAt` descending.
 * - **Date / salary sorts:** apply only within the filtered set (no tier override) so candidates can see true recency or comp.
 * - **Featured strip cap:** at most `EMPLEOS_RESULTS_FEATURED_STRIP_MAX` promoted/featured cards render in the upper “Destacados” block.
 *   Additional promoted/featured matches stay in the main list in the same global order as `filtered`, so paid tiers cannot occupy
 *   the entire viewport ahead of every standard listing.
 *
 * **Landing (live inventory mode)**
 * - `mapEmpleosLiveToFeaturedLanding` prefers promoted/featured rows, then falls back to any live row so the strip is never pure marketing seed.
 * - Recent strip is `publishedAt` descending.
 *
 * **Renew / republish / paid “refresh”**
 * - There is **no** separate renew SKU or automatic ranking bump in this repo. Owner/admin lifecycle APIs may set `published` again
 *   from paused/archived where business rules allow; that is not a hidden SEO loop—document honestly in product copy when shipping billing.
 *
 * **Radius / geo**
 * - `radiusKm` is accepted in the URL contract but **not** applied as a hard filter until lat/lng + backend geo exist (`empleosResultsQuery.ts`).
 */

export const EMPLEOS_RESULTS_FEATURED_STRIP_MAX = 8;
