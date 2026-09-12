/**
 * Business Development & Growth Engine — bounded state-transition graphs. Matches the
 * isValidOpportunityStateTransition / isValidCreativeJobStatusTransition convention exactly: the
 * single source of truth for which state jumps are allowed, so the repository layer can never be
 * bypassed into an invalid jump (e.g. "dismissed" -> "complete").
 */
import type { GrowthAssessmentStatus, GrowthCampaignStatus, GrowthSolutionState } from "./types";

/**
 * Gate D — assessment review-decision transitions. A review decision (accept/needs_correction/
 * reject) is only ever valid FROM 'needs_review' — an already-decided assessment can never be
 * silently flipped to a different decision; the operator must re-analyze (which supersedes it and
 * starts a fresh 'needs_review' version) rather than overwrite history. 'superseded' is reachable
 * from every non-superseded status because createGrowthAssessment supersedes unconditionally
 * whenever a new version is created, regardless of the old version's review decision.
 */
const ASSESSMENT_STATUS_TRANSITIONS: Readonly<Record<GrowthAssessmentStatus, readonly GrowthAssessmentStatus[]>> = {
  draft: ["needs_review", "superseded"],
  needs_review: ["reviewed", "needs_correction", "rejected", "superseded"],
  reviewed: ["superseded"],
  needs_correction: ["superseded"],
  rejected: ["superseded"],
  superseded: [],
};

export function isValidGrowthAssessmentStatusTransition(from: GrowthAssessmentStatus, to: GrowthAssessmentStatus): boolean {
  if (from === to) return false;
  return ASSESSMENT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

const SOLUTION_TRANSITIONS: Readonly<Record<GrowthSolutionState, readonly GrowthSolutionState[]>> = {
  suggested: ["reviewed", "dismissed"],
  reviewed: ["approved", "dismissed"],
  approved: ["in_progress", "dismissed"],
  in_progress: ["complete", "dismissed"],
  complete: [],
  dismissed: [],
};

export function isValidGrowthSolutionTransition(from: GrowthSolutionState, to: GrowthSolutionState): boolean {
  if (from === to) return false;
  return SOLUTION_TRANSITIONS[from]?.includes(to) ?? false;
}

const CAMPAIGN_TRANSITIONS: Readonly<Record<GrowthCampaignStatus, readonly GrowthCampaignStatus[]>> = {
  draft: ["needs_client_input", "ready_for_review", "cancelled"],
  needs_client_input: ["ready_for_review", "cancelled"],
  ready_for_review: ["approved", "needs_client_input", "cancelled"],
  approved: ["in_production", "cancelled"],
  in_production: ["live", "cancelled"],
  live: ["measuring", "paused", "cancelled"],
  measuring: ["complete", "paused"],
  paused: ["live", "cancelled"],
  complete: [],
  cancelled: [],
};

export function isValidGrowthCampaignTransition(from: GrowthCampaignStatus, to: GrowthCampaignStatus): boolean {
  if (from === to) return false;
  return CAMPAIGN_TRANSITIONS[from]?.includes(to) ?? false;
}
