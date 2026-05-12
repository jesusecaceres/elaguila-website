/**
 * Per-listing view counts from `listing_analytics` — no invented metrics.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { listingAnalyticsReadIsDegraded } from "./listingAnalyticsReadErrors";

export type ListingViewRow = { id: string; title: string | null; views: number };

export type FetchOwnerListingViewLeadersResult = {
  leaders: ListingViewRow[];
  laggards: ListingViewRow[];
  listingAnalyticsUnavailable: boolean;
  /** True when the listings inventory query failed (separate from analytics table). */
  listingsQueryFailed: boolean;
};

export async function fetchOwnerListingViewLeaders(
  sb: SupabaseClient,
  ownerId: string
): Promise<FetchOwnerListingViewLeadersResult> {
  const { data: owned, error: e1 } = await sb.from("listings").select("id, title").eq("owner_id", ownerId);
  if (e1) {
    console.warn("[fetchOwnerListingViewLeaders] listings query failed:", e1.message ?? e1);
    return { leaders: [], laggards: [], listingAnalyticsUnavailable: false, listingsQueryFailed: true };
  }
  const listings = (owned ?? []) as Array<{ id: string; title?: string | null }>;
  if (listings.length === 0) return { leaders: [], laggards: [], listingAnalyticsUnavailable: false, listingsQueryFailed: false };

  const ids = listings.map((l) => l.id);
  const titleById = new Map(listings.map((l) => [l.id, l.title ?? null] as const));

  const { data: events, error: e2 } = await sb
    .from("listing_analytics")
    .select("listing_id")
    .in("listing_id", ids)
    .eq("event_type", "listing_view");

  if (e2) {
    const technical = e2.message ?? String(e2);
    const code = typeof (e2 as { code?: string }).code === "string" ? (e2 as { code?: string }).code : "";
    console.warn("[fetchOwnerListingViewLeaders] listing_analytics read failed:", technical, code);
    const unavailable = listingAnalyticsReadIsDegraded({ message: technical, code });
    return { leaders: [], laggards: [], listingAnalyticsUnavailable: unavailable, listingsQueryFailed: false };
  }

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
    listingAnalyticsUnavailable: false,
    listingsQueryFailed: false,
  };
}
