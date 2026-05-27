/**
 * Shared honest public monetization labels (Gate FINAL-MONETIZATION-VISIBILITY-STACK).
 * Pure — no DB, Stripe, or admin metadata.
 */

import { normalizePackageEntitlementTier, type PackageEntitlementTier } from "./packageEntitlements";
import {
  resolveListingVisibilityRank,
  type VisibilityRankSummary,
} from "./printDigitalVisibilityRank";

export type PublicMonetizationBadgeKey =
  | "destacado"
  | "patrocinado"
  | "leonix_advertiser"
  | "refrescado"
  | "verificado_leonix";

export type PublicMonetizationBadge = {
  key: PublicMonetizationBadgeKey;
  label: string;
};

export type PublicMonetizationListingInput = {
  category: string;
  package_entitlement_tier?: string | null;
  print_package_tier?: string | null;
  entitlement_starts_at?: string | null;
  entitlement_ends_at?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  republished_at?: string | null;
  leonix_verified?: boolean | null;
  id?: string | null;
  slug?: string | null;
  leonix_ad_id?: string | null;
};

const PRINT_TIERS = new Set<PackageEntitlementTier>([
  "premium",
  "full_page",
  "half_page",
  "quarter_page",
  "classified_print",
]);

function listingForRank(input: PublicMonetizationListingInput): Record<string, unknown> {
  return {
    id: input.id ?? null,
    slug: input.slug ?? null,
    leonix_ad_id: input.leonix_ad_id ?? null,
    package_entitlement_tier: input.package_entitlement_tier ?? null,
    print_package_tier: input.print_package_tier ?? input.package_entitlement_tier ?? null,
    starts_at: input.entitlement_starts_at ?? input.starts_at ?? null,
    ends_at: input.entitlement_ends_at ?? input.ends_at ?? null,
    republished_at: input.republished_at ?? null,
    category: input.category,
  };
}

/** Honest public labels — Verificado por Leonix is trust-only, not paid placement. */
export function getPublicMonetizationBadges(
  input: PublicMonetizationListingInput,
  lang: "es" | "en",
  rank?: VisibilityRankSummary,
): PublicMonetizationBadge[] {
  const resolvedRank =
    rank ??
    resolveListingVisibilityRank({
      category: input.category,
      listing: listingForRank(input),
    });
  const tier = normalizePackageEntitlementTier(input.package_entitlement_tier);
  const badges: PublicMonetizationBadge[] = [];

  if (resolvedRank.eligibleForDestacadosModule || resolvedRank.bucket === "premium_destacado_module") {
    badges.push({
      key: "destacado",
      label: lang === "en" ? "Featured" : "Destacado",
    });
    badges.push({
      key: "patrocinado",
      label: lang === "en" ? "Sponsored" : "Patrocinado",
    });
  }

  if (tier !== "none" && tier !== "unknown" && tier !== "digital_only" && PRINT_TIERS.has(tier)) {
    badges.push({
      key: "leonix_advertiser",
      label: lang === "en" ? "Leonix advertiser" : "Anunciante Leonix",
    });
  }

  const republishedAt = (input.republished_at ?? "").trim();
  if (republishedAt || resolvedRank.bucket === "republished") {
    badges.push({
      key: "refrescado",
      label: lang === "en" ? "Refreshed" : "Refrescado",
    });
  }

  if (input.leonix_verified === true) {
    badges.push({
      key: "verificado_leonix",
      label: lang === "en" ? "Verified by Leonix" : "Verificado por Leonix",
    });
  }

  const seen = new Set<PublicMonetizationBadgeKey>();
  return badges.filter((b) => {
    if (seen.has(b.key)) return false;
    seen.add(b.key);
    return true;
  });
}
