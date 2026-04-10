import type { AutosPublicListing } from "../data/autosPublicSampleTypes";

/**
 * Fairness-oriented tie-breaker for browse sorts (scaffold — not a production ranker).
 * Slightly rewards freshness and completeness; light business signal does not dominate private listings.
 */
export function compareAutosListingFairTieBreak(a: AutosPublicListing, b: AutosPublicListing): number {
  return scoreAutosListingHeuristic(b) - scoreAutosListingHeuristic(a);
}

function scoreAutosListingHeuristic(l: AutosPublicListing): number {
  let s = l.year * 3;
  if (l.primaryImageUrl) s += 2;
  if ((l.badges?.length ?? 0) > 0) s += 1;
  if (l.sellerType === "dealer" && l.featured) s += 1.5;
  s -= Math.min(l.mileage / 60000, 4);
  return s;
}
