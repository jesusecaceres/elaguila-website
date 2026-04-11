/**
 * Per-listing view counts from `listing_analytics` — no invented metrics.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type ListingViewRow = { id: string; title: string | null; views: number };

export async function fetchOwnerListingViewLeaders(
  sb: SupabaseClient,
  ownerId: string
): Promise<{ leaders: ListingViewRow[]; laggards: ListingViewRow[]; error: string | null }> {
  const { data: owned, error: e1 } = await sb.from("listings").select("id, title").eq("owner_id", ownerId);
  if (e1) return { leaders: [], laggards: [], error: e1.message };
  const listings = (owned ?? []) as Array<{ id: string; title?: string | null }>;
  if (listings.length === 0) return { leaders: [], laggards: [], error: null };

  const ids = listings.map((l) => l.id);
  const titleById = new Map(listings.map((l) => [l.id, l.title ?? null] as const));

  const { data: events, error: e2 } = await sb
    .from("listing_analytics")
    .select("listing_id")
    .in("listing_id", ids)
    .eq("event_type", "listing_view");

  if (e2) return { leaders: [], laggards: [], error: e2.message };

  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, 0);
  for (const row of events ?? []) {
    const lid = (row as { listing_id?: string }).listing_id;
    if (!lid) continue;
    counts.set(lid, (counts.get(lid) ?? 0) + 1);
  }

  const rows: ListingViewRow[] = ids.map((id) => ({
    id,
    title: titleById.get(id) ?? null,
    views: counts.get(id) ?? 0,
  }));

  const sortedDesc = [...rows].sort((a, b) => b.views - a.views || a.id.localeCompare(b.id));
  const sortedAsc = [...rows].sort((a, b) => a.views - b.views || a.id.localeCompare(b.id));

  return {
    leaders: sortedDesc.slice(0, 3).filter((r) => r.views > 0),
    laggards: sortedAsc.slice(0, 3),
    error: null,
  };
}
