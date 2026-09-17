/**
 * BR-FINAL-PUBLISH-STRIPE-ROTATION-05 — other-client similar Bienes listings for public detail.
 * Excludes current listing, same inventory group, and same owner when possible.
 */

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { isListingRowActiveAndPublishedForBrowse } from "@/app/(site)/clasificados/lib/listingPublicBrowseEligibility";
import { isBrFsboRow, isBrFsboRowWithinTerm } from "@/app/lib/listingLifecycle/bienesFsboLifecycle";
import { listingsQueryWithSelectShrink } from "@/app/(site)/clasificados/lib/listingsSelectShrink";
import {
  getBrInventoryGroupId,
  isBrNegocioListing,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import { mapBrListingRowToNegocioCard, type BrListingDbRow } from "../resultados/lib/mapBrListingRowToCard";
import { extractBrFacetsFromDetailPairs } from "../resultados/lib/brFacetFromDetailPairs";
import type { BrNegocioListing } from "../resultados/cards/listingTypes";

const SIMILAR_SELECT =
  "id, title, description, city, price, is_free, images, detail_pairs, listing_json, contact_json, category, seller_type, business_name, owner_id, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role, status, is_published, expires_at, created_at";

/**
 * Gate BIENES-PRIVADO-2 — this reader now serves BOTH BR lanes from ONE engine.
 *
 * FSBO could not use the Negocio same-agent/portfolio rail
 * (`fetchBrRelatedInventoryListingsBrowser`): that reader is keyed on
 * `br_inventory_group_id` / `br_inventory_parent_listing_id`, and a private seller has no
 * parent, no group and no inventory. But FSBO does not need a NEW engine either — this
 * other-seller similarity reader already scores exactly the persisted relationships a private
 * property has (city, property type, price proximity, recency), and it already applies the
 * shared public-eligibility and FSBO fixed-term rules. So it gained a `lane` switch rather
 * than a sibling file.
 *
 * `lane` defaults to `"negocio"`, so every pre-existing caller is byte-identical: same query,
 * same filters, same scoring, same output. Nothing about Negocio behavior changed.
 */
export type BrSimilarLane = "negocio" | "privado";

export type BrSimilarOtherClientFetchArgs = {
  currentListingId: string;
  excludeGroupId?: string | null;
  excludeOwnerId?: string | null;
  city?: string | null;
  price?: number | null;
  propertyType?: string | null;
  /** Which BR lane to draw candidates from. Omitted = the original Negocio behavior. */
  lane?: BrSimilarLane;
  /**
   * The CURRENT listing's operation. Privado only, and a hard FILTER rather than a score: a
   * property for sale must never be offered as "similar" to a rental. `null`/absent means the
   * current listing's own operation could not be read, in which case no operation filter is
   * applied — the rail degrades to city/type/price rather than guessing.
   */
  operation?: "venta" | "renta" | null;
  /** Bedrooms/bathrooms of the current listing, when structured. Privado scoring only. */
  bedrooms?: number | null;
  bathrooms?: number | null;
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

function closeCount(a: number | null | undefined, b: number | null | undefined): number {
  if (typeof a !== "number" || typeof b !== "number") return 0;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  const diff = Math.abs(a - b);
  if (diff === 0) return 2;
  if (diff <= 1) return 1;
  return 0;
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
  // Privado-only refinement. Bedrooms/bathrooms are the facts a private buyer actually
  // compares, and they are already structured on the row (`Leonix:` machine facets). Scoped to
  // the Privado lane so Negocio's score is byte-identical to what it has always been, and
  // weighted BELOW city so it refines an ordering rather than becoming a new ranking model.
  if (args.lane === "privado") {
    score += closeCount(facets.machine?.bedroomsCount ?? null, args.bedrooms ?? null) * 10;
    score += closeCount(facets.machine?.bathroomsCount ?? null, args.bathrooms ?? null) * 8;
  }
  return score;
}

export async function fetchBrSimilarOtherClientListingsForDetail(
  args: BrSimilarOtherClientFetchArgs,
): Promise<BrNegocioListing[]> {
  const limit = args.limit ?? 6;
  const lane: BrSimilarLane = args.lane ?? "negocio";
  const wantOperation = args.operation ?? null;
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
        .eq("status", "active")
        .neq("id", args.currentListingId)
        .order("created_at", { ascending: false })
        .limit(48);
      return { data: res.data as unknown[] | null, error: res.error ? { message: res.error.message } : null };
    };

    const fetched = await listingsQueryWithSelectShrink(SIMILAR_SELECT, runQuery);
    if (fetched.error || !fetched.data) return [];

    const candidates = (fetched.data as BrListingDbRow[]).filter((row) => {
      if (!isListingRowActiveAndPublishedForBrowse(row)) return false;
      // Gate BIENES-PRIVADO-1 — same shared FSBO term rule as browse/detail/Saved Search/sitemap.
      if (!isBrFsboRowWithinTerm(row)) return false;
      if (row.id === args.currentListingId) return false;
      if (lane === "privado") {
        // Canonical published private-seller rows only — the SAME shared lane predicate the
        // term rule, the webhook and the renewal gate use. No inventory-group or parent
        // relationship is consulted, because an FSBO row has none.
        if (!isBrFsboRow(row)) return false;
        // Never mix a sale with a rental.
        if (wantOperation) {
          const rowOperation = extractBrFacetsFromDetailPairs(row.detail_pairs).operation;
          if (rowOperation !== wantOperation) return false;
        }
      } else {
        if (!isBrNegocioListing(row)) return false;
        const group = getBrInventoryGroupId(row);
        if (excludeGroup && group && group === excludeGroup) return false;
      }
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
