import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { buildAnalyticsKeySet } from "@/app/lib/analytics/listingAnalyticsIdentity";
import { fetchListingDashboardAnalyticsServer } from "@/app/lib/analytics/server/fetchOwnerDashboardAnalyticsServer";
import { resolveListingAnalyticsIdentity } from "@/app/lib/analytics/server/resolveListingAnalyticsIdentity";
import {
  fullOnlyFeatureDeniedBody,
  resolveFullOnlyFeatureGate,
} from "@/app/lib/listingPlans/fullOnlyFeatureGate";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/analytics/listing?source_table=&source_id=&canonical_ad_id=
 *
 * A `category` param is accepted by callers but deliberately ignored here — see the note at the
 * identity resolution below. The category is always read from the row or fixed by the source table.
 */
export async function GET(req: NextRequest) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const sourceTable = sp.get("source_table")?.trim() ?? "";
  const sourceId = sp.get("source_id")?.trim() ?? "";
  const canonicalAdId = sp.get("canonical_ad_id")?.trim() || undefined;

  if (!sourceTable || !sourceId) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }

  // The `category` query param is deliberately NOT forwarded. For the multi-category `listings`
  // table, a supplied hint overrides the stored category (resolveListingsRow), which is harmless
  // for display but must never reach an entitlement decision: a Simple business owner could pass
  // a classified category and open the FULL-only gate below on a listing they really do own.
  // Without the hint every category here is read from the row or fixed by the source table.
  const resolved = await resolveListingAnalyticsIdentity({
    sourceTable,
    sourceId,
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

  // Analytics is a FULL-only capability. Ownership is not entitlement: a Simple customer owns
  // their listing and would otherwise read this route directly. Denies only `simple`, so every
  // other listing — classifieds included — keeps the behaviour it has today.
  const gate = await resolveFullOnlyFeatureGate({
    category: resolved.identity.category,
    listingSource: resolved.identity.sourceTable,
    listingId: resolved.identity.sourceId,
    capability: "analytics",
  });
  if (gate.denied) {
    return NextResponse.json(fullOnlyFeatureDeniedBody(gate), { status: 403 });
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
    title: resolved.identity.title ?? null,
    status: resolved.identity.status ?? null,
    leonix_ad_id: resolved.identity.leonixAdId ?? null,
    metrics,
    recent_events: recentEvents,
    analytics_unavailable: analyticsUnavailable,
  });
}
