/**
 * Gate G2-SERVICIOS — Servicios-specific Print-to-Digital visibility ranking adapter.
 *
 * Applies the shared ranking helper to **already-filtered** Servicios results.
 * Search/filter must run first; this only re-orders matching rows by visibility bucket.
 * Equal-rank rows preserve their existing order (stable sort).
 *
 * Does NOT inject unrelated listings, fetch admin metadata, or add Stripe/payment logic.
 */

import {
  resolveListingVisibilityRank,
  compareVisibilityRank,
  type VisibilityRankSummary,
  VISIBILITY_RANK_WEIGHTS,
} from "@/app/lib/listingPlans/printDigitalVisibilityRank";
import {
  resolveListingPlacementEntitlement,
} from "@/app/lib/listingPlans/listingPackageEntitlementPlacement";
import { getPackageEntitlementBenefits } from "@/app/lib/listingPlans/packageEntitlements";
import { serviciosPublicRowToEntitlementListing } from "./serviciosResultsFilter";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";

export type ServiciosRankedRow = {
  row: ServiciosPublicListingRow;
  rank: VisibilityRankSummary;
};

/**
 * Resolve visibility rank for a single Servicios listing row.
 * Safe if entitlement fields are missing — returns organic fallback with warnings.
 *
 * Package D Build D3, Gate 1 — `canonicalRankWeightByListingId` carries pre-resolved canonical
 * `leonix_placement_entitlements` weight (already mapped onto this file's own bucket scale via
 * `placementTierToVisibilityRankWeight`, server-side, batched — see the results page). When a real
 * canonical entitlement exists for this row's id, it wins over BOTH the legacy
 * `listing_package_entitlements` check below and the row-field `printDigitalVisibilityRank`
 * fallback, per the locked "canonical entitlement wins over legacy compatibility signals" rule.
 */
export function resolveServiciosListingRank(
  row: ServiciosPublicListingRow,
  canonicalRankWeightByListingId?: Map<string, number>,
): VisibilityRankSummary {
  const canonicalWeight = row.id ? canonicalRankWeightByListingId?.get(row.id) : undefined;
  if (canonicalWeight != null) {
    const bucket = (Object.entries(VISIBILITY_RANK_WEIGHTS).find(([, w]) => w === canonicalWeight)?.[0] ??
      "organic") as VisibilityRankSummary["bucket"];
    return {
      category: "servicios",
      bucket,
      rankWeight: canonicalWeight,
      label: "Canonical placement entitlement",
      reason: "Active leonix_placement_entitlements row for this listing.",
      source: "leonix_placement_entitlements",
      eligibleForResultsPriority: canonicalWeight >= VISIBILITY_RANK_WEIGHTS.full_page_print_priority,
      eligibleForDestacadosModule: canonicalWeight >= VISIBILITY_RANK_WEIGHTS.premium_destacado_module,
      searchFilterMustMatchFirst: true,
      warnings: [],
    };
  }

  const listing = serviciosPublicRowToEntitlementListing(row);
  const entitlement = resolveListingPlacementEntitlement({
    category: "servicios",
    listing,
  });
  if (entitlement.isActive === true && entitlement.tier !== "none" && entitlement.tier !== "unknown") {
    const def = getPackageEntitlementBenefits(entitlement.tier);
    const bucket = def.visibilityBucket;
    return {
      category: "servicios",
      bucket,
      rankWeight: VISIBILITY_RANK_WEIGHTS[bucket],
      label: def.label,
      reason: `Active package entitlement (${entitlement.tier})`,
      source: "listing_package_entitlements",
      eligibleForResultsPriority: def.eligibleForResultsPriority,
      eligibleForDestacadosModule: def.eligibleForDestacadosModule,
      searchFilterMustMatchFirst: true,
      warnings: [],
    };
  }
  return resolveListingVisibilityRank({
    category: "servicios",
    listing,
  });
}

/**
 * Apply Print-to-Digital visibility ranking to already-filtered Servicios results.
 *
 * 1. Resolves each row's visibility bucket via resolveListingVisibilityRank.
 * 2. Stable-sorts by compareVisibilityRank (higher rankWeight first).
 * 3. Tied rows keep their original array order (from prior sort/filter).
 *
 * Premium → Destacados module eligibility (not forced into normal results).
 * Full-page → above print pool/digital/republish/organic.
 * Organic → fallback when no entitlement fields are present.
 */
export function applyServiciosVisibilityRanking(
  filteredRows: ServiciosPublicListingRow[],
  canonicalRankWeightByListingId?: Map<string, number>,
): ServiciosPublicListingRow[] {
  const ranked: ServiciosRankedRow[] = filteredRows.map((row, index) => ({
    row,
    rank: resolveServiciosListingRank(row, canonicalRankWeightByListingId),
    _originalIndex: index,
  })) as (ServiciosRankedRow & { _originalIndex: number })[];

  ranked.sort((a, b) => {
    const cmp = compareVisibilityRank(a.rank, b.rank);
    if (cmp !== 0) return cmp;
    return (a as unknown as { _originalIndex: number })._originalIndex -
      (b as unknown as { _originalIndex: number })._originalIndex;
  });

  return ranked.map((r) => r.row);
}

/**
 * Check if a Servicios row is eligible for the Destacados module (Premium tier only).
 * Uses the shared ranking helper — does not rely on legacy isFeatured alone.
 */
export function isServiciosRowDestacadoEligible(row: ServiciosPublicListingRow): boolean {
  const rank = resolveServiciosListingRank(row);
  return rank.eligibleForDestacadosModule;
}

/**
 * Check if a Servicios row has results priority (Full-page tier).
 */
export function isServiciosRowResultsPriority(row: ServiciosPublicListingRow): boolean {
  const rank = resolveServiciosListingRank(row);
  return rank.eligibleForResultsPriority;
}
