import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import { isComidaLocalAdminAction } from "@/app/lib/clasificados/comida-local/comidaLocalAdminModeration";
import { applyAdminComidaLocalAction } from "@/app/lib/clasificados/comida-local/comidaLocalAdminQueries";
import { getAdminSupabase, isSupabaseAdminConfigured, requireAdminCookie } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Comida Local — the ONE staff lifecycle route (suspend / unsuspend(restore) / archive(pause) / republish).
 *
 * Replaces the raw status <select> server action. The rules live in comidaLocalAdminModeration.ts and are
 * applied by `applyAdminComidaLocalAction`:
 *  - payment-aware: staff can NEVER make a row public unless it carries payment proof (paid / waived /
 *    legacy live) — otherwise 409 `payment_required`. Draft / pending_payment rows go live only through the
 *    verified payment fulfilment.
 *  - suspend writes suspended_reason = 'moderation'; a payment-engine suspension ('payment') is never
 *    overwritten by a staff restore (409 `payment_suspended`, and the write itself is a CAS that excludes it).
 *  - every applied action writes an admin audit row and revalidates public + admin surfaces.
 *  - this route never writes payment_status and never marks anything paid.
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }

  const { id: rawId } = await ctx.params;
  const id = (rawId ?? "").trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const action = (body as { action?: unknown } | null)?.action;
  if (!isComidaLocalAdminAction(action)) {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  const result = await applyAdminComidaLocalAction(getAdminSupabase(), id, action);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, message: result.message },
      { status: result.httpStatus },
    );
  }

  const audit = await appendAdminAuditLog({
    action: `comida_local_admin_${action}`,
    targetType: "comida_local_public_listing",
    targetId: result.id,
    meta: {
      slug: result.slug,
      leonix_ad_id: result.leonixAdId,
      from_status: result.fromStatus,
      to_status: result.toStatus,
      suspended_reason: result.suspendedReason,
      payment_status: result.paymentStatus,
    },
  });

  revalidatePath("/clasificados/comida-local");
  revalidatePath("/admin/workspace/clasificados/comida-local");
  if (result.slug) revalidatePath(`/clasificados/comida-local/${result.slug}`);

  return NextResponse.json({
    ok: true,
    id: result.id,
    slug: result.slug,
    action,
    status: result.toStatus,
    audit_logged: audit.ok,
  });
}
