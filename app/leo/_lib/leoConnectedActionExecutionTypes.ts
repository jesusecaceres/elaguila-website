/**
 * LEO-21A — Provider-neutral governed connected-action execution contracts.
 *
 * CAPABILITY ≠ AUTHORITY.
 * execution ≠ verification.
 * claim ≠ provider side effect.
 * provider accepted ≠ verified.
 *
 * No OAuth tokens, API keys, raw provider payloads, or full message bodies.
 */

import type {
  LeoActionProposalActionFamily,
  LeoActionProposalGovernanceLevel,
  LeoActionProposalNormalizedTarget,
  LeoActionProposalReferentSnapshot,
  LeoActionProposalStructuredPayload,
} from "@/app/leo/_lib/leoActionProposalTypes";

/** Immutable request: exact APPROVED action. Providers must not alter these fields. */
export type LeoConnectedActionExecutionRequest = {
  proposalId: string;
  actionFamily: LeoActionProposalActionFamily;
  executionClaimKey: string;
  proposalFingerprint: string;
  normalizedTarget: LeoActionProposalNormalizedTarget;
  structuredPayload: LeoActionProposalStructuredPayload;
  referentSnapshot: LeoActionProposalReferentSnapshot;
  governanceLevel: LeoActionProposalGovernanceLevel;
  ownerActorId: string;
  correlationId: string;
  /** Observability / reconciliation only — not a second authorization primitive. */
  attemptId: string;
  requestedAt: string;
};

export const LEO_CONNECTED_ACTION_EXECUTION_STATUSES = [
  "NOT_ATTEMPTED",
  "EXECUTION_STARTED",
  "PROVIDER_ACCEPTED",
  "PROVIDER_ACCEPTED_UNVERIFIED",
  "VERIFIED",
  "FAILED",
  "UNKNOWN_EXTERNAL_OUTCOME",
] as const;

export type LeoConnectedActionExecutionStatus =
  (typeof LEO_CONNECTED_ACTION_EXECUTION_STATUSES)[number];

export const LEO_CONNECTED_ACTION_VERIFICATION_STATES = [
  "NONE",
  "NOT_REQUIRED",
  "PENDING",
  "VERIFIED",
  "FAILED",
  "UNKNOWN",
] as const;

export type LeoConnectedActionVerificationState =
  (typeof LEO_CONNECTED_ACTION_VERIFICATION_STATES)[number];

export const LEO_CONNECTED_ACTION_RETRY_CLASSES = [
  "NOT_RETRYABLE",
  "RETRYABLE_LOCAL_ONLY",
  "RETRYABLE_AFTER_RECONNECT",
  "RECONCILE_FIRST",
  "VERIFY_ONLY",
] as const;

export type LeoConnectedActionRetryClass =
  (typeof LEO_CONNECTED_ACTION_RETRY_CLASSES)[number];

export const LEO_CONNECTED_ACTION_SAFE_FAILURE_CLASSES = [
  "NOT_CONNECTED",
  "SCOPE_INSUFFICIENT",
  "TARGET_UNRESOLVED",
  "PROPOSAL_EXPIRED",
  "NOT_APPROVED",
  "CLAIM_FAILED",
  "ALREADY_CLAIMED",
  "FINGERPRINT_MISMATCH",
  "PROVIDER_REJECTED",
  "PROVIDER_TIMEOUT",
  "PROVIDER_ERROR",
  "PROVIDER_ACCEPTED_UNVERIFIED",
  "VERIFICATION_FAILED",
  "RECEIPT_WRITE_FAILED",
  "STATE_WRITE_FAILED",
  "UNKNOWN_EXTERNAL_OUTCOME",
] as const;

export type LeoConnectedActionSafeFailureClass =
  (typeof LEO_CONNECTED_ACTION_SAFE_FAILURE_CLASSES)[number];

export type LeoConnectedActionFailureClassMeta = {
  retryable: boolean;
  reconcileFirst: boolean;
  safeOwnerMessage: string;
};

export const LEO_CONNECTED_ACTION_FAILURE_CLASS_META: Record<
  LeoConnectedActionSafeFailureClass,
  LeoConnectedActionFailureClassMeta
