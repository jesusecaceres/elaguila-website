/**
 * Restaurantes Print-to-Digital visibility ranking adapter (FINAL-MONETIZATION-VISIBILITY-STACK).
 */

import {
  compareVisibilityRank,
  resolveListingVisibilityRank,
  type VisibilityRankSummary,
} from "@/app/lib/listingPlans/printDigitalVisibilityRank";
import type { RestaurantesPublicBlueprintRow } from "../data/restaurantesPublicBlueprintData";

export function restaurantesBlueprintRowToEntitlementListing(
  row: RestaurantesPublicBlueprintRow,
): Record<string, unknown> {
  return {
    id: row.id,
    slug: row.slug,
    leonix_ad_id: row.leonixAdId ?? null,
    package_entitlement_tier: row.packageEntitlementTier ?? null,
    print_package_tier: row.packageEntitlementTier ?? row.packageTier ?? null,
    starts_at: row.entitlementStartsAt ?? null,
    ends_at: row.entitlementEndsAt ?? null,
    republished_at: row.republishedAt ?? null,
    category: "restaurantes",
  };
}

export function resolveRestaurantesListingRank(row: RestaurantesPublicBlueprintRow): VisibilityRankSummary {
  return resolveListingVisibilityRank({
    category: "restaurantes",
    listing: restaurantesBlueprintRowToEntitlementListing(row),
  });
}

export function applyRestaurantesVisibilityRanking(
  filteredRows: RestaurantesPublicBlueprintRow[],
): RestaurantesPublicBlueprintRow[] {
  const ranked = filteredRows.map((row, index) => ({
    row,
    rank: resolveRestaurantesListingRank(row),
    _originalIndex: index,
  }));

  ranked.sort((a, b) => {
    const cmp = compareVisibilityRank(a.rank, b.rank);
    if (cmp !== 0) return cmp;
    return a._originalIndex - b._originalIndex;
  });

  return ranked.map((r) => r.row);
}

export function isRestaurantesRowDestacadoEligible(row: RestaurantesPublicBlueprintRow): boolean {
  return resolveRestaurantesListingRank(row).eligibleForDestacadosModule;
}

export function isRestaurantesRowResultsPriority(row: RestaurantesPublicBlueprintRow): boolean {
  return resolveRestaurantesListingRank(row).eligibleForResultsPriority;
}
