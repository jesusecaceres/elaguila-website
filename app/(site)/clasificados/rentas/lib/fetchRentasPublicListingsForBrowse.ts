/**
 * Server-side Rentas catalog: published `listings` rows only (no demo).
 * Uses the anon key — must match deployed RLS (see `supabase/migrations/20260421130001_listings_enable_rls_full_policies.sql`).
 * C5C: hydrates active entitlements (service role) to drive `promoted` from package grants.
 */

import { createClient } from "@supabase/supabase-js";
import { mapListingRowToRentasPublicListing } from "@/app/clasificados/rentas/data/mapListingRowToRentasPublicListing";
import { queryRentasBrowseListings } from "@/app/clasificados/rentas/lib/rentasListingPublicSelect";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import { fetchActiveListingPackageEntitlementsForRows } from "@/app/lib/listingPlans/listingPackageEntitlementsServer";
import {
  packageEntitlementGrantsDestacado,
  resolveListingPlacementEntitlement,
} from "@/app/lib/listingPlans/listingPackageEntitlementPlacement";
import { resolveCanonicalPlacementRankWeights } from "@/app/lib/listingPlans/placementResultsOverlay";

export async function fetchRentasPublicListingsForBrowse(lang: "es" | "en"): Promise<RentasPublicListing[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const sb = createClient(url, key);
  const { data, error } = await queryRentasBrowseListings(sb);

  if (error || !data?.length) return [];

  const rawRows = (data as Record<string, unknown>[]).filter(Boolean);

  const entitlementRows = rawRows.map((r) => ({
    id: r.id != null ? String(r.id).trim() : null,
    slug: null as string | null,
    leonix_ad_id: r.leonix_ad_id != null ? String(r.leonix_ad_id).trim() : null,
  }));
  const lookup = await fetchActiveListingPackageEntitlementsForRows(entitlementRows, {
    category: "rentas",
    listingSource: "listings",
  });

  const out: RentasPublicListing[] = [];
  for (const row of rawRows) {
    const id = row.id != null ? String(row.id).trim() : "";
    const leonixAdId = row.leonix_ad_id != null ? String(row.leonix_ad_id).trim() : "";
    const ent = lookup.byListingId.get(id) ?? (leonixAdId ? lookup.byListingId.get(leonixAdId) : null) ?? null;

    let enrichedRow = row;
    if (ent) {
      const summary = resolveListingPlacementEntitlement({
        category: "rentas",
        listing: {
          ...row,
          package_entitlement_tier: ent.tier,
          starts_at: ent.startsAt,
          ends_at: ent.endsAt,
        },
      });
      if (packageEntitlementGrantsDestacado(summary)) {
        enrichedRow = { ...row, admin_promoted: true };
      }
    }

    const m = mapListingRowToRentasPublicListing(enrichedRow, lang);
    if (m && m.browseActive !== false) out.push(m);
  }

  // Package D Build D3, Gate 1 — canonical leonix_placement_entitlements weight, batched.
  const canonicalWeights = await resolveCanonicalPlacementRankWeights(out, {
    category: "rentas",
    surface: "category_results",
  });
  if (canonicalWeights.size > 0) {
    return out.map((l) => {
      const w = canonicalWeights.get(l.id);
      return w != null ? { ...l, canonicalPlacementRankWeight: w } : l;
    });
  }
  return out;
}
