/**
 * Program 7 — Business Outcomes constants.
 * Mirrors the enum/check conventions from Programs 4–6.
 */

export const BUSINESS_OUTCOMES_FLAG_KEY = "business_outcomes";

export const OUTCOME_RESULTS: readonly string[] = [
  "improved", "unchanged", "declined", "inconclusive",
];

export const OUTCOME_CONFIDENCE_LEVELS: readonly string[] = [
  "low", "medium", "high", "insufficient_evidence",
];

export const OUTCOME_CAUSATION_CLAIMS: readonly string[] = [
  "none", "possible", "supported",
];

export const OUTCOME_REVIEW_STATUSES: readonly string[] = [
  "pending", "reviewed", "skipped",
];

export const EVIDENCE_TYPES: readonly string[] = [
  "before_evidence", "after_evidence", "measurement_evidence",
  "owner_provided_evidence", "staff_observed_evidence", "system_derived_evidence",
];

export const EVIDENCE_SOURCE_CLASSES: readonly string[] = [
  "observed_fact", "owner_provided_fact", "staff_observation",
  "system_derived_result", "ai_inference", "unknown", "contradiction",
];

export const EVIDENCE_VISIBILITY: readonly string[] = [
  "owner_and_staff", "staff_only",
];

export const EVIDENCE_SENSITIVITY: readonly string[] = [
  "standard", "sensitive",
];

export const REFLECTION_TYPES: readonly string[] = [
  "owner_reflection", "staff_reflection", "lesson_learned", "next_adjustment",
];

export const REFLECTION_ACTOR_TYPES: readonly string[] = [
  "staff", "owner",
];

export const MEASUREMENT_SOURCES: readonly string[] = [
  "manual_entry", "system_derived", "staff_observation", "owner_reported", "external_source",
];
