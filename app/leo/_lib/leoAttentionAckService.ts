/**
 * LEO-14.1 attention acknowledgement service.
 * ACK / DISMISS / SNOOZE never mutate source attention/email/calendar truth.
 * SNOOZED is active only while now < snooze_until.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import {
  clearLeoAttentionAck,
  getLeoAttentionAckForSource,
  listLeoAttentionAcksForOwner,
  upsertLeoAttentionAck,
} from "@/app/leo/_lib/leoAttentionAckRepository";
import type { LeoAttentionAck, LeoAttentionAckDisposition } from "@/app/leo/_lib/leoTypes";
import { isLeoAttentionAckSuppressing } from "@/app/leo/_lib/leoPersistenceSemantics";

export { isLeoAttentionAckSuppressing } from "@/app/leo/_lib/leoPersistenceSemantics";

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
): Promise<LeoAttentionAck[]> {
  const ownerAuthUserId = await requireOwnerId();
  const all = await listLeoAttentionAcksForOwner(ownerAuthUserId);
  return all.filter((a) => isLeoAttentionAckSuppressing(a, nowMs));
}

export async function leoClearAttentionAck(
  sourceKind: string,
  sourceKey: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ownerAuthUserId = await requireOwnerId();
  return clearLeoAttentionAck(ownerAuthUserId, sourceKind, sourceKey);
}
