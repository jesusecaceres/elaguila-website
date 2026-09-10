/**
 * TODAY-3 — pure deterministic candidate ranking and status-transition logic. Deliberately NOT
 * "server-only" so it is directly unit-testable, matching every prior gate's logic.ts convention.
 * Never ranks by commission, package price, Leonix profit, Featured placement, marketplace
 * sorting, sales quota, or unrecorded staff preference.
 */
import { RECOMMENDATION_TEMPLATES } from "./recommendationRegistry";
import { evaluateSixTests, sixTestsAllowApproval, type SixTestInput, type SixTestOutcome } from "./sixTests";
import type { RecommendationStatus, RecommendationTemplate, RejectedCandidate } from "./types";
import type { HealthDimensionKey } from "../healthMap/types";

export type CandidateDimensionInput = { dimensionKey: HealthDimensionKey; status: string };

export type RankedCandidate = {
  template: RecommendationTemplate;
  dimensionStatus: string;
  score: number;
  sixTests: readonly SixTestOutcome[];
  approvable: boolean;
};

export type CandidateSelectionResult = {
  selected: RankedCandidate | null;
  ranked: readonly RankedCandidate[];
  rejected: readonly RejectedCandidate[];
};

/**
 * Deterministic score: verified need weight (from basePriority) + urgency-by-status + capacity
 * penalty. Never a commission/price/profit term. Higher is more urgent/important.
 */
function scoreCandidate(template: RecommendationTemplate, dimensionStatus: string, capacityBlocked: boolean): number {
  let score = template.basePriority;
  if (dimensionStatus === "needs_attention") score += 20;
  if (dimensionStatus === "insufficient_information") score += 10;
  if (capacityBlocked && template.isDemandGenerating) score -= 50; // capacity protection always outranks demand generation
  if (template.costBand === "free") score += 5; // smallest truthful intervention preferred, never a profit signal
  return score;
}

/**
 * Selects the single current Next Right Move deterministically from verified dimension results.
 * Evaluates every eligible candidate's six tests; only an approvable (all pass/caution) candidate
 * with the highest score may be selected. Ties break by candidateKey (stable, deterministic —
 * never by unrecorded staff preference).
 */
export function selectNextRightMove(params: {
  dimensionResults: readonly CandidateDimensionInput[];
  readinessIsReady: boolean;
  humanReviewRequired: boolean;
  ownerGoalKnown: boolean;
}): CandidateSelectionResult {
  const capacityBlocked = params.dimensionResults.some(
    (d) => d.dimensionKey === "operations_and_capacity" && (d.status === "needs_attention" || d.status === "insufficient_information"),
  );

  const ranked: RankedCandidate[] = [];
  const rejected: RejectedCandidate[] = [];

  for (const dr of params.dimensionResults) {
    if (dr.status === "blocked_by_contradiction") {
      // A contradiction-blocked dimension may still be evaluated by a template that explicitly
      // applies to it (e.g. a "resolve this first" candidate); otherwise it is truthfully skipped.
      const contradictionTemplates = RECOMMENDATION_TEMPLATES.filter(
        (t) => t.dimensionKey === dr.dimensionKey && t.appliesToDimensionStatuses.includes("blocked_by_contradiction"),
      );
      if (contradictionTemplates.length === 0) {
        rejected.push({
          candidateKey: `__blocked_${dr.dimensionKey}`,
          dimensionKey: dr.dimensionKey,
          reasonEs: "Bloqueado por una contradicción sin resolver.",
          reasonEn: "Blocked by an unresolved contradiction.",
        });
        continue;
      }
    }

    const matches = RECOMMENDATION_TEMPLATES.filter((t) => t.dimensionKey === dr.dimensionKey && t.appliesToDimensionStatuses.includes(dr.status));
    for (const template of matches) {
      const sixTestInput: SixTestInput = {
        dimensionStatus: dr.status,
        readinessIsReady: params.readinessIsReady,
        humanReviewRequired: params.humanReviewRequired,
        template,
        ownerGoalKnown: params.ownerGoalKnown,
        capacityBlocked,
      };
      const sixTests = evaluateSixTests(sixTestInput);
      const approvable = sixTestsAllowApproval(sixTests);
      const score = scoreCandidate(template, dr.status, capacityBlocked);
      ranked.push({ template, dimensionStatus: dr.status, score, sixTests, approvable });
      if (!approvable) {
        rejected.push({
          candidateKey: template.candidateKey,
          dimensionKey: template.dimensionKey,
          reasonEs: "Una de las seis pruebas no aprobó esta candidata.",
          reasonEn: "One of the six tests did not pass for this candidate.",
        });
      }
    }
  }

  // Deterministic ordering: score desc, then candidateKey asc for a stable tie-break.
  const sorted = [...ranked].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.template.candidateKey.localeCompare(b.template.candidateKey);
  });

  const selected = sorted.find((c) => c.approvable) ?? null;

  // Every non-selected candidate that was actually evaluated is recorded as truthfully not chosen
  // (never silently dropped) — this feeds "what was intentionally not recommended."
  for (const c of sorted) {
    if (c !== selected) {
      rejected.push({
        candidateKey: c.template.candidateKey,
        dimensionKey: c.template.dimensionKey,
        reasonEs: c.approvable ? "Una recomendación de mayor prioridad fue seleccionada en su lugar." : "Una de las seis pruebas no aprobó esta candidata.",
        reasonEn: c.approvable ? "A higher-priority recommendation was selected instead." : "One of the six tests did not pass for this candidate.",
      });
    }
  }

  return { selected, ranked: sorted, rejected };
}

/** Deterministic status-transition table. Returns null for any decision not valid from the
 * current status — callers must treat null as a rejected transition, never a silent no-op. */
const VALID_TRANSITIONS: Record<RecommendationStatus, Partial<Record<string, RecommendationStatus>>> = {
  draft: { submit_for_review: "review_required", archive: "archived" },
  review_required: { approve: "approved", archive: "archived" },
  approved: { share: "shared_with_owner", archive: "archived" },
  shared_with_owner: { accept: "accepted", decline: "declined", postpone: "postponed" },
  accepted: {},
  declined: {},
  postponed: { resume_review: "review_required" },
  superseded: {},
  archived: {},
};

export function computeNextRecommendationStatus(currentStatus: RecommendationStatus, decision: string): RecommendationStatus | null {
  return VALID_TRANSITIONS[currentStatus]?.[decision] ?? null;
}

/** A consequential override (one that changes owner-facing content) must return the recommendation
 * to review_required unless repository logic proves no owner-facing content changed. */
export function overrideRequiresReapproval(changedFields: readonly string[]): boolean {
  const ownerFacingFields = new Set([
    "verifiedNeedEs", "verifiedNeedEn", "businessConsequenceEs", "businessConsequenceEn",
    "ownerGoalAlignmentEs", "ownerGoalAlignmentEn", "capacityImpactEs", "capacityImpactEn",
    "primaryIntervention", "freeOptionEs", "freeOptionEn", "guidedOptionEs", "guidedOptionEn",
    "correctiveServiceOptionEs", "correctiveServiceOptionEn", "managedOptionEs", "managedOptionEn",
    "externalReferralOptionEs", "externalReferralOptionEn", "doNothingYetOptionEs", "doNothingYetOptionEn",
    "expectedEffort", "costBand", "successMetricEs", "successMetricEn",
  ]);
  return changedFields.some((f) => ownerFacingFields.has(f));
}
