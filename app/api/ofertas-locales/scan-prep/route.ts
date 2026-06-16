import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import {
  mapOfertaLocalDraftToScanPrepUpdatePayload,
  validateOfertaLocalDraftForAiScanPersist,
} from "@/app/lib/ofertas-locales/ofertasLocalesAiScanPersist";
import { mapOfertaLocalDraftToInsertPayload } from "@/app/lib/ofertas-locales/ofertasLocalesPublishMapper";
import { OFERTAS_LOCALES_OWNER_EDITABLE_STATUSES } from "@/app/lib/ofertas-locales/ofertasLocalesOwnerHelpers";
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

/**
 * Persist draft to ofertas_locales for AI scan before final Step 7 submit.
 * Inserts or updates pending_review — no public exposure.
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

  if (existingId) {
    const { data: existing, error: fetchError } = await supabase
      .from("ofertas_locales")
      .select("id, owner_id, status")
      .eq("id", existingId)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    if (existing.owner_id !== ownerId) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const status = existing.status as OfertaLocalPublishStatus;
    if (!OFERTAS_LOCALES_OWNER_EDITABLE_STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: "edit_not_allowed" }, { status: 403 });
    }

    const updatePayload = mapOfertaLocalDraftToScanPrepUpdatePayload(draft, ownerId);
    const { data, error } = await supabase
      .from("ofertas_locales")
      .update(updatePayload)
      .eq("id", existingId)
      .eq("owner_id", ownerId)
      .select("id, status")
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
      created: false,
      updatedAt: now,
    });
  }

  const row = mapOfertaLocalDraftToInsertPayload(draft, ownerId);
  const { data, error } = await supabase
    .from("ofertas_locales")
    .insert({
      ...row,
      updated_at: now,
    })
    .select("id, status, submitted_at")
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
    created: true,
    submittedAt: data.submitted_at ?? now,
  });
}
