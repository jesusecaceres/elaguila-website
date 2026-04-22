import { NextRequest, NextResponse } from "next/server";

import { updateEmpleosJobApplicationStatusOwner } from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getBearerUserId } from "../../../_lib/bearerUser";

export const runtime = "nodejs";

const STATUSES = new Set(["submitted", "viewed", "shortlisted", "rejected", "hired"]);

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ applicationId: string }> }): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }
  const ownerUserId = await getBearerUserId(req);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { applicationId } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const status = String((body as Record<string, unknown>).status ?? "").trim();
  if (!STATUSES.has(status)) {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }

  const res = await updateEmpleosJobApplicationStatusOwner({
    applicationId,
    ownerUserId,
    status: status as "submitted" | "viewed" | "shortlisted" | "rejected" | "hired",
  });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error ?? "update_failed" }, { status: res.error === "forbidden" ? 403 : 500 });
  }
  return NextResponse.json({ ok: true });
}
