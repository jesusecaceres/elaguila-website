/**
 * LEO-21D — Gmail Reply connected-action provider adapter (live-capable, authority OFF).
 *
 * Two-key write activation:
 *   1. LEO_GMAIL_REPLY_WRITE_ENABLED === "true"
 *   2. live token proves gmail.send
 *
 * CAPABILITY ≠ AUTHORITY. Default configuration cannot send.
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
  isLeoGmailReplyWriteFlagEnabled,
  isLeoGoogleWorkspaceConfigured,
  LEO_GMAIL_SEND_SCOPE,
} from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import {
  readLeoGmailMessagePlainTextById,
  readLeoGmailThread,
  sendLeoGmailRawMessage,
} from "@/app/leo/_lib/leoGmailAdapter";
import { proveLeoGmailSendScopeGranted } from "@/app/leo/_lib/leoGmailSendScopeProof";
import { buildLeoGmailReplyMimeRaw } from "@/app/leo/_lib/leoGmailReplyMimeBuilder";
import {
  extractEmailFromAddressHeader,
  leoGmailNormalizedBodiesMatch,
  leoGmailOwnerSenderMatches,
  leoGmailRecipientInToList,
  leoGmailThreadIdsMatch,
  normalizeLeoGmailRecipientEmail,
  validateLeoGmailReplyApprovedPayload,
} from "@/app/leo/_lib/leoGmailReplyVerificationHelpers";
import type { LeoEmailMessageEvidence } from "@/app/leo/_lib/leoTypes";

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
      gate: "LEO-21D",
      providerWriteFlag: isLeoGmailReplyWriteFlagEnabled(),
      requiredWriteScope: LEO_GMAIL_SEND_SCOPE,
      ...(partial.safeMetadata ?? {}),
    },
    attemptId: request.attemptId,
    proposalId: request.proposalId,
    proposalStateAfter: partial.proposalStateAfter ?? null,
  };
}

function deriveReplySubject(sourceSubject: string | null | undefined): string | null {
  const s = typeof sourceSubject === "string" ? sourceSubject.trim() : "";
  if (!s) return null;
  if (/^re\s*:/i.test(s)) return s.slice(0, 200);
  return `Re: ${s}`.slice(0, 200);
}

function deriveReferences(
  priorReferences: string | null | undefined,
  sourceMessageId: string,
): string {
  const prior = typeof priorReferences === "string" ? priorReferences.trim() : "";
  if (!prior) return sourceMessageId;
  if (prior.includes(sourceMessageId)) return prior.slice(0, 2000);
  return `${prior} ${sourceMessageId}`.trim().slice(0, 2000);
}

function pickSourceMessage(
  messages: LeoEmailMessageEvidence[],
  approvedRecipient: string,
): LeoEmailMessageEvidence | null {
  if (!messages.length) return null;
  // Prefer latest message involving the approved recipient (From or To).
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    const from = extractEmailFromAddressHeader(m.sender);
    const inTo = leoGmailRecipientInToList(approvedRecipient, m.to ?? m.recipients);
    if (from === approvedRecipient || inTo) return m;
  }
  // Fall back to latest message with an RFC Message-ID (still require recipient elsewhere).
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.rfcMessageId) return m;
  }
  return messages[messages.length - 1] ?? null;
}

function threadMentionsRecipient(
  messages: LeoEmailMessageEvidence[],
  recipient: string,
): boolean {
  return messages.some((m) => {
    const from = extractEmailFromAddressHeader(m.sender);
    if (from === recipient) return true;
    return leoGmailRecipientInToList(recipient, m.to ?? m.recipients);
  });
}

type PreSendOk = {
  ok: true;
  from: string;
  to: string;
  subject: string;
  inReplyTo: string;
  references: string;
  body: string;
  threadId: string;
};

type PreSendFail = { ok: false; reason: string };

async function revalidateThreadBeforeSend(input: {
  threadId: string;
  recipient: string;
  body: string;
}): Promise<PreSendOk | PreSendFail> {
  const owner = normalizeLeoGmailRecipientEmail(getLeoGoogleAccountEmail());
  if (!owner) {
    return { ok: false, reason: "owner_mailbox_unconfigured" };
  }

  const thread = await readLeoGmailThread(input.threadId);
  if (thread.availability !== "AVAILABLE" || !thread.messages.length) {
    return { ok: false, reason: "thread_unavailable" };
  }

  const first = thread.messages[0];
  if (first?.threadId && !leoGmailThreadIdsMatch(input.threadId, first.threadId)) {
    return { ok: false, reason: "thread_id_mismatch" };
  }

  if (!threadMentionsRecipient(thread.messages, input.recipient)) {
    return { ok: false, reason: "recipient_not_in_thread" };
  }

  const source = pickSourceMessage(thread.messages, input.recipient);
  if (!source?.rfcMessageId) {
    return { ok: false, reason: "source_message_id_missing" };
  }

  const subject = deriveReplySubject(source.subject);
  if (!subject) {
    return { ok: false, reason: "subject_underivable" };
  }

  const inReplyTo = source.rfcMessageId.trim();
  const references = deriveReferences(source.referencesHeader, inReplyTo);
  if (!inReplyTo || !references) {
    return { ok: false, reason: "reply_headers_underivable" };
  }

  return {
    ok: true,
    from: owner,
    to: input.recipient,
    subject,
    inReplyTo,
    references,
    body: input.body,
    threadId: input.threadId,
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
   * Write-flag only (sync). Full two-key proof happens in execute via tokeninfo.
   */
  hasRequiredScope(): boolean {
    return isLeoGmailReplyWriteFlagEnabled();
  },

  async execute(
    request: LeoConnectedActionExecutionRequest,
  ): Promise<LeoConnectedActionExecutionResult> {
    // 1. Immutable approved payload
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
        warnings: [meta.safeOwnerMessage, `Missing: ${payloadCheck.missing.join(", ")}.`],
        safeMetadata: { missing: payloadCheck.missing.join(",") },
      });
    }

    // 2. Google connected
    if (!leoGmailReplyConnectedActionAdapter.isConnected()) {
      const meta = LEO_CONNECTED_ACTION_FAILURE_CLASS_META.NOT_CONNECTED;
      return baseResult(request, {
        status: "FAILED",
        safeFailureClass: "NOT_CONNECTED",
        retryClass: "RETRYABLE_AFTER_RECONNECT",
        verificationState: "NOT_REQUIRED",
        externalSideEffectPossible: false,
        warnings: [meta.safeOwnerMessage],
      });
    }

    // 3. Write flag (key 1)
    const writeFlag = isLeoGmailReplyWriteFlagEnabled();
    if (!writeFlag) {
      const meta = LEO_CONNECTED_ACTION_FAILURE_CLASS_META.SCOPE_INSUFFICIENT;
      return baseResult(request, {
        status: "FAILED",
        safeFailureClass: "SCOPE_INSUFFICIENT",
        retryClass: "RETRYABLE_AFTER_RECONNECT",
        verificationState: "NOT_REQUIRED",
        externalSideEffectPossible: false,
        warnings: [
          meta.safeOwnerMessage,
          "LEO_GMAIL_REPLY_WRITE_ENABLED is not true. No email was sent.",
        ],
        safeMetadata: {
          failedBeforeExternalSideEffect: true,
          writeFlag: false,
          twoKey: "flag_off",
        },
      });
    }

    // 4. gmail.send proven on live token (key 2)
    const scopeProof = await proveLeoGmailSendScopeGranted();
    if (!scopeProof.ok) {
      const meta = LEO_CONNECTED_ACTION_FAILURE_CLASS_META.SCOPE_INSUFFICIENT;
      return baseResult(request, {
        status: "FAILED",
        safeFailureClass: "SCOPE_INSUFFICIENT",
        retryClass: "RETRYABLE_AFTER_RECONNECT",
        verificationState: "NOT_REQUIRED",
        externalSideEffectPossible: false,
        warnings: [
          meta.safeOwnerMessage,
          "gmail.send is not proven on the live token. No email was sent.",
        ],
        safeMetadata: {
          failedBeforeExternalSideEffect: true,
          writeFlag: true,
          scopeProof: scopeProof.errorCode,
          twoKey: "scope_absent",
        },
      });
    }

    // 5. Pre-send thread revalidation (no silent retarget)
    const reval = await revalidateThreadBeforeSend({
      threadId: payloadCheck.threadId,
      recipient: payloadCheck.recipient,
      body: payloadCheck.body,
    });
    if (!reval.ok) {
      const meta = LEO_CONNECTED_ACTION_FAILURE_CLASS_META.TARGET_UNRESOLVED;
      return baseResult(request, {
        status: "FAILED",
        safeFailureClass: "TARGET_UNRESOLVED",
        retryClass: "NOT_RETRYABLE",
        verificationState: "NOT_REQUIRED",
        externalSideEffectPossible: false,
        warnings: [
          meta.safeOwnerMessage,
          `Pre-send thread revalidation failed (${reval.reason}). No email was sent.`,
        ],
        safeMetadata: {
          failedBeforeExternalSideEffect: true,
          revalidation: reval.reason,
        },
      });
    }

    // 6. Build MIME (plain text)
    const mime = buildLeoGmailReplyMimeRaw({
      from: reval.from,
      to: reval.to,
      subject: reval.subject,
      body: reval.body,
      inReplyTo: reval.inReplyTo,
      references: reval.references,
    });
    if (!mime.ok) {
      return baseResult(request, {
        status: "FAILED",
        safeFailureClass: "TARGET_UNRESOLVED",
        retryClass: "NOT_RETRYABLE",
        verificationState: "NOT_REQUIRED",
        externalSideEffectPossible: false,
        warnings: [`MIME build failed (${mime.error}). No email was sent.`],
        safeMetadata: { mimeError: mime.error },
      });
    }

    // 7–8. Dispatch boundary → Gmail messages.send
    // After this call begins, externalSideEffectPossible must be true on uncertain outcomes.
    const sendResult = await sendLeoGmailRawMessage({
      rawBase64Url: mime.rawBase64Url,
      threadId: reval.threadId,
    });

    // 9. Classify
    if (!sendResult.ok) {
      if (sendResult.dispatchStarted) {
        const meta = LEO_CONNECTED_ACTION_FAILURE_CLASS_META.UNKNOWN_EXTERNAL_OUTCOME;
        return baseResult(request, {
          status: "UNKNOWN_EXTERNAL_OUTCOME",
          safeFailureClass: "UNKNOWN_EXTERNAL_OUTCOME",
          retryClass: "RECONCILE_FIRST",
          verificationState: "PENDING",
          externalSideEffectPossible: true,
          externalSideEffectConfirmed: false,
          warnings: [
            meta.safeOwnerMessage,
            "Dispatch may have begun. Reconcile-first — do not blind resend.",
          ],
          safeMetadata: {
            sendError: sendResult.errorCode,
            httpStatus: sendResult.httpStatus,
            reconcileFirst: true,
          },
        });
      }
      return baseResult(request, {
        status: "FAILED",
        safeFailureClass: "PROVIDER_ERROR",
        retryClass: "RETRYABLE_LOCAL_ONLY",
        verificationState: "NOT_REQUIRED",
        externalSideEffectPossible: false,
        warnings: [`Gmail send failed before dispatch (${sendResult.errorCode}).`],
        safeMetadata: { sendError: sendResult.errorCode },
      });
    }

    // PROVIDER_ACCEPTED — not VERIFIED
    return baseResult(request, {
      status: "PROVIDER_ACCEPTED",
      safeFailureClass: null,
      retryClass: "VERIFY_ONLY",
      verificationState: "PENDING",
      providerObjectId: sendResult.messageId,
      externalSideEffectPossible: true,
      externalSideEffectConfirmed: true,
      warnings: [
        "Provider accepted the send. VERIFIED requires read-back body match.",
        "Provider accepted ≠ verified.",
      ],
      safeMetadata: {
        threadId: sendResult.threadId ?? reval.threadId,
        verificationCapability: "FULL",
      },
    });
  },

  async verify(
    request: LeoConnectedActionExecutionRequest,
    executionResult: LeoConnectedActionExecutionResult,
  ): Promise<LeoConnectedActionExecutionResult> {
    // verify_only: NEVER call messages.send
    const providerObjectId =
      typeof executionResult.providerObjectId === "string"
        ? executionResult.providerObjectId.trim()
        : "";

    const payloadCheck = validateLeoGmailReplyApprovedPayload({
      actionFamily: request.actionFamily,
      structuredPayload: request.structuredPayload as Record<string, unknown>,
      normalizedTarget: request.normalizedTarget as Record<string, unknown>,
    });

    if (!providerObjectId) {
      // Narrowest safe reconciliation: cannot prove intended reply without id.
      return baseResult(request, {
        status: "UNKNOWN_EXTERNAL_OUTCOME",
        safeFailureClass: "UNKNOWN_EXTERNAL_OUTCOME",
        retryClass: "RECONCILE_FIRST",
        verificationState: "PENDING",
        externalSideEffectPossible: true,
        externalSideEffectConfirmed: false,
        warnings: [
          "No providerObjectId — cannot prove intended reply. Reconcile-first; do not resend.",
        ],
        safeMetadata: {
          bodyVerification: "NOT_AVAILABLE",
          verificationCapability: "FULL",
          reconcileFirst: true,
          verifyOnly: true,
        },
      });
    }

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
        safeMetadata: { verifyOnly: true },
      });
    }

    const read = await readLeoGmailMessagePlainTextById(providerObjectId);
    if (!read.ok) {
      return baseResult(request, {
        status: "PROVIDER_ACCEPTED_UNVERIFIED",
        safeFailureClass: "PROVIDER_ACCEPTED_UNVERIFIED",
        retryClass: "VERIFY_ONLY",
        verificationState: "PENDING",
        providerObjectId,
        externalSideEffectPossible: true,
        externalSideEffectConfirmed: true,
        warnings: [
          "Provider object could not be fully read back yet. Reconcile-first — do not resend.",
        ],
        safeMetadata: {
          bodyVerification: "NOT_AVAILABLE",
          verificationCapability: "FULL",
          readError: read.errorCode,
          verifyOnly: true,
        },
      });
    }

    const msg = read.message;
    const threadOk = leoGmailThreadIdsMatch(payloadCheck.threadId, msg.threadId);
    const fromOk = leoGmailOwnerSenderMatches(getLeoGoogleAccountEmail(), msg.sender);
    const toOk = leoGmailRecipientInToList(payloadCheck.recipient, msg.to ?? msg.recipients);
    const bodyOk = leoGmailNormalizedBodiesMatch(payloadCheck.body, read.plainText);

    if (!threadOk || !fromOk || !toOk || !bodyOk) {
      return baseResult(request, {
        status: "FAILED",
        safeFailureClass: "VERIFICATION_FAILED",
        retryClass: "RECONCILE_FIRST",
        verificationState: "FAILED",
        providerObjectId,
        externalSideEffectPossible: true,
        externalSideEffectConfirmed: true,
        warnings: [
          "Read-back checks failed (thread / From / To / body). Do not blind resend.",
        ],
        safeMetadata: {
          threadOk,
          fromOk,
          toOk,
          bodyOk,
          bodyVerification: bodyOk ? "MATCH" : "MISMATCH",
          verificationCapability: "FULL",
          verifyOnly: true,
        },
      });
    }

    return baseResult(request, {
      status: "VERIFIED",
      safeFailureClass: null,
      retryClass: "NOT_RETRYABLE",
      verificationState: "VERIFIED",
      providerObjectId,
      externalSideEffectPossible: true,
      externalSideEffectConfirmed: true,
      warnings: [],
      safeMetadata: {
        threadOk: true,
        fromOk: true,
        toOk: true,
        bodyOk: true,
        bodyVerification: "MATCH",
        verificationCapability: "FULL",
        threadId: msg.threadId,
        verifyOnly: true,
      },
    });
  },
};
