/**
 * Program 5 — Promise Keeper constants.
 */

export const PROMISE_KEEPER_FLAG_KEY = "business_promise_keeper";

export const COMMITMENT_STATUSES: readonly string[] = [
  "planned",
  "active",
  "blocked",
  "completed",
  "released",
];

export const RESPONSIBLE_PARTIES: readonly string[] = [
  "owner",
  "staff",
  "shared",
  "external",
];

export const CAPACITY_STATES: readonly string[] = [
  "normal",
  "stretched",
  "paused",
];

export const REVIEW_OUTCOMES: readonly string[] = [
  "continue",
  "modify",
  "delegate",
  "release",
];

export const COMMITMENT_EVENT_TYPES: readonly string[] = [
  "created",
  "started",
  "blocked",
  "help_requested",
  "due_date_changed",
  "reassigned",
  "completed",
  "released",
  "reviewed",
];

export const COMMITMENT_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  planned: ["active", "released"],
  active: ["blocked", "completed", "released"],
  blocked: ["active", "released"],
  completed: [],
  released: [],
};

export function isValidCommitmentStatusTransition(from: string, to: string): boolean {
  const allowed = COMMITMENT_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}
