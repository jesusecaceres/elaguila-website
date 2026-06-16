/**
 * Gate G2C — Server-side listing_analytics aggregation for seller dashboard reads.
 */
import {
  rollupListingAnalyticsEvents,
  type ListingAnalyticsBucket,
} from "@/app/(site)/dashboard/lib/listingAnalyticsAggregate";

export type DashboardAnalyticsEventRow = {
  id?: string;
  listing_id?: string | null;
  canonical_ad_id?: string | null;
  event_type?: string;
  user_id?: string | null;
  created_at?: string;
  category?: string | null;
  owner_user_id?: string | null;
  event_source?: string | null;
  source_table?: string | null;
  source_id?: string | null;
};

export type DashboardAnalyticsTotals = {
  views: number;
  unique_views_estimate: number;
  likes: number;
  saves: number;
  shares: number;
  messages: number;
  phone_clicks: number;
  whatsapp_clicks: number;
  email_clicks: number;
  message_clicks: number;
  website_clicks: number;
  directions_clicks: number;
  result_card_clicks: number;
  impressions: number;
  leads: number;
  applications: number;
  contact_clicks: number;
  profile_views: number;
  listing_opens: number;
  cta_clicks_other: number;
};

export const ZERO_DASHBOARD_ANALYTICS_TOTALS: DashboardAnalyticsTotals = {
  views: 0,
  unique_views_estimate: 0,
  likes: 0,
  saves: 0,
  shares: 0,
  messages: 0,
  phone_clicks: 0,
  whatsapp_clicks: 0,
  email_clicks: 0,
  message_clicks: 0,
  website_clicks: 0,
  directions_clicks: 0,
  result_card_clicks: 0,
  impressions: 0,
  leads: 0,
  applications: 0,
  contact_clicks: 0,
  profile_views: 0,
  listing_opens: 0,
  cta_clicks_other: 0,
};

export type DashboardRecentActivityItem = {
  event_type: string;
  listing_id: string | null;
  created_at: string;
  category: string | null;
  event_source: string | null;
};

function listingKeyForRow(row: DashboardAnalyticsEventRow): string {
  return (row.canonical_ad_id ?? row.listing_id ?? "").trim();
}

export function eventBelongsToOwner(
  row: DashboardAnalyticsEventRow,
  ownerId: string,
  ownerKeySet: Set<string>,
): boolean {
  const ou = (row.owner_user_id ?? "").trim();
  if (ou && ou !== ownerId) return false;
  if (ou === ownerId) return true;
  const key = listingKeyForRow(row);
  return Boolean(key && ownerKeySet.has(key));
}

