/**
 * Program 5 — Promise Keeper pure logic. No DB, no UI.
 * Validates status transitions and capacity/blocker/release support.
 * No shame language — stretched capacity permits reduced scope, postpone, delegate, release.
 */
import { isValidCommitmentStatusTransition } from "./constants";
import type { CapacityState, CommitmentStatus, ReviewOutcome } from "./types";

export function canTransitionCommitmentStatus(from: CommitmentStatus, to: CommitmentStatus): boolean {
  return isValidCommitmentStatusTransition(from, to);
}

export function isCapacityStretched(capacityState: CapacityState): boolean {
  return capacityState === "stretched";
}

export function isCapacityPaused(capacityState: CapacityState): boolean {
  return capacityState === "paused";
}

export function permitsReducedScope(reviewOutcome: ReviewOutcome | null): boolean {
  return reviewOutcome === "modify" || reviewOutcome === "delegate" || reviewOutcome === "release";
}

export function permitsPostpone(reviewOutcome: ReviewOutcome | null): boolean {
  return reviewOutcome === "modify" || reviewOutcome === "delegate";
}

export function permitsDelegate(reviewOutcome: ReviewOutcome | null): boolean {
  return reviewOutcome === "delegate";
}

export function permitsRelease(reviewOutcome: ReviewOutcome | null): boolean {
  return reviewOutcome === "release";
}

export function isShameLanguage(text: string): boolean {
  const shameWords = ["overdue panic", "failure", "broken promise", "delinquent", "negligent"];
  const lower = text.toLowerCase();
  return shameWords.some((w) => lower.includes(w));
}
