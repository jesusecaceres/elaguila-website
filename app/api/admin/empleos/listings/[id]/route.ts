import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import {
  canRepublishListing,
  empleosRowIsPublicLive,
} from "@/app/admin/_lib/classifiedsRepublishCapability";
import { getAdminSupabase, requireAdminCookie } from "@/app/lib/supabase/server";

type EmpleosStaffAction =
  | "suspend"
  | "unsuspend"
  | "promote_on"
  | "promote_off"
  | "verify_on"
  | "verify_off"
  | "archive"
  | "republish";

function isAction(x: unknown): x is EmpleosStaffAction {
  return (
    x === "suspend" ||
    x === "unsuspend" ||
    x === "promote_on" ||
    x === "promote_off" ||
    x === "verify_on" ||
    x === "verify_off" ||
    x === "archive" ||
    x === "republish"
  );
}

export const dynamic = "force-dynamic";

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
    .from("empleos_public_listings")
    .select("id, slug, lifecycle_status, admin_promoted, leonix_verified, republish_count, republish_override")
    .eq("id", id)
    .maybeSingle();

  if (rErr || !row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const rowRec = row as Record<string, unknown>;
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  if (action === "republish") {
    if (String(rowRec.lifecycle_status ?? "").toLowerCase() === "archived") {
      return NextResponse.json({ ok: false, error: "cannot_republish_archived" }, { status: 400 });
    }
    if (!canRepublishListing(rowRec, "empleos")) {
      return NextResponse.json({ ok: false, error: "republish_not_eligible" }, { status: 400 });
    }
    const nextCount = Number(rowRec.republish_count ?? 0) + 1;
    Object.assign(patch, {
      republished_at: now,
      republish_count: nextCount,
      last_republished_source: "admin",
      last_republished_by: null,
    });
    if (!empleosRowIsPublicLive(rowRec)) {
      patch.lifecycle_status = "published";
    }
    const { error } = await supabase.from("empleos_public_listings").update(patch).eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    const slug = String(rowRec.slug ?? "");
    void appendAdminAuditLog({
      action: "republish",
      targetType: "empleos_public_listing",
      targetId: id,
      meta: { slug, patch },
    });
    revalidatePath("/clasificados/empleos");
    revalidatePath("/clasificados/empleos/resultados");
    revalidatePath("/admin/workspace/clasificados/empleos");
    if (slug) revalidatePath(`/clasificados/empleos/${slug}`);
    return NextResponse.json({ ok: true, id, slug, ...patch });
  }

  switch (action) {
    case "suspend":
      patch.lifecycle_status = "paused";
      break;
    case "unsuspend":
      patch.lifecycle_status = "published";
      break;
    case "promote_on":
      patch.admin_promoted = true;
      break;
    case "promote_off":
      patch.admin_promoted = false;
      break;
    case "verify_on":
      patch.leonix_verified = true;
      patch.verified_employer = true;
      break;
    case "verify_off":
      patch.leonix_verified = false;
      patch.verified_employer = false;
      break;
    case "archive":
      patch.lifecycle_status = "archived";
      break;
    default:
      return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  const { error } = await supabase.from("empleos_public_listings").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const slug = String((row as { slug?: string }).slug ?? "");
  void appendAdminAuditLog({
    action: `empleos_admin_${action}`,
    targetType: "empleos_public_listing",
    targetId: id,
    meta: { slug, patch },
  });

  revalidatePath("/clasificados/empleos");
  revalidatePath("/clasificados/empleos/resultados");
  revalidatePath("/admin/workspace/clasificados/empleos");
  if (slug) {
    revalidatePath(`/clasificados/empleos/${slug}`);
  }

  return NextResponse.json({ ok: true, id, slug, ...patch });
}
