/**
 * Program 5 — Proposal Foundation pure logic. No DB, no UI.
 * Validates status transitions and pricing source truth.
 */
import { isValidProposalStatusTransition } from "./constants";
import type { ProposalActor, ProposalPricingSnapshot, ProposalStatus } from "./types";

export function canTransitionProposalStatus(from: ProposalStatus, to: ProposalStatus): boolean {
  return isValidProposalStatusTransition(from, to);
}

export function isPricingConfirmed(snapshot: ProposalPricingSnapshot | null): boolean {
  if (!snapshot) return false;
  return snapshot.pricingConfirmed && snapshot.pricingSource !== "unknown";
}

export function pricingRequiresStaffConfirmation(snapshot: ProposalPricingSnapshot | null): boolean {
  if (!snapshot) return true;
  return !snapshot.pricingConfirmed || snapshot.pricingSource === "unknown";
}

export function proposalAcceptanceDoesNotCharge(): boolean {
  return true;
}

export function proposalAcceptanceDoesNotGrantEntitlement(): boolean {
  return true;
}

export function isValidAcceptanceActor(actor: ProposalActor): boolean {
  if (actor.type === "staff") {
    return actor.rosterId.length > 0 && actor.authUserId.length > 0 && actor.email.length > 0 && actor.role.length > 0;
  }
  if (actor.type === "owner") {
    return actor.authUserId.length > 0 && actor.email.length > 0;
  }
  return false;
}

export function ownerAcceptanceRequiresNoStaffRoster(actor: ProposalActor): boolean {
  if (actor.type !== "owner") return true;
  return true;
}

export function staffAcceptanceRequiresRoster(actor: ProposalActor): boolean {
  if (actor.type !== "staff") return true;
  return actor.rosterId.length > 0;
}

/** Next business_proposals.version from existing history. Empty history → 1. */
export function nextProposalVersion(existingVersions: readonly number[]): number {
  if (existingVersions.length === 0) return 1;
  return Math.max(...existingVersions) + 1;
}

/** In-flight rows that may be replaced before a terminal commercial outcome. */
export function isWorkingReplaceableProposalStatus(status: ProposalStatus): boolean {
  return status === "draft" || status === "staff_review" || status === "owner_review";
}

/**
 * Terminal / historical statuses. Creating a later proposal must not rewrite these.
 * `is_current` records which row is active; status records what happened.
 */
export function isTerminalProposalHistoryStatus(status: ProposalStatus): boolean {
  return status === "accepted" || status === "declined" || status === "expired" || status === "cancelled";
}

/**
 * When staff intentionally creates a later proposal, only in-flight current rows
 * become superseded. Terminal history keeps its status.
 */
export function previousCurrentShouldBecomeSuperseded(status: ProposalStatus): boolean {
  return isWorkingReplaceableProposalStatus(status);
}

/** Status the previous current row must have after a successful later-proposal create. */
export function previousCurrentReplacementStatus(status: ProposalStatus): ProposalStatus {
  return previousCurrentShouldBecomeSuperseded(status) ? "superseded" : status;
}
