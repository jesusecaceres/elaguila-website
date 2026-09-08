/**
 * Program 5 — Proposal Foundation constants.
 */

export const PROPOSAL_FLAG_KEY = "business_proposal_studio";

export const PROPOSAL_STATUSES: readonly string[] = [
  "draft",
  "staff_review",
  "owner_review",
  "accepted",
  "declined",
  "expired",
  "superseded",
  "cancelled",
];

export const PROPOSAL_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ["staff_review", "cancelled"],
  staff_review: ["owner_review", "draft", "cancelled"],
  owner_review: ["accepted", "declined", "staff_review", "expired"],
  accepted: ["superseded"],
  declined: ["superseded"],
  expired: ["superseded"],
  superseded: [],
  cancelled: [],
};

export function isValidProposalStatusTransition(from: string, to: string): boolean {
  const allowed = PROPOSAL_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export const PRICING_SOURCES: readonly string[] = [
  "revenue_pricing_matrix",
  "staff_confirmed",
  "unknown",
];
