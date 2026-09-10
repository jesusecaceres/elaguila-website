import { NextResponse } from "next/server";
import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import {
  isSupportedExternalRecordType,
  lookupExternalRecordById,
} from "@/app/admin/_lib/adminBusinessExternalRecordLookup";
import { createVerifiedExternalLink } from "@/app/lib/business/repositories/businessExternalLinksRepo";

export const dynamic = "force-dynamic";

/**
 * ADMIN-OS-01 GATE 2 — the one write surface for business_external_links. Staff explicitly
 * supply a record type + a real record id; the server re-verifies the record exists in its own
 * table before writing anything (never trusts the client's word for it), then creates an
 * additive, immediately-verified link. Never mutates the linked lead/payment/support-ticket row.
 * Gated the same as internal notes (`create_internal_note`) — same risk profile: an additive,
 * staff-attributed, reversible-by-status Business 360 annotation, not a destructive action.
 */
export async function POST(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("create_internal_note");
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  }
  const { businessId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const recordType = typeof b.recordType === "string" ? b.recordType.trim() : "";
  const recordId = typeof b.recordId === "string" ? b.recordId.trim() : "";
  if (!recordId) {
    return NextResponse.json({ ok: false, error: "missing_record_id" }, { status: 400 });
  }
  if (!isSupportedExternalRecordType(recordType)) {
    return NextResponse.json({ ok: false, error: "unsupported_record_type" }, { status: 400 });
  }

  const supabase = getAdminSupabase();

  // Never trust the client's claim that this record exists — re-verify server-side.
  const summary = await lookupExternalRecordById(supabase, recordType, recordId);
  if (!summary) {
    return NextResponse.json({ ok: false, error: "record_not_found" }, { status: 404 });
  }

  const result = await createVerifiedExternalLink(supabase, {
    businessId,
    recordType,
    recordId,
    linkedByAuthUserId: access.actor.authUserId,
  });
  if (!result.ok) {
    const status = result.error === "duplicate" ? 409 : result.error === "table_missing" ? 503 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  await appendAdminAuditLog({
    action: "business_external_link_created",
    targetType: "business_external_links",
    targetId: result.id,
    meta: { business_id: businessId, record_type: recordType, record_id: recordId, actor_email: access.actor.email },
  });

  return NextResponse.json({ ok: true, id: result.id, summary }, { status: 201 });
}
