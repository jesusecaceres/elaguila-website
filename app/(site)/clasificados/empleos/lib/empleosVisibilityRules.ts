/**
 * Phase 5 — rules for how sample jobs appear across landing, results, and detail.
 * Replace `EMPLEOS_JOB_CATALOG` + flags with API projections later; keep function names stable.
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
