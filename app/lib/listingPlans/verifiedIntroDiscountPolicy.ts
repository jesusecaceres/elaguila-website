/**
 * Package C Build 2 (C4) — pure verified-intro-15% eligibility decision (no server imports;
 * behaviorally testable under tsx). The impure resolver in verifiedIntroDiscount.ts gathers the
 * real facts (verification truth, prior-redemption lookups, package definition) and applies
 * this policy. The atomic reservation flow (verifiedIntroDiscountRedemptions.ts) is the real
 * concurrency gate at checkout time — this decision is a preview, not the enforcement itself.
 */

export type VerifiedIntroDiscountBillingMode = "one_time" | "monthly_subscription" | "free" | "affiliate";

export type VerifiedIntroDiscountVerificationFacts = {
  emailVerified: boolean;
  phoneVerified: boolean;
  /** True if any 'reserved' or 'redeemed' row already exists for owner/email-hash/phone-hash/business. */
  hasPriorRedemption: boolean;
  /** RevenuePackageDefinition.verifiedIntroDiscountEligible !== false (and promoEligible === true). */
  packageEligible: boolean;
  billingMode: VerifiedIntroDiscountBillingMode;
  /** Non-null when a promo code is already the active discount source for this checkout. */
  activeDiscountSource: "promo_code" | null;
};

export type VerifiedIntroDiscountReasonCode =
  | "not_verified"
  | "already_redeemed"
  | "package_excluded"
  | "billing_mode_ineligible"
  | "discount_already_active";

export type VerifiedIntroDiscountMechanism = "unit_amount_reduction" | "stripe_once_coupon";

export type VerifiedIntroDiscountDecision =
  | { eligible: true; discountPercent: 15; mechanism: VerifiedIntroDiscountMechanism }
  | { eligible: false; reasonCode: VerifiedIntroDiscountReasonCode };

export function decideVerifiedIntroDiscountEligibility(
  facts: VerifiedIntroDiscountVerificationFacts,
): VerifiedIntroDiscountDecision {
  // No stacking — a promo code already active on this checkout wins the discount slot; the
  // caller is expected to have already rejected a request that asked for BOTH (discount_conflict)
  // before reaching this preview, but this branch stays as a defensive, honest reason code.
  if (facts.activeDiscountSource === "promo_code") {
    return { eligible: false, reasonCode: "discount_already_active" };
  }
  if (facts.billingMode === "free" || facts.billingMode === "affiliate") {
    return { eligible: false, reasonCode: "billing_mode_ineligible" };
  }
  if (!facts.packageEligible) {
    return { eligible: false, reasonCode: "package_excluded" };
  }
  if (facts.hasPriorRedemption) {
    return { eligible: false, reasonCode: "already_redeemed" };
  }
  if (!facts.emailVerified && !facts.phoneVerified) {
    return { eligible: false, reasonCode: "not_verified" };
  }
  return {
    eligible: true,
    discountPercent: 15,
    mechanism: facts.billingMode === "monthly_subscription" ? "stripe_once_coupon" : "unit_amount_reduction",
  };
}
