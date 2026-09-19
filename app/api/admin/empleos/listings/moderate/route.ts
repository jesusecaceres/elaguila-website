import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { legacyEmpleosStatusToAction } from "@/app/admin/_lib/adminEmpleosStaffActions";
import { runEmpleosStaffAction } from "@/app/admin/_lib/adminEmpleosStaffActionsServer";
import { requireAdminCookie } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DEPRECATED compatibility shim — NOT a second lifecycle system. The Empleos admin page no longer
 * calls it. It maps the old `{ id, lifecycle_status, moderation_reason? }` body onto the canonical
 * staff action and runs the SAME shared server function as `PATCH /api/admin/empleos/listings/[id]`
 * (status/payment preconditions, moderation markers, audit log). `published` therefore means
 * Restore: it can no longer publish a never-paid paid-lane row, and it no longer rewrites
 * `published_at`. Use the canonical PATCH route for new callers.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const id = String(b.id ?? "").trim();
  const lifecycleStatus = String(b.lifecycle_status ?? "").trim();
  if (!id || !lifecycleStatus) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }
  const action = legacyEmpleosStatusToAction(lifecycleStatus);
  if (!action) {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }

  const res = await runEmpleosStaffAction({ id, action, reason: b.moderation_reason });
  return NextResponse.json(res.body, { status: res.status });
}
