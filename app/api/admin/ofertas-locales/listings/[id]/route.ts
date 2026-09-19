import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  isOfertaLocalAdminReviewAction,
  ofertaReviewErrorHttpStatus,
  ofertaReviewErrorMessage,
} from "@/app/lib/ofertas-locales/ofertasLocalesAdminReviewMessages";
import { runOfertaLocalAdminReview } from "@/app/lib/ofertas-locales/ofertasLocalesAdminReviewService";
import { getAdminSupabase, isSupabaseAdminConfigured, requireAdminCookie } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Ofertas Locales — row-level staff lifecycle route (approve / reject / archive / restore), the endpoint the
 * shared `ClassifiedAdminRowActions` (variant "ofertas") calls.
 *
 * Same engine as the inspect-form server action: `runOfertaLocalAdminReview` → `mutateOfertaLocalAdminReview`
 * (approve stays gated by payment / entitlement / partner courtesy, resolved AI items, scan-ready source and a
 * Leonix Ad ID; reject requires a reason; restore returns rejected / archived offers to `pending_review`, never
 * to `approved`), then an audit row + revalidation. The operational-review confirmation must be sent
 * (`confirmed: true`). Nothing here writes payment truth.
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  const { id: rawId } = await ctx.params;
  const id = (rawId ?? "").trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  let body: { action?: unknown; note?: unknown; confirmed?: unknown } | null;
  try {
    body = (await req.json()) as { action?: unknown; note?: unknown; confirmed?: unknown } | null;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const action = body?.action;
  if (!isOfertaLocalAdminReviewAction(action)) {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }
  if (body?.confirmed !== true) {
    return NextResponse.json(
      { ok: false, error: "confirmation_required", message: ofertaReviewErrorMessage("confirmation_required") },
      { status: 400 },
    );
  }

  const note = typeof body?.note === "string" ? body.note : null;
  const result = await runOfertaLocalAdminReview(getAdminSupabase(), { id, action, note });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, message: ofertaReviewErrorMessage(result.error) },
      { status: ofertaReviewErrorHttpStatus(result.error) },
    );
  }

  return NextResponse.json({
    ok: true,
    id: result.id,
    action,
    previousStatus: result.previousStatus,
    newStatus: result.newStatus,
    audit_logged: result.auditLogged,
  });
}
