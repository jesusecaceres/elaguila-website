/**
 * LEO-21A — Provider-neutral governed connected-action execution orchestrator.
 *
 * Order (mandatory):
 * owner → load proposal → owner match → approved → not expired → fingerprint →
 * claim → immutable request → adapter → classify → verify if possible →
 * proposal lifecycle → receipt lifecycle → safe result.
 *
 * No adapter invoke without successful claim (or already-claimed continue).
 * No blind resend after UNKNOWN_EXTERNAL_OUTCOME.
 * CAPABILITY ≠ AUTHORITY — GMAIL_REPLY uses write-disabled adapter; other families null.
 */

import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import {
  getLeoActionProposalForOwner,
  claimLeoActionProposalExecutionAtomic,
} from "@/app/leo/_lib/leoActionProposalRepository";
import {
  leoMarkGovernedActionProposalExecuted,
  leoMarkGovernedActionProposalFailed,
  leoMarkGovernedActionProposalVerified,
} from "@/app/leo/_lib/leoActionProposalService";
import type { LeoActionProposal } from "@/app/leo/_lib/leoActionProposalTypes";
import type { LeoConnectedActionProviderAdapter } from "@/app/leo/_lib/leoConnectedActionProviderAdapter";
import { leoGmailReplyConnectedActionAdapter } from "@/app/leo/_lib/leoGmailReplyConnectedActionAdapter";
import { leoNullConnectedActionProviderAdapter } from "@/app/leo/_lib/leoNullConnectedActionProviderAdapter";
import {
  computeLeoConnectedActionAttemptId,
  leoConnectedActionMayBlindRetryExecute,
} from "@/app/leo/_lib/leoConnectedActionExecutionPolicy";
import {
  LEO_CONNECTED_ACTION_FAILURE_CLASS_META,
  LEO_UNKNOWN_EXTERNAL_OUTCOME_PROPOSAL_STATE,
  type LeoConnectedActionExecutionRequest,
  type LeoConnectedActionExecutionResult,
  type LeoConnectedActionRetryClass,
  type LeoConnectedActionSafeFailureClass,
} from "@/app/leo/_lib/leoConnectedActionExecutionTypes";

export type LeoExecuteGovernedConnectedActionInput = {
  proposalId: string;
  expectedFingerprint: string;
  /**
   * verify_only: never call execute; reconcile/verify after unknown or accepted-unverified.
   * execute: claim then adapter (GMAIL_REPLY is write-disabled in LEO-21C).
   */
  mode?: "execute" | "verify_only";
};

export {
  computeLeoConnectedActionAttemptId,
  leoConnectedActionMayBlindRetryExecute,
} from "@/app/leo/_lib/leoConnectedActionExecutionPolicy";

function failureResult(input: {
  proposalId: string;
  attemptId: string;
  safeFailureClass: LeoConnectedActionSafeFailureClass;
  proposalStateAfter: string | null;
  warnings?: string[];
  retryClass?: LeoConnectedActionRetryClass;
  externalSideEffectPossible?: boolean;
  externalSideEffectConfirmed?: boolean;
}): LeoConnectedActionExecutionResult {
  const meta = LEO_CONNECTED_ACTION_FAILURE_CLASS_META[input.safeFailureClass];
  return {
    status:
      input.safeFailureClass === "UNKNOWN_EXTERNAL_OUTCOME"
        ? "UNKNOWN_EXTERNAL_OUTCOME"
        : input.safeFailureClass === "PROVIDER_ACCEPTED_UNVERIFIED"
          ? "PROVIDER_ACCEPTED_UNVERIFIED"
          : "FAILED",
    providerType: "NONE",
    providerObjectId: null,
    safeFailureClass: input.safeFailureClass,
    retryClass:
      input.retryClass ??
      (meta.reconcileFirst
        ? "RECONCILE_FIRST"
        : meta.retryable
          ? "RETRYABLE_LOCAL_ONLY"
          : "NOT_RETRYABLE"),
    verificationState: "NONE",
    externalSideEffectPossible: input.externalSideEffectPossible ?? false,
    externalSideEffectConfirmed: input.externalSideEffectConfirmed ?? false,
    warnings: input.warnings ?? [meta.safeOwnerMessage],
    safeMetadata: {
      gate: "LEO-21C",
      providerWriteEnabled: false,
    },
    attemptId: input.attemptId,
    proposalId: input.proposalId,
    proposalStateAfter: input.proposalStateAfter,
  };
}

