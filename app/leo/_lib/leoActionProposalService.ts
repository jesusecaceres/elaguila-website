import "server-only";

import { createHash } from "node:crypto";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import {
  createLeoActionProposal,
  transitionLeoActionProposalState,
  getLeoActionProposalForOwner,
  listLeoActionProposalsForOwner,
  approveLeoActionProposalAtomic,
  claimLeoActionProposalExecutionAtomic,
  cancelLeoActionProposal,
  markLeoActionProposalExecuted,
  markLeoActionProposalVerified,
  markLeoActionProposalFailed,
  expireLeoActionProposals,
} from "@/app/leo/_lib/leoActionProposalRepository";
import {
  mapLeoActionProposalToOwnerCard,
  sortLeoGovernedActionCards,
  type LeoGovernedActionProposalCard,
} from "@/app/leo/_lib/leoGovernedActionProposalReadModel";
import { computeLeoActionProposalFingerprint } from "@/app/leo/_lib/leoActionProposalFingerprint";
import {
  LEO_ACTION_PROPOSAL_FAMILIES,
  type LeoActionProposalActionFamily,
  type LeoActionProposal,
  type LeoActionProposalGovernanceLevel,
  type LeoActionProposalNormalizedTarget,
  type LeoActionProposalReferentSnapshot,
  type LeoActionProposalStructuredPayload,
} from "@/app/leo/_lib/leoActionProposalTypes";
import {
  leoCreateToolReceiptRequest,
  leoMarkReceiptPrepared,
  leoMarkReceiptAwaitingApproval,
  leoMarkReceiptAuthorized,
  leoMarkReceiptCancelled,
  leoMarkReceiptExecuted,
  leoMarkReceiptVerified,
  leoMarkReceiptFailed,
} from "@/app/leo/_lib/leoToolReceiptService";

function nonEmptyString(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
}

function hasNonEmptyString(v: unknown): boolean {
  return nonEmptyString(v) != null;
}

function isNonEmptyArray(v: unknown): boolean {
  return Array.isArray(v) && v.length > 0;
}

type LeoActionProposalDisplayReadiness = {
  displayable: boolean;
  awaitingApproval: boolean;
};

function evaluateProposalReadiness(input: {
  actionFamily: LeoActionProposalActionFamily;
  structuredPayload: LeoActionProposalStructuredPayload;
}): LeoActionProposalDisplayReadiness {
  const p = input.structuredPayload as any;

  switch (input.actionFamily) {
    case "GMAIL_SEND": {
      const subjectOk = hasNonEmptyString(p.subject);
      const bodyOk = hasNonEmptyString(p.body);
      const recipientOk = hasNonEmptyString(p.recipient);
      return {
        displayable: subjectOk && bodyOk,
        awaitingApproval: subjectOk && bodyOk && recipientOk,
      };
    }
    case "GMAIL_REPLY": {
      const bodyOk = hasNonEmptyString(p.body);
      const recipientOk = hasNonEmptyString(p.recipient);
      const threadOk = hasNonEmptyString(p.threadId);
      return {
        displayable: bodyOk,
        awaitingApproval: bodyOk && recipientOk && threadOk,
      };
    }
    case "CALENDAR_CREATE": {
      const titleOk = hasNonEmptyString(p.title);
      const startOk = hasNonEmptyString(p.start);
      const endOk = hasNonEmptyString(p.end);
      const tzOk = hasNonEmptyString(p.timezone);
      const attendeesOk = isNonEmptyArray(p.attendees) && (p.attendees as any[]).some((a) => hasNonEmptyString(a?.email));
      return {
        displayable: titleOk && startOk && endOk && tzOk,
        awaitingApproval: titleOk && startOk && endOk && tzOk && attendeesOk,
      };
    }
    case "CALENDAR_UPDATE": {
      const eventIdOk = hasNonEmptyString(p.eventId);
      const patch = p.patch ?? {};
      const anyPatched = [
        patch.title,
        patch.start,
        patch.end,
        patch.timezone,
        patch.location,
        patch.description,
        patch.attendees,
      ].some((x) => {
        if (Array.isArray(x)) return x.length > 0;
        return hasNonEmptyString(x);
      });
      return {
        displayable: eventIdOk && anyPatched,
        awaitingApproval: eventIdOk && anyPatched,
      };
    }
    default:
      return { displayable: false, awaitingApproval: false };
  }
}