> = {
  NOT_CONNECTED: {
    retryable: true,
    reconcileFirst: false,
    safeOwnerMessage: "Provider is not connected. No external action was taken.",
  },
  SCOPE_INSUFFICIENT: {
    retryable: true,
    reconcileFirst: false,
    safeOwnerMessage: "Connected account lacks required write permission. No external action was taken.",
  },
  TARGET_UNRESOLVED: {
    retryable: false,
    reconcileFirst: false,
    safeOwnerMessage: "Target is unresolved. Create a new proposal with proven targets.",
  },
  PROPOSAL_EXPIRED: {
    retryable: false,
    reconcileFirst: false,
    safeOwnerMessage: "This proposal has expired. Prepare a new proposal.",
  },
  NOT_APPROVED: {
    retryable: false,
    reconcileFirst: false,
    safeOwnerMessage: "Owner approval is required before execution.",
  },
  CLAIM_FAILED: {
    retryable: true,
    reconcileFirst: false,
    safeOwnerMessage: "Could not claim execution. Retry locally; no external action was taken.",
  },
  ALREADY_CLAIMED: {
    retryable: false,
    reconcileFirst: true,
    safeOwnerMessage: "Execution was already claimed. Reconcile or verify; do not resend.",
  },
  FINGERPRINT_MISMATCH: {
    retryable: false,
    reconcileFirst: false,
    safeOwnerMessage: "Proposal fingerprint does not match the approved action.",
  },
  PROVIDER_REJECTED: {
    retryable: false,
    reconcileFirst: false,
    safeOwnerMessage: "Provider rejected the action.",
  },
  PROVIDER_TIMEOUT: {
    retryable: false,
    reconcileFirst: true,
    safeOwnerMessage: "Provider timed out. Reconcile before any retry — do not blind resend.",
  },
  PROVIDER_ERROR: {
    retryable: false,
    reconcileFirst: true,
    safeOwnerMessage: "Provider error. Reconcile before retry.",
  },
  PROVIDER_ACCEPTED_UNVERIFIED: {
    retryable: false,
    reconcileFirst: false,
    safeOwnerMessage: "Provider accepted the action; verification is still pending.",
  },
  VERIFICATION_FAILED: {
    retryable: false,
    reconcileFirst: false,
    safeOwnerMessage: "Verification failed. External outcome may exist — do not blind resend.",
  },
  RECEIPT_WRITE_FAILED: {
    retryable: true,
    reconcileFirst: false,
    safeOwnerMessage: "External action may have completed; receipt write failed. Repair receipt only.",
  },
  STATE_WRITE_FAILED: {
    retryable: true,
    reconcileFirst: false,
    safeOwnerMessage: "Local state write failed after progress. Reconcile local state only.",
  },
  UNKNOWN_EXTERNAL_OUTCOME: {
    retryable: false,
    reconcileFirst: true,
    safeOwnerMessage: "External outcome is unknown. Verify or reconcile before any retry.",
  },
};

export type LeoConnectedActionProviderType =
  | "NONE"
  | "GMAIL"
  | "CALENDAR"
  | "UNKNOWN";

/**
 * Safe execution result — never includes tokens, keys, raw payloads, or full bodies.
 */
export type LeoConnectedActionExecutionResult = {
  status: LeoConnectedActionExecutionStatus;
  providerType: LeoConnectedActionProviderType;
  providerObjectId: string | null;
  safeFailureClass: LeoConnectedActionSafeFailureClass | null;
  retryClass: LeoConnectedActionRetryClass;
  verificationState: LeoConnectedActionVerificationState;
  externalSideEffectPossible: boolean;
  externalSideEffectConfirmed: boolean;
  warnings: string[];
  safeMetadata: Record<string, string | number | boolean | null>;
  attemptId: string;
  proposalId: string;
  proposalStateAfter: string | null;
};

/**
 * UNKNOWN_EXTERNAL_OUTCOME persistence policy (no migration):
 * Leave proposal in EXECUTION_CLAIMED — prevents a second claim and avoids
 * falsely declaring EXECUTED/FAILED while external truth is unknown.
 */
export const LEO_UNKNOWN_EXTERNAL_OUTCOME_PROPOSAL_STATE = "EXECUTION_CLAIMED" as const;
