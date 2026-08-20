import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import {
  buildOfertaLocalRenewalCheckoutMetadata,
  createOfertaLocalRenewalAttempt,
  loadOpenOfertaLocalRenewalAttempt,
  resolveOfertaLocalRenewalEligibility,
  type OfertaLocalRenewalParentRow,
} from "@/app/lib/ofertas-locales/ofertasLocalesRenewals";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const PARENT_SELECT =
  "id, owner_id, status, offer_type, leonix_ad_id, published_at, expires_at, commercial_product_key, active_source_asset_id, public_source_asset_id, asset_lifecycle_status, asset_replacement_required_review";

async function loadParent(id: string): Promise<OfertaLocalRenewalParentRow | null> {
  const { data } = await getAdminSupabase()
    .from("ofertas_locales")
    .select(PARENT_SELECT)
    .eq("id", id)
    .maybeSingle();
  return (data as OfertaLocalRenewalParentRow | null) ?? null;
}
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  const { id } = await ctx.params;
  const parent = await loadParent(id);
  if (!parent) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (parent.owner_id !== ownerId) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const eligibility = await resolveOfertaLocalRenewalEligibility({
    supabase: getAdminSupabase(),
    parent,
    ownerId,
  });

  return NextResponse.json({
    ok: true,
    eligibility: eligibility.code,
    message: eligibility.message,
    daysRemaining: eligibility.daysRemaining,
    product: eligibility.product
      ? {
          packageKey: eligibility.product.packageKey,
          amountCents: eligibility.product.amountCents,
          currency: eligibility.product.currency,
          durationDays: eligibility.product.durationDays,
        }
      : null,
    renewalAttempt: eligibility.openAttempt,
  });
}
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  const { id } = await ctx.params;
  const parent = await loadParent(id);
  if (!parent) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (parent.owner_id !== ownerId) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const sourceAssetVersionId =
    typeof body.sourceAssetVersionId === "string" && body.sourceAssetVersionId.trim()
      ? body.sourceAssetVersionId.trim()
      : null;
  const commercialPath = body.commercialPath === "partner_courtesy" ? "partner_courtesy" : "paid";

  const created = await createOfertaLocalRenewalAttempt({
    supabase: getAdminSupabase(),
    parent,
    ownerId,
    sourceAssetVersionId,
    commercialPath,
  });
  if (!created.ok) {
    return NextResponse.json({ ok: false, error: created.error }, { status: created.status });
  }

  const open = await loadOpenOfertaLocalRenewalAttempt({
    supabase: getAdminSupabase(),
    ofertaLocalId: parent.id,
    productKey: created.attempt.product_key,
  });
  const attempt = open ?? created.attempt;
  return NextResponse.json({
    ok: true,
    renewalAttempt: attempt,
    checkout: {
      required: attempt.commercial_path === "paid",
      operation: "renew_listing",
      metadata: buildOfertaLocalRenewalCheckoutMetadata({
        renewalAttemptId: attempt.id,
        currentExpiresAt: parent.expires_at,
      }),
      startsPublicTerm: false,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  const { id } = await ctx.params;
  const parent = await loadParent(id);
  if (!parent) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (parent.owner_id !== ownerId) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const action = String(body.action ?? "").trim();
  const renewalAttemptId = String(body.renewalAttemptId ?? "").trim();
  if (!renewalAttemptId || !["select_source", "submit", "cancel"].includes(action)) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 422 });
  }

  const supabase = getAdminSupabase();
  const { data: attempt } = await supabase
    .from("ofertas_local_renewal_attempts")
    .select("id, state, commercial_path, payment_record_id, package_entitlement_id, partner_assignment_id, source_asset_version_id")
    .eq("id", renewalAttemptId)
    .eq("oferta_local_id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (!attempt) return NextResponse.json({ ok: false, error: "renewal_not_found" }, { status: 404 });

  const now = new Date().toISOString();
  if (action === "cancel") {
    if (!["draft", "awaiting_payment", "payment_pending", "authorized", "preparing_content"].includes(String(attempt.state))) {
      return NextResponse.json({ ok: false, error: "renewal_cancel_not_allowed" }, { status: 409 });
    }
    await supabase
      .from("ofertas_local_renewal_attempts")
      .update({ state: "cancelled", cancelled_at: now, updated_at: now })
      .eq("id", renewalAttemptId)
      .eq("owner_id", ownerId);
    return NextResponse.json({ ok: true });
  }

  if (action === "select_source") {
    const sourceAssetVersionId =
      typeof body.sourceAssetVersionId === "string" && body.sourceAssetVersionId.trim()
        ? body.sourceAssetVersionId.trim()
        : parent.public_source_asset_id || parent.active_source_asset_id || null;
    if (!sourceAssetVersionId) return NextResponse.json({ ok: false, error: "source_required" }, { status: 422 });
    const { error } = await supabase
      .from("ofertas_local_renewal_attempts")
      .update({ source_asset_version_id: sourceAssetVersionId, state: "preparing_content", updated_at: now })
      .eq("id", renewalAttemptId)
      .eq("owner_id", ownerId);
    if (error) return NextResponse.json({ ok: false, error: "source_select_failed" }, { status: 500 });
    return NextResponse.json({ ok: true, sourceAssetVersionId });
  }

  const paidAuthorized =
    attempt.commercial_path === "paid" &&
    Boolean(attempt.payment_record_id) &&
    Boolean(attempt.package_entitlement_id);
  const courtesyAuthorized =
    attempt.commercial_path === "partner_courtesy" && Boolean(attempt.partner_assignment_id);
  if (!paidAuthorized && !courtesyAuthorized) {
    return NextResponse.json({ ok: false, error: "renewal_authorization_required" }, { status: 402 });
  }
  if (!attempt.source_asset_version_id) {
    return NextResponse.json({ ok: false, error: "source_required" }, { status: 422 });
  }

  const [{ count: blockingPages }, { count: unresolvedItems }] = await Promise.all([
    supabase
      .from("oferta_local_scan_pages")
      .select("id", { count: "exact", head: true })
      .eq("oferta_local_id", id)
      .eq("source_asset_version_id", attempt.source_asset_version_id)
      .in("page_status", ["queued", "processing", "failed"]),
    supabase
      .from("oferta_local_items")
      .select("id", { count: "exact", head: true })
      .eq("oferta_local_id", id)
      .eq("source_asset_version_id", attempt.source_asset_version_id)
      .in("review_status", ["pending", "needs_review"]),
  ]);
  if ((blockingPages ?? 0) > 0) return NextResponse.json({ ok: false, error: "blocking_scan_pages" }, { status: 422 });
  if ((unresolvedItems ?? 0) > 0) return NextResponse.json({ ok: false, error: "unresolved_review_items" }, { status: 422 });

  const { error } = await supabase
    .from("ofertas_local_renewal_attempts")
    .update({ state: "pending_review", submitted_at: now, updated_at: now })
    .eq("id", renewalAttemptId)
    .eq("owner_id", ownerId);
  if (error) return NextResponse.json({ ok: false, error: "renewal_submit_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, state: "pending_review" });
}
