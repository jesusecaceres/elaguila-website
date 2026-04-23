/**
 * How sample jobs surface across landing, results, and detail.
 * Replace `EMPLEOS_JOB_CATALOG` + flags with API projections later; keep function names stable.
 *
 * ## Policy (fairness + advertiser value)
 *
 * **Recent (`recent=1` on results / “últimos” on landing)**  
 * Chronological fairness: only jobs with `publishedAt` within the last 7 days (see `empleosResultsQuery`).  
 * Landing “Últimos empleos” uses `showOnLandingRecent` as a curated subset of that pool for layout — not pay-to-rank.
 *
 * **Featured strip (landing)**  
 * Editorial + paid inventory mix: `showOnLandingFeatured` marks rows allowed in the hero strip.  
 * Not every paid listing need appear there; Leonix can reserve slots for quality and category balance.
 *
 * **Listing tiers on cards (`listingTier`)**  
 * - `standard` — baseline organic placement.  
 * - `featured` — elevated visibility (curated / included placement).  
 * - `promoted` — stronger paid/merchandised visibility.  
 * Relevance sort weights tier then recency; **date** and **salary** sorts do not reorder by payment — users can see everyone fairly.
 *
 * **Verified / premium employer**  
 * Trust and business signals (`verifiedEmployer`, `premiumEmployer`) affect badges and optional filters — they **do not** auto-bury unpaid listings in default relevance order beyond transparent tier weighting above.
 */

import { EMPLEOS_JOB_CATALOG } from "../data/empleosSampleCatalog";
import type { EmpleosJobRecord } from "../data/empleosJobTypes";

/** Editorial / paid spotlight strip on the category landing page. */
export function getLandingFeaturedJobs(): EmpleosJobRecord[] {
  return EMPLEOS_JOB_CATALOG.filter((j) => j.showOnLandingFeatured);
}

/** “Últimos empleos” strip — newest sample rows selected for the landing layout. */
export function getLandingRecentJobs(): EmpleosJobRecord[] {
  return EMPLEOS_JOB_CATALOG.filter((j) => j.showOnLandingRecent).sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
}

/** Stronger card chrome: featured vs promoted vs standard (sample tier → future paid flags). */
export function empleosListingVisualTier(job: EmpleosJobRecord): "featured" | "promoted" | "standard" {
  if (job.listingTier === "promoted") return "promoted";
  if (job.listingTier === "featured") return "featured";
  return "standard";
}

/** Trust / business overlays shown on cards and detail (sample booleans → future verification). */
export function empleosEmployerTrustFlags(job: EmpleosJobRecord): { verified: boolean; premium: boolean } {
  return { verified: job.verifiedEmployer, premium: job.premiumEmployer };
}
