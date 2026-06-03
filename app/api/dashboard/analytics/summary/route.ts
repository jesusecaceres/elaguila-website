import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { dashboardTotalsToLegacyOwnerTotals } from "@/app/lib/analytics/server/dashboardAnalyticsMetrics";
import { fetchOwnerDashboardAnalyticsServer } from "@/app/lib/analytics/server/fetchOwnerDashboardAnalyticsServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/analytics/summary — seller-scoped account analytics (service role, Bearer auth).
 */
export async function GET(req: NextRequest) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      ok: true,
      listing_count: 0,
      totals: {
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
      },
      by_category: {},
      by_listing: {},
      recent_activity: [],
      listing_view_leaders: [],
      listing_view_laggards: [],
      listings_query_failed: false,
      analytics_unavailable: true,
      legacy_totals: dashboardTotalsToLegacyOwnerTotals({
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
      }),
    });
  }

  const snap = await fetchOwnerDashboardAnalyticsServer(ownerId);

  return NextResponse.json({
    ok: true,
    listing_count: snap.listingCount,
    totals: snap.totals,
    by_category: snap.byCategory,
    by_listing: snap.byListing,
    recent_activity: snap.recentActivity,
    listing_view_leaders: snap.listingViewLeaders,
    listing_view_laggards: snap.listingViewLaggards,
    listings_query_failed: snap.listingsQueryFailed,
    analytics_unavailable: snap.analyticsUnavailable,
    legacy_totals: dashboardTotalsToLegacyOwnerTotals(snap.totals, snap.lastEngagement),
  });
}
