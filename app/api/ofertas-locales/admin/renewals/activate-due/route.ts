import { NextResponse, type NextRequest } from "next/server";

import { resolveOfertasLocalesOwnerOrAdminAuth } from "@/app/lib/ofertas-locales/ofertasLocalesReviewAuth";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await resolveOfertasLocalesOwnerOrAdminAuth(req);
  if (!auth?.isAdmin) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const limit = Math.max(1, Math.min(20, Number(body.limit ?? 10)));
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { data: due, error } = await supabase
    .from("ofertas_local_renewal_attempts")
    .select("id")
    .eq("state", "approved_scheduled")
    .lte("scheduled_activation_at", now)
    .order("scheduled_activation_at", { ascending: true })
    .limit(limit);
  if (error) return NextResponse.json({ ok: false, error: "due_renewal_lookup_failed" }, { status: 500 });

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const item of due ?? []) {
    const id = String(item.id ?? "");
    const activation = await supabase.rpc("activate_due_oferta_local_renewal", {
      p_renewal_attempt_id: id,
      p_actor_user_id: null,
    });
    if (activation.error) {
      await supabase
        .from("ofertas_local_renewal_attempts")
        .update({
          state: "failed",
          failure_reason: activation.error.message.slice(0, 1000),
          last_attempt_at: now,
          updated_at: now,
        })
        .eq("id", id);
      results.push({ id, ok: false, error: "activation_failed" });
    } else {
      results.push({ id, ok: true });
    }
  }

  return NextResponse.json({ ok: true, checked: (due ?? []).length, results });
}
