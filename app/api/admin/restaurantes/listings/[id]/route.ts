import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import { getAdminSupabase, requireAdminCookie } from "@/app/lib/supabase/server";

type AdminRestauranteAction =
  | "suspend"
  | "unsuspend"
  | "promote_on"
  | "promote_off"
  | "verify_on"
  | "verify_off";

function isAction(x: unknown): x is AdminRestauranteAction {
  return (
    x === "suspend" ||
    x === "unsuspend" ||
    x === "promote_on" ||
    x === "promote_off" ||
    x === "verify_on" ||
    x === "verify_off"
  );
}

/**
 * Admin-only mutations for `restaurantes_public_listings`.
 * Auth: HTTP-only `leonix_admin=1` cookie (same layer as workspace).
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id?.trim()) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const action = (body as { action?: unknown }).action;
  if (!isAction(action)) {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  const { data: row, error: rErr } = await supabase
    .from("restaurantes_public_listings")
    .select("id, slug, status, promoted, leonix_verified")
    .eq("id", id)
    .maybeSingle();

  if (rErr || !row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  switch (action) {
    case "suspend":
      patch.status = "suspended";
      break;
    case "unsuspend":
      patch.status = "published";
      break;
    case "promote_on":
      patch.promoted = true;
      break;
    case "promote_off":
      patch.promoted = false;
      break;
    case "verify_on":
      patch.leonix_verified = true;
      break;
    case "verify_off":
      patch.leonix_verified = false;
      break;
    default:
      return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  const { error } = await supabase.from("restaurantes_public_listings").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  void appendAdminAuditLog({
    action: `restaurantes_admin_${action}`,
    targetType: "restaurantes_public_listing",
    targetId: id,
    meta: { slug: row.slug, patch },
  });

  const slug = String(row.slug);
  revalidatePath("/clasificados/restaurantes/resultados");
  revalidatePath("/clasificados/restaurantes");
  revalidatePath(`/clasificados/restaurantes/${slug}`);

  return NextResponse.json({
    ok: true,
    id,
    slug,
    ...patch,
  });
}
