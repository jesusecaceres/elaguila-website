/**
 * Program 5 — Proposal Foundation domain types. Proposals reference real businesses,
 * real recommendations (optional), and real pricing sources. No invented pricing.
 * No payment state masquerading as proposal state. Proposal acceptance does not
 * charge, create payment, grant entitlement, or fulfill.
 */

export type ProposalStatus =
  | "draft"
  | "staff_review"
  | "owner_review"
  | "accepted"
  | "declined"
  | "expired"
  | "superseded"
  | "cancelled";

export type ProposalActor =
  | { type: "staff"; rosterId: string; authUserId: string; email: string; role: string }
  | { type: "owner"; authUserId: string; email: string };

export type ProposalPricingSnapshot = {
  packageKey: string | null;
  packageLabel: string | null;
  priceCents: number | null;
  billingMode: string | null;
  durationDays: number | null;
  pricingSource: "revenue_pricing_matrix" | "staff_confirmed" | "unknown";
  pricingConfirmed: boolean;
};

export type BusinessProposal = {
  id: string;
  businessId: string;
  sourceRecommendationId: string | null;
  status: ProposalStatus;
  version: number;
  isCurrent: boolean;
  ownerGoalEn: string | null;
  ownerGoalEs: string | null;
  verifiedNeedEn: string;
  verifiedNeedEs: string;
  recommendedIntervention: string;
  freeOptionEn: string | null;
  freeOptionEs: string | null;
  scopeEn: string;
  scopeEs: string;
  deliverablesEn: string;
  deliverablesEs: string;
  exclusionsEn: string | null;
  exclusionsEs: string | null;
  responsibilitiesEn: string;
  responsibilitiesEs: string;
  timelineEn: string;
  timelineEs: string;
  reviewDate: string | null;
  pricingSnapshot: ProposalPricingSnapshot | null;
  entitlementReference: string | null;
  successMetricEn: string;
  successMetricEs: string;
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  acceptedActorType: "staff" | "owner" | null;
  acceptedByRosterId: string | null;
  acceptedByAuthUserId: string | null;
  acceptedByEmail: string | null;
  acceptedByRole: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProposalVersion = {
  id: string;
  proposalId: string;
  businessId: string;
  version: number;
  status: ProposalStatus;
  changedActorType: "staff" | "owner";
  changedByRosterId: string | null;
  changedByAuthUserId: string;
  changedByEmail: string;
  changedByRole: string;
  changeReason: string | null;
  snapshot: Record<string, unknown>;
  createdAt: string;
};
