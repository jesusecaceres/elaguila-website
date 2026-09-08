/**
 * Package C Build 1 (Gate 12) — pure refund/cancellation policy (no server imports).
 *
 * CONTRACTUAL 25% — DO NOT CONFUSE WITH THE RETIRED PROMOTIONAL CAMPAIGN:
 * Agreement v1.2 §12 permits Leonix to retain twenty-five percent (25%) of the total package
 * price as the design/setup fee after design, setup, production, campaign preparation, or
 * placement reservation begins. This constant is CONTRACT policy and must survive the C4
 * retirement of the unrelated 25% promotional discount campaign.
 */

/** Agreement v1.2 §12 — contractual design/setup retention. NOT a promo. Never auto-charged. */
export const DESIGN_SETUP_RETENTION_PERCENT = 25;

/** Fulfillment stages (Agreement v1.2 §11-§13). Order matters: refundability decreases. */
export const FULFILLMENT_STAGES = [
  "pre_work",        // §11 — cancel: refund minus non-refundable processor costs
  "design_setup",    // §12 — cancel: Leonix may retain DESIGN_SETUP_RETENTION_PERCENT
  "proof_approved",  // §13 — non-refundable from here down
  "reserved",
  "committed",
  "published",
  "activated",
] as const;
export type FulfillmentStage = (typeof FULFILLMENT_STAGES)[number];

export type RefundPolicyAssessment = {
  stage: FulfillmentStage;
  refundEligible: "full_minus_processor_costs" | "partial_design_setup_retention" | "non_refundable";
  retentionPercent: number | null;
  requiresAdminReview: true;
  clause: string;
};

/** Pure policy mapping — review guidance only; every refund decision is an audited admin act. */
export function assessRefundPolicy(stage: FulfillmentStage): RefundPolicyAssessment {
  if (stage === "pre_work") {
    return { stage, refundEligible: "full_minus_processor_costs", retentionPercent: null, requiresAdminReview: true, clause: "Agreement v1.2 §11" };
  }
  if (stage === "design_setup") {
    return { stage, refundEligible: "partial_design_setup_retention", retentionPercent: DESIGN_SETUP_RETENTION_PERCENT, requiresAdminReview: true, clause: "Agreement v1.2 §12" };
  }
  return { stage, refundEligible: "non_refundable", retentionPercent: null, requiresAdminReview: true, clause: "Agreement v1.2 §13" };
}

/**
 * Manual cleared-payment transitions (Gate 10): checks must reach FINAL clearance;
 * rejected/reversed are terminal.
 */
export type ManualPaymentState = "pending_verification" | "cleared" | "rejected" | "reversed";

export function canTransitionManualState(from: ManualPaymentState, to: ManualPaymentState): boolean {
  if (from === "pending_verification") return to === "cleared" || to === "rejected";
  if (from === "cleared") return to === "reversed";
  return false; // rejected and reversed are terminal
}
