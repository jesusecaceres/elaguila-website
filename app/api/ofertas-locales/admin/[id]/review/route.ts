import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

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
    const status = result.error === "not_found" ? 404 : result.error === "invalid_transition" ? 409 : 500;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

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
