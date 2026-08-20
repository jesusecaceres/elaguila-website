import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import {
  dashboardTotalsToLegacyOwnerTotals,
  ZERO_DASHBOARD_ANALYTICS_TOTALS,
} from "@/app/lib/analytics/server/dashboardAnalyticsMetrics";
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
      totals: { ...ZERO_DASHBOARD_ANALYTICS_TOTALS },
      by_category: {},
      by_listing: {},
      recent_activity: [],
      listing_view_leaders: [],
      listing_view_laggards: [],
      listings_query_failed: false,
      analytics_unavailable: true,
      legacy_totals: dashboardTotalsToLegacyOwnerTotals({ ...ZERO_DASHBOARD_ANALYTICS_TOTALS }),
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
