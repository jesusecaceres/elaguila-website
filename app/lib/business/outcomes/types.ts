/**
 * Program 7 — Business Outcomes domain types.
 * Mirrors the type conventions from Programs 4–6 exactly.
 * Every outcome references the canonical public.businesses.id.
 * Never fabricates causation, ROI, or guaranteed results.
 */

export type OutcomeResult = "improved" | "unchanged" | "declined" | "inconclusive";

export type OutcomeConfidence = "low" | "medium" | "high" | "insufficient_evidence";

export type OutcomeCausationClaim = "none" | "possible" | "supported";

export type OutcomeReviewStatus = "pending" | "reviewed" | "skipped";

export type OutcomeEvidenceType =
  | "before_evidence"
  | "after_evidence"
  | "measurement_evidence"
  | "owner_provided_evidence"
  | "staff_observed_evidence"
  | "system_derived_evidence";

export type OutcomeEvidenceSourceClass =
  | "observed_fact"
  | "owner_provided_fact"
  | "staff_observation"
  | "system_derived_result"
  | "ai_inference"
  | "unknown"
  | "contradiction";

export type OutcomeEvidenceVisibility = "owner_and_staff" | "staff_only";

export type OutcomeEvidenceSensitivity = "standard" | "sensitive";

export type OutcomeReflectionType =
  | "owner_reflection"
  | "staff_reflection"
  | "lesson_learned"
  | "next_adjustment";

export type MeasurementSource =
  | "manual_entry"
  | "system_derived"
  | "staff_observation"
  | "owner_reported"
  | "external_source";

export type OutcomeActor =
  | { type: "staff"; rosterId: string; authUserId: string; email: string; role: string }
  | { type: "owner"; authUserId: string; email: string };

export type BusinessOutcome = {
  id: string;
  businessId: string;
  recommendationId: string | null;
  commitmentId: string | null;
  creativeJobId: string | null;
  metricKey: string;
  metricLabelEs: string;
  metricLabelEn: string;
  baselineValue: string | null;
  baselineUnit: string | null;
  baselineObservedAt: string | null;
  measuredValue: string | null;
  measuredUnit: string | null;
  measurementSource: MeasurementSource;
  measuredAt: string | null;
  result: OutcomeResult;
  confidence: OutcomeConfidence;
  causationClaim: OutcomeCausationClaim;
  reviewStatus: OutcomeReviewStatus;
  nextReviewAt: string | null;
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  reviewedActorType: "staff" | "owner" | null;
  reviewedByRosterId: string | null;
  reviewedByAuthUserId: string | null;
  reviewedByEmail: string | null;
  reviewedByRole: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessOutcomeEvidence = {
  id: string;
  businessId: string;
  outcomeId: string;
  evidenceType: OutcomeEvidenceType;
  sourceClass: OutcomeEvidenceSourceClass;
  sourceReference: string;
  sourceUrl: string | null;
  observedAt: string;
  structuredValue: Record<string, unknown> | null;
  textExcerpt: string | null;
  visibility: OutcomeEvidenceVisibility;
  sensitivity: OutcomeEvidenceSensitivity;
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  createdAt: string;
};

export type BusinessOutcomeReflection = {
  id: string;
  businessId: string;
  outcomeId: string;
  actorType: "staff" | "owner";
  reflectionType: OutcomeReflectionType;
  text: string;
  capabilityTransferred: boolean;
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  createdAt: string;
};
