/**
 * BR-FINAL-PUBLISH-STRIPE-ROTATION-05 — other-client similar Bienes listings for public detail.
 * Excludes current listing, same inventory group, and same owner when possible.
 */

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { isListingRowActiveAndPublishedForBrowse } from "@/app/(site)/clasificados/lib/listingPublicBrowseEligibility";
import { listingsQueryWithSelectShrink } from "@/app/(site)/clasificados/lib/listingsSelectShrink";
import {
  getBrInventoryGroupId,
  isBrNegocioListing,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import { mapBrListingRowToNegocioCard, type BrListingDbRow } from "../resultados/lib/mapBrListingRowToCard";
import { extractBrFacetsFromDetailPairs } from "../resultados/lib/brFacetFromDetailPairs";
import type { BrNegocioListing } from "../resultados/cards/listingTypes";

const SIMILAR_SELECT =
  "id, title, description, city, price, is_free, images, detail_pairs, listing_json, contact_json, seller_type, business_name, owner_id, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role, status, is_published, created_at";

export type BrSimilarOtherClientFetchArgs = {
  currentListingId: string;
  excludeGroupId?: string | null;
  excludeOwnerId?: string | null;
  city?: string | null;
  price?: number | null;
  propertyType?: string | null;
  lang: "es" | "en";
  limit?: number;
};

function trim(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}

/** Deterministic rotation — stable across SSR/hydration for same viewer listing. */
function rotationScore(listingId: string, seed: string): number {
  let h = 0;
  const s = `${seed}:${listingId}`;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function relevanceScore(
  row: BrListingDbRow,
  args: BrSimilarOtherClientFetchArgs,
): number {
  let score = 0;
  const city = trim(args.city).toLowerCase();
  const rowCity = trim(row.city).toLowerCase();
  if (city && rowCity && (rowCity === city || rowCity.includes(city) || city.includes(rowCity))) {
    score += 40;
  }
  const facets = extractBrFacetsFromDetailPairs(row.detail_pairs);
  const wantType = trim(args.propertyType).toLowerCase();
  const rowType = trim(facets.categoriaPropiedad || "").toLowerCase();
  if (wantType && rowType && (rowType === wantType || rowType.includes(wantType))) {
    score += 25;
  }
  const price = typeof args.price === "number" && Number.isFinite(args.price) ? args.price : null;
  const rowPrice = typeof row.price === "number" ? row.price : null;
  if (price != null && rowPrice != null && price > 0) {
    const ratio = Math.abs(rowPrice - price) / price;
    if (ratio <= 0.15) score += 30;
    else if (ratio <= 0.35) score += 15;
  }
  const created = trim(row.created_at);
  if (created) score += 5;
  return score;
}

export async function fetchBrSimilarOtherClientListingsForDetail(
  args: BrSimilarOtherClientFetchArgs,
): Promise<BrNegocioListing[]> {
  const limit = args.limit ?? 6;
  const excludeGroup = trim(args.excludeGroupId);
  const excludeOwner = trim(args.excludeOwnerId);

  try {
    const sb = createSupabaseBrowserClient();
    const runQuery = async (cols: string) => {
      const res = await sb
        .from("listings")
        .select(cols)
        .eq("category", "bienes-raices")
        .eq("is_published", true)
        .in("status", ["active", "sold"])
        .neq("id", args.currentListingId)
        .order("created_at", { ascending: false })
        .limit(48);
      return { data: res.data as unknown[] | null, error: res.error ? { message: res.error.message } : null };
    };

    const fetched = await listingsQueryWithSelectShrink(SIMILAR_SELECT, runQuery);
    if (fetched.error || !fetched.data) return [];

    const candidates = (fetched.data as BrListingDbRow[]).filter((row) => {
      if (!isListingRowActiveAndPublishedForBrowse(row)) return false;
      if (row.id === args.currentListingId) return false;
      if (!isBrNegocioListing(row)) return false;
      const group = getBrInventoryGroupId(row);
      if (excludeGroup && group && group === excludeGroup) return false;
      const owner = trim(row.owner_id);
      if (excludeOwner && owner && owner === excludeOwner) return false;
      return true;
    });

    const scored = candidates
      .map((row) => ({
        row,
        rel: relevanceScore(row, args),
        rot: rotationScore(row.id, args.currentListingId),
      }))
      .sort((a, b) => b.rel - a.rel || a.rot - b.rot);

    const seen = new Set<string>();
    const unique = scored.filter(({ row }) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });

    return unique.slice(0, limit).map(({ row }) => mapBrListingRowToNegocioCard(row, args.lang));
  } catch {
    return [];
  }
}
