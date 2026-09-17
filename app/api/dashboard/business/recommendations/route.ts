import { NextResponse, type NextRequest } from "next/server";
import { resolveStewardshipAccess } from "@/app/lib/business/stewardship/access";
import { getCurrentRecommendation, listTestsForRecommendation } from "@/app/lib/business/stewardship/repository";

/**
 * GET /api/dashboard/business/recommendations?businessId= — the owner-safe current Next Right
 * Move for this exact business, if one exists and is actually shared. Never returns a draft,
 * a failed internal candidate, staff-only six-test details, or internal sales reasoning — only
 * status/visibility gate what an owner may ever see, enforced here server-side.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const access = await resolveStewardshipAccess(req, businessId);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  if (access.entitlement.state !== "personalized_access_active" || !access.stewardshipFlagAvailable) {
    return NextResponse.json({ ok: true, businessId: access.business.id, entitlementState: access.entitlement.state, recommendation: null });
  }

  const current = await getCurrentRecommendation(access.business.id);
  const ownerVisible =
    current &&
    current.visibility === "owner_and_staff" &&
    (current.status === "shared_with_owner" || current.status === "accepted" || current.status === "declined" || current.status === "postponed");

  if (!ownerVisible || !current) {
    return NextResponse.json({ ok: true, businessId: access.business.id, entitlementState: access.entitlement.state, recommendation: null });
  }

  // Owner-safe shaping: never the internal six-test rows, never staff comparison notes.
  const {
    id, dimensionKey, status, confidence, verifiedNeedEs, verifiedNeedEn, readinessExplanationEs, readinessExplanationEn,
    businessConsequenceEs, businessConsequenceEn, ownerGoalAlignmentEs, ownerGoalAlignmentEn, capacityImpactEs, capacityImpactEn,
    primaryIntervention, freeOptionEs, freeOptionEn, guidedOptionEs, guidedOptionEn, correctiveServiceOptionEs, correctiveServiceOptionEn,
    managedOptionEs, managedOptionEn, externalReferralOptionEs, externalReferralOptionEn, doNothingYetOptionEs, doNothingYetOptionEn,
    expectedEffort, costBand, successMetricEs, successMetricEn, reviewDate, ownerDecision, ownerDecisionAt, sharedAt,
  } = current;

  // The count of tests (never their content) may safely inform the owner that this
  // recommendation passed a real structured review — never the staff-only pass/caution/fail detail.
  const tests = await listTestsForRecommendation(id);

  return NextResponse.json({
    ok: true,
    businessId: access.business.id,
    entitlementState: access.entitlement.state,
    recommendation: {
      id, dimensionKey, status, confidence, verifiedNeedEs, verifiedNeedEn, readinessExplanationEs, readinessExplanationEn,
      businessConsequenceEs, businessConsequenceEn, ownerGoalAlignmentEs, ownerGoalAlignmentEn, capacityImpactEs, capacityImpactEn,
      primaryIntervention, freeOptionEs, freeOptionEn, guidedOptionEs, guidedOptionEn, correctiveServiceOptionEs, correctiveServiceOptionEn,
      managedOptionEs, managedOptionEn, externalReferralOptionEs, externalReferralOptionEn, doNothingYetOptionEs, doNothingYetOptionEn,
      expectedEffort, costBand, successMetricEs, successMetricEn, reviewDate, ownerDecision, ownerDecisionAt, sharedAt,
      reviewedTestCount: tests.length,
    },
  });
}
