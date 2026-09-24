/**
 * LEO FINAL-02 connected action execution orchestrator — server-only.
 *
 * The ONLY path from a confirmed owner action to a real provider call.
 * Reuses FINAL-01's durable receipt system (leoToolReceiptService.ts) for
 * idempotency/lifecycle — does not create a second idempotency framework.
 *
 * Contract: owner_admin -> server-derived actor -> allowlisted tool only ->
 * proposal fetched by ID (never trusted from the client) -> fingerprint
 * matches -> capability ready -> idempotent claim -> exactly one provider
 * adapter call -> receipt transitioned truthfully -> safe bounded result.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { getLeoActionProposalForActor } from "@/app/leo/_lib/leoActionProposalRepository";
import { createLeoCalendarEvent, updateLeoCalendarEvent } from "@/app/leo/_lib/leoCalendarWriteAdapter";
import { createLeoGmailDraft, replyLeoGmailMessage, sendLeoGmailMessage } from "@/app/leo/_lib/leoGmailWriteAdapter";
import { getLeoGoogleCapabilityDiagnostic } from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import { LEO_WRITE_ALLOWLIST } from "@/app/leo/_lib/leoToolRegistry";
import {
  leoCreateToolReceiptRequest,
  leoMarkReceiptAuthorized,
  leoMarkReceiptExecuted,
  leoMarkReceiptFailed,
  leoMarkReceiptVerified,
  leoGetToolReceiptByCorrelation,
} from "@/app/leo/_lib/leoToolReceiptService";
import type {
  LeoActionExecutionResult,
  LeoConnectedActionProposal,
  LeoDurableToolReceipt,
  LeoToolId,
} from "@/app/leo/_lib/leoTypes";

const RECEIPT_TERMINAL_STATES = new Set<LeoDurableToolReceipt["lifecycleState"]>([
  "EXECUTED",
  "VERIFIED",
  "FAILED",
  "NOT_EXECUTED",
  "CANCELLED",
]);

function actionTypeForTool(toolId: LeoToolId): string {
  switch (toolId) {
    case "leo.gmail.draft.create":
      return "CREATE_EMAIL_DRAFT";
    case "leo.gmail.send":
      return "SEND_EMAIL";
    case "leo.gmail.reply":
      return "REPLY_EMAIL";
    case "leo.calendar.create":
      return "CREATE_CALENDAR_EVENT";
    case "leo.calendar.update":
      return "UPDATE_CALENDAR_EVENT";
    default:
      return "UNKNOWN";
  }
}

function summaryForProposal(toolId: LeoToolId, proposal: LeoConnectedActionProposal): string {
  if (proposal.email) {
    return `${actionTypeForTool(toolId)} to ${proposal.email.recipientEmail}: "${proposal.email.subject}"`.slice(
      0,
      500,
    );
  }
  if (proposal.calendar) {
    return `${actionTypeForTool(toolId)}: "${proposal.calendar.title}" ${proposal.calendar.startIso}`.slice(0, 500);
  }
  return actionTypeForTool(toolId);
}

function terminalResultFromReceipt(receipt: LeoDurableToolReceipt): LeoActionExecutionResult {
  if (receipt.lifecycleState === "VERIFIED" || receipt.lifecycleState === "EXECUTED") {
    return {
      state: "SUCCEEDED",
      receiptId: receipt.id,
      errorCode: null,
      message: "This action already executed successfully. Returning the prior result.",
      evidence: null,
    };
  }
  return {
    state: "DUPLICATE_REPLAY",
    receiptId: receipt.id,
    errorCode: receipt.safeErrorClass,
    message: "This action was already processed and did not succeed. It will not be retried automatically.",
    evidence: null,
  };
}

async function invokeAllowlistedAdapter(
  toolId: LeoToolId,
  proposal: LeoConnectedActionProposal,
): Promise<
  | { ok: true; evidence: LeoActionExecutionResult["evidence"] }
  | { ok: false; errorCode: string; message: string }
> {
  if ((toolId === "leo.gmail.draft.create" || toolId === "leo.gmail.send" || toolId === "leo.gmail.reply")) {
    const email = proposal.email;
    if (!email) return { ok: false, errorCode: "PROPOSAL_MISMATCH", message: "Proposal is not an email proposal." };

    if (toolId === "leo.gmail.draft.create") {
      const r = await createLeoGmailDraft({ to: email.recipientEmail, subject: email.subject, bodyText: email.bodyText });
      if (!r.ok) return r;
      return { ok: true, evidence: { provider: "GMAIL", messageId: r.messageId, threadId: r.threadId ?? undefined, providerUpdatedAt: r.providerTimestamp } };
    }
    if (toolId === "leo.gmail.send") {
      const r = await sendLeoGmailMessage({ to: email.recipientEmail, subject: email.subject, bodyText: email.bodyText });
      if (!r.ok) return r;
      return { ok: true, evidence: { provider: "GMAIL", messageId: r.messageId, threadId: r.threadId ?? undefined, providerUpdatedAt: r.providerTimestamp } };
    }
    // leo.gmail.reply
    if (!email.replyToThreadId) {
      return { ok: false, errorCode: "THREAD_ID_REQUIRED", message: "Reply requires a proven threadId." };
    }
    const r = await replyLeoGmailMessage({
      to: email.recipientEmail,
      subject: email.subject,
      bodyText: email.bodyText,
      threadId: email.replyToThreadId,
      inReplyToRfc822MessageId: email.replyToMessageId,
    });
    if (!r.ok) return r;
    return { ok: true, evidence: { provider: "GMAIL", messageId: r.messageId, threadId: r.threadId ?? undefined, providerUpdatedAt: r.providerTimestamp } };
  }

  if (toolId === "leo.calendar.create" || toolId === "leo.calendar.update") {
    const calendar = proposal.calendar;
    if (!calendar) return { ok: false, errorCode: "PROPOSAL_MISMATCH", message: "Proposal is not a calendar proposal." };

    if (toolId === "leo.calendar.create") {
      const r = await createLeoCalendarEvent(calendar);
      if (!r.ok) return r;
      return { ok: true, evidence: { provider: "CALENDAR", eventId: r.eventId, htmlLink: r.htmlLink, providerUpdatedAt: r.providerUpdatedAt } };
    }
    if (!calendar.existingEventId) {
      return { ok: false, errorCode: "EVENT_ID_REQUIRED", message: "Update requires a proven existing event ID." };
    }
    const r = await updateLeoCalendarEvent({ ...calendar, existingEventId: calendar.existingEventId });
    if (!r.ok) return r;
    return { ok: true, evidence: { provider: "CALENDAR", eventId: r.eventId, htmlLink: r.htmlLink, providerUpdatedAt: r.providerUpdatedAt } };
  }

  return { ok: false, errorCode: "TOOL_NOT_ALLOWLISTED", message: "This tool is not allowlisted for execution." };
}

/**
 * Execute a previously prepared, owner-confirmed connected action.
 * Never call the write adapters directly from anywhere else in the codebase.
 */
