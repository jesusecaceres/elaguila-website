import { isVerifiedAdminSession } from "@/app/admin/_lib/adminVerifiedSession";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { runEmpleosStaffAction } from "@/app/admin/_lib/adminEmpleosStaffActionsServer";

export const dynamic = "force-dynamic";

/**
 * THE Empleos staff lifecycle / trust action route. Body: `{ action, reason? }` with action one of
 * suspend | unsuspend | archive | republish | reject | send_to_review | promote_on/off | verify_on/off
 * (see adminEmpleosStaffActions.ts). All rules — status/payment preconditions, moderation markers, audit
 * log — live in `runEmpleosStaffAction`; this route only authenticates and parses.
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  if (!(await isVerifiedAdminSession(jar))) {
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
  const b = (body ?? {}) as { action?: unknown; reason?: unknown };

  const res = await runEmpleosStaffAction({ id, action: b.action, reason: b.reason });
  return NextResponse.json(res.body, { status: res.status });
}