export function dedupeDashboardAnalyticsRows(rows: DashboardAnalyticsEventRow[]): DashboardAnalyticsEventRow[] {
  const seen = new Set<string>();
  const out: DashboardAnalyticsEventRow[] = [];
  for (const row of rows) {
    const key =
      row.id?.trim() ||
      `${listingKeyForRow(row)}|${row.event_type ?? ""}|${row.created_at ?? ""}|${row.user_id ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function aggregateDashboardAnalyticsTotals(
  events: DashboardAnalyticsEventRow[],
): DashboardAnalyticsTotals {
  const totals = { ...ZERO_DASHBOARD_ANALYTICS_TOTALS };
  const viewUsers = new Set<string>();

  for (const row of events) {
    const t = row.event_type ?? "";
    const uid = row.user_id ?? null;

    if (t === "listing_view") {
      totals.views += 1;
      if (uid) viewUsers.add(uid);
    } else if (t === "listing_impression") totals.impressions += 1;
    else if (t === "result_card_click") totals.result_card_clicks += 1;
    else if (t === "listing_save") totals.saves += 1;
    else if (t === "listing_unsave") totals.saves -= 1;
    else if (t === "listing_share") totals.shares += 1;
    else if (t === "message_sent") totals.messages += 1;
    else if (t === "profile_view") totals.profile_views += 1;
    else if (t === "listing_open") totals.listing_opens += 1;
    else if (t === "listing_like") totals.likes += 1;
    else if (t === "listing_unlike") totals.likes -= 1;
    else if (t === "phone_click") totals.phone_clicks += 1;
    else if (t === "whatsapp_click") totals.whatsapp_clicks += 1;
    else if (t === "email_click") totals.email_clicks += 1;
    else if (t === "message_click") totals.message_clicks += 1;
    else if (t === "website_click") totals.website_clicks += 1;
    else if (t === "directions_click") totals.directions_clicks += 1;
    else if (t === "contact_click" || t === "outbound_click") totals.contact_clicks += 1;
    else if (t === "cta_click") totals.cta_clicks_other += 1;
    else if (t === "lead_created") totals.leads += 1;
    else if (t === "apply_started" || t === "apply_submitted") totals.applications += 1;
  }

  totals.saves = Math.max(0, totals.saves);
  totals.likes = Math.max(0, totals.likes);
  totals.unique_views_estimate = viewUsers.size;
  return totals;
}

export function dashboardTotalsToLegacyOwnerTotals(
  totals: DashboardAnalyticsTotals,
  lastEngagement?: string,
): import("@/app/(site)/dashboard/lib/dashboardAnalyticsSummary").OwnerAnalyticsTotals {
  const ctaClicks =
    totals.phone_clicks +
    totals.whatsapp_clicks +
    totals.email_clicks +
    totals.message_clicks +
    totals.website_clicks +
    totals.directions_clicks +
    totals.contact_clicks +
    totals.cta_clicks_other;

  return {
    listingViews: totals.views,
    uniqueListingViewsEstimate: totals.unique_views_estimate,
    saves: totals.saves,
    shares: totals.shares,
    messages: totals.messages,
    profileViews: totals.profile_views,
    listingOpens: totals.listing_opens,
    likes: totals.likes,
    ctaClicks,
    leads: totals.leads,
    applications: totals.applications,
    lastEngagement,
  };
}

export function bucketToDashboardListingMetrics(bucket: ListingAnalyticsBucket) {
  return {
    views: bucket.views,
    unique_views_estimate: bucket.uniqueViews,
    likes: bucket.likes,
    saves: bucket.saves,
    shares: bucket.shares,
    messages: bucket.messages,
    phone_clicks: bucket.phoneClicks,
    whatsapp_clicks: bucket.whatsappClicks,
    email_clicks: bucket.emailClicks,
    message_clicks: bucket.messageClicks,
    website_clicks: 0,
    directions_clicks: 0,
    result_card_clicks: 0,
    impressions: 0,
    leads: bucket.leads,
    applications: bucket.applications,
    contact_clicks: 0,
    profile_views: bucket.profileClicks,
    listing_opens: bucket.listingOpens,
    cta_clicks_other: bucket.ctaClicks,
    last_engagement: bucket.lastEngagement,
  };
}

export function rollupEventsForListingKeys(
  events: DashboardAnalyticsEventRow[],
  listingKeys: string[],
): ListingAnalyticsBucket {
  const mapped = events.map((e) => ({
    listing_id: (listingKeyForRow(e) || e.listing_id || null) as string | null,
    event_type: e.event_type ?? "",
    user_id: e.user_id,
    created_at: e.created_at,
  }));
  return rollupListingAnalyticsEvents(mapped, listingKeys);
}

export function aggregateByHubListingId(
  events: DashboardAnalyticsEventRow[],
  hubListingIds: string[],
  keysByListingId: Record<string, string[]>,
): Record<string, ReturnType<typeof bucketToDashboardListingMetrics>> {
  const mapped = events.map((e) => ({
    listing_id: (listingKeyForRow(e) || e.listing_id || null) as string | null,
    event_type: e.event_type ?? "",
    user_id: e.user_id,
    created_at: e.created_at,
  }));
  const out: Record<string, ReturnType<typeof bucketToDashboardListingMetrics>> = {};
  for (const id of hubListingIds) {
    const keys = keysByListingId[id] ?? [id];
    const rolled = rollupListingAnalyticsEvents(mapped, keys);
    out[id] = bucketToDashboardListingMetrics(rolled);
  }
  return out;
}

export function buildRecentActivity(
  events: DashboardAnalyticsEventRow[],
  limit = 20,
): DashboardRecentActivityItem[] {
  return [...events]
    .filter((e) => e.created_at)
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
    .slice(0, limit)
    .map((e) => ({
      event_type: e.event_type ?? "",
      listing_id: (listingKeyForRow(e) || e.listing_id) ?? null,
      created_at: e.created_at!,
      category: e.category ?? null,
      event_source: e.event_source ?? null,
    }));
}

export function lastEngagementIso(events: DashboardAnalyticsEventRow[]): string | undefined {
  let last: string | undefined;
  for (const row of events) {
    const c = row.created_at;
    if (!c) continue;
    if (!last || new Date(c) > new Date(last)) last = c;
  }
  return last;
}

