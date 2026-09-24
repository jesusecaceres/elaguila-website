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
 * LOCKED LAUNCH POLICY — the owner-approved numbers. They live beside the rate so a surface, a
 * test and the customer copy can never disagree about them.
 */

/** A redemption below this is refused outright rather than silently rounded to nothing. */
export const REDEMPTION_MINIMUM_CENTS = 100;

/** Credits may fund at most half of an eligible purchase, expressed as basis points of it. */
export const REDEMPTION_MAX_FRACTION_BASIS_POINTS = 5_000;

/**
 * The fallback payment-rail floor. Stripe cannot settle a charge below 50 cents, so a redemption
 * is capped to leave at least this much payable unless a caller supplies a STRICTER canonical
 * value for its own rail.
 */
export const DEFAULT_RAIL_MINIMUM_CHARGE_CENTS = 50;

/** Card money stays pending for this many CALENDAR days before it may be promoted. */
export const CARD_SETTLEMENT_PENDING_DAYS = 30;

/** A checkout hold lives this long; after it, the reservation is released automatically. */
export const REDEMPTION_RESERVATION_MINUTES = 30;

/**
 * Launch policy has NO credit expiration. The ledger carries an `expire` entry type so expiry
 * could be introduced later without a schema change, but nothing in this codebase emits one and
 * no surface may tell a customer their credits expire.
 */
export const CREDITS_EXPIRE_AT_LAUNCH = false;

/** Resolve the rail floor: the caller's value wins only when it is STRICTER than the default. */
export function resolveRailMinimumChargeCents(canonicalMinimumCents?: number | null): number {
  const supplied = Number(canonicalMinimumCents);
  if (!Number.isFinite(supplied) || supplied < 0) return DEFAULT_RAIL_MINIMUM_CHARGE_CENTS;
  return Math.max(DEFAULT_RAIL_MINIMUM_CHARGE_CENTS, Math.floor(supplied));
}

/** Half of the eligible purchase, rounded DOWN so the cap can never exceed 50%. */
export function maxRedeemableForPurchaseCents(eligiblePurchaseCents: number): number {
  const base = Math.floor(eligiblePurchaseCents);
  if (!Number.isFinite(base) || base <= 0) return 0;
  return Math.floor((base * REDEMPTION_MAX_FRACTION_BASIS_POINTS) / BASIS_POINTS_DENOMINATOR);
}

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
 * The TOTAL credits a payment should have reversed once `cumulativeRefundedCents` of it has gone
 * back to the customer. A pure function of the cumulative position, never of one event.
 *
 * Proportional and rounded DOWN, except that a full refund reverses the full award: rounding a
 * 100% refund down would leave the customer holding credits for money they no longer paid.
 */
export function computeTotalReversalTargetCents(input: {
  originallyEarnedCents: number;
  originalEligibleNetCents: number;
  cumulativeRefundedCents: number;
}): number {
  const earned = Math.max(0, Math.floor(input.originallyEarnedCents));
  const base = Math.max(0, Math.floor(input.originalEligibleNetCents));
  const refunded = Math.max(0, Math.floor(input.cumulativeRefundedCents));
  if (earned === 0 || base === 0 || refunded === 0) return 0;
  if (refunded >= base) return earned;
  return Math.min(earned, Math.floor((earned * refunded) / base));
}

/**
 * How many credits THIS refund or dispute event should move, given everything that came before.
 *
 * This is a DELTA against a cumulative target, and that is the whole point. Computing each event's
 * reversal in isolation and summing them under-reverses whenever rounding-down bites more than
 * once: three $33.33 refunds of a $100.00 payment that earned $9.00 each reverse $2.99 in
 * isolation, totalling $8.97 and leaving the customer 3 cents of credit for money they got back.
 * Measuring the cumulative position instead lands exactly on $9.00.
 *
 * Guarantees:
 *  - the total reversed converges on the proportional target and never exceeds what was earned,
 *  - out-of-order delivery is safe, because the target depends only on the cumulative refunded
 *    amount, not on which event arrived first,
 *  - a stale or duplicate event that would move the total BACKWARDS returns 0 rather than a
 *    negative movement (an over-reversal in the other direction).
 */
