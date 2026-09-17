/**
 * Business Development & Growth Engine, Section J — client-safe Growth Roadmap projection.
 *
 * Reads from the exact same tables as the internal operator view (no second database, no copy of
 * business truth) and projects only the fields MD §14.2 allows a client to see: Already Strong,
 * Let's Confirm, Recommended Next Steps, Projects, Campaigns, Results. Deliberately never includes
 * rationale, evidence_refs, review notes, actor/roster identity, internal scoring, or an
 * unpromoted AI suggestion — those fields simply never leave the repository layer below.
 *
 * Gate D completes what Gate A left as an honest stub: "Already Strong" and part of "Let's Confirm"
 * now draw from the current assessment's own whatFound/whatKnown/whatUnknown/needsVerification —
 * but ONLY when that assessment's status is 'reviewed' (a human has accepted it as working
 * guidance). A draft/needs_review/needs_correction/rejected assessment's content is internal-only
 * and must never leak to the client-safe surface — this is the same "AI inference never becomes
 * client-facing without human review" doctrine the rest of this gate already enforces for staff,
 * extended to the one surface a client can actually see.
 */
import "server-only";

import { getCurrentGrowthAssessment, listGrowthCampaignsForBusiness, listGrowthSolutionsForBusiness } from "./repository";
import type { GrowthClientSafeProjection } from "./types";

export async function buildClientSafeGrowthProjection(businessId: string): Promise<GrowthClientSafeProjection> {
  const [assessment, solutions, campaigns] = await Promise.all([
    getCurrentGrowthAssessment(businessId),
    listGrowthSolutionsForBusiness(businessId),
    listGrowthCampaignsForBusiness(businessId),
  ]);

  // Only an ACCEPTED assessment's content may reach the client-safe surface. A needs_review /
  // needs_correction / rejected / draft assessment is internal-only — never shown as though it
  // were confirmed guidance.
  const reviewedAssessment = assessment && assessment.status === "reviewed" ? assessment : null;

  const alreadyStrong: GrowthClientSafeProjection["alreadyStrong"] = reviewedAssessment
    ? [...reviewedAssessment.whatFound, ...reviewedAssessment.whatKnown].slice(0, 8).map((item) => ({ textEs: item.textEs, textEn: item.textEn }))
    : [];

  // "Let's Confirm" combines the accepted assessment's own unknowns/needs-verification items with
  // solutions still needing more information — title/text only, never the internal rationale,
  // evidence, or AI-confidence mechanics.
  const letsConfirmFromAssessment = reviewedAssessment
    ? [...reviewedAssessment.whatUnknown, ...reviewedAssessment.needsVerification].map((item) => ({ textEs: item.textEs, textEn: item.textEn }))
    : [];
  const letsConfirmFromSolutions = solutions
    .filter((s) => s.readiness === "needs_more_information" || s.readiness === "needs_preparation")
    .map((s) => ({ textEs: s.titleEs, textEn: s.titleEn }));
  const letsConfirm = [...letsConfirmFromAssessment, ...letsConfirmFromSolutions].slice(0, 10);

  const recommendedNextSteps = solutions
    .filter((s) => s.state === "approved" || s.state === "suggested")
    .map((s) => ({ titleEs: s.titleEs, titleEn: s.titleEn, priority: s.priority }));

  const projects = solutions
    .filter((s) => s.state === "in_progress" || s.state === "approved")
    .map((s) => ({ titleEs: s.titleEs, titleEn: s.titleEn, state: s.state }));

  const campaignsProjection = campaigns.map((c) => ({ objectiveEs: c.objectiveEs, objectiveEn: c.objectiveEn, status: c.status }));

  // "Results" — Gate A has no outcome-linking column yet on business_growth_campaigns; a
  // completed campaign is truthfully surfaced by objective/status only until Outcomes wiring
  // lands in a later gate. No fabricated metric is ever invented here.
  const results = campaigns
    .filter((c) => c.status === "complete")
    .map((c) => ({ textEs: c.objectiveEs, textEn: c.objectiveEn }));

  return {
    alreadyStrong,
    letsConfirm,
    recommendedNextSteps,
    projects,
    campaigns: campaignsProjection,
    results,
  };
}
