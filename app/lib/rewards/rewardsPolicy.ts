/**
 * LEONIX IX REWARDS — the ONE place the commercial contract lives.
 *
 * Pure and IO-free by construction: no database, no Stripe, no `server-only`. Every rule the
 * business agreed to is expressed here as a total function so it can be proven by
 * `scripts/verify-ix-rewards-behavior-01.ts` and reused identically by the Stripe path, the
 * office/manual path, the CSV importer and the customer-facing explanation copy.
 *
 * THE CONTRACT
 *  - Earn 9% back in Leonix Credits on eligible NET SETTLED money actually paid.
 *  - $1 Leonix Credit = $1 toward an eligible Leonix purchase.
 *  - Credits have no cash value and are not transferable.
 *  - Credits SPENT on a purchase do not themselves earn credits.
 *  - Refunds, reversals and chargebacks reverse the corresponding earned credits.
 *  - Customers may redeem all, some or none of an available balance.
 *  - One promotional code maximum per purchase; earned credits may be redeemed alongside it.
 *
 * MONEY: integer cents only. There is no floating-point arithmetic in this file, and every
 * function that divides rounds explicitly and in a documented direction.
 */

/** 9% expressed in basis points, so the rate is exact integer arithmetic. */
export const REWARDS_EARN_RATE_BASIS_POINTS = 900;
export const BASIS_POINTS_DENOMINATOR = 10_000;

/** A credit is worth exactly one cent toward an eligible purchase. */
export const CREDIT_CENT_VALUE = 1;

/**
 * Payment sources that can earn. Deliberately broad: the contract says rewards apply globally
 * across print, digital, Quick, Full, upgrades, cash, card, check and Stripe.
 */
export const EARNING_PAYMENT_SOURCES = ["stripe", "admin_manual", "office", "csv_import"] as const;
export type EarningPaymentSource = (typeof EARNING_PAYMENT_SOURCES)[number];

export function isEarningPaymentSource(value: unknown): value is EarningPaymentSource {
  return typeof value === "string" && (EARNING_PAYMENT_SOURCES as readonly string[]).includes(value);
}

/**
 * The money facts a payment must present to be assessed. All amounts are integer cents.
 * This mirrors the columns `leonix_payment_records` already stores, so nothing new must be
 * captured at payment time for rewards to work.
 */
export type SettledPaymentFacts = {
  /** What the customer actually paid, after every discount. Never the list price. */
  amountPaidCents: number;
  /** Portion of `amountPaidCents` that was settled using Leonix Credits. */
  creditsAppliedCents: number;
  /** Discount from the single permitted promo code, if any. Informational. */
  promoDiscountCents: number;
  source: string;
  /** True only when the money is authoritatively settled. */
  settled: boolean;
  /** Set when the purchase is of a category excluded from earning. */
  categoryExcluded?: boolean;
};

export type EarnAssessment =
  | { earns: false; reason: EarnRefusalReason; eligibleNetCents: 0; earnCents: 0 }
  | { earns: true; eligibleNetCents: number; earnCents: number };

export type EarnRefusalReason =
  | "not_settled"
  | "source_not_eligible"
  | "category_excluded"
  | "no_eligible_net"
  | "invalid_amount";

/**
 * Whole cents, rounded DOWN. Rounding down is deliberate: it never awards a fraction of a cent
 * the business did not commit to, and it keeps `earn(a) + earn(b) <= earn(a+b)` so splitting a
 * payment can never manufacture credits.
 */
export function computeEarnCents(eligibleNetCents: number): number {
  if (!Number.isFinite(eligibleNetCents) || eligibleNetCents <= 0) return 0;
  return Math.floor((Math.floor(eligibleNetCents) * REWARDS_EARN_RATE_BASIS_POINTS) / BASIS_POINTS_DENOMINATOR);
}

/**
 * The net money that actually earns: what was paid, MINUS the part paid with credits.
 * This is the rule "credits used for a purchase do not themselves earn credits".
 */
export function computeEligibleNetCents(facts: SettledPaymentFacts): number {
  const paid = Math.floor(facts.amountPaidCents);
  const credits = Math.floor(facts.creditsAppliedCents);
  if (!Number.isFinite(paid) || !Number.isFinite(credits)) return 0;
  return Math.max(0, paid - Math.max(0, credits));
}

/** The full assessment. This is what the Stripe and manual paths both call. */
export function assessEarn(facts: SettledPaymentFacts): EarnAssessment {
  if (!Number.isFinite(facts.amountPaidCents) || facts.amountPaidCents < 0) {
    return { earns: false, reason: "invalid_amount", eligibleNetCents: 0, earnCents: 0 };
  }
  if (!facts.settled) return { earns: false, reason: "not_settled", eligibleNetCents: 0, earnCents: 0 };
  if (!isEarningPaymentSource(facts.source)) {
    return { earns: false, reason: "source_not_eligible", eligibleNetCents: 0, earnCents: 0 };
  }
  if (facts.categoryExcluded) {
    return { earns: false, reason: "category_excluded", eligibleNetCents: 0, earnCents: 0 };
  }
  const eligibleNetCents = computeEligibleNetCents(facts);
  const earnCents = computeEarnCents(eligibleNetCents);
  if (earnCents <= 0) return { earns: false, reason: "no_eligible_net", eligibleNetCents: 0, earnCents: 0 };
  return { earns: true, eligibleNetCents, earnCents };
}

