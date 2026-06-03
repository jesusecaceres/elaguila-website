/**
 * Gate G2C — Load seller-scoped listing_analytics via service role (server only).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { listingAnalyticsReadIsDegraded } from "@/app/(site)/dashboard/lib/listingAnalyticsReadErrors";
import { countOwnerInventoryListings, collectOwnerListingKeysForAnalytics } from "@/app/lib/ownerEngagementListingKeys";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  aggregateByHubListingId,
  aggregateDashboardAnalyticsTotals,
  buildRecentActivity,
  bucketToDashboardListingMetrics,
  dedupeDashboardAnalyticsRows,
  eventBelongsToOwner,
  lastEngagementIso,
  type DashboardAnalyticsEventRow,
  type DashboardAnalyticsTotals,
  type DashboardRecentActivityItem,
  ZERO_DASHBOARD_ANALYTICS_TOTALS,
} from "./dashboardAnalyticsMetrics";

const EVENT_SELECT =
  "id, listing_id, canonical_ad_id, event_type, user_id, created_at, category, owner_user_id, event_source, source_table, source_id";

export type HubListingViewLeader = { id: string; title: string | null; views: number };

export type OwnerDashboardAnalyticsSnapshot = {
  totals: DashboardAnalyticsTotals;
  listingCount: number;
  analyticsUnavailable: boolean;
  listingsQueryFailed: boolean;
  byCategory: Record<string, DashboardAnalyticsTotals>;
  byListing: Record<string, ReturnType<typeof import("./dashboardAnalyticsMetrics").bucketToDashboardListingMetrics>>;
  recentActivity: DashboardRecentActivityItem[];
  listingViewLeaders: HubListingViewLeader[];
  listingViewLaggards: HubListingViewLeader[];
  lastEngagement?: string;
};

async function loadOwnerAnalyticsEvents(
  sb: SupabaseClient,
  ownerId: string,
  ownerKeys: string[],
): Promise<{ events: DashboardAnalyticsEventRow[]; unavailable: boolean }> {
  const keySet = new Set(ownerKeys);
  const batches: DashboardAnalyticsEventRow[] = [];
  let readFailed = false;

  if (ownerKeys.length > 0) {
    const chunkSize = 80;
    for (let i = 0; i < ownerKeys.length; i += chunkSize) {
      const chunk = ownerKeys.slice(i, i + chunkSize);
      const { data, error } = await sb
        .from("listing_analytics")
        .select(EVENT_SELECT)
        .in("listing_id", chunk);
      if (error) {
        readFailed = true;
        break;
      }
      if (data?.length) batches.push(...(data as DashboardAnalyticsEventRow[]));
    }
  }

  const { data: byOwner, error: ownerErr } = await sb
    .from("listing_analytics")
    .select(EVENT_SELECT)
    .eq("owner_user_id", ownerId)
    .limit(4000);

  if (ownerErr) readFailed = true;
  else if (byOwner?.length) batches.push(...(byOwner as DashboardAnalyticsEventRow[]));

  if (readFailed && batches.length === 0) {
    return { events: [], unavailable: true };
  }

  const filtered = dedupeDashboardAnalyticsRows(batches).filter((row) =>
    eventBelongsToOwner(row, ownerId, keySet),
  );
  return { events: filtered, unavailable: false };
}

async function loadHubListingsForLeaders(
  sb: SupabaseClient,
  ownerId: string,
): Promise<{
  listings: Array<{ id: string; title: string | null; leonix_ad_id?: string | null }>;
  queryFailed: boolean;
}> {
  const { data, error } = await sb.from("listings").select("id, title, leonix_ad_id").eq("owner_id", ownerId);
  if (error) return { listings: [], queryFailed: true };
  const listings = (data ?? [])
    .map((r) => {
      const row = r as { id?: string; title?: string | null; leonix_ad_id?: string | null };
      return { id: String(row.id ?? ""), title: row.title ?? null, leonix_ad_id: row.leonix_ad_id ?? null };
    })
    .filter((r) => r.id);
  return { listings, queryFailed: false };
}

function rollupByCategory(events: DashboardAnalyticsEventRow[]): Record<string, DashboardAnalyticsTotals> {
  const byCat: Record<string, DashboardAnalyticsEventRow[]> = {};
  for (const row of events) {
    const cat = (row.category ?? "unknown").trim() || "unknown";
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(row);
  }
  const out: Record<string, DashboardAnalyticsTotals> = {};
  for (const [cat, rows] of Object.entries(byCat)) {
    out[cat] = aggregateDashboardAnalyticsTotals(rows);
  }
  return out;
}

function computeViewLeaders(
  hubListings: Array<{ id: string; title: string | null; leonix_ad_id?: string | null }>,
  events: DashboardAnalyticsEventRow[],
): { leaders: HubListingViewLeader[]; laggards: HubListingViewLeader[] } {
  const keysById: Record<string, string[]> = {};
  for (const l of hubListings) {
    keysById[l.id] = [l.id, (l.leonix_ad_id ?? "").trim()].filter(Boolean);
  }

  const counts = new Map<string, number>();
  for (const l of hubListings) counts.set(l.id, 0);

  for (const row of events) {
    if (row.event_type !== "listing_view") continue;
    const key = (row.canonical_ad_id ?? row.listing_id ?? "").trim();
    if (!key) continue;
    for (const [id, keys] of Object.entries(keysById)) {
      if (keys.includes(key)) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
        break;
      }
    }
  }

  const rows: HubListingViewLeader[] = hubListings.map((l) => ({
    id: l.id,
    title: l.title,
    views: counts.get(l.id) ?? 0,
  }));

  const sortedDesc = [...rows].sort((a, b) => b.views - a.views || a.id.localeCompare(b.id));
  const sortedAsc = [...rows].sort((a, b) => a.views - b.views || a.id.localeCompare(b.id));

  return {
    leaders: sortedDesc.slice(0, 3).filter((r) => r.views > 0),
    laggards: sortedAsc.slice(0, 3),
  };
}

export async function fetchOwnerDashboardAnalyticsServer(
  ownerId: string,
  sb?: SupabaseClient,
): Promise<OwnerDashboardAnalyticsSnapshot> {
  const empty: OwnerDashboardAnalyticsSnapshot = {
    totals: { ...ZERO_DASHBOARD_ANALYTICS_TOTALS },
    listingCount: 0,
    analyticsUnavailable: true,
    listingsQueryFailed: false,
    byCategory: {},
    byListing: {},
    recentActivity: [],
    listingViewLeaders: [],
    listingViewLaggards: [],
  };

  if (!isSupabaseAdminConfigured()) return empty;

  const admin = sb ?? getAdminSupabase();
  const owner = ownerId.trim();
  if (!owner) return empty;

  const listingCount = await countOwnerInventoryListings(admin, owner);
  const ownerKeys = await collectOwnerListingKeysForAnalytics(admin, owner);
  const { events, unavailable } = await loadOwnerAnalyticsEvents(admin, owner, ownerKeys);

  if (unavailable) {
    return {
      ...empty,
      listingCount,
      analyticsUnavailable: listingAnalyticsReadIsDegraded({ message: "listing_analytics_read_failed" }),
    };
  }

  const { listings: hubListings, queryFailed } = await loadHubListingsForLeaders(admin, owner);
  const hubIds = hubListings.map((l) => l.id);
  const keysByListingId: Record<string, string[]> = {};
  for (const l of hubListings) {
    const row = l as { id: string; leonix_ad_id?: string | null };
    keysByListingId[row.id] = [row.id, (row.leonix_ad_id ?? "").trim()].filter(Boolean);
  }

  const { leaders, laggards } = computeViewLeaders(
    hubListings as Array<{ id: string; title: string | null; leonix_ad_id?: string | null }>,
    events,
  );

  return {
    totals: aggregateDashboardAnalyticsTotals(events),
    listingCount,
    analyticsUnavailable: false,
    listingsQueryFailed: queryFailed,
    byCategory: rollupByCategory(events),
    byListing: aggregateByHubListingId(events, hubIds, keysByListingId),
    recentActivity: buildRecentActivity(events),
    listingViewLeaders: leaders,
    listingViewLaggards: laggards,
    lastEngagement: lastEngagementIso(events),
  };
}

function totalsToListingMetrics(totals: DashboardAnalyticsTotals) {
  return {
    views: totals.views,
    unique_views_estimate: totals.unique_views_estimate,
    likes: totals.likes,
    saves: totals.saves,
    shares: totals.shares,
    messages: totals.messages,
    phone_clicks: totals.phone_clicks,
    whatsapp_clicks: totals.whatsapp_clicks,
    email_clicks: totals.email_clicks,
    message_clicks: totals.message_clicks,
    website_clicks: totals.website_clicks,
    directions_clicks: totals.directions_clicks,
    result_card_clicks: totals.result_card_clicks,
    impressions: totals.impressions,
    leads: totals.leads,
    applications: totals.applications,
    contact_clicks: totals.contact_clicks,
    profile_views: totals.profile_views,
    listing_opens: totals.listing_opens,
    cta_clicks_other: totals.cta_clicks_other,
  };
}

export async function fetchListingDashboardAnalyticsServer(
  ownerId: string,
  listingKeys: string[],
  sb?: SupabaseClient,
): Promise<{
  metrics: ReturnType<typeof totalsToListingMetrics>;
  recentEvents: DashboardRecentActivityItem[];
  analyticsUnavailable: boolean;
}> {
  const zero = {
    metrics: totalsToListingMetrics({ ...ZERO_DASHBOARD_ANALYTICS_TOTALS }),
    recentEvents: [] as DashboardRecentActivityItem[],
    analyticsUnavailable: true,
  };

  if (!isSupabaseAdminConfigured()) return zero;

  const admin = sb ?? getAdminSupabase();
  const owner = ownerId.trim();
  const keys = [...new Set(listingKeys.map((k) => k.trim()).filter(Boolean))];
  if (!owner || keys.length === 0) return { ...zero, analyticsUnavailable: false };

  const ownerKeys = await collectOwnerListingKeysForAnalytics(admin, owner);
  const keySet = new Set([...ownerKeys, ...keys]);
  const { events, unavailable } = await loadOwnerAnalyticsEvents(admin, owner, [...keySet]);

  if (unavailable) return zero;

  const keySetForRollup = new Set(keys);
  const scoped = events.filter((row) => {
    const k = (row.canonical_ad_id ?? row.listing_id ?? "").trim();
    return k && keySetForRollup.has(k);
  });

  return {
    metrics: totalsToListingMetrics(aggregateDashboardAnalyticsTotals(scoped)),
    recentEvents: buildRecentActivity(scoped, 30),
    analyticsUnavailable: false,
  };
}
