/**
 * LEO-14.1 / LEO-14.5 attention acknowledgement service.
 * ACK / DISMISS / SNOOZE never mutate source attention/email/calendar truth.
 * SNOOZED is active only while now < snooze_until.
 * LEO-14.5: internal allowlisted execution with durable receipt + read-back verify.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import {
  clearLeoAttentionAck,
  getLeoAttentionAckForSource,
  listLeoAttentionAcksForOwner,
  upsertLeoAttentionAck,
  type LeoAckListReadResult,
} from "@/app/leo/_lib/leoAttentionAckRepository";
import {
  isLeoInternalAttentionActionType,
  type LeoInternalAttentionActionType,
} from "@/app/leo/_lib/leoAttentionRuntime";
import { leoGovernanceForExecutiveAction } from "@/app/leo/_lib/leoExecutiveActions";
import { isLeoAttentionAckSuppressing } from "@/app/leo/_lib/leoPersistenceSemantics";
import {
  leoCreateToolReceiptRequest,
  leoMarkReceiptAuthorized,
  leoMarkReceiptExecuted,
  leoMarkReceiptFailed,
  leoMarkReceiptNotExecuted,
  leoMarkReceiptVerified,
} from "@/app/leo/_lib/leoToolReceiptService";
import type {
  LeoAttentionAck,
  LeoAttentionAckDisposition,
  LeoDurableToolReceipt,
} from "@/app/leo/_lib/leoTypes";

export { isLeoAttentionAckSuppressing } from "@/app/leo/_lib/leoPersistenceSemantics";
export type { LeoAckListReadResult } from "@/app/leo/_lib/leoAttentionAckRepository";

async function requireOwnerId(): Promise<string> {
  const access = await requireLeoOwnerAccess();
  const id = access.admin.authUserId?.trim();
  if (!id) throw new Error("LEO access denied: missing_auth_user_id");
  return id;
}

export async function leoAcknowledgeAttentionSource(input: {
  sourceKind: string;
  sourceKey: string;
  note?: string | null;
  expiresAt?: string | null;
}): Promise<{ ok: true; ack: LeoAttentionAck } | { ok: false; error: string }> {
  const ownerAuthUserId = await requireOwnerId();
  return upsertLeoAttentionAck({
    ownerAuthUserId,
    sourceKind: input.sourceKind,
    sourceKey: input.sourceKey,
    disposition: "ACKNOWLEDGED",
    note: input.note,
    expiresAt: input.expiresAt,
  });
}

export async function leoDismissAttentionSource(input: {
  sourceKind: string;
  sourceKey: string;
  note?: string | null;
}): Promise<{ ok: true; ack: LeoAttentionAck } | { ok: false; error: string }> {
  const ownerAuthUserId = await requireOwnerId();
  return upsertLeoAttentionAck({
    ownerAuthUserId,
    sourceKind: input.sourceKind,
    sourceKey: input.sourceKey,
    disposition: "DISMISSED",
    note: input.note,
  });
}

export async function leoSnoozeAttentionSource(input: {
  sourceKind: string;
  sourceKey: string;
  snoozeUntil: string;
  note?: string | null;
}): Promise<{ ok: true; ack: LeoAttentionAck } | { ok: false; error: string }> {
  const ownerAuthUserId = await requireOwnerId();
  const until = Date.parse(input.snoozeUntil);
  if (Number.isNaN(until)) return { ok: false, error: "invalid_snooze_until" };
  return upsertLeoAttentionAck({
    ownerAuthUserId,
    sourceKind: input.sourceKind,
    sourceKey: input.sourceKey,
    disposition: "SNOOZED",
    snoozeUntil: input.snoozeUntil,
    note: input.note,
  });
}

export async function leoGetAttentionDisposition(
  sourceKind: string,
  sourceKey: string,
  nowMs = Date.now(),
): Promise<{
  ack: LeoAttentionAck | null;
  disposition: LeoAttentionAckDisposition | null;
  suppressing: boolean;
}> {
  const ownerAuthUserId = await requireOwnerId();
  const ack = await getLeoAttentionAckForSource(ownerAuthUserId, sourceKind, sourceKey);
  const suppressing = isLeoAttentionAckSuppressing(ack, nowMs);
  if (!ack) return { ack: null, disposition: null, suppressing: false };
  if (ack.disposition === "SNOOZED" && !suppressing) {
    return { ack, disposition: "SNOOZED", suppressing: false };
  }
  return { ack, disposition: ack.disposition, suppressing };
}

export async function leoListActiveAttentionAcks(
  nowMs = Date.now(),
): Promise<{
  availability: LeoAckListReadResult["availability"];
  acks: LeoAttentionAck[];
  errorCode: string | null;
}> {
  const ownerAuthUserId = await requireOwnerId();
  const listed = await listLeoAttentionAcksForOwner(ownerAuthUserId);
  if (listed.availability === "UNAVAILABLE") {
    return {
      availability: "UNAVAILABLE",
      acks: [],
      errorCode: listed.errorCode,
    };
  }
  return {
    availability: listed.availability,
    acks: listed.acks.filter((a) => isLeoAttentionAckSuppressing(a, nowMs)),
    errorCode: listed.errorCode,
  };
}

/** Bounded bulk list of all owner acks (not only actively suppressing). */
export async function leoListOwnerAttentionAcks(
  limit?: number,
): Promise<LeoAckListReadResult> {
  const ownerAuthUserId = await requireOwnerId();
  return listLeoAttentionAcksForOwner(ownerAuthUserId, limit);
}

