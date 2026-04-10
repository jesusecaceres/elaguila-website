/**
 * Owner-level rollup of listing_analytics — only uses persisted event_type values.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type OwnerAnalyticsTotals = {
  listingViews: number;
  uniqueListingViewsEstimate: number;
  saves: number;
  shares: number;
  messages: number;
  profileViews: number;
  listingOpens: number;
};

export async function fetchOwnerAnalyticsTotals(
  sb: SupabaseClient,
  ownerId: string
): Promise<{ totals: OwnerAnalyticsTotals | null; listingCount: number; error: string | null }> {
  const { data: owned, error: e1 } = await sb.from("listings").select("id").eq("owner_id", ownerId);
  if (e1) return { totals: null, listingCount: 0, error: e1.message };
  const ids = (owned ?? []).map((r) => String((r as { id: string }).id)).filter(Boolean);
  if (ids.length === 0) {
    return {
      totals: {
        listingViews: 0,
        uniqueListingViewsEstimate: 0,
        saves: 0,
        shares: 0,
        messages: 0,
        profileViews: 0,
        listingOpens: 0,
      },
      listingCount: 0,
      error: null,
    };
  }

  const { data: events, error: e2 } = await sb
    .from("listing_analytics")
    .select("listing_id, event_type, user_id")
    .in("listing_id", ids);
  if (e2) return { totals: null, listingCount: ids.length, error: e2.message };

  const viewUsers = new Set<string>();
  let listingViews = 0;
  let saves = 0;
  let shares = 0;
  let messages = 0;
  let profileViews = 0;
  let listingOpens = 0;

  for (const row of events ?? []) {
    const t = (row as { event_type?: string; user_id?: string | null }).event_type;
    const uid = (row as { user_id?: string | null }).user_id;
    if (t === "listing_view") {
      listingViews += 1;
      if (uid) viewUsers.add(uid);
    } else if (t === "listing_save") saves += 1;
    else if (t === "listing_share") shares += 1;
    else if (t === "message_sent") messages += 1;
    else if (t === "profile_view") profileViews += 1;
    else if (t === "listing_open") listingOpens += 1;
  }

  return {
    totals: {
      listingViews,
      uniqueListingViewsEstimate: viewUsers.size,
      saves,
      shares,
      messages,
      profileViews,
      listingOpens,
    },
    listingCount: ids.length,
    error: null,
  };
}