export type LeoCreateGovernedActionProposalInput = {
  sourceSessionId?: string | null;
  sourceTurnId?: string | null;
  actionFamily: LeoActionProposalActionFamily;
  normalizedTarget: LeoActionProposalNormalizedTarget;
  structuredPayload: LeoActionProposalStructuredPayload;
  referentSnapshot: LeoActionProposalReferentSnapshot;
  /** 24 hours default. */
  expiresAt?: string;
};

export type LeoCreateGovernedActionProposalResult = {
  ok: true;
  proposal: LeoActionProposal;
} | { ok: false; error: string };

function computeExecutionClaimKey(proposalFingerprint: string): string {
  // Stable across retries; unique in DB via constraint.
  return createHash("sha256").update(`leo17a_exec:${proposalFingerprint}`).digest("hex");
}

export async function leoCreateGovernedActionProposal(
  input: LeoCreateGovernedActionProposalInput,
): Promise<LeoCreateGovernedActionProposalResult> {
  const access = await requireLeoOwnerAccess();
  const ownerActorId = access.admin.authUserId?.trim();
  if (!ownerActorId) return { ok: false, error: "missing_owner_actor_id" };

  if (!(LEO_ACTION_PROPOSAL_FAMILIES as readonly string[]).includes(input.actionFamily)) {
    return { ok: false, error: "invalid_action_family" };
  }

  const governanceLevel: LeoActionProposalGovernanceLevel = "RED";
  const now = Date.now();
  const expiresAt =
    input.expiresAt ??
    new Date(now + 24 * 60 * 60 * 1000).toISOString();

  // Fingerprint must represent the exact consequential action identity being approved.
  const proposalFingerprint = computeLeoActionProposalFingerprint({
    ownerActorId,
    actionFamily: input.actionFamily,
    normalizedTarget: input.normalizedTarget,
    structuredPayload: input.structuredPayload,
    referentSnapshot: input.referentSnapshot,
  });

  const executionClaimKey = computeExecutionClaimKey(proposalFingerprint);

  const created = await createLeoActionProposal({
    ownerActorId,
    sourceSessionId: input.sourceSessionId ?? null,
    sourceTurnId: input.sourceTurnId ?? null,
    actionFamily: input.actionFamily,
    governanceLevel,
    normalizedTarget: input.normalizedTarget,
    structuredPayload: input.structuredPayload,
    referentSnapshot: input.referentSnapshot,
    proposalFingerprint,
    executionClaimKey,
    expiresAt,
  });
  if (!created.ok) return { ok: false, error: created.error };

  // Always create the durable receipt request at creation time.
  const createdReceipt = await leoCreateToolReceiptRequest({
    correlationId: `leo-proposal:${created.proposal.proposalId}`,
    toolId: "leo.action_proposal",
    actionType: input.actionFamily,
    governanceLevel,
    requestedPayloadSummary: `Proposal ${input.actionFamily} for approval (not executed yet).`.slice(0, 500),
    preparationRef: created.proposal.proposalId,
    sourceRefs: [],
    sessionId: input.sourceSessionId ?? null,
    turnId: input.sourceTurnId ?? null,
  });

  if (!createdReceipt.ok) {
    // Receipt bridge is best-effort: the proposal remains valid for later operations.
    return { ok: true, proposal: created.proposal };
  }

  await transitionLeoActionProposalState(created.proposal.proposalId, ownerActorId, {
    linked_receipt_id: createdReceipt.receipt.id,
  } as any);

  const readiness = evaluateProposalReadiness({
    actionFamily: input.actionFamily,
    structuredPayload: input.structuredPayload,
  });

  if (!readiness.displayable) {
    return { ok: true, proposal: created.proposal };
  }

  if (readiness.awaitingApproval) {
    // PREPARED → AWAITING_APPROVAL (owner approval required).
    await leoMarkReceiptPrepared(createdReceipt.receipt.id, created.proposal.proposalId);
    await leoMarkReceiptAwaitingApproval(createdReceipt.receipt.id);

    const transitioned = await transitionLeoActionProposalState(created.proposal.proposalId, ownerActorId, {
      proposal_state: "AWAITING_APPROVAL",
      approval_state: "PENDING",
    } as any);
    if (transitioned.ok) return { ok: true, proposal: transitioned.proposal };
    return { ok: true, proposal: created.proposal };
  }

  // PREPARED (displayable) but not all target fields are proven.
  await leoMarkReceiptPrepared(createdReceipt.receipt.id, created.proposal.proposalId);
  const transitioned = await transitionLeoActionProposalState(created.proposal.proposalId, ownerActorId, {
    proposal_state: "PREPARED",
    approval_state: "NONE",
  } as any);
  if (transitioned.ok) return { ok: true, proposal: transitioned.proposal };
  return { ok: true, proposal: created.proposal };
}

