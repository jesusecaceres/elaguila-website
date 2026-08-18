import { NextResponse, type NextRequest } from "next/server";

import { resolveOfertasLocalesOwnerOrAdminAuth } from "@/app/lib/ofertas-locales/ofertasLocalesReviewAuth";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const STATUSES = new Set(["pending", "processing", "failed", "completed", "cancelled"]);

export async function GET(req: NextRequest) {
  const auth = await resolveOfertasLocalesOwnerOrAdminAuth(req);
  if (!auth?.isAdmin) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  const status = req.nextUrl.searchParams.get("status")?.trim() || "pending";
  if (!STATUSES.has(status)) return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });

  const { data, error } = await getAdminSupabase()
    .from("ofertas_local_asset_cleanup_queue")
    .select("id, oferta_local_id, source_asset_version_id, storage_path, cleanup_type, status, attempt_count, last_attempt_at, failure_reason, created_at")
    .eq("status", status)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ ok: false, error: "cleanup_queue_lookup_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, items: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const auth = await resolveOfertasLocalesOwnerOrAdminAuth(req);
  if (!auth?.isAdmin) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const raw = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
  const id = String(raw.id ?? "").trim();
  const status = String(raw.status ?? "").trim();
  if (!id || !STATUSES.has(status)) return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 422 });

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status, updated_at: now };
  if (status === "processing" || status === "failed") update.last_attempt_at = now;
  if (status === "completed") update.completed_at = now;
  if (typeof raw.failureReason === "string") update.failure_reason = raw.failureReason.trim().slice(0, 1000) || null;

  const { error } = await getAdminSupabase()
    .from("ofertas_local_asset_cleanup_queue")
    .update(update)
    .eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: "cleanup_queue_update_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
