/**
 * Servicios Golden Commercial Closeout ⚠️35 (2026-09-14) — finite-term promo-code billing truth.
 *
 * Pure functions only (no DB, Stripe or UI) so the commercial rules are executable in verifiers.
 *
 * Doctrine (locked by the owner/PM):
 *   - the Servicios base subscription stays $399/month, billed MONTHLY;
 *   - a STANDARD contract promo code changes only HOW LONG its discount lasts — the promo row's
 *     `contract_term` (3_month / 6_month / 12_month / founding_partner) selects the term from the
 *     canonical ladder in packagePricingRules.ts, the row's own server-owned `percent_off` is the
 *     percentage;
 *   - such a code is billed through a Stripe `duration:"repeating"` coupon
 *     (`duration_in_months` = term) attached server-side, with the subscription line item left at
 *     the FULL recurring price — Stripe drops the discount by itself after the term, no Leonix action;
 *   - a code WITHOUT a finite contract term (month_to_month / unset), an `amount_off` code, or a
 *     one-time package keeps the pre-existing mechanism (the discounted amount becomes the line
 *     item's unit_amount). Nothing is silently converted into a term, and no default term is invented
 *     — that behaviour stays explicit owner/admin scope and is reported as such;
 *   - the verified 15 % welcome discount is a separate `duration:"once"` mechanism and the two never
 *     stack (checkout rejects both with 409 discount_conflict before either path runs).
 */

import { getContractTermDiscount } from "./packagePricingRules";

export type PromoBillingMechanism = "unit_amount_reduction" | "stripe_repeating_coupon";

export type PromoFiniteTerm = {
  /** The promo row's `contract_term` as stored (trimmed), e.g. "12_month". */
  contractTerm: string;
  /** Billing months the discount lasts — from the canonical ladder. */
  termMonths: number;
  /** Server-owned percentage from the promo row (never client-supplied). */
  percentOff: number;
};

export type PromoBillingPlan = {
  mechanism: PromoBillingMechanism;
  finiteTerm: PromoFiniteTerm | null;
};

/** Months of a FINITE contract term, or null for month-to-month / unset / unknown terms. */
export function resolvePromoFiniteTermMonths(contractTerm: string | null | undefined): number | null {
  const raw = String(contractTerm ?? "").trim();
  if (!raw) return null;
  const { termMonths } = getContractTermDiscount(raw);
  return Number.isFinite(termMonths) && termMonths > 1 ? termMonths : null;
}

export function resolvePromoBillingMechanism(input: {
  billingMode: string | null | undefined;
  promoType: string;
  percentOff: number | null | undefined;
  contractTerm: string | null | undefined;
}): PromoBillingPlan {
  const termMonths = resolvePromoFiniteTermMonths(input.contractTerm);
  const pct = Number(input.percentOff);
  const percentValid = Number.isFinite(pct) && pct > 0 && pct <= 100;
  if (
    input.billingMode === "monthly_subscription" &&
    String(input.promoType ?? "").toLowerCase() === "percent_off" &&
    percentValid &&
    termMonths != null
  ) {
    return {
      mechanism: "stripe_repeating_coupon",
      finiteTerm: { contractTerm: String(input.contractTerm).trim(), termMonths, percentOff: pct },
    };
  }
  return { mechanism: "unit_amount_reduction", finiteTerm: null };
}

/** Fixed, reusable coupon id per (percent, months) pair — safe across unlimited subscriptions. */
export function buildContractTermStripeCouponId(percentOff: number, termMonths: number): string {
  const pct = String(percentOff).replace(/[^0-9]/g, "_");
  return `leonix_contract_${pct}p_${Math.floor(termMonths)}m_repeating`;
}

/** Fail-closed validation of a retrieved coupon before it is trusted. */
export function isValidContractTermCoupon(
  coupon: { percent_off: number | null; duration: string; duration_in_months: number | null },
  percentOff: number,
  termMonths: number,
): boolean {
  return (
    coupon.percent_off === percentOff &&
    coupon.duration === "repeating" &&
    coupon.duration_in_months === termMonths
  );
}

/** Monthly price during the term for a percent promo (mirrors calculatePromoDiscountCents: floor). */
export function computeDiscountedMonthlyCents(baseMonthlyCents: number, percentOff: number): number {
  const base = Math.max(0, Math.floor(baseMonthlyCents));
  const pct = Math.min(100, Math.max(0, Number(percentOff) || 0));
  return Math.max(0, base - Math.floor((base * pct) / 100));
}

/* ==============================================================================================
 * Webhook amount truth — which Checkout Session totals a payment record legitimately accepts.
 * ============================================================================================ */

export type CheckoutAmountRecordLike = {
  billing_mode: string | null;
  amount_total_cents: number | null;
  amount_cents: number | null;
  amount_discount_cents: number | null;
  verified_intro_discount_redemption_id: string | null;
  promo_code_id: string | null;
  contract_term?: string | null;
};

export type AcceptedCheckoutAmounts = {
  /** The record's own total (the full recurring plan price for coupon-billed subscriptions). */
  expectedAmountCents: number;
  /** The one additional value accepted: the server-computed discounted FIRST invoice, or null. */
  discountedFirstInvoiceCents: number | null;
  discountSource: "verified_intro_15" | "contract_term_promo" | null;
};

/**
 * Exactly ONE additional value beyond the record's total is ever accepted, and only when the
 * discount was computed and persisted by this server: a verified-intro once-coupon record, or a
 * promo record whose `contract_term` is a finite term (repeating coupon). Never a tolerance window,
 * never a percentage recomputed here. Everything else is a hard mismatch.
 */
export function resolveAcceptedCheckoutAmounts(
  record: CheckoutAmountRecordLike,
  packagePriceCents: number,
): AcceptedCheckoutAmounts {
  const expectedAmountCents = record.amount_total_cents ?? record.amount_cents ?? packagePriceCents;
  const discount = record.amount_discount_cents ?? 0;
  const monthly = record.billing_mode === "monthly_subscription";
  let discountSource: AcceptedCheckoutAmounts["discountSource"] = null;
  if (monthly && discount > 0) {
    if (record.verified_intro_discount_redemption_id != null) discountSource = "verified_intro_15";
    else if (record.promo_code_id != null && resolvePromoFiniteTermMonths(record.contract_term) != null)
      discountSource = "contract_term_promo";
  }
  return {
    expectedAmountCents,
    discountedFirstInvoiceCents: discountSource ? Math.max(0, expectedAmountCents - discount) : null,
    discountSource,
  };
}

export function isAcceptedCheckoutSessionAmount(
  amounts: AcceptedCheckoutAmounts,
  sessionAmountTotal: number | null | undefined,
): boolean {
  if (sessionAmountTotal == null) return true;
  if (sessionAmountTotal === amounts.expectedAmountCents) return true;
  return amounts.discountedFirstInvoiceCents != null && sessionAmountTotal === amounts.discountedFirstInvoiceCents;
}
