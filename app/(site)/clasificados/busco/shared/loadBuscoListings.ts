"use client";

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

export type BuscoListingBrowseRow = {
  id: string;
  title: string | null;
  description: string | null;
  city: string | null;
  category: string | null;
  detail_pairs: unknown;
  images: unknown;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string | null;
  owner_id: string | null;
};

const SELECT =
  "id,title,description,city,category,detail_pairs,images,contact_phone,contact_email,created_at,owner_id";

export async function fetchPublishedBuscoListings(
  limit = 120,
): Promise<{ rows: BuscoListingBrowseRow[]; error: string | null }> {
  try {
    const sb = createSupabaseBrowserClient();
    const { data, error } = await sb
      .from("listings")
      .select(SELECT)
      .eq("category", "busco")
      .eq("is_published", true)
      .in("status", ["active", "sold"])
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []) as BuscoListingBrowseRow[], error: null };
  } catch (e: unknown) {
    return { rows: [], error: e instanceof Error ? e.message : String(e) };
  }
}
