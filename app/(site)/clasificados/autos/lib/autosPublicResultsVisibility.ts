/**
 * Results lanes (featured / recent / main) — launch rules
 * ------------------------------------------------------
 * - **Featured band:** dealer rows with `featured: true`, capped (FEATURED_CAP). Not pay-to-win by itself:
 *   it is a *visibility band* for promoted dealer inventory; the main grid still lists private sellers and
 *   non-featured rows. Production should only set `featured` from real entitlement data.
 * - **Recent lane:** first N non-featured rows when sort is **newest** only, so “recent” matches user sort.
 *   Duplicates are removed from the main pool so cards do not appear twice.
 * - **Main grid:** everything else (standard pool minus recent-lane ids when recent lane is shown).
 * - **Private sellers:** never excluded from the main pool; landing featured row also tries to surface one
 *   private listing when the sample/API mix allows (`getLandingFeaturedRow`).
 *
 * This partition runs on **already filtered** listings; ranking beyond sort order is intentionally minimal
 * (fair tie-break / lane structure), not a full production search engine.
 */
import type { AutosPublicListing } from "../data/autosPublicSampleTypes";
import { getFeaturedDealerListings, getStandardListings } from "../data/sampleAutosPublicInventory";
import type { AutosPublicSortKey } from "../filters/autosPublicFilterTypes";

export type AutosResultsVisibilityModel = {
  /** Premium dealer band — controlled count, does not replace the full grid. */
  featuredDealerBand: AutosPublicListing[];
  /** Newest non-featured slice — only when sort is "newest" to match "recency" semantics. */
  recentLane: AutosPublicListing[];
  /** Main grid pool (non-featured, excluding recent lane duplicates). */
  mainGridPool: AutosPublicListing[];
};

const FEATURED_CAP = 4;
const RECENT_LANE_CAP = 4;

/**
 * Partitions filtered+sorted inventory into featured band, optional recent lane, and main grid.
 * Private listings are never removed from the main pool — only de-duplicated when shown in recent lane.
 */
export function partitionAutosResultsVisibility(
  sortedFiltered: AutosPublicListing[],
  sort: AutosPublicSortKey,
): AutosResultsVisibilityModel {
  const featuredDealerBand = getFeaturedDealerListings(sortedFiltered).slice(0, FEATURED_CAP);
  const standard = getStandardListings(sortedFiltered);

  const recentLane =
    sort === "newest" ? standard.slice(0, Math.min(RECENT_LANE_CAP, standard.length)) : [];

  const recentIds = new Set(recentLane.map((r) => r.id));
  const mainGridPool = recentLane.length > 0 ? standard.filter((l) => !recentIds.has(l.id)) : standard;

  return { featuredDealerBand, recentLane, mainGridPool };
}
