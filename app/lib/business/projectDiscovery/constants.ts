/**
 * Client Discovery & Project Blueprint Engine, Gate 1 — bounded state-transition graphs. Matches
 * the isValidGrowthSolutionTransition / isValidGrowthCampaignTransition convention exactly: the
 * single source of truth for which state jumps are allowed, so the repository layer can never be
 * bypassed into an invalid jump.
 */
import type { ProjectDiscoveryIntentStatus, ProjectDiscoveryStatus } from "./types";

const DISCOVERY_STATUS_TRANSITIONS: Readonly<Record<ProjectDiscoveryStatus, readonly ProjectDiscoveryStatus[]>> = {
  in_progress: ["needs_client_information", "needs_leonix_decision", "ready_for_blueprint"],
  needs_client_information: ["in_progress", "needs_leonix_decision", "ready_for_blueprint"],
  needs_leonix_decision: ["in_progress", "needs_client_information", "ready_for_blueprint"],
  ready_for_blueprint: ["in_progress", "needs_client_information", "needs_leonix_decision", "blueprint_created"],
  blueprint_created: [],
};

export function isValidProjectDiscoveryStatusTransition(from: ProjectDiscoveryStatus, to: ProjectDiscoveryStatus): boolean {
  if (from === to) return false;
  return DISCOVERY_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

const INTENT_STATUS_TRANSITIONS: Readonly<Record<ProjectDiscoveryIntentStatus, readonly ProjectDiscoveryIntentStatus[]>> = {
  candidate: ["confirmed", "declined"],
  confirmed: ["declined", "converted_to_project"],
  declined: ["candidate"],
  converted_to_project: [],
};

export function isValidProjectDiscoveryIntentTransition(from: ProjectDiscoveryIntentStatus, to: ProjectDiscoveryIntentStatus): boolean {
  if (from === to) return false;
  return INTENT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
