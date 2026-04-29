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
  // New engagement metrics
  likes: number;
  ctaClicks: number;
  leads: number;
  applications: number;
  lastEngagement?: string;
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
        likes: 0,
        ctaClicks: 0,
        leads: 0,
        applications: 0,
      },
      listingCount: 0,
      error: null,
    };
  }

  const { data: events, error: e2 } = await sb
    .from("listing_analytics")
    .select("listing_id, event_type, user_id, created_at")
    .in("listing_id", ids);
  if (e2) return { totals: null, listingCount: ids.length, error: e2.message };

  const viewUsers = new Set<string>();
  let listingViews = 0;
  let saves = 0;
  let shares = 0;
  let messages = 0;
  let profileViews = 0;
  let listingOpens = 0;
  // New metrics
  let likes = 0;
  let ctaClicks = 0;
  let leads = 0;
  let applications = 0;
  let lastEngagement: string | undefined;

  for (const row of events ?? []) {
    const t = (row as { event_type?: string; user_id?: string | null; created_at?: string }).event_type;
    const uid = (row as { user_id?: string | null; created_at?: string }).user_id;
    const createdAt = (row as { created_at?: string }).created_at;
    
    // Track last engagement
    if (createdAt && (!lastEngagement || new Date(createdAt) > new Date(lastEngagement))) {
      lastEngagement = createdAt;
    }
    
    if (t === "listing_view") {
      listingViews += 1;
      if (uid) viewUsers.add(uid);
    } else if (t === "listing_save") saves += 1;
    else if (t === "listing_share") shares += 1;
    else if (t === "message_sent") messages += 1;
    else if (t === "profile_view") profileViews += 1;
    else if (t === "listing_open") listingOpens += 1;
    // New event types
    else if (t === "listing_like") likes += 1;
    else if (t === "cta_click" || t === "phone_click" || t === "whatsapp_click" || t === "website_click" || t === "directions_click") ctaClicks += 1;
    else if (t === "lead_created") leads += 1;
    else if (t === "apply_started" || t === "apply_submitted") applications += 1;
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
      likes,
      ctaClicks,
      leads,
      applications,
      lastEngagement,
    },
    listingCount: ids.length,
    error: null,
  };
}
