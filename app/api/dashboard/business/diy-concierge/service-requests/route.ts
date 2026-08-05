import { NextResponse, type NextRequest } from "next/server";
import { resolveDiyAccess } from "@/app/lib/business/diyConcierge/access";
import { validateServiceRequestInput } from "@/app/lib/business/diyConcierge/logic";
import { createOwnerApproval, createServiceRequest, listServiceRequestsForBusiness } from "@/app/lib/business/diyConcierge/repository";
import type { DiyConciergeActor, ServiceRequestType, ServiceRequestUrgency } from "@/app/lib/business/diyConcierge/types";
import { SERVICE_REQUEST_TYPES, SERVICE_REQUEST_URGENCIES } from "@/app/lib/business/diyConcierge/constants";

/**
 * GET /api/dashboard/business/diy-concierge/service-requests?businessId= — the owner's own paid
 * Guide Me / Let Leonix Handle It request history for this exact business.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const access = await resolveDiyAccess(req, businessId);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  if (access.entitlement.state !== "personalized_access_active") {
    return NextResponse.json({ ok: true, businessId: access.business.id, requests: [] });
  }

  const requests = await listServiceRequestsForBusiness(access.business.id);
  return NextResponse.json({ ok: true, businessId: access.business.id, requests });
}

type ServiceRequestBody = {
  businessId?: unknown;
  sourceActionId?: unknown;
  requestType?: unknown;
  requestedDeliverable?: unknown;
  requestedOutcome?: unknown;
  ownerNote?: unknown;
  urgencyPreference?: unknown;
};

/**
 * POST /api/dashboard/business/diy-concierge/service-requests — creates a structured, truthful,
 * PENDING-only request for paid human work. Never Stripe/payment/scheduling/staff-assignment —
 * this route only records what was requested plus a server-resolved entitlement-context snapshot
 * (never a client-supplied package claim). Also opens a matching Approval Center record so the
 * owner can track/withdraw it, and only staff (via the admin route) may acknowledge it.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: ServiceRequestBody;
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

  const requestType = typeof body.requestType === "string" ? (body.requestType as ServiceRequestType) : null;
  const requestedDeliverable = typeof body.requestedDeliverable === "string" ? body.requestedDeliverable : "";
  const requestedOutcome = typeof body.requestedOutcome === "string" ? body.requestedOutcome : null;
  const ownerNote = typeof body.ownerNote === "string" ? body.ownerNote : null;
  const urgencyPreference: ServiceRequestUrgency =
    typeof body.urgencyPreference === "string" && SERVICE_REQUEST_URGENCIES.includes(body.urgencyPreference as ServiceRequestUrgency)
      ? (body.urgencyPreference as ServiceRequestUrgency)
      : "no_rush";
  const sourceActionId = typeof body.sourceActionId === "string" ? body.sourceActionId : null;

  if (!requestType || !SERVICE_REQUEST_TYPES.includes(requestType)) {
    return NextResponse.json({ ok: false, error: "invalid_request_type" }, { status: 400 });
  }
  const validation = validateServiceRequestInput({ requestedDeliverable, requestedOutcome, ownerNote });
  if (!validation.ok) return NextResponse.json({ ok: false, error: "invalid_input", detail: validation.errors }, { status: 400 });

  // Server-resolved entitlement context snapshot — never a client-supplied package claim.
  const entitlementSnapshot = {
    state: access.entitlement.state,
    packageTier: access.entitlement.packageTier,
    resolvedAt: new Date().toISOString(),
  };

  const created = await createServiceRequest(access.userId, access.email, access.business.id, {
    sourceActionId,
    requestType,
    requestedDeliverable,
    requestedOutcome,
    ownerNote,
    urgencyPreference,
    entitlementSnapshot,
  });
  if (!created) return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });

  const actor: DiyConciergeActor = { type: "owner", authUserId: access.userId, email: access.email };
  await createOwnerApproval(actor, access.business.id, {
    requestType: requestType === "guide_me_concierge" ? "concierge_guidance_request" : "managed_service_request",
    sourceRecordType: "business_service_requests",
    sourceRecordId: created.id,
    requestedDecision: "acknowledge_pending_request",
    ownerNote,
  });

  return NextResponse.json({ ok: true, request: created });
}
