import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import {
  buildOfertasLocalesProductionInsertRow,
  OFERTAS_LOCALES_SCAN_PREP_RETURN_COLUMNS,
  pickScanPrepSubmittedAt,
} from "@/app/lib/ofertas-locales/ofertasLocalesProductionRowAdapter";
import {
  validateOfertaLocalSubmissionEntitlement,
} from "@/app/lib/ofertas-locales/ofertasLocalesCommercialServer";
import { ensureOfertaLocalLeonixAdId } from "@/app/lib/ofertas-locales/ofertasLocalesLeonixAdId";
import { validateOfertaLocalDraftForServerPublish } from "@/app/lib/ofertas-locales/ofertasLocalesPublishMapper";
import type {
  OfertaLocalDraft,
  OfertaLocalOfferType,
  OfertaLocalPublishStatus,
} from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

function isPlainDraft(v: unknown): v is OfertaLocalDraft {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function detectHeavyMedia(value: unknown, path = ""): boolean {
  if (typeof value === "string") {
    if (value.startsWith("data:image/") || value.startsWith("data:application/")) return true;
    if (value.length > 4096) return true;
    return false;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 40).some((item, i) => detectHeavyMedia(item, `${path}[${i}]`));
  }
  if (typeof value === "object" && value !== null) {
    return Object.keys(value as object)
      .slice(0, 80)
      .some((key) => detectHeavyMedia((value as Record<string, unknown>)[key], key));
  }
  return false;
}

type AiReviewContext = {
  ofertaLocalId: string | null;
  scanJobId: string | null;
  malformed: boolean;
};

const FINAL_PUBLISH_PARENT_STATUSES: ReadonlySet<OfertaLocalPublishStatus> = new Set([
  "draft",
  "submitted",
  "pending_review",
]);

const COUPON_PROMOTION_OFFER_TYPES: ReadonlySet<string> = new Set([
  "coupon",
  "promotion",
  "seasonal_special",
  "bundle",
  "featured_deal",
]);

function parseAiReviewContext(body: Record<string, unknown>): AiReviewContext {
  const raw = body.aiReview;
  if (raw === undefined || raw === null) {
    return { ofertaLocalId: null, scanJobId: null, malformed: false };
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { ofertaLocalId: null, scanJobId: null, malformed: true };
  }
  const ctx = raw as Record<string, unknown>;
  return {
    ofertaLocalId:
      typeof ctx.ofertaLocalId === "string" && ctx.ofertaLocalId.trim()
        ? ctx.ofertaLocalId.trim()
        : null,
    scanJobId:
      typeof ctx.scanJobId === "string" && ctx.scanJobId.trim()
        ? ctx.scanJobId.trim()
        : null,
    malformed: false,
  };
}

function normalizeOfferTypeProduct(offerType: string | null | undefined): "weekly_flyer" | "coupon_promotion" | "" {
  if (offerType === "weekly_flyer") return "weekly_flyer";
  if (offerType && COUPON_PROMOTION_OFFER_TYPES.has(offerType)) return "coupon_promotion";
  return "";
}

function parentMatchesDraftLane(params: {
  parentOfferType: string | null | undefined;
  draftOfferType: OfertaLocalOfferType | "";
}): boolean {
  const parentProduct = normalizeOfferTypeProduct(params.parentOfferType);
  const draftProduct = normalizeOfferTypeProduct(params.draftOfferType);
  return Boolean(parentProduct && draftProduct && parentProduct === draftProduct);
}

async function getAiReviewCounts(params: {
  supabase: ReturnType<typeof getAdminSupabase>;
  ownerId: string;
  ofertaLocalId: string;
  scanJobId: string | null;
}): Promise<{ ok: true; totalCount: number; incompleteCount: number; approvedSourceItemCount: number } | { ok: false; error: string; detail?: string }> {
  let totalQuery = params.supabase
    .from("oferta_local_items")
    .select("id", { count: "exact", head: true })
    .eq("oferta_local_id", params.ofertaLocalId)
    .eq("owner_id", params.ownerId);

  let incompleteQuery = params.supabase
    .from("oferta_local_items")
    .select("id", { count: "exact", head: true })
    .eq("oferta_local_id", params.ofertaLocalId)
    .eq("owner_id", params.ownerId)
    .in("review_status", ["pending", "needs_review"]);

  if (params.scanJobId) {
    totalQuery = totalQuery.eq("scan_job_id", params.scanJobId);
    incompleteQuery = incompleteQuery.eq("scan_job_id", params.scanJobId);
  }

  let approvedSourceItems = params.supabase
    .from("oferta_local_items")
    .select("id", { count: "exact", head: true })
    .eq("oferta_local_id", params.ofertaLocalId)
    .eq("owner_id", params.ownerId)
    .eq("review_status", "approved")
    .eq("source_lifecycle_status", "active")
    .not("source_asset_version_id", "is", null);
  if (params.scanJobId) {
    approvedSourceItems = approvedSourceItems.eq("scan_job_id", params.scanJobId);
  }

  const [
    { count: totalCount, error: totalError },
    { count: incompleteCount, error: incompleteError },
    { count: approvedSourceItemCount, error: approvedSourceItemError },
  ] = await Promise.all([totalQuery, incompleteQuery, approvedSourceItems]);

  if (totalError || incompleteError || approvedSourceItemError) {
    return {
      ok: false,
      error: "ai_review_lookup_failed",
      detail: totalError?.message ?? incompleteError?.message ?? approvedSourceItemError?.message ?? "unknown",
    };
  }

  return {
    ok: true,
    totalCount: totalCount ?? 0,
    incompleteCount: incompleteCount ?? 0,
    approvedSourceItemCount: approvedSourceItemCount ?? 0,
  };
}