export function computeReversalDeltaCents(input: {
  originallyEarnedCents: number;
  originalEligibleNetCents: number;
  cumulativeRefundedCents: number;
  alreadyReversedCents: number;
}): number {
  const earned = Math.max(0, Math.floor(input.originallyEarnedCents));
  const already = Math.max(0, Math.floor(input.alreadyReversedCents));
  const target = computeTotalReversalTargetCents(input);
  return Math.max(0, Math.min(target - already, earned - already));
}

/**
 * Derive the earn base from a payment record's stored money, in ONE place.
 *
 * The subtlety this exists to remove: some payment records store a total that is ALREADY net of
 * the credits applied (the Revenue OS checkout reduces the charge before creating the record, and
 * the webhook's amount guard compares Stripe's total against that reduced figure), while others
 * store the gross amount with the credits recorded beside it. Subtracting the credits against an
 * already-net total charges the customer's loyalty value against them twice and awards nothing at
 * all on a purchase half-funded by credits.
 *
 * `metadata.leonix_amount_is_net_of_credits` is written by whichever writer did the netting, so
 * the answer is a recorded fact rather than an inference from the numbers.
 */
export function earnBaseFromPaymentMetadata(input: {
  amountPaidCents: number;
  metadata: Record<string, unknown> | null;
}): { amountPaidCents: number; creditsAppliedCents: number } {
  const meta = (input.metadata ?? {}) as {
    leonix_credits_applied_cents?: number;
    leonix_amount_is_net_of_credits?: boolean;
  };
  const creditsApplied = Math.max(0, Math.floor(Number(meta.leonix_credits_applied_cents ?? 0)) || 0);
  const alreadyNet = meta.leonix_amount_is_net_of_credits === true;
  return {
    amountPaidCents: Math.max(0, Math.floor(input.amountPaidCents) || 0),
    // Already net => nothing left to subtract. The credits are still recorded on the row for the
    // customer's history; they are simply not deducted a second time here.
    creditsAppliedCents: alreadyNet ? 0 : creditsApplied,
  };
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
   * The rail's floor for the residual charge. Omitted means the canonical default
   * (`DEFAULT_RAIL_MINIMUM_CHARGE_CENTS`); a supplied value is honoured only when it is STRICTER.
   * Pass `allowZeroCharge: true` for a rail (cash at the counter) that can settle at zero.
   */
  minimumChargeCents?: number;
  /** Set only for rails with no floor at all — an in-person cash or check payment. */
  allowZeroCharge?: boolean;
  /**
   * The purchase amount the 50% ceiling is measured against. Defaults to `amountDueCents`.
   * Supply it when the amount still owed is not the whole eligible purchase (for example a
   * promo code already reduced the charge): the cap is half of the PURCHASE, not half of the
   * residual.
   */
  eligiblePurchaseCents?: number;
};

export type RedemptionPlan =
  | { ok: true; redeemCents: number; remainingDueCents: number; cappedBy: RedemptionCapReason | null }
  | { ok: false; reason: RedemptionRefusalReason; maxRedeemableCents: number };

export type RedemptionRefusalReason =
  | "invalid_request"
  | "nothing_available"
  | "nothing_due"
  | "below_minimum";

export type RedemptionCapReason =
  | "available_balance"
  | "amount_due"
  | "minimum_charge"
  | "purchase_half_cap";

/**
 * Decide how many credits may actually be applied. The SERVER calls this; a browser-supplied
 * amount is never trusted, and the result is what gets reserved.
 *
 * The owner-approved ceiling and floor are enforced HERE and nowhere else, so no surface can
 * disagree with them:
 *  - never more than the customer has,
 *  - never more than HALF of the eligible purchase,
 *  - never more than is owed (so an invoice cannot go negative),
 *  - never so much that the residual charge drops below the payment rail's minimum,
 *  - never LESS than $1.00 — a sub-minimum redemption is refused outright rather than silently
 *    rounded away, because a customer told "credits applied" and charged the full price is the
 *    phantom-discount failure this function exists to prevent,
 *  - partial redemption is first-class: asking for less than the balance is honoured exactly.
 *
 * Refusals carry `maxRedeemableCents` so a surface can tell the customer what IS possible
 * instead of just saying no.
 */
