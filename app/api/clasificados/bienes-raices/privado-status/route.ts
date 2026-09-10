/**
 * Gate BIENES-PRIVADO-1 — server-authorized owner status transitions for Bienes Raíces FSBO
 * (Privado) listings.
 *
 * Deliberately the smallest possible authority, modelled on the existing
 * `/api/clasificados/bienes-raices/listing-lifecycle` route: this file only extracts the
 * authenticated user and the request body, reads the row's REAL state, and maps a typed decision
 * from the pure policy (`brFsboOwnerStatusAuthority.ts`) to an HTTP response. All rules live in
 * that pure module; none live here, and none live in the client.
 *
 * Why a separate route rather than the Negocio one: `applyBrLifecycleMutation` IS the Negocio model
 * — it requires `seller_type === "business"`, resolves parent/child inventory, cascades to children
 * and routes activation through the capacity RPC. A private seller has none of those. The lane
 * check below is symmetric with that route's own: each lane refuses the other's rows rather than
 * one lane silently inheriting the other's guarantees.
 *
 * This route never touches `expires_at`. Term truth is bought through Revenue OS and written by the
 * webhook; no owner action can create, extend or clear a paid term.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { isBrFsboRow } from "@/app/lib/listingLifecycle/bienesFsboLifecycle";
import {
  BR_FSBO_STATUS_AUTH_REQUIRED_ERROR,
  BR_FSBO_STATUS_LANE_MISMATCH_ERROR,
  BR_FSBO_STATUS_LISTING_NOT_FOUND_ERROR,
  BR_FSBO_STATUS_OWNER_MISMATCH_ERROR,
  BR_FSBO_STATUS_PAYMENT_REQUIRED_ERROR,
  BR_FSBO_STATUS_SERVICE_UNAVAILABLE_ERROR,
  BR_FSBO_STATUS_TRANSITION_NOT_ALLOWED_ERROR,
  isBrFsboOwnerStatusAction,
  resolveBrFsboOwnerStatusDecision,
  type BrFsboStatusErrorCode,
} from "@/app/lib/clasificados/bienes-raices/brFsboOwnerStatusAuthority";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  listingId?: string | null;
  action?: string | null;
};

function statusForError(error: BrFsboStatusErrorCode): number {
  switch (error) {
    case BR_FSBO_STATUS_AUTH_REQUIRED_ERROR:
      return 401;
    case BR_FSBO_STATUS_LISTING_NOT_FOUND_ERROR:
      return 404;
    case BR_FSBO_STATUS_OWNER_MISMATCH_ERROR:
      return 403;
    case BR_FSBO_STATUS_LANE_MISMATCH_ERROR:
    case BR_FSBO_STATUS_PAYMENT_REQUIRED_ERROR:
      return 422;
    case BR_FSBO_STATUS_TRANSITION_NOT_ALLOWED_ERROR:
      return 409;
    case BR_FSBO_STATUS_SERVICE_UNAVAILABLE_ERROR:
      return 503;
    default:
      return 400;
  }
}

export async function POST(request: NextRequest) {
  const bearerUserId = await getBearerUserId(request);
  if (!bearerUserId) {
    return NextResponse.json(
      { ok: false, code: BR_FSBO_STATUS_AUTH_REQUIRED_ERROR },
      { status: 401 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_json" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId || !isBrFsboOwnerStatusAction(body.action)) {
    return NextResponse.json({ ok: false, code: "invalid_request" }, { status: 400 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, code: BR_FSBO_STATUS_SERVICE_UNAVAILABLE_ERROR },
      { status: 503 },
    );
  }

  const supabase = getAdminSupabase();
  const { data: row, error: readError } = await supabase
    .from("listings")
    .select("id, owner_id, category, seller_type, listing_json, status, is_published")
    .eq("id", listingId)
    .maybeSingle();

  // A read failure is reported as "not found" — a raw database message is never returned.
  if (readError || !row?.id) {
    return NextResponse.json({ ok: false, code: BR_FSBO_STATUS_LISTING_NOT_FOUND_ERROR }, { status: 404 });
  }

  if (String(row.owner_id ?? "").trim() !== bearerUserId.trim()) {
    return NextResponse.json({ ok: false, code: BR_FSBO_STATUS_OWNER_MISMATCH_ERROR }, { status: 403 });
  }

  // Lane check, symmetric with the Negocio route's `seller_type === "business"` requirement.
  if (!isBrFsboRow(row)) {
    return NextResponse.json({ ok: false, code: BR_FSBO_STATUS_LANE_MISMATCH_ERROR }, { status: 422 });
  }

  const decision = resolveBrFsboOwnerStatusDecision({ row, action: body.action });
  if (!decision.ok) {
    return NextResponse.json({ ok: false, code: decision.error }, { status: statusForError(decision.error) });
  }

  // Compare-and-set on the exact prior states the decision authorized, so a concurrent change
  // (an Admin moderation action, a webhook activation, a second tab) loses rather than being
  // silently overwritten. The lane predicates are re-asserted in the WHERE clause too.
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("listings")
    .update({ ...decision.patch, updated_at: now })
    .eq("id", listingId)
    .eq("owner_id", bearerUserId)
    .eq("category", "bienes-raices")
    .eq("seller_type", "personal")
    .in("status", [...decision.fromStatuses])
    .select("id, status, is_published")
    .maybeSingle();

  if (updateError || !updated?.id) {
    return NextResponse.json(
      { ok: false, code: BR_FSBO_STATUS_TRANSITION_NOT_ALLOWED_ERROR },
      { status: 409 },
    );
  }

  return NextResponse.json({
    ok: true,
    id: updated.id,
    status: String(updated.status ?? ""),
    isPublished: updated.is_published === true,
  });
}
