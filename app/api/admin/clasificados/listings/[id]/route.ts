import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import { getAdminSupabase, requireAdminCookie } from "@/app/lib/supabase/server";

type ListingsStaffAction =
  | "suspend"
  | "unsuspend"
  | "promote_on"
  | "promote_off"
  | "verify_on"
  | "verify_off"
  | "archive";

function isAction(x: unknown): x is ListingsStaffAction {
  return (
    x === "suspend" ||
    x === "unsuspend" ||
    x === "promote_on" ||
    x === "promote_off" ||
    x === "verify_on" ||
    x === "verify_off" ||
    x === "archive"
  );
}

export const dynamic = "force-dynamic";

/**
 * Staff mutations for `public.listings` (Rentas, En venta, Comunidad, Clases, …).
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
    .from("listings")
    .select("id, category, leonix_ad_id")
    .eq("id", id)
    .maybeSingle();

  if (rErr || !row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};

  switch (action) {
    case "suspend":
      patch.is_published = false;
      patch.status = "flagged";
      break;
    case "unsuspend":
      patch.is_published = true;
      patch.status = "active";
      break;
    case "promote_on":
      patch.admin_promoted = true;
      break;
    case "promote_off":
      patch.admin_promoted = false;
      break;
    case "verify_on":
      patch.leonix_verified = true;
      break;
    case "verify_off":
      patch.leonix_verified = false;
      break;
    case "archive":
      patch.status = "removed";
      patch.is_published = false;
      break;
    default:
      return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  const { error } = await supabase.from("listings").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  void appendAdminAuditLog({
    action: `listings_admin_${action}`,
    targetType: "listings",
    targetId: id,
    meta: { category: (row as { category?: string }).category, patch },
  });

  revalidatePath("/admin/workspace/clasificados");
  revalidatePath(`/clasificados/anuncio/${id}`);
  const cat = String((row as { category?: string }).category ?? "").trim();
  const catLower = cat.toLowerCase();
  if (cat) {
    revalidatePath(`/admin/workspace/clasificados/${encodeURIComponent(catLower)}`);
  }
  if (catLower === "rentas") {
    revalidatePath("/clasificados/rentas");
    revalidatePath("/clasificados/rentas/results");
    revalidatePath(`/clasificados/rentas/anuncio/${id}`);
    revalidatePath(`/clasificados/rentas/listing/${id}`);
  } else if (catLower === "en-venta") {
    revalidatePath("/clasificados/en-venta");
    revalidatePath("/clasificados/en-venta/results");
  } else if (catLower === "comunidad") {
    revalidatePath("/clasificados/comunidad");
  } else if (catLower === "clases") {
    revalidatePath("/clasificados/clases");
  } else if (catLower) {
    revalidatePath(`/clasificados/${encodeURIComponent(catLower)}`);
  }

  return NextResponse.json({ ok: true, id, ...patch });
}