export function buildLeoConnectedActionExecutionRequest(
  proposal: LeoActionProposal,
  ownerActorId: string,
  requestedAt: string,
): LeoConnectedActionExecutionRequest {
  const correlationId = `leo-proposal:${proposal.proposalId}`;
  const attemptId = computeLeoConnectedActionAttemptId({
    proposalId: proposal.proposalId,
    executionClaimKey: proposal.executionClaimKey,
    correlationId,
  });
  return {
    proposalId: proposal.proposalId,
    actionFamily: proposal.actionFamily,
    executionClaimKey: proposal.executionClaimKey,
    proposalFingerprint: proposal.proposalFingerprint,
    normalizedTarget: proposal.normalizedTarget,
    structuredPayload: proposal.structuredPayload,
    referentSnapshot: proposal.referentSnapshot,
    governanceLevel: proposal.governanceLevel,
    ownerActorId,
    correlationId,
    attemptId,
    requestedAt,
  };
}

function resolveAdapter(
  actionFamily: LeoActionProposal["actionFamily"],
): LeoConnectedActionProviderAdapter {
  if (leoGmailReplyConnectedActionAdapter.canHandle(actionFamily)) {
    return leoGmailReplyConnectedActionAdapter;
  }
  return leoNullConnectedActionProviderAdapter;
}

/**
 * Persist outcome using existing proposal + receipt services.
 * UNKNOWN_EXTERNAL_OUTCOME → leave EXECUTION_CLAIMED (no migration for new state).
 */
