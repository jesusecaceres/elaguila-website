import { NextResponse, type NextRequest } from "next/server";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { comidaLocalOwnerIdFromBearer } from "@/app/lib/clasificados/comida-local/comidaLocalPublishServerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Globalization Package A Gate 5 — Comida Local owner lifecycle mutations. Before this route,
 * the pipeline had ZERO owner-side mutation capability (ledger I.12A/I.13A: "zero owner-side
 * mutation"; the dashboard card offered only view/form links). The table's status CHECK
 * already includes 'paused' (migration 20260604120000) — no schema change needed.
 *
 * Contract:
 *  - POST { listingId, action: "pause" | "resume" }.
 *  - Bearer auth required; ownership verified server-side against owner_user_id (fail closed
 *    on a missing/legacy-null owner — same rule the I.13A publish-route fix established).
 *  - pause: 'published' → 'paused' only. resume: 'paused' → 'published' only.
 *  - 'suspended' (admin moderation) and 'draft'/'pending_payment' are never owner-flippable
 *    here.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const ownerUserId = await comidaLocalOwnerIdFromBearer(request);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  let body: { listingId?: unknown; action?: unknown } = {};
  try {
    body = (await request.json()) as { listingId?: unknown; action?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const action = body.action === "pause" || body.action === "resume" ? body.action : null;
  if (!listingId || !action) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  const { data: existing, error: readError } = await supabase
    .from("comida_local_public_listings")
    .select("id, owner_user_id, status")
    .eq("id", listingId)
    .maybeSingle();
  if (readError) {
    return NextResponse.json({ ok: false, error: "lookup_failed" }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  const rowOwner = typeof existing.owner_user_id === "string" ? existing.owner_user_id : null;
  if (!rowOwner || rowOwner !== ownerUserId) {
    // Fail closed on legacy null owners too — an unowned row is nobody's to mutate.
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const currentStatus = String(existing.status ?? "");
  const expectedFrom = action === "pause" ? "published" : "paused";
  const nextStatus = action === "pause" ? "paused" : "published";
  if (currentStatus !== expectedFrom) {
    return NextResponse.json(
      { ok: false, error: "invalid_status_transition", status: currentStatus },
      { status: 400 },
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("comida_local_public_listings")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("owner_user_id", ownerUserId)
    .eq("status", expectedFrom)
    .select("id");
  if (updateError) {
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
  // Zero-row detection (the I.13A rule): a silent no-op must be reported, never claimed as
  // success.
  if (!updated?.length) {
    return NextResponse.json({ ok: false, error: "no_row_updated" }, { status: 409 });
  }

  return NextResponse.json({ ok: true, status: nextStatus });
}
