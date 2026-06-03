/**
 * Resolve an owned `listings` row for seller dashboard workspace routes.
 * Supports internal UUID and Leonix display id (`SALE-…`) with owner scoping.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isLeonixDisplayAdId, isListingUuid } from "@/app/lib/listingSaveDbKey";

export type OwnerListingWorkspaceAccess = "ok" | "missing" | "forbidden";

export async function fetchOwnerListingForWorkspace(
  sb: SupabaseClient,
  ownerId: string,
  routeId: string,
  selFull: string,
  selBase: string,
): Promise<{ data: Record<string, unknown> | null; access: OwnerListingWorkspaceAccess }> {
  const id = routeId.trim();
  const owner = ownerId.trim();
  if (!id || !owner) return { data: null, access: "missing" };

  async function tryOwnedSelect(col: "id" | "leonix_ad_id", val: string) {
    let q = await sb.from("listings").select(selFull).eq(col, val).eq("owner_id", owner).maybeSingle();
    if (q.error) {
      q = await sb.from("listings").select(selBase).eq(col, val).eq("owner_id", owner).maybeSingle();
    }
    if (q.error || !q.data) return null;
    return q.data as unknown as Record<string, unknown>;
  }

  if (isListingUuid(id)) {
    const row = await tryOwnedSelect("id", id);
    if (row) return { data: row, access: "ok" };
  }

  if (isLeonixDisplayAdId(id)) {
    const row = await tryOwnedSelect("leonix_ad_id", id);
    if (row) return { data: row, access: "ok" };
  }

  if (!isListingUuid(id) && !isLeonixDisplayAdId(id)) {
    const byId = await tryOwnedSelect("id", id);
    if (byId) return { data: byId, access: "ok" };
    const byLeonix = await tryOwnedSelect("leonix_ad_id", id);
    if (byLeonix) return { data: byLeonix, access: "ok" };
  }

  const probeCol = isListingUuid(id) ? "id" : isLeonixDisplayAdId(id) ? "leonix_ad_id" : "id";
  const { data: foreign } = await sb
    .from("listings")
    .select("id, owner_id")
    .eq(probeCol, id)
    .maybeSingle();
  if (foreign) {
    const rowOwner = String((foreign as { owner_id?: string }).owner_id ?? "").trim();
    if (rowOwner && rowOwner !== owner) return { data: null, access: "forbidden" };
  }

  return { data: null, access: "missing" };
}