export function planRedemption(req: RedemptionRequest): RedemptionPlan {
  const requested = Math.floor(req.requestedCents);
  const available = Math.floor(req.availableCents);
  const due = Math.floor(req.amountDueCents);
  const minCharge = req.allowZeroCharge === true ? 0 : resolveRailMinimumChargeCents(req.minimumChargeCents);
  const purchase = Math.floor(req.eligiblePurchaseCents ?? req.amountDueCents);

  if (
    ![requested, available, due, purchase].every(Number.isFinite) ||
    requested < 0 ||
    available < 0 ||
    due < 0 ||
    purchase < 0
  ) {
    return { ok: false, reason: "invalid_request", maxRedeemableCents: 0 };
  }

  // The ceiling, independent of what was requested. Also the honest answer to "how much CAN I
  // apply?", which is why it is computed before any refusal returns.
  const byHalfOfPurchase = maxRedeemableForPurchaseCents(purchase);
  const byResidual = Math.max(0, due - minCharge);
  const maxRedeemableCents = Math.max(0, Math.min(available, byHalfOfPurchase, byResidual));

  if (due === 0) return { ok: false, reason: "nothing_due", maxRedeemableCents: 0 };
  if (available === 0 || requested === 0) {
    return { ok: false, reason: "nothing_available", maxRedeemableCents };
  }

  let redeem = requested;
  let cappedBy: RedemptionCapReason | null = null;

  if (redeem > available) {
    redeem = available;
    cappedBy = "available_balance";
  }
  if (redeem > byHalfOfPurchase) {
    redeem = byHalfOfPurchase;
    cappedBy = "purchase_half_cap";
  }
  if (redeem > byResidual) {
    redeem = byResidual;
    // The residual cap is the rail's floor when one applies, and the invoice itself otherwise.
    cappedBy = minCharge > 0 ? "minimum_charge" : "amount_due";
  }

  if (redeem <= 0) return { ok: false, reason: "nothing_available", maxRedeemableCents };

  // The $1.00 floor is applied AFTER every cap, so a purchase too small to support a $1
  // redemption is refused rather than producing a token discount nobody asked for.
  if (redeem < REDEMPTION_MINIMUM_CENTS) {
    return { ok: false, reason: "below_minimum", maxRedeemableCents };
  }

  return { ok: true, redeemCents: redeem, remainingDueCents: due - redeem, cappedBy };
}

/**
 * The exact figures a customer sees while applying credits at checkout.
 *
 * Lives HERE, in the pure module, rather than beside the checkout code: the copy has to be
 * reachable from a client component and from the behavioural verifier, and neither can import a
 * `server-only` module. Every number is formatted from a value the SERVER computed — this function
 * does no arithmetic of its own, so a displayed figure can never disagree with a reserved one.
 */
export function checkoutCreditsCopy(
  lang: "es" | "en",
  view: { availableCents: number; maxRedeemableCents: number; appliedCents: number; remainingDueCents: number },
): { available: string; maximum: string; applied: string; remainingDue: string; note: string } {
  const en = lang === "en";
  return {
    available: `${en ? "Available credits" : "Créditos disponibles"}: ${formatCreditsCents(view.availableCents)}`,
    maximum: `${en ? "Maximum for this purchase" : "Máximo para esta compra"}: ${formatCreditsCents(view.maxRedeemableCents)}`,
    applied: `${en ? "Credits applied" : "Créditos aplicados"}: ${formatCreditsCents(view.appliedCents)}`,
    remainingDue: `${en ? "Remaining to pay" : "Queda por pagar"}: ${formatCreditsCents(view.remainingDueCents)}`,
    note: en
      ? `Credits are held while you complete payment and are only spent once it succeeds. Minimum ${formatCreditsCents(REDEMPTION_MINIMUM_CENTS)}, up to half of an eligible purchase.`
      : `Los créditos se reservan mientras completas el pago y solo se usan cuando se aprueba. Mínimo ${formatCreditsCents(REDEMPTION_MINIMUM_CENTS)}, hasta la mitad de una compra elegible.`,
  };
}

