import { NextResponse, type NextRequest } from "next/server";
import { resolveBusinessHomeAccess } from "@/app/lib/business/businessHome/access";

import { resolveDiyConciergeFlagTier } from "@/app/lib/business/diyConcierge/featureFlag";
import { resolveConciergeEntitlement } from "@/app/lib/business/diyConcierge/entitlement";
import { listActionsForBusiness, listApprovalsForBusiness, listServiceRequestsForBusiness } from "@/app/lib/business/diyConcierge/repository";
import { computeActionProgressSummary } from "@/app/lib/business/diyConcierge/logic";

import { resolveStewardshipFlagTier } from "@/app/lib/business/stewardship/featureFlag";
import { getCurrentRecommendation, listTestsForRecommendation } from "@/app/lib/business/stewardship/repository";

import { resolveHealthMapFlagTier } from "@/app/lib/business/healthMap/featureFlag";
import { getFullRun, getLatestCompletedRun } from "@/app/lib/business/healthMap/repository";
import { shapeDimensionResultsForOwnerView, shapeFindingsForOwnerView } from "@/app/lib/business/healthMap/logic";

import { resolveLivingBookFlagTier } from "@/app/lib/business/livingBook/featureFlag";
import { listFactsForBusiness, listUnknownsForBusiness } from "@/app/lib/business/livingBook/repository";
import { shapeFactsForOwnerView, shapeUnknownsForOwnerView } from "@/app/lib/business/livingBook/logic";

import { resolveAdvisorFlagTier } from "@/app/lib/business/advisor/featureFlag";
import { listActiveSignals } from "@/app/lib/business/advisor/repository";
import { shapeSignalForOwner } from "@/app/lib/business/advisor/logic";

import { resolveOutcomesFlagTier } from "@/app/lib/business/outcomes/featureFlag";
import { listBusinessOutcomes } from "@/app/lib/business/outcomes/repository";
import { isOwnerSafeOutcome, shapeOutcomeForOwner } from "@/app/lib/business/outcomes/logic";

import { resolveAssistantFlagTier } from "@/app/lib/business/assistant/featureFlag";
import { listThreadsForBusiness } from "@/app/lib/business/assistant/repository";

import { resolveProposalFlagTier } from "@/app/lib/business/proposals/featureFlag";
import { listProposalsForBusiness } from "@/app/lib/business/proposals/repository";
import { isOwnerVisibleProposalStatus, shapeProposalForOwner } from "@/app/lib/business/proposals/logic";

