/**
 * Gate QB-RESTAURANTES-MANAGE-01 — Restaurantes owner lifecycle mutation endpoint.
 *
 * NOTE: Restaurantes does NOT have a "paused" status in its canonical schema
 * (KNOWN_RESTAURANTE_STATUSES = published | pending_payment | archived | suspended).
 * This route exposes only the "archive" action (published → archived), which IS
 * canonical and owner-reachable. Resume is not offered here: a suspended or archived
 * restaurante is reinstated through the admin surface, not the owner doorway.
 *
 * Contract:
 *  POST { listingId, action: "archive" }
 *  Bearer auth required; ownership verified server-side.
 *  archive: "published" → "archived" only.
 *  "suspended" and "pending_payment" are never owner-flippable.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ACTIONS = ["archive"] as const;
type RestaurantesManageAction = (typeof ALLOWED_ACTIONS)[number];

function isAllowedAction(v: unknown): v is RestaurantesManageAction {
  return typeof v === "string" && (ALLOWED_ACTIONS as readonly string[]).includes(v);
}

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }

  const ownerUserId = await getBearerUserId(request);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  let body: { listingId?: unknown; action?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const action = isAllowedAction(body.action) ? body.action : null;
  if (!listingId || !action) {
    return NextResponse.json({ ok: false, error: "invalid_body", supported_actions: ALLOWED_ACTIONS }, { status: 400 });
  }

  const db = getAdminSupabase();
  const { data: existing, error: readError } = await db
    .from("restaurantes_public_listings")
    .select("id, owner_user_id, status")
    .eq("id", listingId)
    .maybeSingle();
  if (readError) return NextResponse.json({ ok: false, error: "lookup_failed" }, { status: 500 });
  if (!existing) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const rowOwner = typeof existing.owner_user_id === "string" ? existing.owner_user_id : null;
  if (!rowOwner || rowOwner !== ownerUserId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const currentStatus = String(existing.status ?? "");

  // archive: published → archived only
  if (action === "archive") {
    if (currentStatus !== "published") {
      return NextResponse.json(
        { ok: false, error: "invalid_status_transition", currentStatus },
        { status: 400 },
      );
    }
    const nextStatus = "archived";
    const { data: updated, error: updateError } = await db
      .from("restaurantes_public_listings")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", listingId)
      .eq("owner_user_id", ownerUserId)
      .eq("status", "published")
      .select("id");
    if (updateError) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
    if (!updated?.length) return NextResponse.json({ ok: false, error: "no_row_updated" }, { status: 409 });
    return NextResponse.json({ ok: true, status: nextStatus });
  }

  return NextResponse.json({ ok: false, error: "unsupported_action" }, { status: 400 });
}
