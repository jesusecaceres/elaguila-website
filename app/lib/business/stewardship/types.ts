/**
 * TODAY-3 — Next Right Move + Stewardship Engine domain types. Mirrors the Gate BCO-5A/6A/DIY
 * Concierge type conventions exactly. This package never duplicates a business fact, a Health
 * Map conclusion, or a DIY action into a second permanent copy — every type here either points
 * back at Health Map / Living Book records (run/finding/fact ids) or holds a deterministic
 * recommendation instance derived from them.
 */
import type { HealthDimensionKey } from "../healthMap/types";

export type RecommendationStatus =
  | "draft"
  | "review_required"
  | "approved"
  | "shared_with_owner"
  | "accepted"
  | "declined"
  | "postponed"
  | "superseded"
  | "archived";

export type RecommendationVisibility = "owner_and_staff" | "staff_only";

export type RecommendationConfidence = "low" | "medium" | "high";

/** The permanent recommendation ladder — never "what can Leonix sell?" */
export type PrimaryIntervention =
  | "free_owner_action"
  | "education_guided_self_service"
  | "small_corrective_service"
  | "leonix_product_or_advertising"
  | "ongoing_managed_support"
  | "external_specialist_referral"
  | "no_action_yet";

export type ExpectedEffort = "minutes" | "under_1_hour" | "half_day" | "1_2_days" | "ongoing";

export type CostBand = "free" | "under_100" | "100_500" | "500_plus" | "unknown";

export type OwnerDecision = "accepted" | "declined" | "postponed";

/** Exactly six immutable tests, in the permanent doctrinal order. */
export type SixTestKey = "need" | "readiness" | "capacity" | "life_alignment" | "value" | "lion_code";

export const SIX_TEST_KEYS: readonly SixTestKey[] = ["need", "readiness", "capacity", "life_alignment", "value", "lion_code"];

export type SixTestResult = "pass" | "caution" | "fail" | "blocked";

export type OverrideSixTestEffect = "unchanged" | "requires_reapproval" | "test_result_noted";

export type LedgerEventType =
  | "recommendation_created"
  | "recommendation_approved"
  | "recommendation_shared"
  | "owner_accepted"
  | "owner_declined"
  | "owner_postponed"
  | "override_recorded"
  | "intentionally_not_recommended"
  | "taught_freely"
  | "sold_or_requested"
  | "external_referral"
  | "do_nothing_yet"
  | "review_due";

/** Same dual-actor shape proven throughout Gate BCO-5A/6A/DIY Concierge — never a bare string. */
export type StewardshipActor =
  | { type: "staff"; rosterId: string; authUserId: string; email: string; role: string }
  | { type: "owner"; authUserId: string; email: string };

/** Overrides require a real manager+ staff actor exclusively — never an owner. */
export type StewardshipStaffActor = Extract<StewardshipActor, { type: "staff" }>;

