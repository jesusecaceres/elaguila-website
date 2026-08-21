/**
 * LEO-21C — Gmail Reply connected-action provider adapter.
 *
 * Write-disabled / scope-aware. FAIL-CLOSED.
 * execute() never calls the Gmail send API.
 * verify() is read-only and never invents VERIFIED without full criteria.
 * CAPABILITY ≠ AUTHORITY.
 */

import "server-only";

import type { LeoActionProposalActionFamily } from "@/app/leo/_lib/leoActionProposalTypes";
import type { LeoConnectedActionProviderAdapter } from "@/app/leo/_lib/leoConnectedActionProviderAdapter";
import type {
  LeoConnectedActionExecutionRequest,
  LeoConnectedActionExecutionResult,
} from "@/app/leo/_lib/leoConnectedActionExecutionTypes";
import { LEO_CONNECTED_ACTION_FAILURE_CLASS_META } from "@/app/leo/_lib/leoConnectedActionExecutionTypes";
import {
  getLeoGoogleAccountEmail,
  isLeoGmailReplyWriteCapabilityEnabled,
  isLeoGoogleWorkspaceConfigured,
} from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import { readLeoGmailMessageById } from "@/app/leo/_lib/leoGmailAdapter";
import {
  leoGmailOwnerSenderMatches,
  leoGmailRecipientInToList,
  leoGmailThreadIdsMatch,
  validateLeoGmailReplyApprovedPayload,
} from "@/app/leo/_lib/leoGmailReplyVerificationHelpers";

function baseResult(
  request: LeoConnectedActionExecutionRequest,
  partial: Partial<LeoConnectedActionExecutionResult> &
    Pick<LeoConnectedActionExecutionResult, "status" | "safeFailureClass" | "retryClass">,
): LeoConnectedActionExecutionResult {
  return {
    status: partial.status,
    providerType: "GMAIL",
    providerObjectId: partial.providerObjectId ?? null,
    safeFailureClass: partial.safeFailureClass,
    retryClass: partial.retryClass,
    verificationState: partial.verificationState ?? "NONE",
    externalSideEffectPossible: partial.externalSideEffectPossible ?? false,
    externalSideEffectConfirmed: partial.externalSideEffectConfirmed ?? false,
    warnings: partial.warnings ?? [],
    safeMetadata: {
      adapterId: "leo.gmail_reply",
      gate: "LEO-21C",
      providerWriteEnabled: false,
      gmailReplyWriteCapability: isLeoGmailReplyWriteCapabilityEnabled(),
      ...(partial.safeMetadata ?? {}),
    },
    attemptId: request.attemptId,
    proposalId: request.proposalId,
    proposalStateAfter: partial.proposalStateAfter ?? null,
  };
}

