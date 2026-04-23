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
 * **Landing (live inventory mode — curated discovery, not the full feed)**
 * - **Destacados:** small cap (`EMPLEOS_LANDING_FEATURED_MAX`); prefers promoted/featured for honest paid visibility, then may fall back to
 *   any live row only so the strip is not empty. Full inventory stays on **Resultados**.
 * - **Últimos empleos publicados:** chronological by `publishedAt` (newest first). **Not** pay-to-rank. When standard-tier listings exist,
 *   `mapEmpleosLiveToRecentLandingFair` reserves up to two slots for them so the strip is not exclusively paid tiers while still sorting the
 *   final row set by publish date.
 *
 * **Renew / republish / paid “refresh”**
 * - There is **no** separate renew SKU or automatic ranking bump in this repo. Owner/admin lifecycle APIs may set `published` again
 *   from paused/archived where business rules allow; that is not a hidden SEO loop—document honestly in product copy when shipping billing.
 *
 * **Radius / geo**
 * - `radiusKm` is accepted in the URL contract but **not** applied as a hard filter until lat/lng + backend geo exist (`empleosResultsQuery.ts`).
 */

export const EMPLEOS_RESULTS_FEATURED_STRIP_MAX = 8;

/** Max cards in the landing “Destacados / paid visibility” strip (results page uses `EMPLEOS_RESULTS_FEATURED_STRIP_MAX`). */
export const EMPLEOS_LANDING_FEATURED_MAX = 3;

/** Max rows in the landing “Últimos empleos publicados” list (chronological; see fairness mapper). */
export const EMPLEOS_LANDING_RECENT_MAX = 5;