async function applyLifecycleAfterAdapter(input: {
  proposalId: string;
  result: LeoConnectedActionExecutionResult;
}): Promise<LeoConnectedActionExecutionResult> {
  const { proposalId, result } = input;

  if (result.status === "UNKNOWN_EXTERNAL_OUTCOME") {
    return {
      ...result,
      proposalStateAfter: LEO_UNKNOWN_EXTERNAL_OUTCOME_PROPOSAL_STATE,
      warnings: [
        ...result.warnings,
        `Persisted as ${LEO_UNKNOWN_EXTERNAL_OUTCOME_PROPOSAL_STATE}: unknown external outcome cannot invent EXECUTED/FAILED without proof.`,
      ],
    };
  }

  if (result.status === "VERIFIED") {
    const marked = await leoMarkGovernedActionProposalVerified({ proposalId });
    if (!marked.ok) {
      return failureResult({
        proposalId,
        attemptId: result.attemptId,
        safeFailureClass: "STATE_WRITE_FAILED",
        proposalStateAfter: "EXECUTED",
        externalSideEffectPossible: result.externalSideEffectPossible,
        externalSideEffectConfirmed: result.externalSideEffectConfirmed,
        warnings: [
          ...result.warnings,
          "Verified at provider layer but local VERIFIED state write failed. Repair state only — do not resend.",
        ],
      });
    }
    return { ...result, proposalStateAfter: marked.proposal.proposalState };
  }

  if (
    result.status === "PROVIDER_ACCEPTED" ||
    result.status === "PROVIDER_ACCEPTED_UNVERIFIED"
  ) {
    const marked = await leoMarkGovernedActionProposalExecuted({ proposalId });
    if (!marked.ok) {
      return failureResult({
        proposalId,
        attemptId: result.attemptId,
        safeFailureClass: "STATE_WRITE_FAILED",
        proposalStateAfter: "EXECUTION_CLAIMED",
        externalSideEffectPossible: true,
        externalSideEffectConfirmed: result.externalSideEffectConfirmed,
        warnings: [
          ...result.warnings,
          "Provider accepted but local EXECUTED state write failed. Repair state only — do not resend.",
        ],
      });
    }
    // Receipt EXECUTED is updated inside markGovernedActionProposalExecuted.
    // If receipt lagged, surface RECEIPT_WRITE_FAILED without re-calling provider.
    if (
      result.externalSideEffectConfirmed &&
      marked.proposal.linkedReceiptId == null
    ) {
      return {
        ...result,
        status: "PROVIDER_ACCEPTED_UNVERIFIED",
        safeFailureClass: "RECEIPT_WRITE_FAILED",
        retryClass: "RETRYABLE_LOCAL_ONLY",
        proposalStateAfter: marked.proposal.proposalState,
        warnings: [
          ...result.warnings,
          LEO_CONNECTED_ACTION_FAILURE_CLASS_META.RECEIPT_WRITE_FAILED.safeOwnerMessage,
        ],
      };
    }
    return {
      ...result,
      status:
        result.status === "PROVIDER_ACCEPTED" && result.verificationState !== "VERIFIED"
          ? "PROVIDER_ACCEPTED_UNVERIFIED"
          : result.status,
      safeFailureClass:
        result.verificationState === "VERIFIED"
          ? result.safeFailureClass
          : "PROVIDER_ACCEPTED_UNVERIFIED",
      proposalStateAfter: marked.proposal.proposalState,
    };
  }

  if (result.status === "FAILED" || result.status === "NOT_ATTEMPTED") {
    // No external side effect → FAILED is truthful for null/blocked path.
    if (!result.externalSideEffectPossible && !result.externalSideEffectConfirmed) {
      const marked = await leoMarkGovernedActionProposalFailed({
        proposalId,
        safeErrorClass: result.safeFailureClass,
      });
      if (!marked.ok) {
        return failureResult({
          proposalId,
          attemptId: result.attemptId,
          safeFailureClass: "STATE_WRITE_FAILED",
          proposalStateAfter: "EXECUTION_CLAIMED",
          warnings: [
            ...result.warnings,
            "Local FAILED state write failed. No external side effect occurred.",
          ],
        });
      }
      return { ...result, proposalStateAfter: marked.proposal.proposalState };
    }
    // Side effect possible/confirmed but classified FAILED → do not invent; stay claimed.
    return {
      ...result,
      proposalStateAfter: "EXECUTION_CLAIMED",
      warnings: [
        ...result.warnings,
        "Leaving EXECUTION_CLAIMED because an external side effect may exist.",
      ],
    };
  }

  // EXECUTION_STARTED without completion → treat as unknown if side effect possible.
  if (result.status === "EXECUTION_STARTED" && result.externalSideEffectPossible) {
    return {
      ...result,
      status: "UNKNOWN_EXTERNAL_OUTCOME",
      safeFailureClass: "UNKNOWN_EXTERNAL_OUTCOME",
      retryClass: "RECONCILE_FIRST",
      proposalStateAfter: LEO_UNKNOWN_EXTERNAL_OUTCOME_PROPOSAL_STATE,
    };
  }

  return { ...result, proposalStateAfter: "EXECUTION_CLAIMED" };
}

