"use client";

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { isListingRowWithinEnforcedTerm } from "@/app/lib/listingLifecycle/enforcedTermReadPredicate";

export type CommunityListingBrowseRow = {
  id: string;
  title: string | null;
  description: string | null;
  city: string | null;
  price: number | string | null;
  is_free: boolean | null;
  category: string | null;
  detail_pairs: unknown;
  images: unknown;
  created_at: string | null;
  owner_id: string | null;
  /** Set at activation for PAID Clases (30d); null for free lanes / legacy rows. */
  expires_at?: string | null;
};

const SELECT = "id,title,description,city,price,is_free,category,detail_pairs,images,created_at,owner_id,expires_at";

export async function fetchPublishedCommunityCategoryListings(
  category: "clases" | "comunidad",
  limit = 120,
): Promise<{ rows: CommunityListingBrowseRow[]; error: string | null }> {
  try {
    const sb = createSupabaseBrowserClient();
    const { data, error } = await sb
      .from("listings")
      .select(SELECT)
      .eq("category", category)
      .eq("is_published", true)
      .in("status", ["active", "sold"])
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { rows: [], error: error.message };
    // Paid Clases terms are enforced on read (expired rows drop out); null expires_at is never hidden.
    const rows = ((data ?? []) as CommunityListingBrowseRow[]).filter((r) =>
      isListingRowWithinEnforcedTerm({ category: r.category, expires_at: r.expires_at }),
    );
    return { rows, error: null };
  } catch (e: unknown) {
    return { rows: [], error: e instanceof Error ? e.message : String(e) };
  }
}
