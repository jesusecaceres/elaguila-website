import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import {
  getOfertaLocalForOwner,
  mapOfertaLocalRowToOwnerDetail,
  OFERTAS_LOCALES_OWNER_EDITABLE_STATUSES,
} from "@/app/lib/ofertas-locales/ofertasLocalesOwnerHelpers";
import {
  buildOfertaLocalOwnerUpdatePayload,
  stripForbiddenOwnerUpdateFields,
  validateOfertaLocalOwnerUpdateInput,
} from "@/app/lib/ofertas-locales/ofertasLocalesOwnerUpdateMapper";
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

  return NextResponse.json({ ok: true, offer: mapOfertaLocalRowToOwnerDetail(row, lang) });
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
