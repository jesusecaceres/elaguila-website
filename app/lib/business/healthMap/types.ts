/**
 * Gate BCO-6A — Explainable Business Health Map types. Mirrors the Gate BCO-5A Living Business
 * Book type conventions exactly. The Health Map never duplicates business facts into a second
 * permanent profile — every type here either points back at Living Book records (fact/evidence/
 * unknown/contradiction ids) or holds a derived, explainable conclusion computed from them.
 */

export type HealthDimensionKey =
  | "business_foundation"
  | "customer_clarity"
  | "offer_and_value"
  | "operations_and_capacity"
  | "visibility_and_discovery"
  | "communication_and_follow_up"
  | "owner_goals_and_sustainability";

export type HealthDimensionStatus = "strong" | "stable" | "needs_attention" | "insufficient_information" | "blocked_by_contradiction";

export type HealthConfidence = "low" | "medium" | "high";

export type HealthEvidenceStrength = "none" | "low" | "medium" | "high";

export type HealthFreshness = "fresh" | "aging" | "stale" | "unknown";

export type HealthRunTriggerType = "staff_requested" | "owner_requested" | "discovery_completed" | "business_record_changed" | "system_refresh";

export type HealthRunStatus = "in_progress" | "completed" | "failed";

export type HealthFindingType = "strength" | "risk" | "gap" | "opportunity" | "unknown" | "contradiction";

export type HealthFindingSeverity = "info" | "low" | "medium" | "high";

export type HealthFindingVisibility = "owner_and_staff" | "staff_only";

export type HealthFindingStatus = "active" | "archived";

export type RecommendationReadinessStatus =
  | "ready"
  | "needs_more_information"
  | "resolve_contradictions_first"
  | "capacity_risk"
  | "human_review_required";

/** Same dual-actor shape proven throughout Gate BCO-5A — never a bare string. */
export type HealthMapActor =
  | { type: "staff"; rosterId: string; authUserId: string; email: string; role: string }
  | { type: "owner"; authUserId: string; email: string };

export type BusinessHealthAssessmentRun = {
  id: string;
  businessId: string;
  calculationVersion: string;
  triggerType: HealthRunTriggerType;
  status: HealthRunStatus;
  startedAt: string;
  completedAt: string | null;
  sourceDataCutoffAt: string | null;
  totalDimensionsAssessed: number;
  strongCount: number;
  stableCount: number;
  needsAttentionCount: number;
  insufficientInformationCount: number;
  contradictionBlockedCount: number;
  summaryEs: string | null;
  summaryEn: string | null;
  createdActorType: "staff" | "owner";
  createdByEmail: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessHealthDimensionResult = {
  id: string;
  assessmentRunId: string;
  businessId: string;
  dimensionKey: HealthDimensionKey;
  status: HealthDimensionStatus;
  confidence: HealthConfidence;
  evidenceStrength: HealthEvidenceStrength;
  freshness: HealthFreshness;
  supportingFactIds: string[];
  supportingEvidenceIds: string[];
  relatedUnknownIds: string[];
  relatedContradictionIds: string[];
  explanationEs: string;
  explanationEn: string;
  limitationsEs: string | null;
  limitationsEn: string | null;
  calculatedAt: string;
  calculationVersion: string;
  createdAt: string;
};

export type BusinessHealthFinding = {
  id: string;
  assessmentRunId: string;
  dimensionResultId: string;
  businessId: string;
  findingType: HealthFindingType;
  severity: HealthFindingSeverity;
  titleEs: string;
  titleEn: string;
  explanationEs: string;
  explanationEn: string;
  supportingFactIds: string[];
  supportingEvidenceIds: string[];
  relatedUnknownIds: string[];
  relatedContradictionIds: string[];
  confidence: HealthConfidence;
  visibility: HealthFindingVisibility;
  status: HealthFindingStatus;
  createdAt: string;
};

export type BusinessRecommendationReadiness = {
  id: string;
  assessmentRunId: string;
  businessId: string;
  readinessStatus: RecommendationReadinessStatus;
  reasonEs: string;
  reasonEn: string;
  blockingDimensionKeys: HealthDimensionKey[];
  blockingUnknownIds: string[];
  blockingContradictionIds: string[];
  humanReviewRequired: boolean;
  humanReviewMarkedByEmail: string | null;
  humanReviewMarkedAt: string | null;
  humanReviewNote: string | null;
  calculationVersion: string;
  createdAt: string;
  updatedAt: string;
};

/** Full persisted output of one calculation run — what the engine returns and the repository writes atomically. */
export type HealthAssessmentResult = {
  run: BusinessHealthAssessmentRun;
  dimensionResults: BusinessHealthDimensionResult[];
  findings: BusinessHealthFinding[];
  readiness: BusinessRecommendationReadiness;
};
