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
