/**
 * Gate C5B — placement truth helpers (pure functions).
 * Public/dashboard surfaces must use active `listing_package_entitlements` data
 * merged onto listing rows (`package_entitlement_tier`, `starts_at`, `ends_at`).
 */

import {
  getPackageEntitlementBenefits,
  isPackageEntitlementActive,
  normalizePackageEntitlementTier,
  resolvePackageEntitlement,
  type PackageEntitlementSummary,
  type PackageEntitlementTier,
} from "./packageEntitlements";
import {
  compareVisibilityRank,
  resolveListingVisibilityRank,
  type VisibilityRankSummary,
} from "./printDigitalVisibilityRank";

export type ActiveListingPackageEntitlement = {
  tier: PackageEntitlementTier;
  startsAt: string;
  endsAt: string;
  listingId: string;
};

const TIER_RANK: Record<PackageEntitlementTier, number> = {
  premium: 70,
  full_page: 60,
  half_page: 50,
  classified_print: 45,
  quarter_page: 40,
  digital_only: 30,
  none: 0,
  unknown: 0,
};

export function isListingPackageEntitlementRowActive(row: {
  status?: string | null;
  revoked_at?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  now?: Date | string | number | null;
}): boolean {
  const status = String(row.status ?? "").trim().toLowerCase();
  if (status === "revoked" || row.revoked_at) return false;
  const startsAt = row.starts_at ?? row.startsAt ?? null;
  const endsAt = row.ends_at ?? row.endsAt ?? null;
  const active = isPackageEntitlementActive({ startsAt, endsAt, now: row.now ?? null });
  return active === true;
}

export function pickStrongestActiveEntitlement(
  rows: ActiveListingPackageEntitlement[],
): ActiveListingPackageEntitlement | null {
  let best: ActiveListingPackageEntitlement | null = null;
  let bestRank = -1;
  for (const r of rows) {
    const rank = TIER_RANK[r.tier] ?? 0;
    if (rank > bestRank) {
      bestRank = rank;
      best = r;
    }
  }
  return best;
}

export function mergeActiveEntitlementFieldsIntoListingRow<T extends Record<string, unknown>>(
  row: T,
  entitlement: ActiveListingPackageEntitlement | null,
): T {
  if (!entitlement) return row;
  return {
    ...row,
    package_entitlement_tier: entitlement.tier,
    entitlement_starts_at: entitlement.startsAt,
    entitlement_ends_at: entitlement.endsAt,
    starts_at: entitlement.startsAt,
    ends_at: entitlement.endsAt,
  };
}

export function resolveListingPlacementEntitlement(input: {
  category: string;
  listing?: Record<string, unknown> | null;
  now?: Date | string | number | null;
}): PackageEntitlementSummary {
  return resolvePackageEntitlement({
    category: input.category,
    listing: input.listing ?? null,
    now: input.now ?? null,
  });
}

/** Active premium contract → Destacado / Patrocinado modules (not legacy `isFeatured` alone). */
export function packageEntitlementGrantsDestacado(summary: PackageEntitlementSummary): boolean {
  if (summary.isActive !== true) return false;
  if (summary.tier !== "premium") return false;
  return summary.eligibleForDestacadosModule && summary.benefits.destacados_module === true;
}

/** Active full-page contract → priority sort without Destacado badge. */
export function packageEntitlementGrantsResultsPriority(summary: PackageEntitlementSummary): boolean {
  if (summary.isActive !== true) return false;
  return summary.eligibleForResultsPriority && summary.benefits.results_priority === true;
}

/** Active contract includes Nuestros Negocios / classified hub listing (Quarter Page excluded by default). */
export function packageEntitlementIncludesNuestrosNegocios(summary: PackageEntitlementSummary): boolean {
  if (summary.isActive !== true) return false;
  return summary.benefits.classified_listing === true;
}

export function listingPlacementVisibilityRank(input: {
  category: string;
  listing?: Record<string, unknown> | null;
  now?: Date | string | number | null;
}): VisibilityRankSummary {
  return resolveListingVisibilityRank({
    category: input.category,
    listing: input.listing ?? null,
    now: input.now ?? null,
  });
}

export function compareListingPlacementVisibility(
  a: VisibilityRankSummary,
  b: VisibilityRankSummary,
): number {
  return compareVisibilityRank(a, b);
}

export function listingPlacementTierLabel(tier: PackageEntitlementTier, lang: "en" | "es"): string {
  const def = getPackageEntitlementBenefits(tier);
  if (lang === "es") {
    switch (tier) {
      case "premium":
        return "Premium / Destacado";
      case "full_page":
        return "Página completa (prioridad)";
      case "half_page":
        return "Media página";
      case "quarter_page":
        return "Cuarto de página";
      case "classified_print":
        return "Solo Nuestros Negocios";
      case "digital_only":
        return "Digital";
      default:
        return def.label;
    }
  }
  return def.label;
}

/** Dev/QA inventory add-on metadata keys (admin grant / Stripe C6). */
export const BR_INVENTORY_ADDON_ENTITLEMENT_METADATA_KEY = "inventory_addon_br_properties";
export const AUTOS_INVENTORY_ADDON_ENTITLEMENT_METADATA_KEY = "inventory_addon_autos_vehicles";

export function entitlementMetadataHasInventoryAddon(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): boolean {
  if (!metadata || typeof metadata !== "object") return false;
  return metadata[key] === true || metadata[key] === "active";
}
