/**
 * LEO-16 owner test alert — same push transport as production alerts.
 */
import { NextResponse } from "next/server";

import { resolveLeoAccess } from "@/app/leo/_lib/leoAccess";
import { sendLeoTestAlert } from "@/app/leo/_lib/leoNotificationService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const access = await resolveLeoAccess();
  if (!access.allowed) {
    const status = access.reason === "unauthenticated" ? 401 : 403;
    return NextResponse.json({ ok: false, error: access.reason }, { status });
  }
  const ownerAuthUserId = access.admin.authUserId?.trim();
  if (!ownerAuthUserId) {
    return NextResponse.json({ ok: false, error: "missing_auth_user_id" }, { status: 403 });
  }

  const result = await sendLeoTestAlert(ownerAuthUserId);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "test_failed", delivered: result.delivered },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, delivered: result.delivered, test: true });
}
