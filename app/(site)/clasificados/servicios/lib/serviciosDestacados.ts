/**
 * Gate G2B-SERVICIOS-STACK — Servicios Destacados / Patrocinados module helpers (pure).
 *
 * Rows must already have public-safe active entitlement overlay applied.
 * Does not fetch DB, expose admin metadata, or add Stripe/payment logic.
 */

import { normalizePackageEntitlementTier, type PackageEntitlementTier } from "@/app/lib/listingPlans/packageEntitlements";
import {
  isServiciosRowDestacadoEligible,
  resolveServiciosListingRank,
} from "./serviciosVisibilityRanking";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";

export type ServiciosDestacadoDisplayMode = "hero" | "duo" | "grid" | "compact";

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

/**
 * Compare two Servicios rows for Destacados module ordering.
 * Lower placement priority sorts first; then higher tier; stable tie = 0.
 */
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

/**
 * Filter rows eligible for the Destacados module and sort by placement + tier.
 * Preserves stable order on ties via original index.
 */
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

export type ServiciosPublicMonetizationBadge = {
  key: "destacado" | "patrocinado" | "leonix_advertiser" | "refrescado";
  label: string;
};

/** Honest public labels for result cards — no payment/sales/admin data. */
export function getServiciosPublicMonetizationBadges(
  row: ServiciosPublicListingRow,
  lang: "es" | "en",
): ServiciosPublicMonetizationBadge[] {
  const badges: ServiciosPublicMonetizationBadge[] = [];
  const rank = resolveServiciosListingRank(row);
  const tier = normalizePackageEntitlementTier(row.package_entitlement_tier);

  if (rank.eligibleForDestacadosModule || rank.bucket === "premium_destacado_module") {
    badges.push({
      key: "destacado",
      label: lang === "en" ? "Featured" : "Destacado",
    });
    badges.push({
      key: "patrocinado",
      label: lang === "en" ? "Sponsored" : "Patrocinado",
    });
  }

  const printTiers = new Set<PackageEntitlementTier>([
    "premium",
    "full_page",
    "half_page",
    "quarter_page",
    "classified_print",
  ]);
  if (tier !== "none" && tier !== "unknown" && tier !== "digital_only" && printTiers.has(tier)) {
    badges.push({
      key: "leonix_advertiser",
      label: lang === "en" ? "Leonix advertiser" : "Anunciante Leonix",
    });
  }

  const republishedAt = row.republished_at?.trim();
  if (republishedAt || rank.bucket === "republished") {
    badges.push({
      key: "refrescado",
      label: lang === "en" ? "Refreshed" : "Refrescado",
    });
  }

  const seen = new Set<string>();
  return badges.filter((b) => {
    if (seen.has(b.key)) return false;
    seen.add(b.key);
    return true;
  });
}

export function serviciosListingDetailHref(row: ServiciosPublicListingRow, lang: "es" | "en"): string {
  return `/clasificados/servicios/${encodeURIComponent(row.slug)}?lang=${lang}`;
}
