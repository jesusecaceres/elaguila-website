/**
 * Package B — Contextual Opportunity / Sponsorship Bridge domain types.
 *
 * A CreativeOpportunity is a distinct lifecycle object from stewardship's recommendations
 * (business_recommendations) and advisor's signals (business_advisor_signals) — it represents a
 * potential match between a business and an upcoming Leonix editorial/campaign/seasonal moment,
 * not a Health-Map-derived "next right move" or a system-detected internal signal. It reuses
 * those systems' underlying evaluations (readiness gate, Six-Test Lion Code logic — see
 * readinessAdapter.ts) rather than inventing a parallel scoring system.
 *
 * Doctrine (locked, mirrors advisor/stewardship conventions):
 * - Never auto-outreach: no email/SMS/call/contact fields exist anywhere on this type.
 * - Never auto-price/contract/sponsor: no pricing, contract, or sponsorship-confirmation fields.
 * - Never auto-publish: creating/approving an opportunity has no publishing side effect.
 * - Explainable, never a bare score: matchReasons are always human-readable ES/EN pairs.
 * - Approved != confirmed sponsor. See ../creativeStudio/compliance.ts SPONSOR_DISCLOSURE_TYPES
 *   for the doctrine that still applies once/if a creative request results in sponsored content.
 */

export type OpportunityType =
  | "editorial_match"
  | "sponsored_feature"
  | "seasonal_campaign"
  | "category_feature"
  | "business_campaign";

export const OPPORTUNITY_TYPES: readonly OpportunityType[] = [
  "editorial_match", "sponsored_feature", "seasonal_campaign", "category_feature", "business_campaign",
];

/** Bounded lifecycle. No state allows any automated execution — every transition is staff-initiated. */
export type OpportunityLifecycleState =
  | "suggested"
  | "reviewed"
  | "approved"
  | "dismissed"
  | "creative_requested";

export const OPPORTUNITY_LIFECYCLE_STATES: readonly OpportunityLifecycleState[] = [
  "suggested", "reviewed", "approved", "dismissed", "creative_requested",
];

/** Valid forward transitions only — mirrors constants.ts's CREATIVE_JOB_STATUS_TRANSITIONS convention. */
export const OPPORTUNITY_STATE_TRANSITIONS: Record<OpportunityLifecycleState, readonly OpportunityLifecycleState[]> = {
  suggested: ["reviewed", "approved", "dismissed"],
  reviewed: ["approved", "dismissed"],
  approved: ["creative_requested", "dismissed"],
  dismissed: [],
  creative_requested: [],
};

export function isValidOpportunityStateTransition(from: OpportunityLifecycleState, to: OpportunityLifecycleState): boolean {
  return OPPORTUNITY_STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

export type OpportunityMatchReasonCategory =
  | "category_match"
  | "service_match"
  | "audience_match"
  | "geography_match"
  | "timing_match"
  | "business_goal_match"
  | "editorial_theme_match"
  | "readiness_match"
  | "prior_relationship_match";

export interface OpportunityMatchReason {
  category: OpportunityMatchReasonCategory;
  explanationEs: string;
  explanationEn: string;
}

export type OpportunitySourceType = "editorial_registry" | "seasonal_registry";

export interface CreativeOpportunity {
  id: string;
  businessId: string;
  opportunityType: OpportunityType;
  titleEs: string;
  titleEn: string;
  summaryEs: string;
  summaryEn: string;
  matchReasons: readonly OpportunityMatchReason[];
  /** Secondary to matchReasons — never a substitute for a human-readable explanation. */
  confidence: "low" | "medium" | "high";
  readinessRecommended: boolean;
  readinessExplanationEs: string;
  readinessExplanationEn: string;
  sourceType: OpportunitySourceType;
  sourceKey: string;
  sourceTitle: string;
  activeFrom: string | null;
  activeUntil: string | null;
  lifecycleState: OpportunityLifecycleState;
  createdActorType: "staff" | "owner" | "system";
  createdByRosterId: string | null;
  createdByAuthUserId: string | null;
  createdByRole: string;
  reviewedAt: string | null;
  reviewedByRosterId: string | null;
  reviewedByAuthUserId: string | null;
  reviewedByRole: string | null;
  reviewNote: string | null;
  sourceOpportunityCreativeJobId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OpportunityActor =
  | { type: "staff"; rosterId: string; authUserId: string; role: string }
  | { type: "system"; role: string };

export interface CreateOpportunityInput {
  opportunityType: OpportunityType;
  titleEs: string;
  titleEn: string;
  summaryEs: string;
  summaryEn: string;
  matchReasons: readonly OpportunityMatchReason[];
  confidence: "low" | "medium" | "high";
  readinessRecommended: boolean;
  readinessExplanationEs: string;
  readinessExplanationEn: string;
  sourceType: OpportunitySourceType;
  sourceKey: string;
  sourceTitle: string;
  activeFrom: string | null;
  activeUntil: string | null;
}

export interface ReviewOpportunityInput {
  reviewNote: string | null;
}
