import { NextResponse } from "next/server";
import { assertAdminLeadExportAccess } from "@/app/admin/_lib/adminLeadExportAuth";
import { updateLeonixLeadAdmin } from "@/app/admin/_lib/leonixLeadsData";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const denied = await assertAdminLeadExportAccess();
  if (denied) return denied;

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const result = await updateLeonixLeadAdmin(id, {
    status: o.status != null ? String(o.status) : undefined,
    internal_notes: o.internal_notes != null ? String(o.internal_notes) : undefined,
  });

  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : result.error === "invalid_status" ? 400 : 500;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, row: result.row });
}
