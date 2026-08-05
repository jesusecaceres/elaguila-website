/**
 * Package C Build 1 (C2) — pure event-ledger claim policy (no server imports; behaviorally
 * testable). The DB conditional UPDATE in stripeEventLedger.ts enforces the same rule
 * atomically — this module is the single statement of that rule.
 */

export const STALE_PROCESSING_MINUTES = 10;

/**
 * Claim decision for a DUPLICATE delivery, given the existing ledger row's state.
 *   reclaim         — retryable/stale: this delivery may process the event.
 *   skip_done       — completed/ignored/terminal: respond 200, never reprocess.
 *   skip_processing — a fresh claim is actively processing elsewhere: respond 200.
 */
export function decideDuplicateClaim(
  existing: { status: string; processing_started_at: string | null },
  nowMs: number,
): "reclaim" | "skip_done" | "skip_processing" {
  if (existing.status === "received" || existing.status === "failed_retryable") return "reclaim";
  if (existing.status === "processing") {
    const started = existing.processing_started_at ? Date.parse(existing.processing_started_at) : NaN;
    if (!Number.isFinite(started)) return "reclaim";
    return nowMs - started > STALE_PROCESSING_MINUTES * 60_000 ? "reclaim" : "skip_processing";
  }
  // completed | ignored | failed_terminal
  return "skip_done";
}
