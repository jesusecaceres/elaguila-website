"use client";

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

export type MascotasPerdidosListingBrowseRow = {
  id: string;
  title: string | null;
  description: string | null;
  city: string | null;
  category: string | null;
  detail_pairs: unknown;
  images: unknown;
  leonix_ad_id: string | null;
  created_at: string | null;
  owner_id: string | null;
};

const SELECT =
  "id,title,description,city,category,detail_pairs,images,leonix_ad_id,created_at,owner_id";

export async function fetchPublishedMascotasPerdidosListings(
  limit = 120,
): Promise<{ rows: MascotasPerdidosListingBrowseRow[]; error: string | null }> {
  try {
    const sb = createSupabaseBrowserClient();
    const { data, error } = await sb
      .from("listings")
      .select(SELECT)
      .eq("category", "mascotas-y-perdidos")
      .eq("is_published", true)
      .in("status", ["active", "sold"])
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []) as MascotasPerdidosListingBrowseRow[], error: null };
  } catch (e: unknown) {
    return { rows: [], error: e instanceof Error ? e.message : String(e) };
  }
}