export async function leoExecuteGovernedConnectedAction(
  input: LeoExecuteGovernedConnectedActionInput,
): Promise<LeoConnectedActionExecutionResult> {
  const mode = input.mode ?? "execute";
  const access = await requireLeoOwnerAccess();
  const ownerActorId = access.admin.authUserId?.trim();
  if (!ownerActorId) {
    return failureResult({
      proposalId: input.proposalId,
      attemptId: "missing_owner",
      safeFailureClass: "NOT_APPROVED",
      proposalStateAfter: null,
      warnings: ["Owner authentication required."],
    });
  }

  const proposal = await getLeoActionProposalForOwner(input.proposalId, ownerActorId);
  if (!proposal) {
    return failureResult({
      proposalId: input.proposalId,
      attemptId: "not_found",
      safeFailureClass: "NOT_APPROVED",
      proposalStateAfter: null,
      warnings: ["Proposal not found for owner."],
    });
  }

  const requestedAt = new Date().toISOString();
  const draftRequest = buildLeoConnectedActionExecutionRequest(
    proposal,
    ownerActorId,
    requestedAt,
  );

  if (proposal.proposalFingerprint !== input.expectedFingerprint) {
    return failureResult({
      proposalId: proposal.proposalId,
      attemptId: draftRequest.attemptId,
      safeFailureClass: "FINGERPRINT_MISMATCH",
      proposalStateAfter: proposal.proposalState,
    });
  }

  const nowMs = Date.now();
  const expiresMs = Date.parse(proposal.expiresAt);
  if (Number.isFinite(expiresMs) && expiresMs <= nowMs) {
    return failureResult({
      proposalId: proposal.proposalId,
      attemptId: draftRequest.attemptId,
      safeFailureClass: "PROPOSAL_EXPIRED",
      proposalStateAfter: proposal.proposalState,
    });
  }

  if (proposal.proposalState === "VERIFIED") {
    return {
      status: "VERIFIED",
      providerType: "NONE",
      providerObjectId: null,
      safeFailureClass: null,
      retryClass: "NOT_RETRYABLE",
      verificationState: "VERIFIED",
      externalSideEffectPossible: false,
      externalSideEffectConfirmed: false,
      warnings: ["Already verified."],
      safeMetadata: { gate: "LEO-21A" },
      attemptId: draftRequest.attemptId,
      proposalId: proposal.proposalId,
      proposalStateAfter: "VERIFIED",
    };
  }

  if (proposal.proposalState === "EXECUTED" || mode === "verify_only") {
    if (proposal.proposalState !== "EXECUTED" && proposal.proposalState !== "EXECUTION_CLAIMED") {
      return failureResult({
        proposalId: proposal.proposalId,
        attemptId: draftRequest.attemptId,
        safeFailureClass: "NOT_APPROVED",
        proposalStateAfter: proposal.proposalState,
        warnings: ["verify_only requires EXECUTED or EXECUTION_CLAIMED."],
      });
    }
    const adapter = resolveAdapter(proposal.actionFamily);
    const prior: LeoConnectedActionExecutionResult = {
      status:
        proposal.proposalState === "EXECUTED"
          ? "PROVIDER_ACCEPTED_UNVERIFIED"
          : "UNKNOWN_EXTERNAL_OUTCOME",
      providerType: "NONE",
      providerObjectId: null,
      safeFailureClass:
        proposal.proposalState === "EXECUTED"
          ? "PROVIDER_ACCEPTED_UNVERIFIED"
          : "UNKNOWN_EXTERNAL_OUTCOME",
      retryClass: "VERIFY_ONLY",
      verificationState: "PENDING",
      externalSideEffectPossible: proposal.proposalState === "EXECUTED",
      externalSideEffectConfirmed: proposal.proposalState === "EXECUTED",
      warnings: [],
      safeMetadata: { gate: "LEO-21A", path: "verify_only" },
      attemptId: draftRequest.attemptId,
      proposalId: proposal.proposalId,
      proposalStateAfter: proposal.proposalState,
    };
    const verified = await adapter.verify(draftRequest, prior);
    // Null adapter will not invent VERIFIED.
    if (verified.status === "VERIFIED" && verified.verificationState === "VERIFIED") {
      return applyLifecycleAfterAdapter({ proposalId: proposal.proposalId, result: verified });
    }
    return {
      ...verified,
      proposalStateAfter: proposal.proposalState,
    };
  }

  let working = proposal;

  if (proposal.proposalState === "APPROVED") {
    const claimed = await claimLeoActionProposalExecutionAtomic({
      proposalId: proposal.proposalId,
      ownerActorId,
    });
    if (!claimed.ok) {
      const cls: LeoConnectedActionSafeFailureClass =
        claimed.error === "already_claimed" ? "ALREADY_CLAIMED" : "CLAIM_FAILED";
      return failureResult({
        proposalId: proposal.proposalId,
        attemptId: draftRequest.attemptId,
        safeFailureClass: cls,
        proposalStateAfter: proposal.proposalState,
        retryClass: cls === "ALREADY_CLAIMED" ? "RECONCILE_FIRST" : "RETRYABLE_LOCAL_ONLY",
      });
    }
    working = claimed.proposal;
  } else if (proposal.proposalState === "EXECUTION_CLAIMED") {
    // Continue after prior claim — only if blind retry is safe.
    const gate = leoConnectedActionMayBlindRetryExecute({
      priorStatus: null,
      priorExternalSideEffectPossible: false,
      mode,
    });
    // Without persisted prior outcome, LEO-21A null path: no side effect possible → allow.
    if (!gate.allowed) {
      return failureResult({
        proposalId: proposal.proposalId,
        attemptId: draftRequest.attemptId,
        safeFailureClass: "UNKNOWN_EXTERNAL_OUTCOME",
        proposalStateAfter: "EXECUTION_CLAIMED",
        retryClass: "RECONCILE_FIRST",
      });
    }
  } else if (proposal.proposalState === "FAILED") {
    return failureResult({
      proposalId: proposal.proposalId,
      attemptId: draftRequest.attemptId,
      safeFailureClass: "NOT_APPROVED",
      proposalStateAfter: "FAILED",
      warnings: ["Proposal already failed. Prepare a new proposal if needed."],
    });
  } else {
    return failureResult({
      proposalId: proposal.proposalId,
      attemptId: draftRequest.attemptId,
      safeFailureClass: "NOT_APPROVED",
      proposalStateAfter: proposal.proposalState,
    });
  }

  // Claim must have succeeded before adapter execute.
  if (working.proposalState !== "EXECUTION_CLAIMED") {
    return failureResult({
      proposalId: proposal.proposalId,
      attemptId: draftRequest.attemptId,
      safeFailureClass: "CLAIM_FAILED",
      proposalStateAfter: working.proposalState,
    });
  }

  const request = buildLeoConnectedActionExecutionRequest(
    working,
    ownerActorId,
    requestedAt,
  );

  const adapter = resolveAdapter(working.actionFamily);
  if (!adapter.canHandle(working.actionFamily)) {
    return failureResult({
      proposalId: working.proposalId,
      attemptId: request.attemptId,
      safeFailureClass: "NOT_CONNECTED",
      proposalStateAfter: "EXECUTION_CLAIMED",
    });
  }

  let result = await adapter.execute(request);

  // Provider accepted ≠ verified. Only verify when side effect confirmed or accepted.
  if (
    result.status === "PROVIDER_ACCEPTED" ||
    result.status === "PROVIDER_ACCEPTED_UNVERIFIED"
  ) {
    const verified = await adapter.verify(request, result);
    if (verified.verificationState === "VERIFIED" && verified.status === "VERIFIED") {
      result = verified;
    } else {
      result = {
        ...verified,
        status: "PROVIDER_ACCEPTED_UNVERIFIED",
        safeFailureClass: "PROVIDER_ACCEPTED_UNVERIFIED",
        verificationState:
          verified.verificationState === "VERIFIED" ? "PENDING" : verified.verificationState,
      };
    }
  }

  return applyLifecycleAfterAdapter({ proposalId: working.proposalId, result });
}
