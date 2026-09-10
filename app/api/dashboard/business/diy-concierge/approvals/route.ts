import { NextResponse, type NextRequest } from "next/server";
import { resolveDiyAccess } from "@/app/lib/business/diyConcierge/access";
import { decideOwnerApproval, getApprovalById, listApprovalsForBusiness } from "@/app/lib/business/diyConcierge/repository";
import type { ApprovalStatus, DiyConciergeActor } from "@/app/lib/business/diyConcierge/types";
import { MAX_NOTE_LENGTH } from "@/app/lib/business/diyConcierge/constants";

/**
 * GET /api/dashboard/business/diy-concierge/approvals?businessId= — the owner's Approval Center
 * list for this exact business. Nothing here is auto-approved; every row reflects an explicit
 * decision or a still-pending request.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const access = await resolveDiyAccess(req, businessId);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  if (access.entitlement.state !== "personalized_access_active") {
    return NextResponse.json({ ok: true, businessId: access.business.id, approvals: [] });
  }

  const approvals = await listApprovalsForBusiness(access.business.id);
  return NextResponse.json({ ok: true, businessId: access.business.id, approvals });
}

type DecisionBody = { businessId?: unknown; approvalId?: unknown; decision?: unknown; note?: unknown };

/**
 * POST /api/dashboard/business/diy-concierge/approvals — body: {businessId, approvalId, decision,
 * note?}. Only "approved" | "declined" | "withdrawn" may be submitted through the owner-facing
 * route — an owner may never approve a staff-only decision on their own request; only a pending
 * approval may ever be decided, and only once.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: DecisionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const businessId = typeof body.businessId === "string" ? body.businessId : null;
  const access = await resolveDiyAccess(req, businessId);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  if (access.entitlement.state !== "personalized_access_active") {
    return NextResponse.json({ ok: false, error: "personalized_access_unavailable" }, { status: 403 });
  }

  const approvalId = typeof body.approvalId === "string" ? body.approvalId : "";
  const decision = typeof body.decision === "string" ? (body.decision as ApprovalStatus) : null;
  const note = typeof body.note === "string" ? body.note : null;

  if (!approvalId) return NextResponse.json({ ok: false, error: "missing_approval_id" }, { status: 400 });
  if (decision !== "approved" && decision !== "declined" && decision !== "withdrawn") {
    return NextResponse.json({ ok: false, error: "invalid_decision" }, { status: 400 });
  }
  if (note !== null && note.length > MAX_NOTE_LENGTH) return NextResponse.json({ ok: false, error: "note_too_long" }, { status: 400 });

  const existing = await getApprovalById(access.business.id, approvalId);
  if (!existing) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  // An owner may withdraw their own paid-service requests, but only staff may approve/decline
  // them (via the admin route) — an owner must never approve their own paid request.
  const isPaidServiceApproval = existing.requestType === "concierge_guidance_request" || existing.requestType === "managed_service_request";
  if (isPaidServiceApproval && decision !== "withdrawn") {
    return NextResponse.json({ ok: false, error: "owner_may_only_withdraw" }, { status: 403 });
  }

  const actor: DiyConciergeActor = { type: "owner", authUserId: access.userId, email: access.email };
  const result = await decideOwnerApproval(actor, access.business.id, approvalId, decision, note);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "not_found" ? 404 : 409 });
  }
  return NextResponse.json({ ok: true, approval: result.approval });
}
