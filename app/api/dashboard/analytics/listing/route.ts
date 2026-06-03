import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { buildAnalyticsKeySet } from "@/app/lib/analytics/listingAnalyticsIdentity";
import { fetchListingDashboardAnalyticsServer } from "@/app/lib/analytics/server/fetchOwnerDashboardAnalyticsServer";
import { resolveListingAnalyticsIdentity } from "@/app/lib/analytics/server/resolveListingAnalyticsIdentity";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/analytics/listing?source_table=&source_id=&canonical_ad_id=&category=
 */
export async function GET(req: NextRequest) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const sourceTable = sp.get("source_table")?.trim() ?? "";
  const sourceId = sp.get("source_id")?.trim() ?? "";
  const category = sp.get("category")?.trim() || undefined;
  const canonicalAdId = sp.get("canonical_ad_id")?.trim() || undefined;

  if (!sourceTable || !sourceId) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }

  const resolved = await resolveListingAnalyticsIdentity({
    sourceTable,
    sourceId,
    category,
    canonicalAdId,
  });

  if (!resolved.ok) {
    if (resolved.error === "listing_not_found") {
      return NextResponse.json({ ok: false, error: "listing_not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: resolved.error }, { status: 400 });
  }

  if (resolved.identity.ownerUserId !== ownerId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const listingKeys = buildAnalyticsKeySet(resolved.identity);
  const { metrics, recentEvents, analyticsUnavailable } = await fetchListingDashboardAnalyticsServer(
    ownerId,
    listingKeys,
  );

  return NextResponse.json({
    ok: true,
    canonical_ad_id: resolved.identity.canonicalAdId,
    source_table: resolved.identity.sourceTable,
    source_id: resolved.identity.sourceId,
    category: resolved.identity.category,
    metrics,
    recent_events: recentEvents,
    analytics_unavailable: analyticsUnavailable,
  });
}
