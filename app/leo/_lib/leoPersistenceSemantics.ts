/**
 * LEO-14.1 pure persistence semantics — fixture-safe (no server-only).
 */
import type {
  LeoAttentionAck,
  LeoCommitment,
  LeoCommitmentDerivedDueState,
} from "@/app/leo/_lib/leoTypes";

export const LEO_TURN_RETENTION_DAYS = 60;
export const LEO_TURN_TEXT_MAX = 4000;

const DUE_SOON_MS = 48 * 60 * 60 * 1000;

/** Derived only — never a persisted canonical status. */
export function deriveLeoCommitmentDueState(
  commitment: Pick<LeoCommitment, "status" | "dueAt">,
  nowMs = Date.now(),
): LeoCommitmentDerivedDueState {
  if (commitment.status !== "OPEN" || !commitment.dueAt) return "NONE";
  const due = Date.parse(commitment.dueAt);
  if (Number.isNaN(due)) return "NONE";
  if (due < nowMs) return "OVERDUE";
  if (due - nowMs <= DUE_SOON_MS) return "DUE_SOON";
  return "NONE";
}

/** Whether an ack currently suppresses the source from "needs you" surfaces. */
export function isLeoAttentionAckSuppressing(
  ack: LeoAttentionAck | null,
  nowMs = Date.now(),
): boolean {
  if (!ack) return false;
  if (ack.expiresAt) {
    const exp = Date.parse(ack.expiresAt);
    if (!Number.isNaN(exp) && exp < nowMs) return false;
  }
  if (ack.disposition === "ACKNOWLEDGED" || ack.disposition === "DISMISSED") return true;
  if (ack.disposition === "SNOOZED") {
    if (!ack.snoozeUntil) return false;
    const until = Date.parse(ack.snoozeUntil);
    if (Number.isNaN(until)) return false;
    return until > nowMs;
  }
  return false;
}