export type BusinessRecommendation = {
  id: string;
  businessId: string;
  sourceRunId: string;
  sourceFindingId: string | null;
  candidateKey: string;
  registryVersion: string;
  dimensionKey: HealthDimensionKey;
  status: RecommendationStatus;
  visibility: RecommendationVisibility;
  version: number;
  isCurrent: boolean;
  confidence: RecommendationConfidence;
  verifiedNeedEs: string;
  verifiedNeedEn: string;
  readinessExplanationEs: string;
  readinessExplanationEn: string;
  businessConsequenceEs: string;
  businessConsequenceEn: string;
  ownerGoalAlignmentEs: string;
  ownerGoalAlignmentEn: string;
  capacityImpactEs: string;
  capacityImpactEn: string;
  primaryIntervention: PrimaryIntervention;
  freeOptionEs: string | null;
  freeOptionEn: string | null;
  guidedOptionEs: string | null;
  guidedOptionEn: string | null;
  correctiveServiceOptionEs: string | null;
  correctiveServiceOptionEn: string | null;
  managedOptionEs: string | null;
  managedOptionEn: string | null;
  externalReferralOptionEs: string | null;
  externalReferralOptionEn: string | null;
  doNothingYetOptionEs: string | null;
  doNothingYetOptionEn: string | null;
  selectionReasonEs: string;
  selectionReasonEn: string;
  rejectedHigherCostReasonEs: string | null;
  rejectedHigherCostReasonEn: string | null;
  expectedEffort: ExpectedEffort;
  costBand: CostBand;
  successMetricEs: string;
  successMetricEn: string;
  reviewDate: string | null;
  supersedesRecommendationId: string | null;
  createdActorType: "staff" | "owner";
  createdByEmail: string;
  createdByRole: string;
  approvedByEmail: string | null;
  approvedByRole: string | null;
  approvedAt: string | null;
  sharedAt: string | null;
  ownerDecision: OwnerDecision | null;
  ownerDecisionAt: string | null;
  ownerDecisionNote: string | null;
  ownerDecisionReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessRecommendationTest = {
  id: string;
  recommendationId: string;
  businessId: string;
  testKey: SixTestKey;
  result: SixTestResult;
  explanationEs: string;
  explanationEn: string;
  evidenceRefs: readonly string[];
  confidence: RecommendationConfidence;
  ruleVersion: string;
  createdAt: string;
};

export type BusinessRecommendationOverride = {
  id: string;
  recommendationId: string;
  businessId: string;
  reason: string;
  beforeSnapshot: Record<string, unknown>;
  afterSnapshot: Record<string, unknown>;
  changedFields: readonly string[];
  sixTestEffect: OverrideSixTestEffect;
  reapprovalRequired: boolean;
  actorEmail: string;
  createdAt: string;
};

export type StewardshipLedgerEntry = {
  id: string;
  businessId: string;
  recommendationId: string | null;
  eventType: LedgerEventType;
  reasonEs: string | null;
  reasonEn: string | null;
  structuredReason: Record<string, unknown>;
  evidenceRefs: readonly string[];
  productOrServiceKey: string | null;
  moneyInvolved: boolean;
  paymentReference: string | null;
  actorType: "staff" | "owner";
  actorEmail: string;
  actorRole: string;
  createdAt: string;
};

/** Deterministic, code-resident candidate template — never generated by AI. */
export type RecommendationTemplate = {
  candidateKey: string;
  dimensionKey: HealthDimensionKey;
  appliesToDimensionStatuses: readonly string[];
  verifiedNeedEs: string;
  verifiedNeedEn: string;
  businessConsequenceEs: string;
  businessConsequenceEn: string;
  primaryIntervention: PrimaryIntervention;
  freeOptionEs: string | null;
  freeOptionEn: string | null;
  guidedOptionEs: string | null;
  guidedOptionEn: string | null;
  correctiveServiceOptionEs: string | null;
  correctiveServiceOptionEn: string | null;
  managedOptionEs: string | null;
  managedOptionEn: string | null;
  externalReferralOptionEs: string | null;
  externalReferralOptionEn: string | null;
  doNothingYetOptionEs: string;
  doNothingYetOptionEn: string;
  selectionReasonEs: string;
  selectionReasonEn: string;
  rejectedHigherCostReasonEs: string | null;
  rejectedHigherCostReasonEn: string | null;
  expectedEffort: ExpectedEffort;
  costBand: CostBand;
  successMetricEs: string;
  successMetricEn: string;
  /** Base priority weight for deterministic ranking — never commission/price-based. */
  basePriority: number;
  /** True when acting on this candidate could increase demand faster than an unready business can fulfill it. */
  isDemandGenerating: boolean;
};

/** A truthful "why this candidate was not selected" record, kept staff-only. */
export type RejectedCandidate = {
  candidateKey: string;
  dimensionKey: HealthDimensionKey;
  reasonEs: string;
  reasonEn: string;
};
