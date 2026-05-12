import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import {
  autosRowIsPublicLive,
  canRepublishListing,
} from "@/app/admin/_lib/classifiedsRepublishCapability";
import { getAdminSupabase, requireAdminCookie } from "@/app/lib/supabase/server";
import { getAutosClassifiedsListingById } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import type { AutosClassifiedsListingStatus } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

export const dynamic = "force-dynamic";

type StaffAutosAction =
  | "remove_public"
  | "restore_active"
  | "suspend"
  | "unsuspend"
  | "promote_on"
  | "promote_off"
  | "verify_on"
  | "verify_off"
  | "archive"
  | "republish";

function isAction(x: unknown): x is StaffAutosAction {
  return (
    x === "remove_public" ||
    x === "restore_active" ||
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

/**
 * Staff-only mutations for `autos_classifieds_listings` (paid Autos vertical).
 * Auth: `leonix_admin` cookie (same layer as other admin APIs).
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

  const row = await getAutosClassifiedsListingById(id);
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  if (action === "republish") {
    const { data: meta, error: mErr } = await supabase
      .from("autos_classifieds_listings")
      .select("republish_count, republish_override, lane, status, leonix_ad_id, owner_user_id")
      .eq("id", id)
      .maybeSingle();
    if (mErr || !meta) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    const rec = { ...(meta as Record<string, unknown>) };
    if (!canRepublishListing(rec, "autos")) {
      return NextResponse.json({ ok: false, error: "republish_not_eligible" }, { status: 400 });
    }
    const nextCount = Number(rec.republish_count ?? 0) + 1;
    const patch: Record<string, unknown> = {
      updated_at: now,
      republished_at: now,
      republish_count: nextCount,
      last_republished_source: "admin",
      last_republished_by: null,
    };
    if (!autosRowIsPublicLive(rec)) {
      if (rec.status === "removed" || rec.status === "cancelled") {
        patch.status = "active" satisfies AutosClassifiedsListingStatus;
        patch.published_at = row.published_at ?? now;
      }
    }
    const { error } = await supabase.from("autos_classifieds_listings").update(patch).eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    void appendAdminAuditLog({
      action: "republish",
      targetType: "autos_classifieds_listing",
      targetId: id,
      meta: { leonix_ad_id: rec.leonix_ad_id, patch },
    });
    revalidatePath("/clasificados/autos");
    revalidatePath(`/clasificados/autos/vehiculo/${id}`);
    revalidatePath("/admin/workspace/clasificados/autos");
    return NextResponse.json({ ok: true, id, ...patch });
  }

  const patch: Record<string, unknown> = { updated_at: now };

  if (action === "remove_public" || action === "suspend") {
    if (row.status !== "active") {
      return NextResponse.json({ ok: false, error: "not_active" }, { status: 400 });
    }
    patch.status = "removed" satisfies AutosClassifiedsListingStatus;
  } else if (action === "restore_active" || action === "unsuspend") {
    if (row.status !== "removed" && row.status !== "cancelled") {
      return NextResponse.json({ ok: false, error: "not_removed_or_cancelled" }, { status: 400 });
    }
    patch.status = "active" satisfies AutosClassifiedsListingStatus;
    patch.published_at = row.published_at ?? now;
  } else if (action === "promote_on") {
    patch.featured = true;
  } else if (action === "promote_off") {
    patch.featured = false;
  } else if (action === "verify_on") {
    patch.leonix_verified = true;
  } else if (action === "verify_off") {
    patch.leonix_verified = false;
  } else if (action === "archive") {
    if (row.status === "draft" || row.status === "pending_payment") {
      return NextResponse.json({ ok: false, error: "cannot_archive_pre_publish" }, { status: 400 });
    }
    patch.status = "cancelled" satisfies AutosClassifiedsListingStatus;
  } else {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  const { error } = await supabase.from("autos_classifieds_listings").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  void appendAdminAuditLog({
    action: `autos_admin_${action}`,
    targetType: "autos_classifieds_listing",
    targetId: id,
    meta: { from: row.status, patch },
  });

  revalidatePath("/clasificados/autos");
  revalidatePath(`/clasificados/autos/vehiculo/${id}`);
  revalidatePath("/admin/workspace/clasificados/autos");

  return NextResponse.json({ ok: true, id, ...patch });
}
