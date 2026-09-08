import { NextResponse, type NextRequest } from "next/server";
import { resolveDiyAccess } from "@/app/lib/business/diyConcierge/access";
import { getFullRun, getLatestCompletedRun } from "@/app/lib/business/healthMap/repository";
import { shapeDimensionResultsForOwnerView, shapeFindingsForOwnerView } from "@/app/lib/business/healthMap/logic";

/**
 * GET /api/dashboard/business/diy-concierge/health-explanations?businessId= — owner-safe
 * explanation for each of the seven certified Health Map dimensions from the latest immutable
 * run. Never re-diagnoses, never rewrites the certified conclusion, never hides a contradiction
 * or insufficient-information state — it returns exactly what shapeDimensionResultsForOwnerView/
 * shapeFindingsForOwnerView already produce for the Health Map's own owner-facing route.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const access = await resolveDiyAccess(req, businessId);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  if (access.entitlement.state !== "personalized_access_active") {
    return NextResponse.json({ ok: true, businessId: access.business.id, entitlementState: access.entitlement.state, assessedAt: null, dimensions: [], findings: [] });
  }

  const latestRun = await getLatestCompletedRun(access.business.id);
  if (!latestRun) {
    return NextResponse.json({ ok: true, businessId: access.business.id, entitlementState: access.entitlement.state, assessedAt: null, dimensions: [], findings: [] });
  }
  const full = await getFullRun(latestRun.id);
  if (!full) {
    return NextResponse.json({ ok: true, businessId: access.business.id, entitlementState: access.entitlement.state, assessedAt: null, dimensions: [], findings: [] });
  }

  return NextResponse.json({
    ok: true,
    businessId: access.business.id,
    entitlementState: access.entitlement.state,
    assessedAt: full.run.completedAt,
    dimensions: shapeDimensionResultsForOwnerView(full.dimensionResults),
    findings: shapeFindingsForOwnerView(full.findings).map((f) => ({
      findingType: f.findingType,
      titleEs: f.titleEs,
      titleEn: f.titleEn,
      explanationEs: f.explanationEs,
      explanationEn: f.explanationEn,
    })),
  });
}
