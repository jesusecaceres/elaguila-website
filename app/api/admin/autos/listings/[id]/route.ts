import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import {
  getAutosClassifiedsListingById,
  updateAutosListingStatus,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import type { AutosClassifiedsListingStatus } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

export const dynamic = "force-dynamic";

type StaffAutosAction = "remove_public" | "restore_active";

function isAction(x: unknown): x is StaffAutosAction {
  return x === "remove_public" || x === "restore_active";
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

  let nextStatus: AutosClassifiedsListingStatus | null = null;
  if (action === "remove_public") {
    if (row.status !== "active") {
      return NextResponse.json({ ok: false, error: "not_active" }, { status: 400 });
    }
    nextStatus = "removed";
  } else {
    if (row.status !== "removed") {
      return NextResponse.json({ ok: false, error: "not_removed" }, { status: 400 });
    }
    nextStatus = "active";
  }

  const ok = await updateAutosListingStatus(id, nextStatus, nextStatus === "active" ? { published_at: row.published_at ?? new Date().toISOString() } : undefined);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }

  void appendAdminAuditLog({
    action: `autos_admin_${action}`,
    targetType: "autos_classifieds_listing",
    targetId: id,
    meta: { from: row.status, to: nextStatus },
  });

  revalidatePath("/clasificados/autos");
  revalidatePath("/admin/workspace/clasificados/autos");

  return NextResponse.json({ ok: true, id, status: nextStatus });
}
