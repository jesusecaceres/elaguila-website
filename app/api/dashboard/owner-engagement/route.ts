import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { dashboardTotalsToLegacyOwnerTotals } from "@/app/lib/analytics/server/dashboardAnalyticsMetrics";
import { fetchOwnerDashboardAnalyticsServer } from "@/app/lib/analytics/server/fetchOwnerDashboardAnalyticsServer";
import {
  fetchOwnerEngagementRollupsServer,
  supplementOwnerTotalsWithRollups,
} from "@/app/lib/ownerEngagementRollupsServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 });
  }

  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }

  const ownerId = data.user.id;
  const snap = isSupabaseAdminConfigured()
    ? await fetchOwnerDashboardAnalyticsServer(ownerId)
    : null;
  const clientAgg = snap
    ? {
        totals: dashboardTotalsToLegacyOwnerTotals(snap.totals, snap.lastEngagement),
        listingCount: snap.listingCount,
        listingAnalyticsUnavailable: snap.analyticsUnavailable,
      }
    : {
        totals: dashboardTotalsToLegacyOwnerTotals({
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
        listingCount: 0,
        listingAnalyticsUnavailable: true,
      };
  const rollups = isSupabaseAdminConfigured() ? await fetchOwnerEngagementRollupsServer(ownerId) : null;
  const totals = supplementOwnerTotalsWithRollups(clientAgg.totals, rollups);

  return NextResponse.json({
    ok: true,
    totals,
    listingCount: clientAgg.listingCount,
    listingAnalyticsUnavailable: clientAgg.listingAnalyticsUnavailable,
    serviciosBySlug: rollups?.serviciosBySlug ?? {},
  });
}
