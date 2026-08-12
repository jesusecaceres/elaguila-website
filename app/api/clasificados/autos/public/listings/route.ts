import { NextResponse } from "next/server";
import {
  isAutosClassifiedsDbConfigured,
  listActiveAutosClassifiedsRows,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { autosClassifiedsRowToPublicListing } from "@/app/lib/clasificados/autos/mapAutosClassifiedsToPublic";
import { fetchActiveListingPackageEntitlementsForRows } from "@/app/lib/listingPlans/listingPackageEntitlementsServer";
import {
  packageEntitlementGrantsDestacado,
  packageEntitlementGrantsResultsPriority,
  resolveListingPlacementEntitlement,
} from "@/app/lib/listingPlans/listingPackageEntitlementPlacement";
import { resolveCanonicalPlacementRankWeights } from "@/app/lib/listingPlans/placementResultsOverlay";

export const dynamic = "force-dynamic";

/**
 * Active Autos listings for landing, results, and filters (no sample fallback in API).
 * C5C: hydrates entitlement data to drive `featured` from active premium/full_page grants.
 */
export async function GET() {
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: true, listings: [], configured: false });
  }
  const rows = await listActiveAutosClassifiedsRows();

  const entitlementRows = rows.map((r) => ({
    id: r.id,
    slug: null as string | null,
    leonix_ad_id: r.leonix_ad_id,
  }));
  const lookup = await fetchActiveListingPackageEntitlementsForRows(entitlementRows, {
    category: "autos",
    listingSource: "autos_classifieds_listings",
  });

  let listings = rows.map((row) => {
    const pub = autosClassifiedsRowToPublicListing(row);
    const ent = lookup.byListingId.get(row.id) ?? (row.leonix_ad_id ? lookup.byListingId.get(row.leonix_ad_id) : null) ?? null;
    if (ent) {
      const summary = resolveListingPlacementEntitlement({
        category: "autos",
        listing: {
          id: row.id,
          leonix_ad_id: row.leonix_ad_id,
          package_entitlement_tier: ent.tier,
          starts_at: ent.startsAt,
          ends_at: ent.endsAt,
        },
      });
      if (packageEntitlementGrantsDestacado(summary) || packageEntitlementGrantsResultsPriority(summary)) {
        return { ...pub, featured: true };
      }
    }
    return pub;
  });

  // Package D Build D3, Gate 1 — canonical leonix_placement_entitlements weight, dealer lane only.
  // Autos Privado listings are never included in this lookup, so they can never receive a Dealer
  // placement benefit regardless of what canonical rows exist.
  const dealerListings = listings.filter((l) => l.sellerType === "dealer");
  if (dealerListings.length > 0) {
    const canonicalWeights = await resolveCanonicalPlacementRankWeights(dealerListings, {
      category: "autos",
      surface: "category_results",
    });
    if (canonicalWeights.size > 0) {
      listings = listings.map((l) => {
        const w = canonicalWeights.get(l.id);
        return w != null ? { ...l, canonicalPlacementRankWeight: w } : l;
      });
    }
  }

  return NextResponse.json({ ok: true, listings, configured: true });
}