export async function executeLeoConnectedAction(input: {
  proposalId: string;
  fingerprint: string;
  toolId: string;
}): Promise<LeoActionExecutionResult> {
  // 1-2. owner_admin, server-derived actor. Client-supplied identity is never
  // read here — requireLeoOwnerAccess derives the actor from the server-side
  // admin session, matching every other LEO write path.
  const access = await requireLeoOwnerAccess();
  const actor = access.admin.authUserId?.trim();
  if (!actor) {
    return { state: "DENIED", receiptId: null, errorCode: "OWNER_ACCESS_DENIED", message: "Owner access required.", evidence: null };
  }

  // 3. Accept only a supported, allowlisted structured action.
  const toolId = input.toolId as LeoToolId;
  if (!LEO_WRITE_ALLOWLIST.has(toolId)) {
    return { state: "DENIED", receiptId: null, errorCode: "TOOL_NOT_ALLOWLISTED", message: "This action is not available.", evidence: null };
  }

  // Proposal is fetched by ID scoped to this actor — the client never
  // supplies executable recipient/subject/body/event content directly.
  const proposalRecord = await getLeoActionProposalForActor(input.proposalId, actor);
  if (!proposalRecord) {
    return { state: "UNAVAILABLE", receiptId: null, errorCode: "PROPOSAL_NOT_FOUND", message: "This proposal was not found or has expired. Please prepare it again.", evidence: null };
  }
  if (proposalRecord.toolId !== toolId) {
    return { state: "DENIED", receiptId: null, errorCode: "PROPOSAL_TOOL_MISMATCH", message: "Proposal does not match the requested action.", evidence: null };
  }

  // 6. Confirmation freshness — the fingerprint the client echoes back must
  // match the exact content it was shown. A mismatch means the UI state was
  // stale or tampered; never silently execute against different content.
  if (input.fingerprint !== proposalRecord.fingerprint) {
    return { state: "DENIED", receiptId: null, errorCode: "CONFIRMATION_STALE", message: "This confirmation no longer matches the prepared action. Please review and confirm again.", evidence: null };
  }

  // Capability readiness — fail closed truthfully rather than attempting.
  const capability = getLeoGoogleCapabilityDiagnostic({ tokenAvailable: true });
  if (capability.write !== "WRITE_READY") {
    return {
      state: "UNAVAILABLE",
      receiptId: null,
      errorCode: capability.write,
      message: "Google write actions require owner setup.",
      evidence: null,
    };
  }

  // 7. Recipient/attendee were already resolved and validated at prepare
  // time (leoPeopleAdapter.ts / calendar availability); re-validate shape
  // here as defense in depth before the real provider call.
  const proposal = proposalRecord.proposal;
  if (proposal.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(proposal.email.recipientEmail)) {
    return { state: "DENIED", receiptId: null, errorCode: "RECIPIENT_INVALID", message: "Recipient could not be re-validated.", evidence: null };
  }
  if (proposal.calendar) {
    for (const a of proposal.calendar.attendees) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) {
        return { state: "DENIED", receiptId: null, errorCode: "ATTENDEE_INVALID", message: "An attendee could not be re-validated.", evidence: null };
      }
    }
  }

  // 8. Deterministic execution identity — same (actor, proposalId, toolId)
  // always yields the same correlationId, so retries/duplicate clicks
  // collide into the same receipt row instead of a second provider call.
  const correlationId = `leo-action:${toolId}:${proposalRecord.id}`;
  const actionType = actionTypeForTool(toolId);

  const existingReceipt = await leoGetToolReceiptByCorrelation(correlationId);
  if (existingReceipt) return terminalResultFromReceipt(existingReceipt);

  const created = await leoCreateToolReceiptRequest({
    correlationId,
    toolId,
    actionType,
    governanceLevel: "YELLOW",
    requestedPayloadSummary: summaryForProposal(toolId, proposal),
    preparationRef: proposalRecord.id,
    sourceRefs: [{ system: "GOOGLE", kind: "action_proposal", id: proposalRecord.id }],
  });
  if (!created.ok) {
    return { state: "FAILED", receiptId: null, errorCode: created.error, message: "Could not create an execution receipt.", evidence: null };
  }

  const authorized = await leoMarkReceiptAuthorized(created.receipt.id);
  if (!authorized.ok) {
    // Lost a concurrent race to claim this receipt — another in-flight
    // request already owns it. Report duplicate-replay rather than retrying.
    return { state: "DUPLICATE_REPLAY", receiptId: created.receipt.id, errorCode: authorized.error, message: "This action is already being processed.", evidence: null };
  }

  // 9. Exactly one allowlisted provider adapter call.
  const providerResult = await invokeAllowlistedAdapter(toolId, proposal);

  // 10-11. Validate provider result, transition the receipt truthfully.
  if (!providerResult.ok) {
    const failed = await leoMarkReceiptFailed(created.receipt.id, providerResult.errorCode.slice(0, 120));
    return {
      state: "FAILED",
      receiptId: failed.ok ? failed.receipt.id : created.receipt.id,
      errorCode: providerResult.errorCode,
      message: providerResult.message,
      evidence: null,
    };
  }

  const executed = await leoMarkReceiptExecuted(created.receipt.id);
  if (!executed.ok) {
    return { state: "FAILED", receiptId: created.receipt.id, errorCode: executed.error, message: "Provider succeeded but the receipt could not be marked executed.", evidence: providerResult.evidence };
  }
  const verified = await leoMarkReceiptVerified(created.receipt.id);

  // 12. Safe bounded result — no raw provider payload, no OAuth material.
  return {
    state: "SUCCEEDED",
    receiptId: verified.ok ? verified.receipt.id : executed.receipt.id,
    errorCode: null,
    message: "Action executed successfully.",
    evidence: providerResult.evidence,
  };
}
