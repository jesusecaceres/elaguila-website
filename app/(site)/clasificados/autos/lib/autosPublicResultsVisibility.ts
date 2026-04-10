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
