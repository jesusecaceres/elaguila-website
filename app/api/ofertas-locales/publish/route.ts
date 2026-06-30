import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import {
  buildOfertasLocalesProductionInsertRow,
  OFERTAS_LOCALES_SCAN_PREP_RETURN_COLUMNS,
  pickScanPrepSubmittedAt,
} from "@/app/lib/ofertas-locales/ofertasLocalesProductionRowAdapter";
import { validateOfertaLocalDraftForServerPublish } from "@/app/lib/ofertas-locales/ofertasLocalesPublishMapper";
import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
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

function parseAiReviewContext(body: Record<string, unknown>): {
  ofertaLocalId: string | null;
  scanJobId: string | null;
} {
  const raw = body.aiReview;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ofertaLocalId: null, scanJobId: null };
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
  };
}

async function getIncompleteAiReviewCount(params: {
  supabase: ReturnType<typeof getAdminSupabase>;
  ownerId: string;
  ofertaLocalId: string | null;
  scanJobId: string | null;
}): Promise<number> {
  if (!params.ofertaLocalId) return 0;

  let query = params.supabase
    .from("oferta_local_items")
    .select("id", { count: "exact", head: true })
    .eq("oferta_local_id", params.ofertaLocalId)
    .eq("owner_id", params.ownerId)
    .in("review_status", ["pending", "needs_review"]);

  if (params.scanJobId) {
    query = query.eq("scan_job_id", params.scanJobId);
  }

  const { count, error } = await query;
  if (error) {
    // If AI tables are unavailable, do not block non-AI publish; Step 5 and review UI surface table issues.
    return 0;
  }
  return count ?? 0;
}

/**
 * Submit Ofertas Locales draft for moderation review.
 * Inserts pending_review row only — no public exposure, payment, or analytics.
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
  const incompleteAiReviewCount = await getIncompleteAiReviewCount({
    supabase,
    ownerId,
    ofertaLocalId: aiReview.ofertaLocalId,
    scanJobId: aiReview.scanJobId,
  });

  if (incompleteAiReviewCount > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "ai_review_incomplete",
        detail: `Finish reviewing ${incompleteAiReviewCount} AI suggestion(s) before submitting.`,
        issues: [
          {
            field: "aiReview",
            message: `Finish reviewing ${incompleteAiReviewCount} AI suggestion(s) before submitting.`,
            severity: "error",
          },
        ],
      },
      { status: 422 }
    );
  }

  const row = buildOfertasLocalesProductionInsertRow(draft, ownerId);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("ofertas_locales")
    .insert(row)
    .select(OFERTAS_LOCALES_SCAN_PREP_RETURN_COLUMNS)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: "insert_failed", detail: error?.message ?? "unknown" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    status: data.status,
    submittedAt: pickScanPrepSubmittedAt(data as Record<string, unknown>, now),
  });
}
