import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import { validateOfertaLocalDraftForAiScanPersist } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanPersist";
import { OFERTAS_LOCALES_OWNER_EDITABLE_STATUSES } from "@/app/lib/ofertas-locales/ofertasLocalesOwnerHelpers";
import {
  buildOfertasLocalesScanPrepInsertRow,
  buildOfertasLocalesScanPrepUpdateRow,
  OFERTAS_LOCALES_SCAN_PREP_RETURN_COLUMNS,
  pickScanPrepSubmittedAt,
  readExistingDraftSnapshotFromRow,
  sanitizeSupabaseWriteError,
} from "@/app/lib/ofertas-locales/ofertasLocalesProductionRowAdapter";
import {
  isSupabaseMissingColumnError,
  isSupabaseSchemaCacheMissingTableError,
  OFERTAS_LOCALES_AI_SCAN_PREP_ROUTE_VERSION,
  parseSupabaseProjectRefFromUrl,
  probeOfertasLocalesAiTables,
  schemaProbeFailureResponse,
} from "@/app/lib/ofertas-locales/ofertasLocalesSupabaseSchema";
import type { OfertaLocalDraft, OfertaLocalPublishStatus } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

function isPlainDraft(v: unknown): v is OfertaLocalDraft {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function detectHeavyMedia(value: unknown): boolean {
  if (typeof value === "string") {
    if (value.startsWith("data:image/") || value.startsWith("data:application/")) return true;
    if (value.length > 4096) return true;
    return false;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 40).some((item) => detectHeavyMedia(item));
  }
  if (typeof value === "object" && value !== null) {
    return Object.keys(value as object)
      .slice(0, 80)
      .some((key) => detectHeavyMedia((value as Record<string, unknown>)[key]));
  }
  return false;
}

function writeFailure(
  action: "scan_prep_insert_failed" | "scan_prep_update_failed",
  error: { message?: string; code?: string; hint?: string; details?: string },
  supabaseUrl: string | undefined
) {
  const sanitized = sanitizeSupabaseWriteError(error);
  return NextResponse.json(
    {
      ok: false,
      error: action,
      detail: sanitized.message,
      code: sanitized.code,
      hint: sanitized.hint,
      columnMismatch: isSupabaseMissingColumnError(sanitized.message, sanitized.code),
      supabaseProjectRef: parseSupabaseProjectRefFromUrl(supabaseUrl),
      routeVersion: OFERTAS_LOCALES_AI_SCAN_PREP_ROUTE_VERSION,
    },
    { status: 500 }
  );
}

/**
 * Persist draft to ofertas_locales for AI scan before final Step 7 submit.
 * Inserts or updates pending_review — no public exposure.
 */
