/**
 * Program 7 — Proactive Advisor domain types.
 * The Advisor detects signals from existing Program 1–6 truth — it never
 * creates recommendations, sends messages, charges, or mutates business facts.
 * Signals are deterministic, reviewable, and never auto-acted upon.
 */

export type AdvisorSignalType =
  | "COMMITMENT_DUE"
  | "COMMITMENT_BLOCKED"
  | "POSTPONED_RECOMMENDATION_REVIEW_DUE"
  | "CREATIVE_AWAITING_REVIEW"
  | "PROPOSAL_AWAITING_OWNER"
  | "UNRESOLVED_CONTRADICTION"
  | "STALE_CRITICAL_TRUTH"
  | "OUTCOME_REVIEW_DUE"
  | "CAPACITY_STRETCHED";

export type AdvisorSignalSeverity =
  | "information"
  | "opportunity"
  | "priority"
  | "blocked";

export type AdvisorSignalStatus =
  | "active"
  | "acknowledged"
  | "resolved"
  | "expired"
  | "dismissed";

export type AdvisorSourceType =
  | "commitment"
  | "recommendation"
  | "creative_job"
  | "proposal"
  | "contradiction"
  | "fact"
  | "outcome"
  | "capacity";

export type AdvisorEventType =
  | "detected"
  | "acknowledged"
  | "resolved"
  | "expired"
  | "dismissed"
  | "re_detected";

export type AdvisorActor =
  | { type: "staff"; rosterId: string; authUserId: string; email: string; role: string }
  | { type: "owner"; authUserId: string; email: string };

export type BusinessAdvisorSignal = {
  id: string;
  businessId: string;
  signalType: AdvisorSignalType;
  severity: AdvisorSignalSeverity;
  status: AdvisorSignalStatus;
  sourceType: AdvisorSourceType;
  sourceReferenceId: string | null;
  titleEs: string;
  titleEn: string;
  explanationEs: string;
  explanationEn: string;
  detectedAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  expiresAt: string | null;
  createdActorType: "staff" | "owner" | "system";
  createdByRosterId: string | null;
  createdByAuthUserId: string | null;
  createdByEmail: string | null;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessAdvisorSignalEvent = {
  id: string;
  businessId: string;
  signalId: string;
  eventType: AdvisorEventType;
  eventActorType: "staff" | "owner" | "system";
  eventByRosterId: string | null;
  eventByAuthUserId: string | null;
  eventByEmail: string | null;
  eventByRole: string;
  eventNote: string | null;
  createdAt: string;
};
