import type { LeoGovernanceLevel } from "@/app/leo/_lib/leoTypes";

/**
 * LEO-17A — Canonical governed connected-action proposal types.
 *
 * Contract rule: provider secrets/tokens/bodies are never stored here.
 * Only bounded, display/proof-minimal identity + targets + evidence refs.
 */

export const LEO_ACTION_PROPOSAL_FAMILIES = [
  "GMAIL_SEND",
  "GMAIL_REPLY",
  "CALENDAR_CREATE",
  "CALENDAR_UPDATE",
] as const;

export type LeoActionProposalActionFamily =
  (typeof LEO_ACTION_PROPOSAL_FAMILIES)[number];

export const LEO_ACTION_PROPOSAL_GOVERNANCE_LEVELS = ["RED"] as const;
export type LeoActionProposalGovernanceLevel =
  (typeof LEO_ACTION_PROPOSAL_GOVERNANCE_LEVELS)[number] & LeoGovernanceLevel;

export const LEO_ACTION_PROPOSAL_APPROVAL_STATES = [
  "NONE",
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;

export type LeoActionProposalApprovalState =
  (typeof LEO_ACTION_PROPOSAL_APPROVAL_STATES)[number];

export const LEO_ACTION_PROPOSAL_STATES = [
  "DRAFT",
  "PREPARED",
  "AWAITING_APPROVAL",
  "APPROVED",
  "EXECUTION_CLAIMED",
  "EXECUTED",
  "VERIFIED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
] as const;

export type LeoActionProposalState = (typeof LEO_ACTION_PROPOSAL_STATES)[number];

export type LeoGmailSendPayload = {
  recipient: string | null;
  subject: string | null;
  body: string | null;
  replyToThreadId?: string | null;
  sourceEvidenceRefs: string[];
};

export type LeoGmailReplyPayload = {
  recipient: string | null;
  threadId: string | null;
  body: string | null;
  subject?: string | null;
  sourceEvidenceRefs: string[];
};

export type LeoCalendarAttendee = {
  email: string | null;
  name?: string | null;
};

export type LeoCalendarCreatePayload = {
  title: string | null;
  start: string | null; // ISO time, proven only
  end: string | null; // ISO time, proven only
  timezone: string | null;
  attendees: LeoCalendarAttendee[] | null;
  location?: string | null;
  description?: string | null;
  sourceEvidenceRefs: string[];
};

export type LeoCalendarUpdatePayload = {
  eventId: string | null;
  patch: {
    title?: string | null;
    start?: string | null;
    end?: string | null;
    timezone?: string | null;
    attendees?: LeoCalendarAttendee[] | null;
    location?: string | null;
    description?: string | null;
  };
  sourceEvidenceRefs: string[];
};

export type LeoActionProposalStructuredPayload =
  | LeoGmailSendPayload
  | LeoGmailReplyPayload
  | LeoCalendarCreatePayload
  | LeoCalendarUpdatePayload;

/**
 * Normalized target values safe for display/proof.
 * Must not be treated as authority beyond proposal approval.
 */
export type LeoActionProposalNormalizedTarget = Record<string, unknown>;

export type LeoActionProposalReferentSnapshot = Record<string, unknown>;

export type LeoActionProposal = {
  proposalId: string;
  ownerActorId: string;
  sourceSessionId: string | null;
  sourceTurnId: string | null;

  actionFamily: LeoActionProposalActionFamily;
  governanceLevel: LeoActionProposalGovernanceLevel;

  proposalState: LeoActionProposalState;
  approvalState: LeoActionProposalApprovalState;

  normalizedTarget: LeoActionProposalNormalizedTarget;
  structuredPayload: LeoActionProposalStructuredPayload;
  referentSnapshot: LeoActionProposalReferentSnapshot;

  proposalFingerprint: string;
  executionClaimKey: string;
  linkedReceiptId: string | null;

  createdAt: string;
  updatedAt: string;

  approvedAt: string | null;
  executionClaimedAt: string | null;
  executedAt: string | null;
  verifiedAt: string | null;
  failedAt: string | null;
  expiresAt: string;
};

export type LeoActionProposalCreateInput = {
  ownerActorId: string;
  sourceSessionId?: string | null;
  sourceTurnId?: string | null;
  actionFamily: LeoActionProposalActionFamily;
  governanceLevel: LeoActionProposalGovernanceLevel;

  normalizedTarget: LeoActionProposalNormalizedTarget;
  structuredPayload: LeoActionProposalStructuredPayload;
  referentSnapshot: LeoActionProposalReferentSnapshot;

  proposalFingerprint: string;
  executionClaimKey: string;
  expiresAt: string;
};

export type LeoActionProposalApproveInput = {
  proposalId: string;
  ownerActorId: string;
  expectedFingerprint: string;
};

export type LeoActionProposalClaimInput = {
  proposalId: string;
  ownerActorId: string;
};