/**
 * Customer-facing explanation of a RECOVERY BALANCE, in the customer's own terms.
 *
 * Said plainly, because the alternative is a checkout that refuses to apply credits and does not
 * say why. A refund returned money for a purchase whose credits had already been spent, so those
 * credits are owed back; the next credits earned settle it automatically. No penalty, no expiry,
 * nothing to pay in cash.
 */
export function recoveryBalanceCopy(
  lang: "es" | "en",
  view: { recoveryCents: number },
): { heading: string; detail: string } {
  const amount = formatCreditsCents(Math.max(0, Math.floor(view.recoveryCents) || 0));
  return lang === "en"
    ? {
        heading: `Credits owed back: ${amount}`,
        detail:
          `A refund returned money for a purchase whose credits you had already used, so ${amount} in credits is owed back. ` +
          "The next credits you earn cover it automatically, and then your credits become available again. " +
          "There is nothing to pay in cash, and your credits do not expire.",
      }
    : {
        heading: `Créditos por devolver: ${amount}`,
        detail:
          `Un reembolso devolvió dinero de una compra cuyos créditos ya habías usado, así que quedan ${amount} en créditos por devolver. ` +
          "Los próximos créditos que ganes lo cubren automáticamente y después tus créditos vuelven a estar disponibles. " +
          "No hay nada que pagar en efectivo y tus créditos no vencen.",
      };
}

