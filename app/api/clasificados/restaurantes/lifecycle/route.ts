import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OwnerRestauranteAction = "pause" | "resume";

function parseAction(value: unknown): OwnerRestauranteAction | null {
  return value === "pause" || value === "resume" ? value : null;
}

/**
 * Owner-safe Restaurantes lifecycle.
 *
 * This is deliberately separate from the Admin moderation route:
 * - owner pause: published -> paused
 * - owner resume: paused -> published
 * - suspended/archived/pending_payment can never be flipped here
 *
 * Every write is owner-scoped and compare-and-set on the current status so a
 * concurrent Admin moderation/payment transition fails closed instead of being overwritten.
 */
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
  const action = parseAction(body.action);
  if (!listingId || !action) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const db = getAdminSupabase();
  const { data: existing, error: readError } = await db
    .from("restaurantes_public_listings")
    .select("id, slug, owner_user_id, status")
    .eq("id", listingId)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ ok: false, error: "lookup_failed" }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const rowOwner = typeof existing.owner_user_id === "string" ? existing.owner_user_id : "";
  if (!rowOwner || rowOwner !== ownerUserId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const expectedFrom = action === "pause" ? "published" : "paused";
  const nextStatus = action === "pause" ? "paused" : "published";
  const currentStatus = String(existing.status ?? "").trim().toLowerCase();
  if (currentStatus !== expectedFrom) {
    return NextResponse.json(
      { ok: false, error: "invalid_status_transition", status: currentStatus },
      { status: 409 },
    );
  }

  const updatedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await db
    .from("restaurantes_public_listings")
    .update({ status: nextStatus, updated_at: updatedAt })
    .eq("id", listingId)
    .eq("owner_user_id", ownerUserId)
    .eq("status", expectedFrom)
    .select("id, slug, status, updated_at");

  if (updateError) {
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
  if (!updated?.length) {
    return NextResponse.json({ ok: false, error: "no_row_updated" }, { status: 409 });
  }

  const slug = String(existing.slug ?? "").trim();
  revalidatePath("/clasificados/restaurantes");
  revalidatePath("/clasificados/restaurantes/resultados");
  revalidatePath("/dashboard/restaurantes");
  revalidatePath("/dashboard/mis-anuncios");
  if (slug) revalidatePath(`/clasificados/restaurantes/${slug}`);

  return NextResponse.json({
    ok: true,
    listingId,
    status: nextStatus,
    updatedAt,
  });
}