/**
 * How many credits a refund claws back.
 *
 * PROPORTIONAL, and never more than was earned: refunding half of an eligible payment reverses
 * half of the credits it generated. Rounded DOWN for the same reason earning is, and clamped so
 * a rounding artifact or a duplicate refund can never reverse more than the original award.
 */
export function computeReversalCents(input: {
  originallyEarnedCents: number;
  originalEligibleNetCents: number;
  refundedCents: number;
  alreadyReversedCents?: number;
}): number {
  const earned = Math.max(0, Math.floor(input.originallyEarnedCents));
  const base = Math.max(0, Math.floor(input.originalEligibleNetCents));
  const refunded = Math.max(0, Math.floor(input.refundedCents));
  const already = Math.max(0, Math.floor(input.alreadyReversedCents ?? 0));
  if (earned === 0 || base === 0 || refunded === 0) return 0;
  const proportional = refunded >= base ? earned : Math.floor((earned * refunded) / base);
  return Math.max(0, Math.min(proportional, earned - already));
}

// ---------------------------------------------------------------------------
// REDEMPTION
// ---------------------------------------------------------------------------

export type RedemptionRequest = {
  /** Credits the customer asked to apply. They may choose all, some or none. */
  requestedCents: number;
  /** Spendable balance right now. Reserved credits are already excluded by the caller. */
  availableCents: number;
  /** The amount still owed after the single permitted promo code has been applied. */
  amountDueCents: number;
  /**
   * Some rails cannot settle a zero-value transaction. When set, redemption is capped so at
   * least this much remains payable. Zero means a fully-credit-funded purchase is allowed.
   */
  minimumChargeCents?: number;
};

export type RedemptionPlan =
  | { ok: true; redeemCents: number; remainingDueCents: number; cappedBy: RedemptionCapReason | null }
  | { ok: false; reason: "invalid_request" | "nothing_available" | "nothing_due" };

export type RedemptionCapReason = "available_balance" | "amount_due" | "minimum_charge";

/**
 * Decide how many credits may actually be applied. The SERVER calls this; a browser-supplied
 * amount is never trusted, and the result is what gets reserved.
 *
 * Guarantees:
 *  - never more than the customer has,
 *  - never more than is owed (so an invoice cannot go negative),
 *  - never so much that the remaining charge drops below a rail's minimum,
 *  - partial redemption is first-class: asking for less than the balance is honoured exactly.
 */
export function planRedemption(req: RedemptionRequest): RedemptionPlan {
  const requested = Math.floor(req.requestedCents);
  const available = Math.floor(req.availableCents);
  const due = Math.floor(req.amountDueCents);
  const minCharge = Math.max(0, Math.floor(req.minimumChargeCents ?? 0));

  if (![requested, available, due].every(Number.isFinite) || requested < 0 || available < 0 || due < 0) {
    return { ok: false, reason: "invalid_request" };
  }
  if (due === 0) return { ok: false, reason: "nothing_due" };
  if (available === 0 || requested === 0) return { ok: false, reason: "nothing_available" };

  const maxByDue = Math.max(0, due - minCharge);
  let redeem = requested;
  let cappedBy: RedemptionCapReason | null = null;

  if (redeem > available) {
    redeem = available;
    cappedBy = "available_balance";
  }
  if (redeem > maxByDue) {
    redeem = maxByDue;
    cappedBy = minCharge > 0 && due - minCharge < available ? "minimum_charge" : "amount_due";
  }
  if (redeem <= 0) return { ok: false, reason: "nothing_available" };

  return { ok: true, redeemCents: redeem, remainingDueCents: due - redeem, cappedBy };
}

// ---------------------------------------------------------------------------
// PROMO COEXISTENCE
// ---------------------------------------------------------------------------

/**
 * Leonix Credits are LOYALTY VALUE, not a discount code. The existing "one promotional code
 * maximum per purchase" rule (enforced server-side in the Revenue OS checkout as a
 * `discount_conflict` 409) is unchanged and remains authoritative: credits do not consume the
 * single promo slot, and applying credits never permits a second promo code.
 *
 * This function exists so that rule is asserted in one testable place rather than re-derived at
 * each call site.
 */
export function validateDiscountCombination(input: {
  promoCodeApplied: boolean;
  verifiedIntroDiscountApplied: boolean;
  creditsAppliedCents: number;
}): { ok: true } | { ok: false; reason: "multiple_promo_codes" } {
  // Two PROMO-CLASS discounts remain mutually exclusive — unchanged behaviour.
  if (input.promoCodeApplied && input.verifiedIntroDiscountApplied) {
    return { ok: false, reason: "multiple_promo_codes" };
  }
  // Credits alongside at most one promo is explicitly permitted.
  return { ok: true };
}

/** Customer-facing explanation of the earn rate. Kept beside the rate so the two cannot drift. */
export function earnRateCopy(lang: "es" | "en"): string {
  const pct = REWARDS_EARN_RATE_BASIS_POINTS / 100;
  return lang === "en"
    ? `Earn ${pct}% back in Leonix Credits on eligible purchases. $1 in credits = $1 toward your next eligible purchase. Credits have no cash value, are not transferable, and credits used on a purchase do not earn more credits.`
    : `Gana ${pct}% en Créditos Leonix en compras elegibles. $1 en créditos = $1 para tu próxima compra elegible. Los créditos no tienen valor en efectivo, no son transferibles, y los créditos usados en una compra no generan más créditos.`;
}

/** Format integer cents as USD for display. Never used for arithmetic. */
export function formatCreditsCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.floor(cents));
  return `${sign}$${(abs / 100).toFixed(2)}`;
}
