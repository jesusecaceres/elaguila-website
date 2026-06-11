import { NextResponse } from "next/server";
import { assertAdminLeadExportAccess } from "@/app/admin/_lib/adminLeadExportAuth";
import {
  applyNewsletterLifecycleAdmin,
  updateNewsletterSubscriberNotesAdmin,
} from "@/app/admin/_lib/leonixLeadsData";

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
  const actionRaw = o.action != null ? String(o.action).trim() : "";

  if (actionRaw === "archive" || actionRaw === "restore" || actionRaw === "delete") {
    const result = await applyNewsletterLifecycleAdmin(
      id,
      actionRaw as "archive" | "restore" | "delete",
    );
    if (!result.ok) {
      const status =
        result.error === "not_found" ? 404 : result.error === "already_deleted" ? 409 : 500;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, row: result.row, action: actionRaw });
  }

  if (o.internal_notes != null) {
    const result = await updateNewsletterSubscriberNotesAdmin(id, String(o.internal_notes));
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, row: result.row });
  }

  return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
}
