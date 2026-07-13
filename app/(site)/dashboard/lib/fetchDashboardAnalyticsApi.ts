/**
 * Gate G2C — Client fetch helpers for secure dashboard analytics APIs.
 */
import type { OwnerAnalyticsTotals } from "./dashboardAnalyticsSummary";
import type { ListingViewRow } from "./ownerListingAnalyticsInsights";
import type { ListingAnalyticsBucket } from "./listingAnalyticsAggregate";

export type DashboardAnalyticsTotalsClient = {
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
    profile_views?: number;
    listing_opens?: number;
    cta_clicks_other?: number;
};

export type DashboardAnalyticsSummaryResponse = {
  ok: true;
  listing_count: number;
  totals: DashboardAnalyticsTotalsClient;
  by_category: Record<string, DashboardAnalyticsTotalsClient>;
  by_listing: Record<
    string,
    {
      views: number;
      unique_views_estimate: number;
      likes: number;
      saves: number;
      shares: number;
      messages: number;
      phone_clicks?: number;
      whatsapp_clicks?: number;
      email_clicks?: number;
      message_clicks?: number;
      profile_views?: number;
      listing_opens?: number;
      cta_clicks_other?: number;
      leads?: number;
      applications?: number;
      last_engagement?: string;
    }
  >;
  recent_activity: unknown[];
  listing_view_leaders: ListingViewRow[];
  listing_view_laggards: ListingViewRow[];
  listings_query_failed: boolean;
  analytics_unavailable: boolean;
  legacy_totals: OwnerAnalyticsTotals;
};

export type DashboardAnalyticsSummaryClientResult = {
  totals: OwnerAnalyticsTotals;
  byCategoryTotals: Record<string, OwnerAnalyticsTotals>;
  listingCount: number;
  listingAnalyticsUnavailable: boolean;
  listingsQueryFailed: boolean;
  leaders: ListingViewRow[];
  laggards: ListingViewRow[];
  byListing: DashboardAnalyticsSummaryResponse["by_listing"];
};

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export function dashboardAnalyticsTotalsToOwnerTotals(
  totals: DashboardAnalyticsTotalsClient,
): OwnerAnalyticsTotals {
  const ctaClicks =
    (totals.phone_clicks ?? 0) +
    (totals.whatsapp_clicks ?? 0) +
    (totals.email_clicks ?? 0) +
    (totals.message_clicks ?? 0) +
    (totals.website_clicks ?? 0) +
    (totals.directions_clicks ?? 0) +
    (totals.contact_clicks ?? 0) +
    (totals.cta_clicks_other ?? 0);

  return {
    listingViews: totals.views ?? 0,
    uniqueListingViewsEstimate: totals.unique_views_estimate ?? 0,
    saves: totals.saves ?? 0,
    shares: totals.shares ?? 0,
    messages: totals.messages ?? 0,
    profileViews: totals.profile_views ?? 0,
    listingOpens: totals.listing_opens ?? 0,
    likes: totals.likes ?? 0,
    ctaClicks,
    leads: totals.leads ?? 0,
    applications: totals.applications ?? 0,
  };
}