export const leoGmailReplyConnectedActionAdapter: LeoConnectedActionProviderAdapter = {
  adapterId: "leo.gmail_reply",

  canHandle(actionFamily: LeoActionProposalActionFamily): boolean {
    return actionFamily === "GMAIL_REPLY";
  },

  isConnected(): boolean {
    return isLeoGoogleWorkspaceConfigured();
  },

  /**
   * Write scope not enabled in LEO-21C.
   * Does not introspect Google's token; capability switch remains false.
   */
  hasRequiredScope(): boolean {
    return isLeoGmailReplyWriteCapabilityEnabled();
  },

  async execute(
    request: LeoConnectedActionExecutionRequest,
  ): Promise<LeoConnectedActionExecutionResult> {
    const payloadCheck = validateLeoGmailReplyApprovedPayload({
      actionFamily: request.actionFamily,
      structuredPayload: request.structuredPayload as Record<string, unknown>,
      normalizedTarget: request.normalizedTarget as Record<string, unknown>,
    });
    if (!payloadCheck.ok) {
      const meta = LEO_CONNECTED_ACTION_FAILURE_CLASS_META.TARGET_UNRESOLVED;
      return baseResult(request, {
        status: "FAILED",
        safeFailureClass: "TARGET_UNRESOLVED",
        retryClass: "NOT_RETRYABLE",
        verificationState: "NOT_REQUIRED",
        externalSideEffectPossible: false,
        externalSideEffectConfirmed: false,
        warnings: [
          meta.safeOwnerMessage,
          `Missing: ${payloadCheck.missing.join(", ")}.`,
        ],
        safeMetadata: { missing: payloadCheck.missing.join(",") },
      });
    }

    if (!leoGmailReplyConnectedActionAdapter.isConnected()) {
      const meta = LEO_CONNECTED_ACTION_FAILURE_CLASS_META.NOT_CONNECTED;
      return baseResult(request, {
        status: "FAILED",
        safeFailureClass: "NOT_CONNECTED",
        retryClass: "RETRYABLE_AFTER_RECONNECT",
        verificationState: "NOT_REQUIRED",
        externalSideEffectPossible: false,
        externalSideEffectConfirmed: false,
        warnings: [meta.safeOwnerMessage],
      });
    }

    // Write-disabled: never invoke the Gmail send API. Fail closed on scope.
    if (!leoGmailReplyConnectedActionAdapter.hasRequiredScope()) {
      const meta = LEO_CONNECTED_ACTION_FAILURE_CLASS_META.SCOPE_INSUFFICIENT;
      return baseResult(request, {
        status: "FAILED",
        safeFailureClass: "SCOPE_INSUFFICIENT",
        retryClass: "RETRYABLE_AFTER_RECONNECT",
        verificationState: "NOT_REQUIRED",
        externalSideEffectPossible: false,
        externalSideEffectConfirmed: false,
        warnings: [
          meta.safeOwnerMessage,
          "Gmail is connected for reading. Reply permission (gmail.send) has not been granted. No email was sent.",
        ],
        safeMetadata: {
          failedBeforeExternalSideEffect: true,
          requiredWriteScope: "gmail.send",
        },
      });
    }

    // Unreachable while write capability is false — keep fail-closed.
    const meta = LEO_CONNECTED_ACTION_FAILURE_CLASS_META.SCOPE_INSUFFICIENT;
    return baseResult(request, {
      status: "FAILED",
      safeFailureClass: "SCOPE_INSUFFICIENT",
      retryClass: "NOT_RETRYABLE",
      verificationState: "NOT_REQUIRED",
      externalSideEffectPossible: false,
      externalSideEffectConfirmed: false,
      warnings: [meta.safeOwnerMessage, "Gmail reply write path is not enabled."],
    });
  },

  async verify(
    request: LeoConnectedActionExecutionRequest,
    executionResult: LeoConnectedActionExecutionResult,
  ): Promise<LeoConnectedActionExecutionResult> {
    // Never invoke execute or the Gmail send API from verify.
    const providerObjectId =
      typeof executionResult.providerObjectId === "string"
        ? executionResult.providerObjectId.trim()
        : "";

    if (!providerObjectId || !executionResult.externalSideEffectConfirmed) {
      return baseResult(request, {
        status: "NOT_ATTEMPTED",
        safeFailureClass: executionResult.safeFailureClass,
        retryClass: executionResult.retryClass,
        verificationState: "NONE",
        externalSideEffectPossible: false,
        externalSideEffectConfirmed: false,
        warnings: [
          ...executionResult.warnings,
          "Verification unavailable: no provider message id from a confirmed send.",
        ],
        safeMetadata: {
          bodyVerification: "NOT_AVAILABLE",
          verificationCapability: "PARTIAL",
        },
      });
    }

    const payloadCheck = validateLeoGmailReplyApprovedPayload({
      actionFamily: request.actionFamily,
      structuredPayload: request.structuredPayload as Record<string, unknown>,
      normalizedTarget: request.normalizedTarget as Record<string, unknown>,
    });
    if (!payloadCheck.ok) {
      return baseResult(request, {
        status: "FAILED",
        safeFailureClass: "TARGET_UNRESOLVED",
        retryClass: "NOT_RETRYABLE",
        verificationState: "FAILED",
        providerObjectId,
        externalSideEffectPossible: true,
        externalSideEffectConfirmed: true,
        warnings: ["Cannot verify: approved reply targets unresolved."],
      });
    }

    const read = await readLeoGmailMessageById(providerObjectId);
    const msg = read.messages[0] ?? null;
    if (read.availability !== "AVAILABLE" || !msg) {
      return baseResult(request, {
        status: "PROVIDER_ACCEPTED_UNVERIFIED",
        safeFailureClass: "PROVIDER_ACCEPTED_UNVERIFIED",
        retryClass: "VERIFY_ONLY",
        verificationState: "PENDING",
        providerObjectId,
        externalSideEffectPossible: true,
        externalSideEffectConfirmed: true,
        warnings: [
          "Provider object could not be read back yet. Reconcile-first — do not resend.",
        ],
        safeMetadata: {
          bodyVerification: "NOT_AVAILABLE",
          verificationCapability: "PARTIAL",
        },
      });
    }

    const threadOk = leoGmailThreadIdsMatch(payloadCheck.threadId, msg.threadId);
    const fromOk = leoGmailOwnerSenderMatches(getLeoGoogleAccountEmail(), msg.sender);
    const toOk = leoGmailRecipientInToList(payloadCheck.recipient, msg.to ?? msg.recipients);

    if (!threadOk || !fromOk || !toOk) {
      return baseResult(request, {
        status: "FAILED",
        safeFailureClass: "VERIFICATION_FAILED",
        retryClass: "RECONCILE_FIRST",
        verificationState: "FAILED",
        providerObjectId,
        externalSideEffectPossible: true,
        externalSideEffectConfirmed: true,
        warnings: [
          "Read-back identity checks failed (thread / From / To). Do not blind resend.",
        ],
        safeMetadata: {
          threadOk,
          fromOk,
          toOk,
          bodyVerification: "NOT_AVAILABLE",
          verificationCapability: "PARTIAL",
        },
      });
    }

    // Metadata path has no safe full body — cannot emit VERIFIED in LEO-21C.
    return baseResult(request, {
      status: "PROVIDER_ACCEPTED_UNVERIFIED",
      safeFailureClass: "PROVIDER_ACCEPTED_UNVERIFIED",
      retryClass: "VERIFY_ONLY",
      verificationState: "PENDING",
      providerObjectId,
      externalSideEffectPossible: true,
      externalSideEffectConfirmed: true,
      warnings: [
        "Identity checks passed (messageId/thread/From/To). Body verification is PARTIAL — metadata read has no plain body. VERIFIED requires a future safe body-read gate.",
        "Provider accepted ≠ verified.",
      ],
      safeMetadata: {
        threadOk: true,
        fromOk: true,
        toOk: true,
        bodyVerification: "NOT_AVAILABLE",
        verificationCapability: "PARTIAL",
        rfcMessageId: msg.rfcMessageId ?? null,
        subject: msg.subject,
      },
    });
  },
};
