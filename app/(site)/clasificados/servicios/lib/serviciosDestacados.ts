/**
 * Gate G2B-SERVICIOS-STACK — Servicios Destacados / Patrocinados module helpers (pure).
 *
 * Rows must already have public-safe active entitlement overlay applied.
 * Does not fetch DB, expose admin metadata, or add Stripe/payment logic.
 */

import { getPublicMonetizationBadges, type PublicMonetizationBadge } from "@/app/lib/listingPlans/publicMonetizationBadges";
import { normalizePackageEntitlementTier, type PackageEntitlementTier } from "@/app/lib/listingPlans/packageEntitlements";
import {
  isServiciosRowDestacadoEligible,
  resolveServiciosListingRank,
} from "./serviciosVisibilityRanking";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";

export type ServiciosDestacadoDisplayMode = "hero" | "duo" | "grid" | "compact";

export type ServiciosPublicMonetizationBadge = PublicMonetizationBadge;

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

export function getServiciosDestacadoDisplayMode(count: number): ServiciosDestacadoDisplayMode {
  if (count <= 1) return "hero";
  if (count === 2) return "duo";
  if (count <= 4) return "grid";
  return "compact";
}

function placementPriorityForRow(row: ServiciosPublicListingRow): number {
  const stored = row.entitlement_digital_placement_priority;
  if (typeof stored === "number" && Number.isFinite(stored)) return stored;
  return FALLBACK_PLACEMENT_PRIORITY;
}

function tierSortWeight(row: ServiciosPublicListingRow): number {
  const tier = normalizePackageEntitlementTier(row.package_entitlement_tier);
  return TIER_SORT[tier] ?? 0;
}

export function compareServiciosDestacadosRows(
  a: ServiciosPublicListingRow,
  b: ServiciosPublicListingRow,
): number {
  const placementCmp = placementPriorityForRow(a) - placementPriorityForRow(b);
  if (placementCmp !== 0) return placementCmp;
  const tierCmp = tierSortWeight(b) - tierSortWeight(a);
  if (tierCmp !== 0) return tierCmp;
  return 0;
}

export function getServiciosDestacadosRows(rows: ServiciosPublicListingRow[]): ServiciosPublicListingRow[] {
  const eligible = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => isServiciosRowDestacadoEligible(row));

  eligible.sort((a, b) => {
    const cmp = compareServiciosDestacadosRows(a.row, b.row);
    if (cmp !== 0) return cmp;
    return a.index - b.index;
  });

  return eligible.map(({ row }) => row);
}

/** Honest public labels for result cards — no payment/sales/admin data. */
export function getServiciosPublicMonetizationBadges(
  row: ServiciosPublicListingRow,
  lang: "es" | "en",
): ServiciosPublicMonetizationBadge[] {
  return getPublicMonetizationBadges(
    {
      category: "servicios",
      id: row.id ?? null,
      slug: row.slug,
      leonix_ad_id: row.leonix_ad_id ?? null,
      package_entitlement_tier: row.package_entitlement_tier ?? null,
      entitlement_starts_at: row.entitlement_starts_at ?? null,
      entitlement_ends_at: row.entitlement_ends_at ?? null,
      republished_at: row.republished_at ?? null,
      leonix_verified: row.leonix_verified === true,
    },
    lang,
    resolveServiciosListingRank(row),
  );
}

export function serviciosListingDetailHref(row: ServiciosPublicListingRow, lang: "es" | "en"): string {
  return `/clasificados/servicios/${encodeURIComponent(row.slug)}?lang=${lang}`;
}
