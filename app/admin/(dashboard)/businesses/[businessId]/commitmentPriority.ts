/**
 * Gate 6 — pure commitment prioritization for the Commitments section. No DB, no UI.
 * Buckets an already-loaded commitment into one visual priority group so staff can answer
 * "what did we promise, who owns it, and when is it due?" without reading every row in order.
 */

export type CommitmentPriorityBucket = "overdue" | "blocked" | "due_soon" | "open" | "history";

export const COMMITMENT_PRIORITY_ORDER: readonly CommitmentPriorityBucket[] = [
  "overdue",
  "blocked",
  "due_soon",
  "open",
  "history",
];

export const COMMITMENT_PRIORITY_LABEL: Record<CommitmentPriorityBucket, string> = {
  overdue: "Overdue",
  blocked: "Blocked",
  due_soon: "Due soon",
  open: "Open",
  history: "Completed / history",
};

const DUE_SOON_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export function commitmentPriorityBucket(
  commitment: { status: string; dueAt: string | null },
  nowMs: number,
): CommitmentPriorityBucket {
  if (commitment.status === "completed" || commitment.status === "released") return "history";

  const dueMs = commitment.dueAt ? new Date(commitment.dueAt).getTime() : null;
  if (dueMs !== null && dueMs < nowMs) return "overdue";
  if (commitment.status === "blocked") return "blocked";
  if (dueMs !== null && dueMs - nowMs <= DUE_SOON_WINDOW_MS) return "due_soon";
  return "open";
}
