/**
 * Package D Build D3, Gate 1 — shared server-side helper that resolves canonical placement
 * entitlement truth for a batch of listing rows and attaches a plain numeric rank weight, so each
 * category's own results loader/route can merge it into DEFAULT/RELEVANCE ordering without
 * duplicating the resolve-then-map boilerplate per category.
 *
 * This module is deliberately thin: it does not decide how a category merges the weight into its
 * own sort — that stays category-specific (see each category's own results loader). It only owns
 * "given real rows with a listingId, resolve which ones have an active canonical entitlement and
 * how much default-order weight that's worth."
 */
import "server-only";
import { resolveCanonicalPlacementSignalsForListings } from "./placementResolution";
import { placementSignalToDefaultRankWeight } from "./placementRankingAdapter";
import { VISIBILITY_RANK_WEIGHTS, type VisibilityRankBucket } from "./printDigitalVisibilityRank";
import { normalizePlacementTier } from "./placementEntitlements";

export async function resolveCanonicalPlacementRankWeights(
  rows: readonly { id: string }[],
  opts: { category: string; surface: string },
): Promise<Map<string, number>> {
  const ids = rows.map((r) => r.id).filter(Boolean);
  const result = new Map<string, number>();
  if (ids.length === 0) return result;

  const signals = await resolveCanonicalPlacementSignalsForListings({
    category: opts.category,
    listingIds: ids,
    surface: opts.surface,
  });
  for (const [listingId, signal] of signals) {
    result.set(listingId, placementSignalToDefaultRankWeight(signal));
  }
  return result;
}

/**
 * Same batch resolution as `resolveCanonicalPlacementRankWeights`, but maps each tier onto the
 * `printDigitalVisibilityRank.ts` bucket scale instead of the raw `PLACEMENT_TIER_RANK` scale — for
 * categories (Servicios, Restaurantes) whose default-order bucketing is keyed to that fixed
 * 9-value enum, so a canonical weight never falls outside the values those callers already expect.
 */
export async function resolveCanonicalVisibilityBucketWeights(
  rows: readonly { id: string }[],
  opts: { category: string; surface: string },
): Promise<Map<string, number>> {
  const ids = rows.map((r) => r.id).filter(Boolean);
  const result = new Map<string, number>();
  if (ids.length === 0) return result;

  const signals = await resolveCanonicalPlacementSignalsForListings({
    category: opts.category,
    listingIds: ids,
    surface: opts.surface,
  });
  for (const [listingId, signal] of signals) {
    result.set(listingId, placementTierToVisibilityRankWeight(signal.tier));
  }
  return result;
}

/**
 * Maps a canonical `PlacementTier` onto the EXISTING `printDigitalVisibilityRank.ts` bucket weight
 * scale (600/500/400/300/200/100/50/25/0), for categories (Servicios, Restaurantes) whose
 * default-order bucketing is keyed to that fixed 9-value enum. Never introduces a new bucket value
 * — a canonical tier with no natural bucket home (e.g. "free") maps to the existing "organic" weight
 * rather than inventing a 10th value, so downstream bucket-keyed logic (e.g. Servicios' fixed
 * `weightOrder` array) never silently drops a row.
 */
const TIER_TO_VISIBILITY_BUCKET: Record<string, VisibilityRankBucket> = {
  partner_premium: "premium_destacado_module",
  print_full_page: "full_page_print_priority",
  print_half_page: "print_advertiser_pool",
  print_quarter_page: "print_advertiser_pool",
  website_business: "digital_featured",
  paid_private: "digital_featured",
  affiliate: "organic",
  free: "organic",
};

export function placementTierToVisibilityRankWeight(tier: string | null | undefined): number {
  const normalized = normalizePlacementTier(tier);
  if (normalized === "unknown") return 0;
  const bucket = TIER_TO_VISIBILITY_BUCKET[normalized] ?? "organic";
  return VISIBILITY_RANK_WEIGHTS[bucket];
}