async function validateAiReviewScanJob(params: {
  supabase: ReturnType<typeof getAdminSupabase>;
  ownerId: string;
  ofertaLocalId: string;
  scanJobId: string | null;
}): Promise<{ ok: true } | { ok: false; error: string; detail?: string; status: number }> {
  if (!params.scanJobId) return { ok: true };

  const { data, error } = await params.supabase
    .from("oferta_local_scan_jobs")
    .select("id, status, failed_pages, current_stage")
    .eq("id", params.scanJobId)
    .eq("oferta_local_id", params.ofertaLocalId)
    .eq("owner_id", params.ownerId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: "ai_scan_job_lookup_failed",
      detail: error.message,
      status: 500,
    };
  }

  if (!data) {
    return {
      ok: false,
      error: "ai_scan_job_not_found",
      detail: "The AI scan job is not linked to this offer.",
      status: 422,
    };
  }

  if (data.status === "failed" || (data.failed_pages ?? 0) > 0 || data.current_stage === "failed") {
    return {
      ok: false,
      error: "ai_scan_has_blocking_failures",
      detail: "Resolve failed scan pages before submitting for review.",
      status: 422,
    };
  }

  return { ok: true };
}

/**
 * Submit Ofertas Locales canonical parent for moderation review.
 * Requires verified paid entitlement; no public exposure or analytics.
 */
