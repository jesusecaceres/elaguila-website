/**
 * Client-side applicator for Bienes public entitlement overlay.
 * Pipeline: fetch listings → filter/search → overlay → ranking → render
 */
import type { BrListingBadge, BrNegocioListing } from "../resultados/cards/listingTypes";

export type BrPublicEntitlementBadge = {
  tier: string;
  startsAt: string;
  endsAt: string;
  grantsDestacado: boolean;
  grantsResultsPriority: boolean;
  digitalPlacementPriority: number | null;
  printPlacementType: string | null;
};

const TIER_RANK: Record<string, number> = {
  premium: 70,
  full_page: 60,
  half_page: 50,
  classified_print: 45,
  quarter_page: 40,
  digital_only: 30,
  none: 0,
  unknown: 0,
};

export function brEntitlementTierRank(tier: string | null | undefined): number {
  const t = String(tier ?? "").trim().toLowerCase();
  return TIER_RANK[t] ?? 0;
}

export function listingHasActiveBrSponsorship(listing: BrNegocioListing): boolean {
  return Boolean(listing.isSponsored) || listing.badges.includes("destacada") || listing.badges.includes("promocionada");
}

export function applyBrEntitlementBadgeToListing(
  listing: BrNegocioListing,
  badge: BrPublicEntitlementBadge | null | undefined,
): BrNegocioListing {
  if (!badge) {
    return {
      ...listing,
      isSponsored: false,
      packageEntitlementTier: undefined,
      entitlementEndsAt: undefined,
      digitalPlacementPriority: undefined,
    };
  }

  const badges: BrListingBadge[] = [...listing.badges.filter((b) => b !== "destacada" && b !== "promocionada")];
  if (badge.grantsDestacado && !badges.includes("destacada")) badges.push("destacada");
  if (badge.grantsResultsPriority && !badges.includes("promocionada")) badges.push("promocionada");
  // Print pool / half-page: show print partner badge as promocionada when active results_priority is false but print badge tier
  if (
    !badge.grantsDestacado &&
    !badge.grantsResultsPriority &&
    ["half_page", "quarter_page", "classified_print"].includes(badge.tier) &&
    !badges.includes("promocionada")
  ) {
    // Half/quarter do not get results priority — no sponsored results badge.
  }

  const isSponsored = badge.grantsDestacado || badge.grantsResultsPriority;

  return {
    ...listing,
    badges,
    isSponsored,
    packageEntitlementTier: badge.tier,
    entitlementEndsAt: badge.endsAt,
    digitalPlacementPriority: badge.digitalPlacementPriority,
    placementSignals: [
      ...(listing.placementSignals ?? []).filter((s) => !s.startsWith("entitlement:")),
      `entitlement:${badge.tier}`,
      isSponsored ? "sponsored:active" : "entitlement:active_no_priority",
    ],
    monetizationWarnings: (listing.monetizationWarnings ?? []).filter(
      (w) => !w.includes("Monetization placement fields"),
    ),
  };
}

/**
 * Fetch active Bienes entitlements for listing UUIDs and merge onto cards.
 * Fail-open: returns original listings if the overlay request fails.
 */
export async function overlayActiveEntitlementsOnBrListings(
  listings: BrNegocioListing[],
): Promise<BrNegocioListing[]> {
  if (listings.length === 0) return listings;
  try {
    const res = await fetch("/api/clasificados/bienes-raices/public/entitlement-overlay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingIds: listings.map((l) => l.id) }),
      cache: "no-store",
    });
    if (!res.ok) return listings;
    const json = (await res.json()) as {
      ok?: boolean;
      byListingId?: Record<string, BrPublicEntitlementBadge>;
    };
    const map = json.byListingId ?? {};
    return listings.map((l) => applyBrEntitlementBadgeToListing(l, map[l.id] ?? null));
  } catch {
    return listings;
  }
}

/** Compare two filtered listings for sponsored-first ranking (after filters). */
export function compareBrSponsoredRank(a: BrNegocioListing, b: BrNegocioListing): number {
  const aSponsored = listingHasActiveBrSponsorship(a) ? 1 : 0;
  const bSponsored = listingHasActiveBrSponsorship(b) ? 1 : 0;
  if (aSponsored !== bSponsored) return bSponsored - aSponsored;

  const tierDiff = brEntitlementTierRank(b.packageEntitlementTier) - brEntitlementTierRank(a.packageEntitlementTier);
  if (tierDiff !== 0) return tierDiff;

  const ap = typeof a.digitalPlacementPriority === "number" ? a.digitalPlacementPriority : 0;
  const bp = typeof b.digitalPlacementPriority === "number" ? b.digitalPlacementPriority : 0;
  if (ap !== bp) return bp - ap;

  return 0;
}
