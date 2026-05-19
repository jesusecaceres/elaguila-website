"use client";

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

export type BrParentListingMeta = {
  id: string;
  leonix_ad_id: string | null;
  title: string | null;
};

/** Owner-safe read of parent BR Negocio listing for inventory add-flow context. */
export async function fetchBrParentListingMetaBrowser(
  parentListingId: string,
): Promise<BrParentListingMeta | null> {
  const id = parentListingId.trim();
  if (!id) return null;
  const sb = createSupabaseBrowserClient();
  const { data, error } = await sb
    .from("listings")
    .select("id, leonix_ad_id, title, category, seller_type")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as {
    id: string;
    leonix_ad_id?: string | null;
    title?: string | null;
    category?: string | null;
    seller_type?: string | null;
  };
  if (String(row.category ?? "").toLowerCase() !== "bienes-raices") return null;
  if (String(row.seller_type ?? "").toLowerCase() !== "business") return null;
  return {
    id: row.id,
    leonix_ad_id: row.leonix_ad_id?.trim() || null,
    title: row.title?.trim() || null,
  };
}
