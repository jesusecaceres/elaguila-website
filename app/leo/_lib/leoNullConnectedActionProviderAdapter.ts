/**
 * LEO-21A — Null / blocked connected-action provider adapter.
 *
 * The ONLY runtime adapter in this gate.
 * Fail-closed: NOT_CONNECTED or SCOPE_INSUFFICIENT.
 * No network mutation. No provider call. No external side effect.
 */

import "server-only";

import type { LeoActionProposalActionFamily } from "@/app/leo/_lib/leoActionProposalTypes";
import type { LeoConnectedActionProviderAdapter } from "@/app/leo/_lib/leoConnectedActionProviderAdapter";
import type {
  LeoConnectedActionExecutionRequest,
  LeoConnectedActionExecutionResult,
} from "@/app/leo/_lib/leoConnectedActionExecutionTypes";
import { LEO_CONNECTED_ACTION_FAILURE_CLASS_META } from "@/app/leo/_lib/leoConnectedActionExecutionTypes";

function blockedResult(
  request: LeoConnectedActionExecutionRequest,
  safeFailureClass: "NOT_CONNECTED" | "SCOPE_INSUFFICIENT",
): LeoConnectedActionExecutionResult {
  const meta = LEO_CONNECTED_ACTION_FAILURE_CLASS_META[safeFailureClass];
  return {
    status: "FAILED",
    providerType: "NONE",
    providerObjectId: null,
    safeFailureClass,
    retryClass: meta.retryable ? "RETRYABLE_AFTER_RECONNECT" : "NOT_RETRYABLE",
    verificationState: "NOT_REQUIRED",
    externalSideEffectPossible: false,
    externalSideEffectConfirmed: false,
    warnings: [meta.safeOwnerMessage],
    safeMetadata: {
      adapterId: "leo.null_connected_action",
      gate: "LEO-21A",
      providerWriteEnabled: false,
    },
    attemptId: request.attemptId,
    proposalId: request.proposalId,
    proposalStateAfter: null,
  };
}

export const leoNullConnectedActionProviderAdapter: LeoConnectedActionProviderAdapter = {
  adapterId: "leo.null_connected_action",

  canHandle(_actionFamily: LeoActionProposalActionFamily): boolean {
    // Handles every family as the fail-closed default until real adapters exist.
    return true;
  },

  isConnected(): boolean {
    return false;
  },

  hasRequiredScope(): boolean {
    return false;
  },

  async execute(
    request: LeoConnectedActionExecutionRequest,
  ): Promise<LeoConnectedActionExecutionResult> {
    // Fail-closed: LEO-21A never opens a provider connection or write scope.
    if (!leoNullConnectedActionProviderAdapter.isConnected()) {
      return blockedResult(request, "NOT_CONNECTED");
    }
    if (!leoNullConnectedActionProviderAdapter.hasRequiredScope()) {
      return blockedResult(request, "SCOPE_INSUFFICIENT");
    }
    return blockedResult(request, "NOT_CONNECTED");
  },

  async verify(
    request: LeoConnectedActionExecutionRequest,
    executionResult: LeoConnectedActionExecutionResult,
  ): Promise<LeoConnectedActionExecutionResult> {
    // Nothing external happened; verification cannot invent success.
    return {
      ...executionResult,
      status: executionResult.externalSideEffectConfirmed
        ? "PROVIDER_ACCEPTED_UNVERIFIED"
        : executionResult.status,
      verificationState: "NOT_REQUIRED",
      warnings: [
        ...executionResult.warnings,
        "Null adapter: no provider object to verify.",
      ],
      attemptId: request.attemptId,
      proposalId: request.proposalId,
    };
  },
};
