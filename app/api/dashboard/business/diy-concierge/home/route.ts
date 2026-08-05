import { NextResponse, type NextRequest } from "next/server";
import { resolveDiyAccess } from "@/app/lib/business/diyConcierge/access";
import { getFullRun, getLatestCompletedRun } from "@/app/lib/business/healthMap/repository";
import { shapeDimensionResultsForOwnerView } from "@/app/lib/business/healthMap/logic";
import { listActionsForBusiness, listApprovalsForBusiness, listServiceRequestsForBusiness } from "@/app/lib/business/diyConcierge/repository";
import { computeActionProgressSummary } from "@/app/lib/business/diyConcierge/logic";

/**
 * GET /api/dashboard/business/diy-concierge/home?businessId= — the unified DIY Concierge Home
 * payload: entitlement state, latest owner-safe Health Map summary, real action-state progress,
 * and pending Approval Center / service-request counts. Never returns personalized data unless
 * `entitlement.state === "personalized_access_active"` for the exact, membership-verified business.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const access = await resolveDiyAccess(req, businessId);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  const { business, entitlement } = access;

  if (entitlement.state !== "personalized_access_active") {
    return NextResponse.json({
      ok: true,
      businessId: business.id,
      entitlement: { state: entitlement.state, packageTier: entitlement.packageTier, conciergeGuidance: entitlement.conciergeGuidance },
      healthSummary: null,
      actionProgress: null,
      pendingApprovalsCount: 0,
      pendingServiceRequestsCount: 0,
    });
  }

  const latestRun = await getLatestCompletedRun(business.id);
  let healthSummary: { assessedAt: string | null; dimensionCount: number } | null = null;
  if (latestRun) {
    const full = await getFullRun(latestRun.id);
    if (full) {
      const dims = shapeDimensionResultsForOwnerView(full.dimensionResults);
      healthSummary = { assessedAt: full.run.completedAt, dimensionCount: dims.length };
    }
  }

  const [actions, approvals, serviceRequests] = await Promise.all([
    listActionsForBusiness(business.id),
    listApprovalsForBusiness(business.id),
    listServiceRequestsForBusiness(business.id),
  ]);

  return NextResponse.json({
    ok: true,
    businessId: business.id,
    entitlement: { state: entitlement.state, packageTier: entitlement.packageTier, conciergeGuidance: entitlement.conciergeGuidance },
    healthSummary,
    actionProgress: computeActionProgressSummary(actions),
    pendingApprovalsCount: approvals.filter((a) => a.status === "pending").length,
    pendingServiceRequestsCount: serviceRequests.filter((r) => r.status === "pending").length,
  });
}