export async function leoClearAttentionAck(
  sourceKind: string,
  sourceKey: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ownerAuthUserId = await requireOwnerId();
  return clearLeoAttentionAck(ownerAuthUserId, sourceKind, sourceKey);
}

export type LeoInternalAttentionActionResult =
  | {
      ok: true;
      actionType: LeoInternalAttentionActionType;
      ack: LeoAttentionAck;
      receipt: LeoDurableToolReceipt;
    }
  | { ok: false; error: string; receipt?: LeoDurableToolReceipt | null };

/**
 * Exact allowlist executor for ACKNOWLEDGE / DISMISS / REMIND_LATER.
 * Creates durable receipt, mutates ACK metadata only, verifies by read-back.
 */
export async function leoExecuteInternalAttentionAction(input: {
  actionType: string;
  sourceKind: string;
  sourceKey: string;
  snoozeUntil?: string | null;
  note?: string | null;
  nowMs?: number;
}): Promise<LeoInternalAttentionActionResult> {
  if (!isLeoInternalAttentionActionType(input.actionType)) {
    return { ok: false, error: "action_not_allowlisted" };
  }
  const actionType = input.actionType;
  const sourceKind = input.sourceKind.trim();
  const sourceKey = input.sourceKey.trim();
  if (!sourceKind || !sourceKey) return { ok: false, error: "source_required" };

  const governanceLevel = leoGovernanceForExecutiveAction(actionType);
  const correlationId = `leo-internal:${actionType}:${sourceKind}:${sourceKey}:${input.nowMs ?? Date.now()}`;

  const created = await leoCreateToolReceiptRequest({
    correlationId,
    toolId: "leo.attention.read",
    actionType,
    governanceLevel,
    requestedPayloadSummary: `${actionType} ${sourceKind}/${sourceKey}`.slice(0, 500),
    sourceRefs: [{ system: "LEO", kind: sourceKind, id: sourceKey }],
  });
  if (!created.ok) return { ok: false, error: created.error };

  let receipt = created.receipt;
  const auth = await leoMarkReceiptAuthorized(receipt.id);
  if (auth.ok) receipt = auth.receipt;

  let ackResult: { ok: true; ack: LeoAttentionAck } | { ok: false; error: string };
  if (actionType === "ACKNOWLEDGE") {
    ackResult = await leoAcknowledgeAttentionSource({
      sourceKind,
      sourceKey,
      note: input.note,
    });
  } else if (actionType === "DISMISS") {
    ackResult = await leoDismissAttentionSource({
      sourceKind,
      sourceKey,
      note: input.note,
    });
  } else {
    if (!input.snoozeUntil) {
      await leoMarkReceiptNotExecuted(receipt.id, "missing_snooze_until");
      return { ok: false, error: "snooze_until_required", receipt };
    }
    ackResult = await leoSnoozeAttentionSource({
      sourceKind,
      sourceKey,
      snoozeUntil: input.snoozeUntil,
      note: input.note,
    });
  }

  if (!ackResult.ok) {
    const failed = await leoMarkReceiptFailed(receipt.id, ackResult.error);
    return {
      ok: false,
      error: ackResult.error,
      receipt: failed.ok ? failed.receipt : receipt,
    };
  }

  const executed = await leoMarkReceiptExecuted(receipt.id);
  if (!executed.ok) {
    return { ok: false, error: executed.error, receipt };
  }
  receipt = executed.receipt;

  const nowMs = input.nowMs ?? Date.now();
  const readBack = await leoGetAttentionDisposition(sourceKind, sourceKey, nowMs);
  const expectedDisposition =
    actionType === "ACKNOWLEDGE"
      ? "ACKNOWLEDGED"
      : actionType === "DISMISS"
        ? "DISMISSED"
        : "SNOOZED";
  const verifiedOk =
    readBack.ack != null &&
    readBack.disposition === expectedDisposition &&
    readBack.suppressing === true;

  if (!verifiedOk) {
    const failed = await leoMarkReceiptFailed(receipt.id, "readback_mismatch");
    return {
      ok: false,
      error: "verification_failed",
      receipt: failed.ok ? failed.receipt : receipt,
    };
  }

  const verified = await leoMarkReceiptVerified(receipt.id);
  if (!verified.ok) {
    return { ok: false, error: verified.error, receipt };
  }

  return {
    ok: true,
    actionType,
    ack: ackResult.ack,
    receipt: verified.receipt,
  };
}