export async function fetchDashboardAnalyticsSummary(
  accessToken: string,
): Promise<DashboardAnalyticsSummaryClientResult | null> {
  if (!accessToken.trim()) return null;
  try {
    const res = await fetch("/api/dashboard/analytics/summary", {
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as DashboardAnalyticsSummaryResponse;
    if (!data.ok) return null;
    const byCategoryTotals = Object.fromEntries(
      Object.entries(data.by_category ?? {}).map(([category, totals]) => [
        category,
        dashboardAnalyticsTotalsToOwnerTotals(totals),
      ]),
    );
    return {
      totals: data.legacy_totals,
      byCategoryTotals,
      listingCount: data.listing_count,
      listingAnalyticsUnavailable: data.analytics_unavailable,
      listingsQueryFailed: data.listings_query_failed,
      leaders: data.listing_view_leaders ?? [],
      laggards: data.listing_view_laggards ?? [],
      byListing: data.by_listing ?? {},
    };
  } catch {
    return null;
  }
}

export type DashboardListingAnalyticsResponse = {
  ok: true;
  canonical_ad_id: string;
  source_table: string;
  source_id: string;
  category: string;
  title?: string | null;
  status?: string | null;
  leonix_ad_id?: string | null;
  metrics: {
    views: number;
    unique_views_estimate: number;
    likes: number;
    saves: number;
    shares: number;
    messages: number;
    phone_clicks?: number;
    whatsapp_clicks?: number;
    email_clicks?: number;
    message_clicks?: number;
    website_clicks?: number;
    directions_clicks?: number;
    contact_clicks?: number;
    profile_views?: number;
    listing_opens?: number;
    cta_clicks_other?: number;
    leads?: number;
    applications?: number;
    last_engagement?: string;
  };
  recent_events: unknown[];
  analytics_unavailable: boolean;
};

export async function fetchDashboardListingAnalytics(
  accessToken: string,
  params: {
    source_table: string;
    source_id: string;
    category?: string;
    canonical_ad_id?: string;
  },
): Promise<{
  stats: ListingAnalyticsBucket & { lastEngagement?: string };
  degraded: boolean;
  forbidden: boolean;
  meta?: {
    title?: string | null;
    status?: string | null;
    leonixAdId?: string | null;
    category?: string | null;
  };
} | null> {
  if (!accessToken.trim()) return null;
  const q = new URLSearchParams({
    source_table: params.source_table,
    source_id: params.source_id,
  });
  if (params.category) q.set("category", params.category);
  if (params.canonical_ad_id) q.set("canonical_ad_id", params.canonical_ad_id);

  try {
    const res = await fetch(`/api/dashboard/analytics/listing?${q.toString()}`, {
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
    if (res.status === 401) return null;
    if (res.status === 403) return { stats: emptyStats(), degraded: false, forbidden: true };
    if (!res.ok) return { stats: emptyStats(), degraded: true, forbidden: false };
    const data = (await res.json()) as DashboardListingAnalyticsResponse;
    if (!data.ok) return { stats: emptyStats(), degraded: true, forbidden: false };
    const m = data.metrics;
    const ctaClicks =
      (m.phone_clicks ?? 0) +
      (m.whatsapp_clicks ?? 0) +
      (m.email_clicks ?? 0) +
      (m.message_clicks ?? 0) +
      (m.website_clicks ?? 0) +
      (m.directions_clicks ?? 0) +
      (m.contact_clicks ?? 0) +
      (m.cta_clicks_other ?? 0);
    return {
      stats: {
        views: m.views,
        uniqueViews: m.unique_views_estimate,
        messages: m.messages,
        saves: m.saves,
        shares: m.shares,
        profileClicks: m.profile_views ?? 0,
        listingOpens: m.listing_opens ?? 0,
        likes: m.likes,
        ctaClicks,
        phoneClicks: m.phone_clicks ?? 0,
        whatsappClicks: m.whatsapp_clicks ?? 0,
        emailClicks: m.email_clicks ?? 0,
        messageClicks: m.message_clicks ?? 0,
        leads: m.leads ?? 0,
        applications: m.applications ?? 0,
        lastEngagement: m.last_engagement,
      },
      degraded: data.analytics_unavailable,
      forbidden: false,
      meta: {
        title: data.title ?? null,
        status: data.status ?? null,
        leonixAdId: data.leonix_ad_id ?? null,
        category: data.category ?? null,
      },
    };
  } catch {
    return { stats: emptyStats(), degraded: true, forbidden: false };
  }
}

function emptyStats(): ListingAnalyticsBucket & { lastEngagement?: string } {
  return {
    views: 0,
    uniqueViews: 0,
    messages: 0,
    saves: 0,
    shares: 0,
    profileClicks: 0,
    listingOpens: 0,
    likes: 0,
    ctaClicks: 0,
    phoneClicks: 0,
    whatsappClicks: 0,
    emailClicks: 0,
    messageClicks: 0,
    leads: 0,
    applications: 0,
  };
}

/** Map secure API by_listing row to aggregateListingAnalyticsEvents bucket shape. */
export function hubListingMetricsFromSummary(
  byListing: DashboardAnalyticsSummaryResponse["by_listing"],
  listingIds: string[],
): Record<string, ListingAnalyticsBucket> {
  const out: Record<string, ListingAnalyticsBucket> = {};
  for (const id of listingIds) {
    const m = byListing[id];
    if (!m) {
      out[id] = emptyStats();
      continue;
    }
    out[id] = {
      views: m.views,
      uniqueViews: m.unique_views_estimate,
      messages: m.messages,
      saves: m.saves,
      shares: m.shares,
      profileClicks: m.profile_views ?? 0,
      listingOpens: m.listing_opens ?? 0,
      likes: m.likes,
      ctaClicks: m.cta_clicks_other ?? 0,
      phoneClicks: m.phone_clicks ?? 0,
      whatsappClicks: m.whatsapp_clicks ?? 0,
      emailClicks: m.email_clicks ?? 0,
      messageClicks: m.message_clicks ?? 0,
      leads: m.leads ?? 0,
      applications: m.applications ?? 0,
      lastEngagement: m.last_engagement,
    };
  }
  return out;
}
