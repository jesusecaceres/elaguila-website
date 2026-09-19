import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import {
  mutateOfertaLocalAdminReview,
  type OfertaLocalAdminReviewAction,
} from "@/app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations";
import { getAdminSupabase, isSupabaseAdminConfigured, requireAdminCookie } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_ACTIONS: ReadonlySet<OfertaLocalAdminReviewAction> = new Set([
  "approve",
  "reject",
  "archive",
  // closeout 2: rejected / archived offers go back to pending_review (never straight to approved).
  "restore",
]);

type ReviewBody = {
  action?: string;
  note?: string;
};

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  const { id } = await ctx.params;
  let body: ReviewBody;
  try {
    body = (await req.json()) as ReviewBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const action = String(body.action ?? "").trim() as OfertaLocalAdminReviewAction;
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  const note = typeof body.note === "string" ? body.note : null;
  const supabase = getAdminSupabase();
  const result = await mutateOfertaLocalAdminReview(supabase, id, action, note);

  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "invalid_transition"
          ? 409
          : result.error === "rejection_reason_required" ||
              result.error === "unresolved_review_items"
            ? 422
            : 500;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  // closeout 2: this route used to mutate with no audit row.
  await appendAdminAuditLog({
    action: `ofertas_locales_admin_${action}`,
    targetType: "ofertas_locales",
    targetId: result.id,
    meta: {
      from_status: result.previousStatus,
      to_status: result.newStatus,
      note: note && note.trim() ? note.trim().slice(0, 500) : null,
      via: "api/ofertas-locales/admin/[id]/review",
    },
  });

  revalidatePath("/clasificados/ofertas-locales");
  revalidatePath("/clasificados/ofertas-locales/results");
  revalidatePath("/admin/workspace/clasificados/ofertas-locales");

  return NextResponse.json({
    ok: true,
    id: result.id,
    previousStatus: result.previousStatus,
    newStatus: result.newStatus,
  });
}
