/**
 * Business Development & Growth Engine — bounded state-transition graphs. Matches the
 * isValidOpportunityStateTransition / isValidCreativeJobStatusTransition convention exactly: the
 * single source of truth for which state jumps are allowed, so the repository layer can never be
 * bypassed into an invalid jump (e.g. "dismissed" -> "complete").
 */
import type { GrowthCampaignStatus, GrowthSolutionState } from "./types";

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