/** Customer-facing explanation of the redemption rules. Kept beside them so they cannot drift. */
export function redemptionRulesCopy(lang: "es" | "en"): string {
  const min = formatCreditsCents(REDEMPTION_MINIMUM_CENTS);
  const pct = REDEMPTION_MAX_FRACTION_BASIS_POINTS / 100;
  // WHERE, NOT JUST HOW MUCH — AND ONLY WHERE IT IS TRUE TODAY.
  //
  // This copy promised the customer they could apply credits to "an eligible purchase", and the
  // wallet panel shows it to everyone who has a balance. There is no such purchase online: the
  // only surface that passes `creditsEligible` to the checkout is the servicios preview, and both
  // of its packages are `monthly_subscription`, which the server refuses by name. So the panel
  // never mounts anywhere, every online checkout refuses credits, and the one path that does spend
  // them is the staff counter. Telling a customer they can spend money they cannot spend is the
  // same defect class as a phantom discount — it just fails later, at the counter, in person.
  //
  // The amount rules are unchanged and still true: they bind the counter redemption exactly as
  // they would have bound an online one. Only the promise about WHERE has been corrected. See the
  // certification document's owner-decision section: enabling online redemption needs a per-
  // checkout `duration: "once"` coupon on the payment rail, which is unbuilt.
  return lang === "en"
    ? `Apply at least ${min} in credits, and up to ${pct}% of an eligible purchase. Leonix staff apply your credits to a payment in the office — online checkout does not accept credits yet. Credits are held while you pay and are only spent once the payment succeeds. Your credits do not expire.`
    : `Aplica al menos ${min} en créditos, y hasta el ${pct}% de una compra elegible. El personal de Leonix aplica tus créditos a un pago en la oficina — la compra en línea aún no acepta créditos. Los créditos se reservan mientras pagas y solo se usan cuando el pago se completa. Tus créditos no vencen.`;
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

// ---------------------------------------------------------------------------
// SETTLEMENT ELIGIBILITY
// ---------------------------------------------------------------------------

/**
 * Payment statuses that mean the money did NOT stay with Leonix.
 *
 * `refunded` is deliberately absent. `recordRefundOnPaymentRecord` sets it for a PARTIAL refund as
 * well as a full one, so treating it as invalidation froze the un-refunded remainder of the earn in
 * `pending` permanently. A refund is handled by proportional reversal plus residual promotion; only
 * a payment that is contested, failed or canceled is invalid.
 */
export const NON_PROMOTABLE_PAYMENT_STATUSES: readonly string[] = ["disputed", "failed", "canceled"];

/**
 * Is a payment still good once its settlement window has closed?
 *
 * PURE, AND DELIBERATELY SO. This used to be a block of conditions inside a database query, which
 * meant no test could reach it: the promotion sweep is driven with an INJECTED eligibility
 * predicate, so a mutation to the real one left every check green. An adversarial mutation run
 * proved it — reverting this rule to "does any chargeback row exist" was caught by nothing.
 *
 * THE DISPUTE RULE IS THE SUBTLE ONE. A dispute invalidates the payment outright while the money
 * is contested. It is not permanent: the ledger is append-only, so the `chargeback_reversal` row
 * stands for ever, and asking whether one EXISTS meant a payment whose dispute Leonix WON never
 * promoted again — the remainder of a partially disputed payment stayed frozen in `pending` while
 * every surface told the customer their credits do not expire. What matters is whether a clawback
 * is still OUTSTANDING, which is the reversal minus what winning gave back.
 */
export function isPaymentPromotableFromFacts(facts: {
  paymentStatus: string | null;
  manualState: string | null;
  /** Every `chargeback_reversal` and `reversal_restoration` row on this payment. */
  disputeLedgerRows: ReadonlyArray<{ entryType: string; amountCents: number }>;
}): boolean {
  if (facts.paymentStatus && NON_PROMOTABLE_PAYMENT_STATUSES.includes(facts.paymentStatus)) return false;
  if (facts.manualState === "reversed" || facts.manualState === "rejected") return false;

  const outstandingDisputeCents = facts.disputeLedgerRows.reduce((sum, row) => {
    const amount = Math.max(0, Math.floor(Number(row.amountCents) || 0));
    if (row.entryType === "chargeback_reversal") return sum + amount;
    if (row.entryType === "reversal_restoration") return sum - amount;
    return sum;
  }, 0);
  return outstandingDisputeCents <= 0;
}

// ---------------------------------------------------------------------------
// WHAT A QUEUED REFUND ROW'S AMOUNT MEANS
// ---------------------------------------------------------------------------

/**
 * Is a queue row's stored amount a CUMULATIVE rail position rather than one event's own amount?
 *
 * THE ROW'S `external_ref` IS THE ANSWER, AND IT IS THE ONLY ANSWER. A row that names a refund or
 * dispute holds THAT event's amount; a row that names none is the truncated-payload case, where
 * the rail gave `charge.amount_refunded` — a running total — and no refund object to attribute it
 * to. The two are passed to the reversal resolver through different parameters, so confusing them
 * does not fail: it moves the wrong amount of real money.
 *
 * Pure, exported and tested directly, because the consequence is not local to the call site.
 */
export function queuedRefundAmountIsCumulative(row: { externalRef: string | null }): boolean {
  return !row.externalRef;
}

/**
 * What a RE-FILE of a queue row must carry.
 *
 * A staff resolution that fails re-files the row so the obligation is not lost. That re-file used
 * to attach the staff-supplied event id to a row that had none (`row.externalRef ?? suppliedId`),
 * which changed the meaning of a number it did not change: a cumulative amount became a per-event
 * one, and the next resolution added it to the prior basis instead of measuring against it.
 *
 * Measured, on a $100.00 payment that earned 900 with a first $25.00 refund already reversed: a
 * second $25.00 refund filed as cumulative 5000 and then re-filed with an external ref reversed
 * **675 instead of 450** — 225 credits clawed back that the customer still owned, and on a spent
 * balance the excess lands as `recovery_cents` they never owed, which also freezes redemption.
 *
 * So the row's own ref is carried through unchanged, and the supplied id becomes EVIDENCE in the
 * reason rather than semantics in the key. The invariant this function exists to hold is
 * `queuedRefundAmountIsCumulative(row) === queuedRefundAmountIsCumulative(refiled)`.
 */
export function refiledRefundResolution(
  row: { externalRef: string | null; cumulativeRefundedCents: number },
  suppliedExternalId: string | null,
): { externalRef: string | null; cumulativeRefundedCents: number; evidenceSuffix: string } {
  return {
    externalRef: row.externalRef,
    cumulativeRefundedCents: row.cumulativeRefundedCents,
    evidenceSuffix: suppliedExternalId ? `[${suppliedExternalId}]` : "",
  };
}

/**
 * WHICH IDEMPOTENCY ANCHOR A STAFF RESOLUTION IS ALLOWED TO USE.
 *
 * `reverse:<kind>:<id>` and `restore:<id>` are globally unique keys that decide whether a future
 * webhook delivery moves money or silently deduplicates. Letting a human TYPE that id put the key
 * under their fingers: one wrong character writes a reversal on payment A under customer B's
 * *future* refund id, and when B's `charge.refunded` arrives the posting function finds the key,
 * deduplicates, and B's genuine clawback never happens while the ledger claims it did. Checking
 * the typed id against ids already on the ledger cannot catch that, because the defining property
 * of the attack is that the key is still FREE when it is typed.
 *
 * THE ANCHOR IS ALWAYS THE RAIL'S OWN EVENT ID. There is exactly one accounting scheme.
 *
 * A first attempt at this keyed a truncated-payload row on the ROW (`queue:<id>`), reasoning that
 * such a row names no event. That was wrong, and it moved real money: the staff resolution wrote
 * `reverse:refund:queue:<uuid>` while the rail's own later delivery wrote
 * `reverse:refund:re_REAL`, the two keys do not deduplicate against each other, and
 * `sumReversalBasisForPayment` ADDS their `basis_contribution_cents`. Measured on a $100.00 payment
 * that earned 900 with one $50.00 refund: **900 clawed back where 450 was owed**, and on a spent
 * balance 450 cents of `recovery_cents` the customer never owed, which also freezes every
 * redemption. It was the same "second accounting scheme living beside the per-refund-id one"
 * that `revenueSubscriptionEvents` had already been repaired to remove, reintroduced through the
 * staff queue. This is why the route DEMANDS the canonical refund id before it will resolve such a
 * row at all: so that the two deliveries share one key and the second one is a no-op.
 *
 * What the row decides is whether the typed id is ALLOWED, not whether it is used:
 *
 * - A row that names an event (`external_ref`) is resolved under THAT id, and a typed id that
 *   disagrees is a typo — refused by name rather than written.
 * - A row that names none is the truncated-payload case. The typed id IS the anchor, because it is
 *   the rail's key for the same refund. Without one there is no stable idempotency and the
 *   resolution is refused rather than keyed on something only this system knows.
 * - A restoration must name its dispute. Restoring a dispute nobody can name is refused, because
 *   the per-dispute bound that stops a won dispute giving back another dispute's clawback is
 *   computed from exactly that id.
 *
 * The typo hazard this cannot rule out — an id that is still FREE when it is mistyped — is
 * narrowed by the route's `refund_external_id_belongs_to_another_payment` pre-check and costs at
 * most a silent under-reversal of one future refund, which the queue then files. A double clawback
 * on a real customer today is not the safer side of that trade.
 */
export function resolutionIdempotencyAnchor(
  row: { id: string; externalRef: string | null },
  suppliedExternalId: string,
  opts: { wantsRestore: boolean },
): { ok: true; anchor: string } | { ok: false; error: string } {
  const supplied = suppliedExternalId.trim();
  if (row.externalRef) {
    if (supplied && supplied !== row.externalRef) {
      return { ok: false, error: "supplied_id_does_not_match_row" };
    }
    return { ok: true, anchor: row.externalRef };
  }
  if (opts.wantsRestore) return { ok: false, error: "restoration_row_has_no_dispute_id" };
  if (!supplied) return { ok: false, error: "refund_external_id_required" };
  return { ok: true, anchor: supplied };
}