/**
 * GET /api/dashboard/business/home?businessId= — Gate 2 (Owner-Safe Bridge Reconciliation): the
 * single owner-safe Business Home composition payload the Owner Command Center's Business Tools
 * surface can consume, WITHOUT the Owner Command Center (or this route) ever touching a staff-only
 * table directly.
 *
 * This route creates no new domain engine and no new truth. Every section below calls the exact
 * same repository functions, feature-flag resolvers, and owner-safe shape functions its own
 * already-certified dedicated route already uses (recommendations/route.ts, health/route.ts,
 * book/route.ts, diy-concierge/home/route.ts, and the Program 6/7 ownerAccess-gated routes under
 * app/api/business/[businessId]/**). The only new logic here is orchestration: one exact-membership
 * access check (resolveBusinessHomeAccess — see that file's own doctrine note on why it is a
 * separate, DIY-entitlement-agnostic primitive), then N independently-flag-gated, independently
 * try/caught reads run in parallel. One domain being disabled, unentitled, or erroring never
 * breaks any other section — every section either returns its real data or an honest
 * unavailable/no-data state. Never a fabricated value.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const access = await resolveBusinessHomeAccess(req, businessId);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  const { userId, business } = access;

  // --- DIY Concierge package entitlement — the one commercial gate that Health/Next Right
  // Move/Action Plan already condition on (see their own dedicated routes). Resolved once, reused
  // by all three, exactly matching existing per-route doctrine — not a new commercial concept.
  const diyFlagTier = await resolveDiyConciergeFlagTier(userId);
  const diyFlagAvailable = diyFlagTier === "global" || diyFlagTier === "pilot";
  const entitlement = await resolveConciergeEntitlement({ businessId: business.id, diyConciergeFlagAvailable: diyFlagAvailable });
  const personalizedAccessActive = entitlement.state === "personalized_access_active";

  const [
    whatMattersNow,
    businessHealth,
    actionPlan,
    whatLeonixUnderstands,
    needsAttention,
    workWithLeonix,
    progress,
    assistant,
  ] = await Promise.all([
    composeWhatMattersNow(userId, business.id, personalizedAccessActive),
    composeBusinessHealth(userId, business.id, personalizedAccessActive),
    composeActionPlan(userId, business.id, personalizedAccessActive),
    composeWhatLeonixUnderstands(userId, business.id),
    composeNeedsAttention(userId, business.id),
    composeWorkWithLeonix(userId, business.id),
    composeProgress(userId, business.id),
    composeAssistant(userId, business.id),
  ]);

  return NextResponse.json({
    ok: true,
    businessId: business.id,
    business: { id: business.id, displayName: business.displayName, businessStage: business.businessStage },
    entitlement: { state: entitlement.state, packageTier: entitlement.packageTier, conciergeGuidance: entitlement.conciergeGuidance },
    whatMattersNow,
    businessHealth,
    actionPlan,
    whatLeonixUnderstands,
    // Learning — Phase 4 doctrine: only ever populated if a current recommendation/need mapping
    // exists. No such mapping module exists in this repository today (verified this pass); rather
    // than invent one, this section stays honestly null. Not a bug — a documented MISSING BRIDGE.
    learning: null,
    needsAttention,
    workWithLeonix,
    progress,
    assistant,
  });
}

async function composeWhatMattersNow(userId: string, businessId: string, personalizedAccessActive: boolean) {
  const flagTier = await resolveStewardshipFlagTier(userId);
  const flagAvailable = flagTier === "global" || flagTier === "pilot";
  if (!flagAvailable || !personalizedAccessActive) return { available: false, recommendation: null };
  try {
    const current = await getCurrentRecommendation(businessId);
    const ownerVisible =
      current &&
      current.visibility === "owner_and_staff" &&
      (current.status === "shared_with_owner" || current.status === "accepted" || current.status === "declined" || current.status === "postponed");
    if (!ownerVisible || !current) return { available: true, recommendation: null };

    // Owner-safe shaping identical to /api/dashboard/business/recommendations — never the
    // internal six-test rows, never staff comparison notes, never a draft/unshared candidate.
    const {
      id, dimensionKey, status, confidence, verifiedNeedEs, verifiedNeedEn, readinessExplanationEs, readinessExplanationEn,
      businessConsequenceEs, businessConsequenceEn, ownerGoalAlignmentEs, ownerGoalAlignmentEn, capacityImpactEs, capacityImpactEn,
      primaryIntervention, freeOptionEs, freeOptionEn, guidedOptionEs, guidedOptionEn, correctiveServiceOptionEs, correctiveServiceOptionEn,
      managedOptionEs, managedOptionEn, externalReferralOptionEs, externalReferralOptionEn, doNothingYetOptionEs, doNothingYetOptionEn,
      expectedEffort, costBand, successMetricEs, successMetricEn, reviewDate, ownerDecision, ownerDecisionAt, sharedAt,
    } = current;
    const tests = await listTestsForRecommendation(id);
    return {
      available: true,
      recommendation: {
        id, dimensionKey, status, confidence, verifiedNeedEs, verifiedNeedEn, readinessExplanationEs, readinessExplanationEn,
        businessConsequenceEs, businessConsequenceEn, ownerGoalAlignmentEs, ownerGoalAlignmentEn, capacityImpactEs, capacityImpactEn,
        primaryIntervention, freeOptionEs, freeOptionEn, guidedOptionEs, guidedOptionEn, correctiveServiceOptionEs, correctiveServiceOptionEn,
        managedOptionEs, managedOptionEn, externalReferralOptionEs, externalReferralOptionEn, doNothingYetOptionEs, doNothingYetOptionEn,
        expectedEffort, costBand, successMetricEs, successMetricEn, reviewDate, ownerDecision, ownerDecisionAt, sharedAt,
        reviewedTestCount: tests.length,
      },
    };
  } catch {
    return { available: false, recommendation: null };
  }
}

async function composeBusinessHealth(userId: string, businessId: string, personalizedAccessActive: boolean) {
  const flagTier = await resolveHealthMapFlagTier(userId);
  const flagAvailable = flagTier === "global" || flagTier === "pilot";
  if (!flagAvailable || !personalizedAccessActive) return { available: false, assessedAt: null, strengths: [], needsAttention: [] };
  try {
    const latestRun = await getLatestCompletedRun(businessId);
    if (!latestRun) return { available: true, assessedAt: null, strengths: [], needsAttention: [] };
    const full = await getFullRun(latestRun.id);
    if (!full) return { available: true, assessedAt: null, strengths: [], needsAttention: [] };
    const dims = shapeDimensionResultsForOwnerView(full.dimensionResults);
    const findings = shapeFindingsForOwnerView(full.findings ?? []);
    return {
      available: true,
      assessedAt: full.run.completedAt,
      strengths: dims.filter((d) => d.status === "strong" || d.status === "stable"),
      needsAttention: dims.filter((d) => d.status === "needs_attention" || d.status === "insufficient_information" || d.status === "blocked_by_contradiction"),
      findings,
    };
  } catch {
    return { available: false, assessedAt: null, strengths: [], needsAttention: [] };
  }
}

async function composeActionPlan(userId: string, businessId: string, personalizedAccessActive: boolean) {
  const flagTier = await resolveDiyConciergeFlagTier(userId);
  const flagAvailable = flagTier === "global" || flagTier === "pilot";
  if (!flagAvailable || !personalizedAccessActive) return { available: false, progress: null };
  try {
    const actions = await listActionsForBusiness(businessId);
    return { available: true, progress: computeActionProgressSummary(actions) };
  } catch {
    return { available: false, progress: null };
  }
}

async function composeWhatLeonixUnderstands(userId: string, businessId: string) {
  const flagTier = await resolveLivingBookFlagTier(userId);
  if (flagTier === "unavailable") return { available: false, confirmedFactCount: 0, needsConfirmationCount: 0, openQuestionsCount: 0 };
  try {
    const [factsRaw, unknownsRaw] = await Promise.all([listFactsForBusiness(businessId), listUnknownsForBusiness(businessId)]);
    const facts = shapeFactsForOwnerView(factsRaw);
    const unknowns = shapeUnknownsForOwnerView(unknownsRaw);
    const isConfirmed = (state: (typeof facts)[number]["confirmationState"]) => state === "owner_confirmed" || state === "staff_confirmed";
    return {
      available: true,
      confirmedFactCount: facts.filter((f) => isConfirmed(f.confirmationState)).length,
      needsConfirmationCount: facts.filter((f) => !isConfirmed(f.confirmationState)).length,
      openQuestionsCount: unknowns.length,
    };
  } catch {
    return { available: false, confirmedFactCount: 0, needsConfirmationCount: 0, openQuestionsCount: 0 };
  }
}

async function composeNeedsAttention(userId: string, businessId: string) {
  const flagTier = await resolveAdvisorFlagTier(userId);
  const flagAvailable = flagTier === "global" || flagTier === "pilot";
  if (!flagAvailable) return { available: false, signals: [] };
  try {
    const signals = await listActiveSignals(businessId);
    return { available: true, signals: signals.map(shapeSignalForOwner) };
  } catch {
    return { available: false, signals: [] };
  }
}

async function composeWorkWithLeonix(userId: string, businessId: string) {
  const [approvalsResult, serviceRequestsResult, proposalsResult] = await Promise.allSettled([
    listApprovalsForBusiness(businessId),
    listServiceRequestsForBusiness(businessId),
    (async () => {
      const flagTier = await resolveProposalFlagTier(userId);
      if (flagTier === "unavailable") return null;
      const all = await listProposalsForBusiness(businessId);
      return all.filter((p) => p.isCurrent && isOwnerVisibleProposalStatus(p.status)).map(shapeProposalForOwner);
    })(),
  ]);

  const pendingApprovalsCount =
    approvalsResult.status === "fulfilled" ? approvalsResult.value.filter((a) => a.status === "pending").length : 0;
  const pendingServiceRequestsCount =
    serviceRequestsResult.status === "fulfilled" ? serviceRequestsResult.value.filter((r) => r.status === "pending").length : 0;
  const proposalsAwaitingDecision = proposalsResult.status === "fulfilled" ? proposalsResult.value : null;

  return { pendingApprovalsCount, pendingServiceRequestsCount, proposalsAwaitingDecision };
}

async function composeProgress(userId: string, businessId: string) {
  const flagTier = await resolveOutcomesFlagTier(userId);
  if (flagTier === "unavailable") return { available: false, outcomes: [] };
  try {
    const outcomes = await listBusinessOutcomes(businessId);
    const ownerSafe = outcomes.filter(isOwnerSafeOutcome);
    return { available: true, outcomes: ownerSafe.map(shapeOutcomeForOwner) };
  } catch {
    return { available: false, outcomes: [] };
  }
}

async function composeAssistant(userId: string, businessId: string) {
  const flagTier = await resolveAssistantFlagTier(userId);
  const flagAvailable = flagTier === "global" || flagTier === "pilot";
  if (!flagAvailable) return { available: false, hasActiveThread: false };
  try {
    const threads = await listThreadsForBusiness(businessId);
    return { available: true, hasActiveThread: threads.some((t) => t.status === "active") };
  } catch {
    return { available: false, hasActiveThread: false };
  }
}