export async function POST(req: NextRequest) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "supabase_admin_unconfigured",
        detail: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 }
    );
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

  const rawBody = body as Record<string, unknown>;
  const draft = rawBody.draft;
  if (!isPlainDraft(draft)) {
    return NextResponse.json({ ok: false, error: "missing_draft" }, { status: 400 });
  }

  if (detectHeavyMedia(draft)) {
    return NextResponse.json({ ok: false, error: "heavy_media_detected" }, { status: 400 });
  }

  const issues = validateOfertaLocalDraftForServerPublish(draft, ownerId);
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "validation_failed",
        issues: errors,
        missingFields: errors.map((i) => i.field),
      },
      { status: 422 }
    );
  }

  const supabase = getAdminSupabase();
  const aiReview = parseAiReviewContext(rawBody);
  const now = new Date().toISOString();

  if (aiReview.malformed || (aiReview.scanJobId && !aiReview.ofertaLocalId)) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_ai_review_context",
        detail: "The AI review parent could not be verified for this submission.",
        issues: [
          {
            field: "aiReview",
            message: "The AI review parent could not be verified for this submission.",
            severity: "error",
          },
        ],
      },
      { status: 422 }
    );
  }

  if (aiReview.ofertaLocalId) {
    const { data: parent, error: parentError } = await supabase
      .from("ofertas_locales")
      .select("id, owner_id, status, offer_type, draft_snapshot, leonix_ad_id")
      .eq("id", aiReview.ofertaLocalId)
      .maybeSingle();

    if (parentError) {
      return NextResponse.json(
        { ok: false, error: "ai_review_parent_lookup_failed", detail: parentError.message },
        { status: 500 }
      );
    }

    if (!parent) {
      return NextResponse.json(
        { ok: false, error: "ai_review_parent_not_found", detail: "The AI review parent was not found." },
        { status: 404 }
      );
    }

    if (parent.owner_id !== ownerId) {
      return NextResponse.json(
        { ok: false, error: "ai_review_parent_forbidden", detail: "The AI review parent is not owned by this account." },
        { status: 403 }
      );
    }

    const parentStatus = parent.status as OfertaLocalPublishStatus;
    if (!FINAL_PUBLISH_PARENT_STATUSES.has(parentStatus)) {
      return NextResponse.json(
        {
          ok: false,
          error: "ai_review_parent_not_editable",
          detail: `Cannot submit an AI-reviewed offer with status ${parentStatus}.`,
        },
        { status: 409 }
      );
    }

    if (!parentMatchesDraftLane({ parentOfferType: parent.offer_type, draftOfferType: draft.offerType })) {
      return NextResponse.json(
        {
          ok: false,
          error: "ai_review_parent_mismatch",
          detail: "The AI review parent does not match this offer type.",
        },
        { status: 422 }
      );
    }

    const leonix = await ensureOfertaLocalLeonixAdId({
      supabase,
      ofertaLocalId: aiReview.ofertaLocalId,
      ownerId,
    });
    if (!leonix.ok) {
      return NextResponse.json(
        { ok: false, error: leonix.code, detail: leonix.message },
        { status: 500 }
      );
    }

    const entitlement = await validateOfertaLocalSubmissionEntitlement({
      supabase,
      parent: {
        id: parent.id,
        owner_id: parent.owner_id,
        offer_type: parent.offer_type,
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

    const scanJobValidation = await validateAiReviewScanJob({
      supabase,
      ownerId,
      ofertaLocalId: aiReview.ofertaLocalId,
      scanJobId: aiReview.scanJobId,
    });

    if (!scanJobValidation.ok) {
      return NextResponse.json(
        { ok: false, error: scanJobValidation.error, detail: scanJobValidation.detail },
        { status: scanJobValidation.status }
      );
    }

    const aiReviewCounts = await getAiReviewCounts({
      supabase,
      ownerId,
      ofertaLocalId: aiReview.ofertaLocalId,
      scanJobId: aiReview.scanJobId,
    });

    if (!aiReviewCounts.ok) {
      return NextResponse.json(
        { ok: false, error: aiReviewCounts.error, detail: aiReviewCounts.detail },
        { status: 500 }
      );
    }

    if (aiReviewCounts.incompleteCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "ai_review_incomplete",
          detail: `Finish reviewing ${aiReviewCounts.incompleteCount} AI suggestion(s) before submitting.`,
          issues: [
            {
              field: "aiReview",
              message: `Finish reviewing ${aiReviewCounts.incompleteCount} AI suggestion(s) before submitting.`,
              severity: "error",
            },
          ],
        },
        { status: 422 }
      );
    }

    if (aiReviewCounts.approvedSourceItemCount < 1) {
      return NextResponse.json(
        {
          ok: false,
          error: "ai_review_approved_source_item_required",
          detail: "Approve at least one item from the scanned source before submitting.",
          issues: [
            {
              field: "aiReview",
              message: "Approve at least one item from the scanned source before submitting.",
              severity: "error",
            },
          ],
        },
        { status: 422 }
      );
    }

    const updateRow = buildOfertasLocalesProductionInsertRow(draft, ownerId, parent.draft_snapshot);
    delete updateRow.owner_id;
    delete updateRow.created_at;
    updateRow.commercial_eligibility_source = entitlement.source;
    updateRow.partner_assignment_id =
      entitlement.source === "partner_courtesy" ? entitlement.partnerAssignmentId : null;

    const { data, error } = await supabase
      .from("ofertas_locales")
      .update(updateRow)
      .eq("id", aiReview.ofertaLocalId)
      .eq("owner_id", ownerId)
      .select(OFERTAS_LOCALES_SCAN_PREP_RETURN_COLUMNS)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: "update_failed", detail: error?.message ?? "unknown" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: data.id,
      status: data.status,
      submittedAt: pickScanPrepSubmittedAt(data as Record<string, unknown>, now),
      aiReview: {
        ofertaLocalId: data.id,
        scanJobId: aiReview.scanJobId,
        reviewedItems: aiReviewCounts.totalCount,
        approvedSourceItems: aiReviewCounts.approvedSourceItemCount,
      },
      commercial: {
        source: entitlement.source,
        productKey: entitlement.product.packageKey,
        paymentRecordId: entitlement.source === "paid" ? entitlement.paymentRecordId : null,
        packageEntitlementId: entitlement.source === "paid" ? entitlement.packageEntitlementId : null,
        partnerAssignmentId: entitlement.source === "partner_courtesy" ? entitlement.partnerAssignmentId : null,
        leonixAdId: entitlement.leonixAdId,
      },
    });
  }

  return NextResponse.json(
    {
      ok: false,
      error: "canonical_parent_required",
      detail: "Create or reuse the AI-reviewed canonical parent before submitting to review.",
    },
    { status: 409 }
  );
}
