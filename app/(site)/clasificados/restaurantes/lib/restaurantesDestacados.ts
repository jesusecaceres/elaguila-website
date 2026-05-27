/**
 * Restaurantes Destacados / Patrocinados helpers (FINAL-MONETIZATION-VISIBILITY-STACK).
 */

import { getPublicMonetizationBadges, type PublicMonetizationBadge } from "@/app/lib/listingPlans/publicMonetizationBadges";
import { normalizePackageEntitlementTier, type PackageEntitlementTier } from "@/app/lib/listingPlans/packageEntitlements";
import type { RestaurantesPublicBlueprintRow } from "../data/restaurantesPublicBlueprintData";
import {
  isRestaurantesRowDestacadoEligible,
  resolveRestaurantesListingRank,
  restaurantesBlueprintRowToEntitlementListing,
} from "./restaurantesVisibilityRanking";

export type RestaurantesDestacadoDisplayMode = "hero" | "duo" | "grid" | "compact";

const TIER_SORT: Record<PackageEntitlementTier, number> = {
  premium: 70,
  full_page: 60,
  half_page: 50,
  classified_print: 45,
  quarter_page: 40,
  digital_only: 30,
  none: 0,
  unknown: 0,
};

const FALLBACK_PLACEMENT_PRIORITY = 9999;

export function getRestaurantesDestacadoDisplayMode(count: number): RestaurantesDestacadoDisplayMode {
  if (count <= 1) return "hero";
  if (count === 2) return "duo";
  if (count <= 4) return "grid";
  return "compact";
}

function placementPriorityForRow(row: RestaurantesPublicBlueprintRow): number {
  const stored = row.entitlementDigitalPlacementPriority;
  if (typeof stored === "number" && Number.isFinite(stored)) return stored;
  return FALLBACK_PLACEMENT_PRIORITY;
}

function tierSortWeight(row: RestaurantesPublicBlueprintRow): number {
  const tier = normalizePackageEntitlementTier(row.packageEntitlementTier);
  return TIER_SORT[tier] ?? 0;
}

export function compareRestaurantesDestacadosRows(
  a: RestaurantesPublicBlueprintRow,
  b: RestaurantesPublicBlueprintRow,
): number {
  const placementCmp = placementPriorityForRow(a) - placementPriorityForRow(b);
  if (placementCmp !== 0) return placementCmp;
  const tierCmp = tierSortWeight(b) - tierSortWeight(a);
  if (tierCmp !== 0) return tierCmp;
  return 0;
}

export function getRestaurantesDestacadosRows(
  rows: RestaurantesPublicBlueprintRow[],
): RestaurantesPublicBlueprintRow[] {
  const eligible = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => isRestaurantesRowDestacadoEligible(row));

  eligible.sort((a, b) => {
    const cmp = compareRestaurantesDestacadosRows(a.row, b.row);
    if (cmp !== 0) return cmp;
    return a.index - b.index;
  });

  return eligible.map(({ row }) => row);
}

export { restaurantesBlueprintRowToEntitlementListing } from "./restaurantesVisibilityRanking";

export function getRestaurantesPublicMonetizationBadges(
  row: RestaurantesPublicBlueprintRow,
  lang: "es" | "en",
): PublicMonetizationBadge[] {
  return getPublicMonetizationBadges(
    {
      category: "restaurantes",
      ...restaurantesBlueprintRowToEntitlementListing(row),
      leonix_verified: row.leonixVerified === true,
    },
    lang,
    resolveRestaurantesListingRank(row),
  );
}

export function restaurantesListingDetailHref(row: RestaurantesPublicBlueprintRow, lang: "es" | "en"): string {
  const slug = row.slug?.trim();
  if (!slug) return `/clasificados/restaurantes/resultados?lang=${lang}`;
  return `/clasificados/restaurantes/${encodeURIComponent(slug)}?lang=${lang}`;
}
