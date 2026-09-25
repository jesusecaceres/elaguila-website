import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { findRecentDuplicateAnalyticsEvent } from "@/app/lib/analytics/server/analyticsEventDedupe";
import { resolveListingAnalyticsIdentity } from "@/app/lib/analytics/server/resolveListingAnalyticsIdentity";
import { isSelfEngagement } from "@/app/lib/analytics/selfEngagementGuard";
import {
  assertAnalyticsEventAuth,
  parseAnalyticsEventBody,
  sanitizeAnalyticsMetadata,
} from "@/app/lib/analytics/server/validateAnalyticsEvent";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApiError =
  | "invalid_payload"
  | "invalid_event_type"
  | "invalid_source_table"
  | "listing_not_found"
  | "auth_required"
  | "insert_failed"
  | "db_not_configured";

function errorResponse(error: ApiError, status: number) {
  return NextResponse.json({ ok: false as const, error }, { status });
}

/**
 * POST /api/analytics/events — global validated listing_analytics writes (service role).
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return errorResponse("db_not_configured", 503);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorResponse("invalid_payload", 400);
  }

  const parsed = parseAnalyticsEventBody(raw);
  if (!parsed.ok) {
    const status = parsed.error === "invalid_event_type" || parsed.error === "invalid_source_table" ? 400 : 400;
    return errorResponse(parsed.error, status);
  }

  const authenticatedUserId = await getBearerUserId(req);
  const authCheck = assertAnalyticsEventAuth(parsed.payload.event_type, authenticatedUserId);
  if (!authCheck.ok) {
    return errorResponse(authCheck.error, 401);
  }

  const resolved = await resolveListingAnalyticsIdentity({
    sourceTable: parsed.payload.source_table,
    sourceId: parsed.payload.source_id,
    category: parsed.payload.category,
    canonicalAdId: parsed.payload.canonical_ad_id,
  });

  if (!resolved.ok) {
    if (resolved.error === "db_not_configured") return errorResponse("db_not_configured", 503);
    if (resolved.error === "invalid_source_table") return errorResponse("invalid_source_table", 400);
    if (resolved.error === "invalid_source_id") return errorResponse("invalid_payload", 400);
    return errorResponse("listing_not_found", 404);
  }

  const identity = resolved.identity;
  const supabase = getAdminSupabase();

  // RED #10 (Globalization Build A) — the write endpoint previously never compared owner_user_id
  // to the acting user_id, so a logged-in owner browsing/clicking their own listing silently
  // inflated their own counts. This is the single shared choke point every caller goes through,
  // so the fix belongs here rather than in each category's own client code (the pre-existing
  // client-side `isSelfEngagement` guard only covered Like/Save on 5 files and could never catch
  // every caller). Anonymous self-views (an owner not logged in) remain undetectable — that
  // requires new session-identity infrastructure and is out of scope for this fix.
  if (isSelfEngagement(authenticatedUserId, identity.ownerUserId)) {
    return NextResponse.json({
      ok: true,
      selfAction: true,
      canonical_ad_id: identity.canonicalAdId,
      category: identity.category,
      source_table: identity.sourceTable,
      source_id: identity.sourceId,
    });
  }

  const isDuplicate = await findRecentDuplicateAnalyticsEvent(supabase, {
    canonicalAdId: identity.canonicalAdId,
    eventType: parsed.payload.event_type,
    userId: authenticatedUserId,
    anonymousSessionId: parsed.payload.anonymous_session_id ?? null,
  });

  if (isDuplicate) {
    return NextResponse.json({
      ok: true,
      deduped: true,
      canonical_ad_id: identity.canonicalAdId,
      category: identity.category,
      source_table: identity.sourceTable,
      source_id: identity.sourceId,
    });
  }

  const clientCategory = parsed.payload.category?.trim();
  const metadata = {
    ...sanitizeAnalyticsMetadata(parsed.payload.metadata),
    ...(clientCategory ? { client_category: clientCategory } : {}),
    ...(identity.title ? { resolved_title: identity.title } : {}),
    ...(identity.publicUrl ? { public_url: identity.publicUrl } : {}),
    ...(identity.detailUrl ? { detail_url: identity.detailUrl } : {}),
  };

  const insertRow = {
    listing_id: identity.canonicalAdId,
    canonical_ad_id: identity.canonicalAdId,
    source_table: identity.sourceTable,
    source_id: identity.sourceId,
    category: identity.category,
    owner_user_id: identity.ownerUserId,
    user_id: authenticatedUserId,
    anonymous_session_id: parsed.payload.anonymous_session_id?.trim() || null,
    event_type: parsed.payload.event_type,
    event_source: parsed.payload.event_source?.trim() || null,
    metadata,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("listing_analytics")
    .insert(insertRow)
    .select("id")
    .single();

  if (insertError) {
    console.error("[analytics/events] insert_failed", insertError);
    return errorResponse("insert_failed", 500);
  }

  return NextResponse.json({
    ok: true,
    event_id: inserted?.id ?? null,
    canonical_ad_id: identity.canonicalAdId,
    category: identity.category,
    source_table: identity.sourceTable,
    source_id: identity.sourceId,
  });
}
