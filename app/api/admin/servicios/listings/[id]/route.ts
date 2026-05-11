import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import { insertServiciosAnalyticsEvent } from "@/app/clasificados/servicios/lib/serviciosOpsTablesServer";
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "@/app/clasificados/servicios/lib/serviciosListingLifecycle";
import { getAdminSupabase, requireAdminCookie } from "@/app/lib/supabase/server";

type ServiciosStaffAction =
  | "suspend"
  | "unsuspend"
  | "promote_on"
  | "promote_off"
  | "verify_on"
  | "verify_off"
  | "archive";

function isAction(x: unknown): x is ServiciosStaffAction {
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
    .from("servicios_public_listings")
    .select("id, slug, listing_status, promoted, leonix_verified")
    .eq("id", id)
    .maybeSingle();

  if (rErr || !row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  switch (action) {
    case "suspend":
      patch.listing_status = "suspended";
      break;
    case "unsuspend":
      patch.listing_status = SERVICIOS_LISTING_STATUS_PUBLISHED;
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
    case "archive":
      patch.listing_status = "rejected";
      break;
    default:
      return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  const { error } = await supabase.from("servicios_public_listings").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const slug = String((row as { slug?: string }).slug ?? "");
  void insertServiciosAnalyticsEvent({
    listingSlug: slug || null,
    eventType: "admin_moderation",
    meta: { action: `servicios_patch_${action}`, patch },
  });

  void appendAdminAuditLog({
    action: `servicios_admin_${action}`,
    targetType: "servicios_public_listing",
    targetId: id,
    meta: { slug, patch },
  });

  revalidatePath("/clasificados/servicios");
  revalidatePath("/clasificados/servicios/resultados");
  revalidatePath("/admin/workspace/clasificados/servicios");
  if (slug) {
    revalidatePath(`/clasificados/servicios/${slug}`);
  }

  return NextResponse.json({ ok: true, id, slug, ...patch });
}
