import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { listingsQueryWithSelectShrink } from "@/app/(site)/clasificados/lib/listingsSelectShrink";
import type { BrPropertyInventoryRowLike } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";

const OWNER_BR_INVENTORY_SELECT =
  "id, owner_id, category, seller_type, status, is_published, detail_pairs, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role, title, leonix_ad_id";

export async function fetchBrOwnerInventoryListingRows(ownerId: string): Promise<BrPropertyInventoryRowLike[]> {
  if (!ownerId.trim()) return [];
  try {
    const sb = createSupabaseBrowserClient();
    const res = await listingsQueryWithSelectShrink(OWNER_BR_INVENTORY_SELECT, async (cols) => {
      const q = await sb
        .from("listings")
        .select(cols)
        .eq("owner_id", ownerId)
        .eq("category", "bienes-raices");
      return { data: q.data as unknown[] | null, error: q.error ? { message: q.error.message } : null };
    });
    if (res.error || !res.data) return [];
    return res.data as BrPropertyInventoryRowLike[];
  } catch {
    return [];
  }
}
