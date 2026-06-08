import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { isListingRowActiveAndPublishedForBrowse } from "@/app/(site)/clasificados/lib/listingPublicBrowseEligibility";
import { listingsQueryWithSelectShrink } from "@/app/(site)/clasificados/lib/listingsSelectShrink";
import {
  getBrInventoryGroupId,
  getBrInventoryParentListingId,
  getBrInventoryRole,
  isBrNegocioListing,
  resolveBrInventoryGroupingKey,
  type BrPropertyInventoryRole,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import { mapBrListingRowToNegocioCard, type BrListingDbRow } from "../resultados/lib/mapBrListingRowToCard";
import type { BrNegocioListing } from "../resultados/cards/listingTypes";

const RELATED_SELECT =
  "id, title, description, city, price, is_free, images, detail_pairs, listing_json, contact_json, seller_type, business_name, owner_id, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role, status, is_published, created_at";

export type BrRelatedInventoryFetchArgs = {
  currentListingId: string;
  ownerId?: string | null;
  brInventoryGroupId?: string | null;
  brInventoryParentListingId?: string | null;
  currentInventoryRole?: BrPropertyInventoryRole | string | null;
  lang: "es" | "en";
  limit?: number;
};

export async function fetchBrRelatedInventoryListingsForDetail(
  args: BrRelatedInventoryFetchArgs,
): Promise<BrNegocioListing[]> {
  const limit = args.limit ?? 8;
  const groupId = (args.brInventoryGroupId ?? "").trim();
  const ownerId = (args.ownerId ?? "").trim();
  if (!groupId && !ownerId) return [];

  try {
    const sb = createSupabaseBrowserClient();
    const runQuery = async (cols: string) => {
      let q = sb
        .from("listings")
        .select(cols)
        .eq("category", "bienes-raices")
        .eq("is_published", true)
        .in("status", ["active", "sold"])
        .neq("id", args.currentListingId)
        .limit(Math.min(limit + 4, 24));
      if (groupId) {
        q = q.eq("br_inventory_group_id", groupId);
      } else if (ownerId) {
        q = q.eq("owner_id", ownerId).eq("seller_type", "business");
      }
      const res = await q;
      return { data: res.data as unknown[] | null, error: res.error ? { message: res.error.message } : null };
    };

    const fetched = await listingsQueryWithSelectShrink(RELATED_SELECT, runQuery);
    if (fetched.error || !fetched.data) return [];

    const rows = (fetched.data as BrListingDbRow[]).filter((row) => {
      if (!isListingRowActiveAndPublishedForBrowse(row)) return false;
      if (!isBrNegocioListing(row)) return false;
      if (row.id === args.currentListingId) return false;
      const role = getBrInventoryRole(row);
      const viewerRole =
        args.currentInventoryRole === "main" || args.currentInventoryRole === "inventory_property"
          ? args.currentInventoryRole
          : null;
      if (viewerRole === "main" && role !== "inventory_property") return false;
      if (groupId) return getBrInventoryGroupId(row) === groupId;
      if (ownerId) {
        const parent = getBrInventoryParentListingId(row);
        const sameGroup = resolveBrInventoryGroupingKey(row) === `owner:${ownerId}`;
        return sameGroup || parent === args.currentListingId || parent === args.brInventoryParentListingId;
      }
      return true;
    });

    const seen = new Set<string>();
    const unique = rows.filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });

    return unique.slice(0, limit).map((r) => mapBrListingRowToNegocioCard(r, args.lang));
  } catch {
    return [];
  }
}
