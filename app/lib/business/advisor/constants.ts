/**
 * Program 7 — Proactive Advisor constants.
 * Advisor is NOT a second recommendation engine.
 * It detects reviewable SIGNALS from existing Program 1–6 truth.
 */

export const BUSINESS_PROACTIVE_ADVISOR_FLAG_KEY = "business_proactive_advisor";

export const ADVISOR_SIGNAL_TYPES: readonly string[] = [
  "COMMITMENT_DUE",
  "COMMITMENT_BLOCKED",
  "POSTPONED_RECOMMENDATION_REVIEW_DUE",
  "CREATIVE_AWAITING_REVIEW",
  "PROPOSAL_AWAITING_OWNER",
  "UNRESOLVED_CONTRADICTION",
  "STALE_CRITICAL_TRUTH",
  "OUTCOME_REVIEW_DUE",
  "CAPACITY_STRETCHED",
];

export const ADVISOR_SIGNAL_SEVERITIES: readonly string[] = [
  "information", "opportunity", "priority", "blocked",
];

export const ADVISOR_SIGNAL_STATUSES: readonly string[] = [
  "active", "acknowledged", "resolved", "expired", "dismissed",
];

export const ADVISOR_SOURCE_TYPES: readonly string[] = [
  "commitment", "recommendation", "creative_job", "proposal",
  "contradiction", "fact", "outcome", "capacity",
];

export const ADVISOR_EVENT_TYPES: readonly string[] = [
  "detected", "acknowledged", "resolved", "expired", "dismissed", "re_detected",
];