export async function POST(req: NextRequest) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "supabase_admin_unconfigured",
        detail: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        routeVersion: OFERTAS_LOCALES_AI_SCAN_PREP_ROUTE_VERSION,
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

  const raw = body as Record<string, unknown>;
  const draft = raw.draft;
  const existingId =
    typeof raw.ofertaLocalId === "string" && raw.ofertaLocalId.trim() ? raw.ofertaLocalId.trim() : null;

  if (!isPlainDraft(draft)) {
    return NextResponse.json({ ok: false, error: "invalid_draft" }, { status: 400 });
  }

  if (detectHeavyMedia(draft)) {
    return NextResponse.json(
      {
        ok: false,
        error: "payload_too_large",
        detail: "Draft must not include base64 file contents.",
      },
      { status: 413 }
    );
  }

  const issues = validateOfertaLocalDraftForAiScanPersist(draft, ownerId);
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
  const now = new Date().toISOString();

  const tableProbe = await probeOfertasLocalesAiTables(supabase);
  if (!tableProbe.ok) {
    const failure = schemaProbeFailureResponse(tableProbe, supabaseUrl);
    return NextResponse.json(
      {
        ok: false,
        ...failure,
        routeVersion: OFERTAS_LOCALES_AI_SCAN_PREP_ROUTE_VERSION,
      },
      { status: 503 }
    );
  }

  if (existingId) {
    const { data: existing, error: fetchError } = await supabase
      .from("ofertas_locales")
      .select("id, owner_id, status, draft_snapshot")
      .eq("id", existingId)
      .maybeSingle();

    if (fetchError) {
      if (isSupabaseSchemaCacheMissingTableError(fetchError.message, fetchError.code)) {
        const failure = schemaProbeFailureResponse(
          {
            ok: false,
            tables: [
              {
                table: "ofertas_locales",
                ok: false,
                code: fetchError.code ?? null,
                message: fetchError.message ?? null,
                hint: fetchError.hint ?? null,
              },
            ],
            failedTables: ["ofertas_locales"],
          },
          supabaseUrl
        );
        return NextResponse.json({ ok: false, ...failure, routeVersion: OFERTAS_LOCALES_AI_SCAN_PREP_ROUTE_VERSION }, { status: 503 });
      }
      return NextResponse.json(
        {
          ok: false,
          error: "scan_prep_lookup_failed",
          detail: fetchError.message,
          code: fetchError.code ?? null,
          routeVersion: OFERTAS_LOCALES_AI_SCAN_PREP_ROUTE_VERSION,
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    if (existing.owner_id !== ownerId) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const status = existing.status as OfertaLocalPublishStatus;
    if (!OFERTAS_LOCALES_OWNER_EDITABLE_STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: "edit_not_allowed" }, { status: 403 });
    }

    const updatePayload = buildOfertasLocalesScanPrepUpdateRow(
      draft,
      ownerId,
      readExistingDraftSnapshotFromRow(existing)
    );
    const { data, error } = await supabase
      .from("ofertas_locales")
      .update(updatePayload)
      .eq("id", existingId)
      .eq("owner_id", ownerId)
      .select(OFERTAS_LOCALES_SCAN_PREP_RETURN_COLUMNS)
      .single();

    if (error || !data) {
      if (isSupabaseSchemaCacheMissingTableError(error?.message, error?.code)) {
        const failure = schemaProbeFailureResponse(
          {
            ok: false,
            tables: [
              {
                table: "ofertas_locales",
                ok: false,
                code: error?.code ?? null,
                message: error?.message ?? null,
                hint: error?.hint ?? null,
              },
            ],
            failedTables: ["ofertas_locales"],
          },
          supabaseUrl
        );
        return NextResponse.json({ ok: false, ...failure, routeVersion: OFERTAS_LOCALES_AI_SCAN_PREP_ROUTE_VERSION }, { status: 503 });
      }
      return writeFailure("scan_prep_update_failed", error ?? { message: "unknown" }, supabaseUrl);
    }

    return NextResponse.json({
      ok: true,
      id: data.id,
      status: data.status,
      created: false,
      updatedAt: now,
      submittedAt: pickScanPrepSubmittedAt(data as Record<string, unknown>, now),
      routeVersion: OFERTAS_LOCALES_AI_SCAN_PREP_ROUTE_VERSION,
    });
  }

  const row = buildOfertasLocalesScanPrepInsertRow(draft, ownerId);
  const { data, error } = await supabase
    .from("ofertas_locales")
    .insert(row)
    .select(OFERTAS_LOCALES_SCAN_PREP_RETURN_COLUMNS)
    .single();

  if (error || !data) {
    if (isSupabaseSchemaCacheMissingTableError(error?.message, error?.code)) {
      const failure = schemaProbeFailureResponse(
        {
          ok: false,
          tables: [
            {
              table: "ofertas_locales",
              ok: false,
              code: error?.code ?? null,
              message: error?.message ?? null,
              hint: error?.hint ?? null,
            },
          ],
          failedTables: ["ofertas_locales"],
        },
        supabaseUrl
      );
      return NextResponse.json({ ok: false, ...failure, routeVersion: OFERTAS_LOCALES_AI_SCAN_PREP_ROUTE_VERSION }, { status: 503 });
    }
    return writeFailure("scan_prep_insert_failed", error ?? { message: "unknown" }, supabaseUrl);
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    status: data.status,
    created: true,
    submittedAt: pickScanPrepSubmittedAt(data as Record<string, unknown>, now),
    routeVersion: OFERTAS_LOCALES_AI_SCAN_PREP_ROUTE_VERSION,
  });
}
