"use client";

import { createSupabaseBrowserClient, getBrowserAuthUserForEngagement } from "@/app/lib/supabase/browser";
import { readRestaurantesSavedIds } from "./restaurantesFirstPartyPreferences";

/**
 * Buyer "Guardados" keys for discovery `saved=1` filter.
 * Merges legacy localStorage ids with account `saved_listings` (REST1).
 */
export async function loadRestaurantesBuyerSavedIdSet(): Promise<Set<string>> {
  const merged = new Set(readRestaurantesSavedIds());

  try {
    const sb = createSupabaseBrowserClient();
    const user = await getBrowserAuthUserForEngagement();
    if (!user?.id) return merged;

    const { data, error } = await sb
      .from("saved_listings")
      .select("listing_id, source_id, source_table, category")
      .eq("user_id", user.id);

    if (error) return merged;

    for (const row of data ?? []) {
      const cat = String(row.category ?? "").trim().toLowerCase();
      const table = String(row.source_table ?? "").trim();
      if (cat && cat !== "restaurantes") continue;
      if (table && table !== "restaurantes_public_listings") continue;
      const sid = String(row.source_id ?? "").trim();
      const lid = String(row.listing_id ?? "").trim();
      if (sid) merged.add(sid);
      else if (lid) merged.add(lid);
    }
  } catch {
    /* non-fatal */
  }

  return merged;
}
