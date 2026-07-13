import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { isListingRowActiveAndPublishedForBrowse } from "@/app/(site)/clasificados/lib/listingPublicBrowseEligibility";
import { listingsQueryWithSelectShrink } from "@/app/(site)/clasificados/lib/listingsSelectShrink";
import type { BrNegocioListing } from "../resultados/cards/listingTypes";
import { mapBrListingRowToNegocioCard, type BrListingDbRow } from "../resultados/lib/mapBrListingRowToCard";

/** Baseline columns — safe if optional timestamp columns are missing in an older DB. */
const BR_LISTINGS_SELECT_BASE =
  "id, title, description, city, price, is_free, images, detail_pairs, listing_json, profile_json, contact_json, seller_type, business_name, owner_id, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role, created_at, status, is_published";

/** Rich timestamps for `reciente` / republish fairness (`mapBrListingRowToNegocioCard`). */
const BR_LISTINGS_SELECT_RICH = `${BR_LISTINGS_SELECT_BASE}, updated_at, published_at, republish_sort_at, republished_at`;

/**
 * Deferred: Optional monetization/placement fields for future highlighted/featured badges.
 * These fields do not currently exist in the listings table.
 * When added via migration, they can be safely selected here using shrink-safe strategy.
 * Fields to add in future:
 * - package_tier, package_key, package_entitlement_id
 * - placement_tier, placement_tier_key
 * - is_featured, featured_until
 * - is_promoted, promoted_until
 * - is_verified, verified_at
 */

export type FetchBrPublishedListingsResult = {
  listings: BrNegocioListing[];
  error: string | null;
};

/**
 * Active, published `listings` rows for category `bienes-raices` (browser client + user session).
 * Mirrors `BienesRaicesResultsClient` live query contract.
 */
export async function fetchBrPublishedListingsForBrowse(opts: {
  lang: "es" | "en";
  limit?: number;
}): Promise<FetchBrPublishedListingsResult> {
  const limit = opts.limit ?? 80;
  try {
    const sb = createSupabaseBrowserClient();
    let data: unknown[] | null = null;
    let error: { message: string } | null = null;
    const rich = await listingsQueryWithSelectShrink(BR_LISTINGS_SELECT_RICH, async (cols) => {
      const res = await sb
        .from("listings")
        .select(cols)
        .eq("category", "bienes-raices")
        .eq("is_published", true)
        .eq("status", "active")
        .order("republish_sort_at", { ascending: false, nullsFirst: true })
        .limit(limit);
      return { data: res.data as unknown[] | null, error: res.error ? { message: res.error.message } : null };
    });
    if (rich.error) {
      const base = await listingsQueryWithSelectShrink(BR_LISTINGS_SELECT_BASE, async (cols) => {
        const res = await sb
          .from("listings")
          .select(cols)
          .eq("category", "bienes-raices")
          .eq("is_published", true)
          .eq("status", "active")
          .limit(limit);
        return { data: res.data as unknown[] | null, error: res.error ? { message: res.error.message } : null };
      });
      data = base.data as unknown[] | null;
      error = base.error ? { message: base.error.message } : null;
    } else {
      data = rich.data as unknown[] | null;
    }
    if (error) {
      return { listings: [], error: error.message };
    }
    const rows = (data ?? []) as BrListingDbRow[];
    const mapped = rows
      .filter((r) => isListingRowActiveAndPublishedForBrowse(r))
      .map((r) => mapBrListingRowToNegocioCard(r, opts.lang));
    return { listings: mapped, error: null };
  } catch (e) {
    return { listings: [], error: e instanceof Error ? e.message : String(e) };
  }
}