export type LeoApproveGovernedActionProposalInput = {
  proposalId: string;
  expectedFingerprint: string;
};

export async function leoApproveGovernedActionProposal(
  input: LeoApproveGovernedActionProposalInput,
): Promise<{ ok: true; proposal: LeoActionProposal } | { ok: false; error: string }> {
  const access = await requireLeoOwnerAccess();
  const ownerActorId = access.admin.authUserId?.trim();
  if (!ownerActorId) return { ok: false, error: "missing_owner_actor_id" };

  const approved = await approveLeoActionProposalAtomic({
    proposalId: input.proposalId,
    ownerActorId,
    expectedFingerprint: input.expectedFingerprint,
  });
  if (!approved.ok) return { ok: false, error: approved.error };

  if (approved.proposal.linkedReceiptId) {
    // Approval authorizes receipt, but does NOT execute provider side effects.
    await leoMarkReceiptAuthorized(approved.proposal.linkedReceiptId);
  }

  return { ok: true, proposal: approved.proposal };
}

export async function leoCancelGovernedActionProposal(
  input: { proposalId: string },
): Promise<{ ok: true; proposal: LeoActionProposal } | { ok: false; error: string }> {
  const access = await requireLeoOwnerAccess();
  const ownerActorId = access.admin.authUserId?.trim();
  if (!ownerActorId) return { ok: false, error: "missing_owner_actor_id" };

  const cancelled = await cancelLeoActionProposal(input.proposalId, ownerActorId);
  if (!cancelled.ok) return { ok: false, error: cancelled.error };

  if (cancelled.proposal.linkedReceiptId) {
    await leoMarkReceiptCancelled(cancelled.proposal.linkedReceiptId);
  }

  return { ok: true, proposal: cancelled.proposal };
}

export async function leoClaimGovernedActionProposalExecution(input: {
  proposalId: string;
}): Promise<{ ok: true; proposal: LeoActionProposal } | { ok: false; error: string }> {
  const access = await requireLeoOwnerAccess();
  const ownerActorId = access.admin.authUserId?.trim();
  if (!ownerActorId) return { ok: false, error: "missing_owner_actor_id" };

  const claimed = await claimLeoActionProposalExecutionAtomic({
    proposalId: input.proposalId,
    ownerActorId,
  });
  if (!claimed.ok) return { ok: false, error: claimed.error };

  return { ok: true, proposal: claimed.proposal };
}

export async function leoGetGovernedActionProposalForOwner(input: {
  proposalId: string;
}): Promise<{ ok: true; proposal: LeoActionProposal } | { ok: false; error: string }> {
  const access = await requireLeoOwnerAccess();
  const ownerActorId = access.admin.authUserId?.trim();
  if (!ownerActorId) return { ok: false, error: "missing_owner_actor_id" };
  const proposal = await getLeoActionProposalForOwner(input.proposalId, ownerActorId);
  if (!proposal) return { ok: false, error: "not_found" };
  return { ok: true, proposal };
}

