/**
 * Package D Build D2, Gate 2 — reusable ranking input/adapter.
 *
 * Bridges canonical placement truth (`placementResolution.ts` / `placementEntitlements.ts`) into a
 * ranking-comparable weight, so a category's DEFAULT/RELEVANCE discovery ordering can incorporate
 * placement without any category being forced to rewrite its own sorter in D2.
 *
 * Hard boundary (do not weaken): this module is never imported by a strict numeric sort comparator
 * (price ASC/DESC, salary, or any other explicit user-selected numeric order). It exists only for
 * default/relevance/featured discovery, where paid placement may legitimately influence ordering.
 * `printDigitalVisibilityRank.ts` remains the ranking engine of record where a category already
 * uses it — this adapter is additive, not a replacement.
 */
import type { ResolvedPlacementSignal } from "./placementResolution";
import { PLACEMENT_TIER_RANK, type PlacementTier } from "./placementEntitlements";

/**
 * Locked default placement group order (highest first), reusing the exact weights already defined
 * on `PLACEMENT_TIER_RANK` — no second competing table:
 *   1. partner_premium (800)   2. print_full_page (700)   3. print_half_page (600)
 *   4. print_quarter_page (500) 5. website_business (400)  6. paid_private (300)
 *   7. affiliate (200) / free (100) — affiliate ranks only per its actual granted tier, never
 *      magically outranked by its source; "free"/"community" always ranks last.
 */
export const PLACEMENT_GROUP_ORDER: readonly PlacementTier[] = [
  "partner_premium",
  "print_full_page",
  "print_half_page",
  "print_quarter_page",
  "website_business",
  "paid_private",
  "affiliate",
  "free",
];

/** Numeric weight for default/relevance ordering. No signal (no active entitlement) = 0, ranked
 * below every real placement tier and below organic content that has its own positive score. */
export function placementSignalToDefaultRankWeight(signal: ResolvedPlacementSignal | null | undefined): number {
  if (!signal) return 0;
  return PLACEMENT_TIER_RANK[signal.tier as PlacementTier] ?? 0;
}

export type PlacementAwareDefaultSortInput = {
  placementRankWeight: number;
  /** Truthful secondary signals already computed by the caller — never invented here. */
  verified?: boolean;
  republishedAtMs?: number | null;
  relevanceScore?: number;
};

/**
 * Compare two items for DEFAULT/RELEVANCE discovery only. Placement weight first, then verified,
 * then republish recency, then relevance score. Callers must NEVER route a strict price/salary/date
 * sort through this comparator — it is only for the "no explicit sort selected" / "featured" case.
 */
export function comparePlacementAwareDefaultOrder(
  a: PlacementAwareDefaultSortInput,
  b: PlacementAwareDefaultSortInput,
): number {
  const placementDiff = b.placementRankWeight - a.placementRankWeight;
  if (placementDiff !== 0) return placementDiff;

  if (Boolean(a.verified) !== Boolean(b.verified)) return a.verified ? -1 : 1;

  const aRep = a.republishedAtMs ?? 0;
  const bRep = b.republishedAtMs ?? 0;
  if (aRep !== bRep) return bRep - aRep;

  return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
}
