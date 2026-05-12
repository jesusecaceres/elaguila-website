/**
 * Owner-level rollup of listing_analytics — only uses persisted event_type values.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { collectOwnerListingKeysForAnalytics, countOwnerInventoryListings } from "@/app/lib/ownerEngagementListingKeys";
import { listingAnalyticsReadIsDegraded } from "./listingAnalyticsReadErrors";

export type OwnerAnalyticsTotals = {
  listingViews: number;
  uniqueListingViewsEstimate: number;
  saves: number;
  shares: number;
  messages: number;
  profileViews: number;
  listingOpens: number;
  likes: number;
  ctaClicks: number;
  leads: number;
  applications: number;
  lastEngagement?: string;
};

const ZERO_TOTALS: OwnerAnalyticsTotals = {
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
};

export type FetchOwnerAnalyticsTotalsResult = {
  totals: OwnerAnalyticsTotals;
  listingCount: number;
  /** True when reads from listing_analytics failed — show a single setup / degraded notice, not raw errors. */
  listingAnalyticsUnavailable: boolean;
};

export async function fetchOwnerAnalyticsTotals(
  sb: SupabaseClient,
  ownerId: string
): Promise<FetchOwnerAnalyticsTotalsResult> {
  const inventoryCount = await countOwnerInventoryListings(sb, ownerId);
  const ids = await collectOwnerListingKeysForAnalytics(sb, ownerId);
  if (ids.length === 0) {
    return {
      totals: { ...ZERO_TOTALS },
      listingCount: inventoryCount,
      listingAnalyticsUnavailable: false,
    };
  }

  const { data: events, error: e2 } = await sb
    .from("listing_analytics")
    .select("listing_id, event_type, user_id, created_at")
    .in("listing_id", ids);

  if (e2) {
    const technical = e2.message ?? String(e2);
    const code = typeof (e2 as { code?: string }).code === "string" ? (e2 as { code?: string }).code : "";
    console.warn("[fetchOwnerAnalyticsTotals] listing_analytics read failed:", technical, code);
    const unavailable = listingAnalyticsReadIsDegraded({ message: technical, code });
    return {
      totals: { ...ZERO_TOTALS },
      listingCount: inventoryCount,
      listingAnalyticsUnavailable: unavailable,
    };
  }

  const viewUsers = new Set<string>();
  let listingViews = 0;
  let saves = 0;
  let shares = 0;
  let messages = 0;
  let profileViews = 0;
  let listingOpens = 0;
  let likes = 0;
  let ctaClicks = 0;
  let leads = 0;
  let applications = 0;
  let lastEngagement: string | undefined;

  for (const row of events ?? []) {
    const t = (row as { event_type?: string; user_id?: string | null; created_at?: string }).event_type;
    const uid = (row as { user_id?: string | null; created_at?: string }).user_id;
    const createdAt = (row as { created_at?: string }).created_at;

    if (createdAt && (!lastEngagement || new Date(createdAt) > new Date(lastEngagement))) {
      lastEngagement = createdAt;
    }

    if (t === "listing_view") {
      listingViews += 1;
      if (uid) viewUsers.add(uid);
    } else if (t === "listing_save") saves += 1;
    else if (t === "listing_unsave") saves -= 1;
    else if (t === "listing_share") shares += 1;
    else if (t === "message_sent") messages += 1;
    else if (t === "profile_view") profileViews += 1;
    else if (t === "listing_open") listingOpens += 1;
    else if (t === "listing_like") likes += 1;
    else if (t === "listing_unlike") likes -= 1;
    else if (t === "cta_click" || t === "phone_click" || t === "whatsapp_click" || t === "website_click" || t === "directions_click")
      ctaClicks += 1;
    else if (t === "lead_created") leads += 1;
    else if (t === "apply_started" || t === "apply_submitted") applications += 1;
  }

  return {
    totals: {
      listingViews,
      uniqueListingViewsEstimate: viewUsers.size,
      saves: Math.max(0, saves),
      shares,
      messages,
      profileViews,
      listingOpens,
      likes: Math.max(0, likes),
      ctaClicks,
      leads,
      applications,
      lastEngagement,
    },
    listingCount: inventoryCount,
    listingAnalyticsUnavailable: false,
  };
}