/**
 * LEO-21B — Owner cockpit list from canonical leo_action_proposals only.
 */
export async function leoListGovernedActionProposalCardsForOwner(input?: {
  limit?: number;
}): Promise<
  | { ok: true; cards: LeoGovernedActionProposalCard[] }
  | { ok: false; error: string }
> {
  const access = await requireLeoOwnerAccess();
  const ownerActorId = access.admin.authUserId?.trim();
  if (!ownerActorId) return { ok: false, error: "missing_owner_actor_id" };
  const proposals = await listLeoActionProposalsForOwner(ownerActorId, input?.limit ?? 40);
  const cards = sortLeoGovernedActionCards(
    proposals.map((p) => mapLeoActionProposalToOwnerCard(p)),
  );
  return { ok: true, cards };
}

/**
 * Future provider path: provider mutation succeeded → persist EXECUTED truth
 * and move receipt to EXECUTED (receipt verification remains separate).
 */
export async function leoMarkGovernedActionProposalExecuted(input: {
  proposalId: string;
}): Promise<{ ok: true; proposal: LeoActionProposal } | { ok: false; error: string }> {
  const access = await requireLeoOwnerAccess();
  const ownerActorId = access.admin.authUserId?.trim();
  if (!ownerActorId) return { ok: false, error: "missing_owner_actor_id" };

  const executed = await markLeoActionProposalExecuted({
    proposalId: input.proposalId,
    ownerActorId,
  });
  if (!executed.ok) return { ok: false, error: executed.error };

  if (executed.proposal.linkedReceiptId) {
    await leoMarkReceiptExecuted(executed.proposal.linkedReceiptId);
  }

  return { ok: true, proposal: executed.proposal };
}

/**
 * Future provider path: read-back verified → persist VERIFIED truth
 * and move receipt to VERIFIED.
 */
export async function leoMarkGovernedActionProposalVerified(input: {
  proposalId: string;
}): Promise<{ ok: true; proposal: LeoActionProposal } | { ok: false; error: string }> {
  const access = await requireLeoOwnerAccess();
  const ownerActorId = access.admin.authUserId?.trim();
  if (!ownerActorId) return { ok: false, error: "missing_owner_actor_id" };

  const verified = await markLeoActionProposalVerified({
    proposalId: input.proposalId,
    ownerActorId,
  });
  if (!verified.ok) return { ok: false, error: verified.error };

  if (verified.proposal.linkedReceiptId) {
    await leoMarkReceiptVerified(verified.proposal.linkedReceiptId);
  }

  return { ok: true, proposal: verified.proposal };
}

/**
 * Future provider path: provider mutation/verify failed → persist FAILED truth
 * and move receipt to FAILED.
 */
export async function leoMarkGovernedActionProposalFailed(input: {
  proposalId: string;
  safeErrorClass?: string | null;
}): Promise<{ ok: true; proposal: LeoActionProposal } | { ok: false; error: string }> {
  const access = await requireLeoOwnerAccess();
  const ownerActorId = access.admin.authUserId?.trim();
  if (!ownerActorId) return { ok: false, error: "missing_owner_actor_id" };

  const failed = await markLeoActionProposalFailed({
    proposalId: input.proposalId,
    ownerActorId,
  });
  if (!failed.ok) return { ok: false, error: failed.error };

  if (failed.proposal.linkedReceiptId) {
    await leoMarkReceiptFailed(failed.proposal.linkedReceiptId, input.safeErrorClass ?? null);
  }

  return { ok: true, proposal: failed.proposal };
}

/**
 * Expire proposals that have passed expires_at.
 * Intended for a future cron/background job; currently not used by this gate.
 */
export async function leoExpireGovernedActionProposalsForOwner(): Promise<void> {
  const access = await requireLeoOwnerAccess();
  const ownerActorId = access.admin.authUserId?.trim();
  if (!ownerActorId) return;
  await expireLeoActionProposals({ ownerActorId });
}

