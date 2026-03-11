/**
 * Recently viewed listings: Supabase when logged in, localStorage when anonymous.
 * Max 10 entries per user; newest first.
 */

import { createSupabaseBrowserClient } from "./supabase/browser";

const STORAGE_KEY = "recentlyViewedListings";
const MAX_ITEMS = 10;

function getFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

function setToStorage(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ITEMS)));
}

/** Add a listing view. Call when a listing page loads. */
export async function addListingView(listingId: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await supabase
      .from("recently_viewed")
      .upsert(
        { user_id: user.id, listing_id: listingId, created_at: new Date().toISOString() },
        { onConflict: "user_id,listing_id" }
      );
    const { data: rows } = await supabase
      .from("recently_viewed")
      .select("id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (rows && rows.length > MAX_ITEMS) {
      const toDelete = rows.slice(MAX_ITEMS).map((r) => r.id);
      for (const id of toDelete) {
        await supabase.from("recently_viewed").delete().eq("id", id);
      }
    }
    return;
  }

  const prev = getFromStorage();
  const next = [listingId, ...prev.filter((id) => id !== listingId)].slice(0, MAX_ITEMS);
  setToStorage(next);
}

/** Get recently viewed listing IDs (newest first), max 10. */
export async function getRecentlyViewedIds(): Promise<string[]> {
  const supabase = createSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data } = await supabase
      .from("recently_viewed")
      .select("listing_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(MAX_ITEMS);
    if (!data) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const row of data) {
      if (seen.has(row.listing_id)) continue;
      seen.add(row.listing_id);
      out.push(row.listing_id);
    }
    return out;
  }

  return getFromStorage();
}
