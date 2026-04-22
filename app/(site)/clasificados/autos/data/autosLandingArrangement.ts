import type { AutosPublicListing } from "./autosPublicSampleTypes";
import { compareNewestAutosPublic } from "@/app/lib/clasificados/autos/autosPublicRanking";

/**
 * Landing inventory bands — balances paid dealer visibility with predictable private presence.
 * See `AUTOS_RANKING_POLICY.md`.
 */

/** Featured dealers first, then other dealers by recency (private rows never appear here). */
export function getLandingDealerSpotlightListings(listings: AutosPublicListing[], max = 6): AutosPublicListing[] {
  const dealers = listings.filter((l) => l.sellerType === "dealer");
  const featured = dealers.filter((l) => l.featured);
  const rest = dealers.filter((l) => !l.featured).sort(compareNewestAutosPublic);
  return [...featured, ...rest].slice(0, max);
}

/** Non-featured private sellers, newest / most recently refreshed first. */
export function getLandingPrivateFreshListings(listings: AutosPublicListing[], max = 6): AutosPublicListing[] {
  return listings
    .filter((l) => l.sellerType === "private" && !l.featured)
    .sort(compareNewestAutosPublic)
    .slice(0, max);
}

/** Mixed remaining inventory after spotlight bands (no duplicate cards). */
export function getLandingMixedLatestListings(
  listings: AutosPublicListing[],
  excludeIds: ReadonlySet<string>,
  max = 8,
): AutosPublicListing[] {
  return listings
    .filter((l) => !excludeIds.has(l.id))
    .sort(compareNewestAutosPublic)
    .slice(0, max);
}
