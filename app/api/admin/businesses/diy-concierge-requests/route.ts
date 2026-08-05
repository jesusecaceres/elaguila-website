import { NextResponse, type NextRequest } from "next/server";
import { requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { hasCapability } from "@/app/admin/_lib/salesWorkspaceCapabilities";
import { staffActorToDiyConciergeActor } from "@/app/admin/_lib/diyConciergeActor";
import { acknowledgeServiceRequest, decideOwnerApproval, getApprovalById, listAllPendingServiceRequests } from "@/app/lib/business/diyConcierge/repository";

/**
 * GET /api/admin/businesses/diy-concierge-requests — staff-only list of every pending Guide Me /
 * Let Leonix Handle It request across all businesses, for staff to review. Requires
 * view_diy_concierge_requests. Never a work order, payment, or assignment by itself.
 */
export async function GET(): Promise<NextResponse> {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: 403 });
  if (!hasCapability(access.actor.capabilities, "view_diy_concierge_requests")) {
    return NextResponse.json({ ok: false, error: "capability_denied" }, { status: 403 });
  }

  const requests = await listAllPendingServiceRequests();
  return NextResponse.json({ ok: true, requests });
}

type DecisionBody = { requestId?: unknown; approvalId?: unknown; action?: unknown; note?: unknown };

/**
 * POST /api/admin/businesses/diy-concierge-requests — staff-only. body: {requestId, action:
 * "acknowledge"} acknowledges a pending service request (never a work order/payment/assignment);
 * body: {approvalId, action: "approve"|"decline", note?} decides the matching Approval Center
 * record for a paid guidance/managed-service request — only staff may approve/decline these,
 * never the owner themselves.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: 403 });

  let body: DecisionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";

  if (action === "acknowledge") {
    if (!hasCapability(access.actor.capabilities, "view_diy_concierge_requests")) {
      return NextResponse.json({ ok: false, error: "capability_denied" }, { status: 403 });
    }
    const requestId = typeof body.requestId === "string" ? body.requestId : "";
    if (!requestId) return NextResponse.json({ ok: false, error: "missing_request_id" }, { status: 400 });
    const updated = await acknowledgeServiceRequest(access.actor.rosterId, access.actor.email, requestId);
    if (!updated) return NextResponse.json({ ok: false, error: "not_found_or_not_pending" }, { status: 404 });
    return NextResponse.json({ ok: true, request: updated });
  }

  if (action === "approve" || action === "decline") {
    const approvalId = typeof body.approvalId === "string" ? body.approvalId : "";
    const businessId = typeof (body as { businessId?: unknown }).businessId === "string" ? (body as { businessId: string }).businessId : "";
    const note = typeof body.note === "string" ? body.note : null;
    if (!approvalId || !businessId) return NextResponse.json({ ok: false, error: "missing_approval_or_business_id" }, { status: 400 });

    const existingApproval = await getApprovalById(businessId, approvalId);
    if (!existingApproval) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

    const requiredCapability = existingApproval.requestType === "concierge_guidance_request" ? "decide_concierge_guidance_request" : "decide_managed_service_request";
    if (!hasCapability(access.actor.capabilities, requiredCapability)) {
      return NextResponse.json({ ok: false, error: "capability_denied" }, { status: 403 });
    }

    const actor = staffActorToDiyConciergeActor(access.actor);
    const result = await decideOwnerApproval(actor, businessId, approvalId, action === "approve" ? "approved" : "declined", note);
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "not_found" ? 404 : 409 });
    return NextResponse.json({ ok: true, approval: result.approval });
  }

  return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
}
