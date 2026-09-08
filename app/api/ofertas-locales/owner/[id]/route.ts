import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import {
  getOfertaLocalForOwner,
  mapOfertaLocalAdminRowToDraftRecoveryPatch,
  mapOfertaLocalRowToOwnerDetail,
  OFERTAS_LOCALES_OWNER_EDITABLE_STATUSES,
} from "@/app/lib/ofertas-locales/ofertasLocalesOwnerHelpers";
import {
  buildOfertaLocalOwnerUpdatePayload,
  stripForbiddenOwnerUpdateFields,
  validateOfertaLocalOwnerUpdateInput,
} from "@/app/lib/ofertas-locales/ofertasLocalesOwnerUpdateMapper";
import { validateOfertaLocalSubmissionEntitlement } from "@/app/lib/ofertas-locales/ofertasLocalesCommercialServer";
import { ensureOfertaLocalLeonixAdId } from "@/app/lib/ofertas-locales/ofertasLocalesLeonixAdId";
import { fetchListingDashboardAnalyticsServer } from "@/app/lib/analytics/server/fetchOwnerDashboardAnalyticsServer";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  const { id } = await ctx.params;
  const langParam = req.nextUrl.searchParams.get("lang")?.trim();
  const lang = langParam === "en" ? "en" : "es";

  const row = await getOfertaLocalForOwner(getAdminSupabase(), ownerId, id);
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const detail = mapOfertaLocalRowToOwnerDetail(row, lang);
  const analytics = await fetchListingDashboardAnalyticsServer(
    ownerId,
    [row.id, row.leonix_ad_id ?? ""].filter(Boolean),
    getAdminSupabase(),
  );

  return NextResponse.json({
    ok: true,
    // Lets the publish wizard recover an in-progress application (business
    // info, contact, assets) when local browser draft state is unavailable —
    // e.g. a different Preview deployment origin, device, or cleared storage.
    draftPatch: OFERTAS_LOCALES_OWNER_EDITABLE_STATUSES.includes(row.status)
      ? mapOfertaLocalAdminRowToDraftRecoveryPatch(row)
      : null,
    offer: {
      ...detail,
      analytics: {
        views: analytics.metrics.views,
        listingOpens: analytics.metrics.listing_opens,
        productOpens: analytics.metrics.product_opens,
        productSearchClicks: analytics.metrics.product_search_result_clicks,
        shares: analytics.metrics.shares,
        shoppingListAdds: analytics.metrics.shopping_list_adds,
        contactActions:
          analytics.metrics.phone_clicks +
          analytics.metrics.whatsapp_clicks +
          analytics.metrics.email_clicks +
          analytics.metrics.message_clicks,
        websiteClicks: analytics.metrics.website_clicks,
        directionsClicks: analytics.metrics.directions_clicks,
        lastActivity: analytics.recentEvents[0]?.created_at ?? null,
        unavailable: analytics.analyticsUnavailable,
      },
    },
  });
}

/**
 * Owner resubmit — allowed fields only; always returns to pending_review.
 * Blocks approved/archived edits and status escalation.
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  const { id } = await ctx.params;
  const supabase = getAdminSupabase();
  const row = await getOfertaLocalForOwner(supabase, ownerId, id);
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (!OFERTAS_LOCALES_OWNER_EDITABLE_STATUSES.includes(row.status)) {
    return NextResponse.json({ ok: false, error: "edit_not_allowed" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  if ("status" in raw || "owner_id" in raw || "internal_notes" in raw) {
    return NextResponse.json({ ok: false, error: "forbidden_fields" }, { status: 400 });
  }

  const updates = stripForbiddenOwnerUpdateFields(
    (raw.updates as Record<string, unknown> | undefined) ?? raw
  );
  const validationError = validateOfertaLocalOwnerUpdateInput(row, updates);
  if (validationError) {
    return NextResponse.json({ ok: false, error: validationError }, { status: 422 });
  }

  const payload = buildOfertaLocalOwnerUpdatePayload(row, updates);

  const leonix = await ensureOfertaLocalLeonixAdId({
    supabase,
    ofertaLocalId: id,
    ownerId,
  });
  if (!leonix.ok) {
    return NextResponse.json({ ok: false, error: leonix.code, detail: leonix.message }, { status: 500 });
  }

  const entitlement = await validateOfertaLocalSubmissionEntitlement({
    supabase,
    parent: {
      id: row.id,
      owner_id: row.owner_id,
      offer_type: row.offer_type,
      leonix_ad_id: leonix.leonixAdId,
    },
    ownerId,
  });
  if (!entitlement.ok) {
    return NextResponse.json(
      { ok: false, error: entitlement.code, detail: entitlement.message },
      { status: entitlement.status }
    );
  }
  payload.commercial_eligibility_source = entitlement.source;
  payload.partner_assignment_id =
    entitlement.source === "partner_courtesy" ? entitlement.partnerAssignmentId : null;

  const { data, error } = await supabase
    .from("ofertas_locales")
    .update(payload)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select("id, status, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    status: data.status,
    updatedAt: data.updated_at,
  });
}
