/**
 * LEO-20A — Leonix Self-Intelligence V1 contracts.
 *
 * Interpretation layer over canonical Leonix evidence.
 * No fake scores, no persistence, no parallel reporting/health engines.
 */
export const LEO_SELF_INTELLIGENCE_DIMENSIONS = [
  "OPERATIONS",
  "REVENUE_MONETIZATION_HEALTH",
  "TECHNOLOGY_READINESS",
  "PRODUCT_OPERATIONAL_HEALTH",
  "BUSINESS_FOUNDATION",
  "CUSTOMER_JOURNEY",
  "DISCOVERY_SEO",
  "TRUST_REPUTATION",
  "MARKETING_CREATIVE",
  "COMMUNITY_IMPACT",
] as const;

export type LeoSelfIntelligenceDimension = (typeof LEO_SELF_INTELLIGENCE_DIMENSIONS)[number];

/** V1 live dimensions with adapters. */
export const LEO_SELF_INTELLIGENCE_V1_DIMENSIONS = [
  "OPERATIONS",
  "REVENUE_MONETIZATION_HEALTH",
  "TECHNOLOGY_READINESS",
  "PRODUCT_OPERATIONAL_HEALTH",
] as const;

export type LeoSelfIntelligenceV1Dimension = (typeof LEO_SELF_INTELLIGENCE_V1_DIMENSIONS)[number];

export const LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS = [
  "BUSINESS_FOUNDATION",
  "CUSTOMER_JOURNEY",
  "DISCOVERY_SEO",
  "TRUST_REPUTATION",
  "MARKETING_CREATIVE",
  "COMMUNITY_IMPACT",
] as const;

export type LeoSelfIntelligenceDeferredDimension =
  (typeof LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS)[number];

export const LEO_SELF_INTELLIGENCE_HEALTH_STATES = [
  "HEALTHY",
  "WATCH",
  "NEEDS_ATTENTION",
  "CRITICAL",
  "UNKNOWN",
  "NOT_MEASURED",
] as const;

export type LeoSelfIntelligenceHealthState = (typeof LEO_SELF_INTELLIGENCE_HEALTH_STATES)[number];

export const LEO_SELF_INTELLIGENCE_FRESHNESS_STATES = [
  "CURRENT",
  "AGING",
  "STALE",
  "UNKNOWN",
] as const;

export type LeoSelfIntelligenceFreshness = (typeof LEO_SELF_INTELLIGENCE_FRESHNESS_STATES)[number];

export const LEO_SELF_INTELLIGENCE_EPISTEMIC_STATES = [
  "KNOWN",
  "CONFIRMED",
  "INFERRED",
  "UNKNOWN",
] as const;

export type LeoSelfIntelligenceEpistemic = (typeof LEO_SELF_INTELLIGENCE_EPISTEMIC_STATES)[number];

export const LEO_SELF_INTELLIGENCE_CONFIDENCE = ["HIGH", "MEDIUM", "LOW", "NONE"] as const;

export type LeoSelfIntelligenceConfidence = (typeof LEO_SELF_INTELLIGENCE_CONFIDENCE)[number];

export type LeoSelfIntelligenceCoverage = "KNOWN" | "PARTIAL" | "NONE";

export type LeoSelfIntelligenceDimensionResult = {
  dimension: LeoSelfIntelligenceDimension;
  state: LeoSelfIntelligenceHealthState;
  reason: string;
  evidenceRefs: string[];
  freshness: LeoSelfIntelligenceFreshness;
  confidence: LeoSelfIntelligenceConfidence;
  epistemic: LeoSelfIntelligenceEpistemic;
  limitations: string[];
  coverage: LeoSelfIntelligenceCoverage;
  lastObservedAt: string | null;
};

export type LeoSelfIntelligenceBlindSpot = {
  dimension: LeoSelfIntelligenceDimension;
  state: "NOT_MEASURED" | "UNKNOWN";
  reason: string;
  whatEvidenceIsMissing: string;
  businessWhyItMatters: string;
  recommendedSensorOrFutureCapability: string;
};

export type LeoSelfIntelligenceImpactLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type LeoSelfIntelligenceEffort = "LOW" | "MEDIUM" | "HIGH";

export type LeoSelfIntelligenceReversibility = "EASY" | "MODERATE" | "HARD";

export type LeoSelfIntelligenceNextMove = {
  id: string;
  title: string;
  whyNow: string;
  evidenceRefs: string[];
  expectedBenefit: string;
  risk: string;
  effort: LeoSelfIntelligenceEffort;
  severity: LeoSelfIntelligenceImpactLevel;
  customerImpact: LeoSelfIntelligenceImpactLevel;
  revenueImpact: LeoSelfIntelligenceImpactLevel;
  trustImpact: LeoSelfIntelligenceImpactLevel;
  operationalImpact: LeoSelfIntelligenceImpactLevel;
  strategicValue: LeoSelfIntelligenceImpactLevel;
  reversibility: LeoSelfIntelligenceReversibility;
  confidence: LeoSelfIntelligenceConfidence;
  dependencyOrder: number;
  ownerActionRequired: boolean;
  leoCanPrepare: boolean;
  /** Always false by default — CAPABILITY != AUTHORITY. */
  leoCanExecuteWithCurrentAuthority: false;
  limitations: string[];
  relatedDimension: LeoSelfIntelligenceDimension | null;
};

export type LeoSelfIntelligenceEvidenceCoverageSummary = {
  v1DimensionsWithCoverage: number;
  v1DimensionsMeasured: number;
  deferredNotMeasured: number;
  notes: string[];
};

export type LeonixInternalIntelligenceProfile = {
  generatedAt: string;
  dimensions: LeoSelfIntelligenceDimensionResult[];
  healthMap: LeoSelfIntelligenceDimensionResult[];
  blindSpots: LeoSelfIntelligenceBlindSpot[];
  topNextMove: LeoSelfIntelligenceNextMove | null;
  additionalNextMoves: LeoSelfIntelligenceNextMove[];
  evidenceCoverage: LeoSelfIntelligenceEvidenceCoverageSummary;
  freshnessSummary: {
    overall: LeoSelfIntelligenceFreshness;
    notes: string[];
  };
  limitations: string[];
  /** Qualitative only — never a numeric score. */
  overallInterpretation: string;
  notClaiming: readonly string[];
};

export const LEO_SELF_INTELLIGENCE_NOT_CLAIMING = [
  "aggregate_health_percentage",
  "letter_grade",
  "fake_seo_score",
  "fake_funnel_conversion",
  "fake_reputation_score",
  "fake_community_impact_score",
  "mrr_arr_unless_canonical",
  "execution_authority",
  "revenue_os_ownership",
  "business_concierge_ownership",
] as const;
