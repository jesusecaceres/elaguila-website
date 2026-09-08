import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { queueOfertaLocalNotificationEvent } from "@/app/lib/ofertas-locales/ofertasLocalesNotificationEvents";
import { getAdminSupabase, isSupabaseAdminConfigured, requireAdminCookie } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_ACTIONS = new Set([
  "approve",
  "reject",
  "request_correction",
  "cancel",
  "retry_activation",
]);

async function assertAdmin() {
  const cookieStore = await cookies();
  return requireAdminCookie(cookieStore);
}
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await assertAdmin())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  const supabase = getAdminSupabase();
  const { data: parent, error: parentError } = await supabase
    .from("ofertas_locales")
    .select("id, owner_id, leonix_ad_id, status, offer_type, published_at, expires_at, public_source_asset_id, active_source_asset_id")
    .eq("id", id)
    .maybeSingle();
  if (parentError || !parent) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const { data: renewals, error } = await supabase
    .from("ofertas_local_renewal_attempts")
    .select("*")
    .eq("oferta_local_id", id)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ ok: false, error: "renewal_lookup_failed" }, { status: 500 });

  const { data: terms } = await supabase
    .from("ofertas_local_public_terms")
    .select("*")
    .eq("oferta_local_id", id)
    .order("starts_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ ok: true, parent, renewals: renewals ?? [], terms: terms ?? [] });
}
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await assertAdmin())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const action = String(body.action ?? "").trim();
  const renewalAttemptId = String(body.renewalAttemptId ?? "").trim();
  const reason = String(body.reason ?? "").trim().slice(0, 1000);
  if (!ALLOWED_ACTIONS.has(action) || !renewalAttemptId) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 422 });
  }

  const supabase = getAdminSupabase();
  const { data: attempt, error: attemptError } = await supabase
    .from("ofertas_local_renewal_attempts")
    .select("id, oferta_local_id, owner_id, state, commercial_path, payment_record_id, package_entitlement_id, partner_assignment_id")
    .eq("id", renewalAttemptId)
    .eq("oferta_local_id", id)
    .maybeSingle();
  if (attemptError || !attempt) return NextResponse.json({ ok: false, error: "renewal_not_found" }, { status: 404 });

  const now = new Date().toISOString();
  if (action === "approve" || action === "retry_activation") {
    if (!["pending_review", "approved_scheduled"].includes(String(attempt.state))) {
      return NextResponse.json({ ok: false, error: "renewal_not_ready_for_activation" }, { status: 409 });
    }
    if (attempt.commercial_path === "paid" && (!attempt.payment_record_id || !attempt.package_entitlement_id)) {
      return NextResponse.json({ ok: false, error: "renewal_entitlement_required" }, { status: 422 });
    }
    if (attempt.commercial_path === "partner_courtesy" && !attempt.partner_assignment_id) {
      return NextResponse.json({ ok: false, error: "renewal_courtesy_required" }, { status: 422 });
    }
    const { data, error } = await supabase.rpc("activate_due_oferta_local_renewal", {
      p_renewal_attempt_id: renewalAttemptId,
      p_actor_user_id: null,
    });
    if (error) {
      await supabase
        .from("ofertas_local_renewal_attempts")
        .update({
          state: "failed",
          failure_reason: error.message.slice(0, 1000),
          retry_count: 1,
          last_attempt_at: now,
          updated_at: now,
        })
        .eq("id", renewalAttemptId);
      return NextResponse.json({ ok: false, error: "renewal_activation_failed" }, { status: 500 });
    }
    await queueOfertaLocalNotificationEvent({
      supabase,
      eventKey: "renewal_approved",
      ofertaLocalId: id,
      renewalAttemptId,
      recipientRole: "owner",
      recipientUserId: String(attempt.owner_id ?? "") || null,
      metadata: { activation: data ?? null, sent: false },
    });
    return NextResponse.json({ ok: true, activation: data ?? null });
  }

  const update: Record<string, unknown> = { updated_at: now };
  if (action === "reject") {
    if (!reason) return NextResponse.json({ ok: false, error: "reason_required" }, { status: 422 });
    update.state = "failed";
    update.rejection_reason = reason;
  } else if (action === "request_correction") {
    if (!reason) return NextResponse.json({ ok: false, error: "reason_required" }, { status: 422 });
    update.state = "correction_required";
    update.correction_reason = reason;
  } else if (action === "cancel") {
    update.state = "cancelled";
    update.cancelled_at = now;
    update.failure_reason = reason || null;
  }

  const { error } = await supabase
    .from("ofertas_local_renewal_attempts")
    .update(update)
    .eq("id", renewalAttemptId)
    .eq("oferta_local_id", id);
  if (error) return NextResponse.json({ ok: false, error: "renewal_update_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
