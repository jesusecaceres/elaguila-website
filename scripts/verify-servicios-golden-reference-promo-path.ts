/**
 * Gate SERVICIOS-GOLDEN-REFERENCE-TRUTH-LOCK — PATH B (verified intro 15%) certification.
 *
 * The defect this proves closed (P0, money-at-risk):
 *   Servicios is `monthly_subscription`, so the verified-intro-15% policy selects the
 *   `stripe_once_coupon` mechanism. That mechanism deliberately leaves the Stripe line item at
 *   full price (so renewals bill full $399) and applies a duration:"once" coupon instead — which
 *   makes the Checkout Session's `amount_total` the DISCOUNTED first invoice ($339.15) while the
 *   payment record correctly stores the full recurring plan price ($399.00).
 *
 *   The webhook's amount guard compared those two values directly. They legitimately differ, so
 *   fulfillment was rejected with `amount_mismatch` AFTER Stripe had already charged the
 *   customer: money taken, listing never published, entitlement never granted, and the one-time
 *   redemption permanently stuck at 'reserved'.
 *
 * Source assertions use stripComments() so a doc comment can never satisfy a code assertion.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-golden-reference-promo-path.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { decideVerifiedIntroDiscountEligibility } from "../app/lib/listingPlans/verifiedIntroDiscountPolicy";
import { getRevenuePackageDefinition } from "../app/lib/listingPlans/revenuePricingMatrix";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Removes block and line comments so prose can never satisfy a source assertion. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

function readSrc(rel: string): string {
  return stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));
}

const CHECKOUT_SRC = readSrc("app/api/revenue-os/checkout/route.ts");
const FULFILLMENT_SRC = readSrc("app/lib/listingPlans/revenueFulfillment.ts");
const PAYMENT_RECORDS_SRC = readSrc("app/lib/listingPlans/revenuePaymentRecords.ts");
const STRIPE_SRC = readSrc("app/lib/listingPlans/revenueStripe.ts");
const COUPON_SRC = readSrc("app/lib/listingPlans/verifiedIntroDiscountStripeCoupon.ts");

// =================================================================================
// 1. Commercial truth — the numbers this gate certifies
// =================================================================================

const SERVICIOS_BASE_CENTS = 39900;
const EXPECTED_DISCOUNT_CENTS = 5985; // 15% of $399.00, exact — no rounding ambiguity
const EXPECTED_FIRST_CHARGE_CENTS = 33915; // $339.15

check("Servicios base package is $399/mo monthly_subscription and promo-eligible", () => {
  const def = getRevenuePackageDefinition("servicios_base_monthly");
  assert.ok(def, "servicios_base_monthly must exist in the pricing matrix");
  assert.equal(def.category, "servicios");
  assert.equal(def.priceCents, SERVICIOS_BASE_CENTS);
  assert.equal(def.billingMode, "monthly_subscription");
  assert.equal(def.promoEligible, true, "package must be promo-eligible for PATH B to exist");
  assert.notEqual(
    def.verifiedIntroDiscountEligible,
    false,
    "Servicios must not be excluded from the verified intro discount",
  );
});

check("15% of the real Servicios price is exactly 5985 cents, first charge 33915", () => {
  const discount = Math.floor((SERVICIOS_BASE_CENTS * 15) / 100);
  assert.equal(discount, EXPECTED_DISCOUNT_CENTS);
  assert.equal(SERVICIOS_BASE_CENTS - discount, EXPECTED_FIRST_CHARGE_CENTS);
});

// =================================================================================
// 2. Policy — mechanism selection and renewal semantics
// =================================================================================

const baseFacts = {
  emailVerified: true,
  phoneVerified: false,
  hasPriorRedemption: false,
  packageEligible: true,
  billingMode: "monthly_subscription" as const,
  activeDiscountSource: null,
};

check("Servicios (monthly_subscription) selects the stripe_once_coupon mechanism", () => {
  const decision = decideVerifiedIntroDiscountEligibility(baseFacts);
  assert.equal(decision.eligible, true);
  if (!decision.eligible) return;
  assert.equal(decision.discountPercent, 15);
  assert.equal(
    decision.mechanism,
    "stripe_once_coupon",
    "a subscription must NOT reduce the line item — renewals would then bill the discounted price forever",
  );
});

check("EMAIL PATH: a confirmed email alone is sufficient (no phone verification required)", () => {
  const decision = decideVerifiedIntroDiscountEligibility({ ...baseFacts, emailVerified: true, phoneVerified: false });
  assert.equal(decision.eligible, true);
});

check("SMS PATH: a verified phone alone is sufficient (no confirmed email required)", () => {
  const decision = decideVerifiedIntroDiscountEligibility({ ...baseFacts, emailVerified: false, phoneVerified: true });
  assert.equal(decision.eligible, true);
});

check("NEITHER verified: refused with not_verified", () => {
  const decision = decideVerifiedIntroDiscountEligibility({ ...baseFacts, emailVerified: false, phoneVerified: false });
  assert.equal(decision.eligible, false);
  if (decision.eligible) return;
  assert.equal(decision.reasonCode, "not_verified");
});

check("ONE-TIME: a prior reserved/redeemed row refuses with already_redeemed", () => {
  const decision = decideVerifiedIntroDiscountEligibility({ ...baseFacts, hasPriorRedemption: true });
  assert.equal(decision.eligible, false);
  if (decision.eligible) return;
  assert.equal(decision.reasonCode, "already_redeemed");
});

check("NO STACKING: an active promo code refuses with discount_already_active", () => {
  const decision = decideVerifiedIntroDiscountEligibility({ ...baseFacts, activeDiscountSource: "promo_code" });
  assert.equal(decision.eligible, false);
  if (decision.eligible) return;
  assert.equal(decision.reasonCode, "discount_already_active");
});

check("RENEWAL: the Stripe coupon is percent_off 15 with duration 'once' (renewals full price)", () => {
  assert.match(COUPON_SRC, /percent_off:\s*15/, "coupon must be 15% off");
  assert.match(COUPON_SRC, /duration:\s*"once"/, "coupon MUST be duration:'once' or renewals stay discounted forever");
});

check("The coupon is server-attached via `discounts`, never a customer-typed promotion code", () => {
  assert.match(STRIPE_SRC, /discounts:\s*\[\{\s*coupon:/, "coupon must be attached server-side");
  assert.match(STRIPE_SRC, /allow_promotion_codes:\s*false/, "customer-typed promotion codes must stay disabled");
});

// =================================================================================
// 3. THE P0 FIX — checkout now records the real first-charge discount for BOTH mechanisms
// =================================================================================

check("P0/a: the 15% amount is computed BEFORE the mechanism branch (both mechanisms record it)", () => {
  const idxCompute = CHECKOUT_SRC.indexOf("verifiedIntroDiscountCents = Math.floor((prelim.subtotalCents * 15) / 100)");
  const idxBranch = CHECKOUT_SRC.indexOf('if (verifiedIntroDiscountMechanism === "stripe_once_coupon")');
  assert.ok(idxCompute > 0, "the 15% computation must exist");
  assert.ok(idxBranch > 0, "the mechanism branch must exist");
  assert.ok(
    idxCompute < idxBranch,
    "the discount must be computed BEFORE the branch, or the coupon path records a zero discount",
  );
});

check("P0/b: the coupon mechanism still does NOT reduce finalAmountCents (renewal stays full price)", () => {
  const branchStart = CHECKOUT_SRC.indexOf('if (verifiedIntroDiscountMechanism === "stripe_once_coupon")');
  const branchEnd = CHECKOUT_SRC.indexOf("verifiedIntroDiscountEligible = true", branchStart);
  assert.ok(branchStart > 0 && branchEnd > branchStart, "mechanism branch must be locatable");
  const branch = CHECKOUT_SRC.slice(branchStart, branchEnd);
  const couponArm = branch.slice(0, branch.indexOf("} else {"));
  assert.ok(
    !couponArm.includes("finalAmountCents"),
    "the stripe_once_coupon arm must never assign finalAmountCents — that would discount the recurring price",
  );
  assert.ok(
    branch.includes("finalAmountCents = Math.max(0, prelim.subtotalCents - verifiedIntroDiscountCents)"),
    "the unit_amount_reduction arm must still reduce the line item",
  );
});

check("P0/c: the redemption ledger and payment record receive the real discount amount", () => {
  assert.match(
    CHECKOUT_SRC,
    /discountCents:\s*verifiedIntroDiscountCents/,
    "the redemption reservation must record the real discount",
  );
  assert.match(
    CHECKOUT_SRC,
    /discountCents:\s*discountCents\s*\|\|\s*verifiedIntroDiscountCents/,
    "the payment record must record the verified-intro discount when no promo discount applies",
  );
});

// =================================================================================
// 4. THE P0 FIX — the webhook guard accepts exactly one additional value
// =================================================================================

/**
 * Reproduces the guard's decision exactly as written in revenueFulfillment.ts. Kept in lockstep
 * with the source assertion below so this can never drift into testing a private copy of logic
 * that no longer resembles the shipped guard.
 */
function guardAcceptsAmount(input: {
  sessionAmountTotal: number | null;
  amountTotalCents: number | null;
  amountDiscountCents: number | null;
  billingMode: string | null;
  verifiedIntroRedemptionId: string | null;
  packagePriceCents: number;
}): boolean {
  const expectedAmount = input.amountTotalCents ?? input.packagePriceCents;
  const verifiedIntroFirstChargeCents =
    input.verifiedIntroRedemptionId != null &&
    input.billingMode === "monthly_subscription" &&
    (input.amountDiscountCents ?? 0) > 0
      ? Math.max(0, expectedAmount - (input.amountDiscountCents ?? 0))
      : null;
  const amountAccepted =
    input.sessionAmountTotal === expectedAmount ||
    (verifiedIntroFirstChargeCents != null && input.sessionAmountTotal === verifiedIntroFirstChargeCents);
  // The guard only REJECTS when all three conditions hold.
  return !(input.sessionAmountTotal != null && expectedAmount > 0 && !amountAccepted);
}

const serviciosPathB = {
  amountTotalCents: SERVICIOS_BASE_CENTS,
  amountDiscountCents: EXPECTED_DISCOUNT_CENTS,
  billingMode: "monthly_subscription",
  verifiedIntroRedemptionId: "red_123",
  packagePriceCents: SERVICIOS_BASE_CENTS,
};

check("P0/d: PATH B — Stripe's discounted $339.15 first invoice is ACCEPTED (was the money-loss bug)", () => {
  assert.equal(
    guardAcceptsAmount({ ...serviciosPathB, sessionAmountTotal: EXPECTED_FIRST_CHARGE_CENTS }),
    true,
    "the discounted first invoice must fulfill — otherwise the customer is charged and never published",
  );
});

check("P0/e: PATH A — the undiscounted $399.00 total is still ACCEPTED", () => {
  assert.equal(
    guardAcceptsAmount({
      sessionAmountTotal: SERVICIOS_BASE_CENTS,
      amountTotalCents: SERVICIOS_BASE_CENTS,
      amountDiscountCents: null,
      billingMode: "monthly_subscription",
      verifiedIntroRedemptionId: null,
      packagePriceCents: SERVICIOS_BASE_CENTS,
    }),
    true,
  );
});

check("NO WEAKENING: a discounted amount with NO redemption attached is still REJECTED", () => {
  assert.equal(
    guardAcceptsAmount({
      sessionAmountTotal: EXPECTED_FIRST_CHARGE_CENTS,
      amountTotalCents: SERVICIOS_BASE_CENTS,
      amountDiscountCents: EXPECTED_DISCOUNT_CENTS,
      billingMode: "monthly_subscription",
      verifiedIntroRedemptionId: null,
      packagePriceCents: SERVICIOS_BASE_CENTS,
    }),
    false,
    "without a verified-intro redemption row, an underpayment must still be refused",
  );
});

check("NO WEAKENING: a one_time billing mode never gets the subscription allowance", () => {
  assert.equal(
    guardAcceptsAmount({
      sessionAmountTotal: EXPECTED_FIRST_CHARGE_CENTS,
      amountTotalCents: SERVICIOS_BASE_CENTS,
      amountDiscountCents: EXPECTED_DISCOUNT_CENTS,
      billingMode: "one_time",
      verifiedIntroRedemptionId: "red_123",
      packagePriceCents: SERVICIOS_BASE_CENTS,
    }),
    false,
    "unit_amount_reduction already reduces the line item; it must never also get a second allowance",
  );
});

check("NO WEAKENING: an arbitrary wrong amount is still REJECTED on PATH B", () => {
  for (const wrong of [1, 100, 33914, 33916, 39899, 40000]) {
    assert.equal(
      guardAcceptsAmount({ ...serviciosPathB, sessionAmountTotal: wrong }),
      false,
      `amount ${wrong} must be refused — the allowance is one exact value, not a tolerance window`,
    );
  }
});

check("NO WEAKENING: a zero/absent recorded discount grants no allowance", () => {
  assert.equal(
    guardAcceptsAmount({ ...serviciosPathB, amountDiscountCents: 0, sessionAmountTotal: EXPECTED_FIRST_CHARGE_CENTS }),
    false,
  );
  assert.equal(
    guardAcceptsAmount({ ...serviciosPathB, amountDiscountCents: null, sessionAmountTotal: EXPECTED_FIRST_CHARGE_CENTS }),
    false,
  );
});

check("P0/f: the shipped guard in revenueFulfillment.ts matches the logic proven above", () => {
  assert.match(
    FULFILLMENT_SRC,
    /const verifiedIntroFirstChargeCents\s*=/,
    "the guard must derive an explicit first-charge value",
  );
  assert.match(
    FULFILLMENT_SRC,
    /paymentRecord\.verified_intro_discount_redemption_id\s*!=\s*null/,
    "the allowance must require an attached verified-intro redemption",
  );
  assert.match(
    FULFILLMENT_SRC,
    /paymentRecord\.billing_mode\s*===\s*"monthly_subscription"/,
    "the allowance must be restricted to the subscription (coupon) mechanism",
  );
  assert.match(
    FULFILLMENT_SRC,
    /const amountAccepted\s*=/,
    "the guard must compute an explicit acceptance decision",
  );
  assert.match(
    FULFILLMENT_SRC,
    /expectedAmount\s*>\s*0\s*&&\s*!amountAccepted/,
    "the rejection branch must consume the acceptance decision",
  );
  assert.ok(
    !/session\.amount_total\s*!==\s*expectedAmount/.test(FULFILLMENT_SRC),
    "the old blind inequality comparison must no longer exist",
  );
});

check("P0/g: the row type exposes the columns the guard reads, and they are really selected", () => {
  assert.match(PAYMENT_RECORDS_SRC, /amount_subtotal_cents:\s*number\s*\|\s*null;/);
  assert.match(PAYMENT_RECORDS_SRC, /amount_discount_cents:\s*number\s*\|\s*null;/);
  const selectMatch = PAYMENT_RECORDS_SRC.match(/const PAYMENT_RECORD_SELECT\s*=\s*\n?\s*"([^"]+)"/);
  assert.ok(selectMatch, "PAYMENT_RECORD_SELECT must be locatable");
  const columns = selectMatch![1].split(",").map((c) => c.trim());
  for (const required of [
    "amount_discount_cents",
    "amount_subtotal_cents",
    "amount_total_cents",
    "billing_mode",
    "verified_intro_discount_redemption_id",
  ]) {
    assert.ok(columns.includes(required), `${required} must be selected, not just declared on the type`);
  }
});

// =================================================================================
// 5. Fulfillment linkage — the redemption must actually reach 'redeemed'
// =================================================================================

check("The webhook marks the redemption redeemed via the payment record's FK column", () => {
  assert.match(
    FULFILLMENT_SRC,
    /paymentRecord\.verified_intro_discount_redemption_id/,
    "fulfillment must read the FK column added by migration 20260805100300",
  );
  assert.match(FULFILLMENT_SRC, /markVerifiedIntroDiscountRedemptionRedeemed/);
  assert.match(
    FULFILLMENT_SRC,
    /markVerifiedIntroDiscountRedemptionExpiredOrCancelled/,
    "an expired/cancelled checkout must release the one-time benefit",
  );
});

check("Checkout links the redemption to the payment record before Stripe is called", () => {
  // Call sites, not the import statements at the top of the file.
  const idxAttach = CHECKOUT_SRC.indexOf("await attachVerifiedIntroDiscountRedemptionToPaymentRecord({");
  const idxSession = CHECKOUT_SRC.indexOf("await createRevenueStripeCheckoutSession({");
  assert.ok(idxAttach > 0, "the payment-record link must be written");
  assert.ok(idxSession > 0, "the Stripe session must be created");
  assert.ok(idxAttach < idxSession, "the FK link must exist before Stripe, so the webhook can always resolve it");
});

check("A failed reservation stops checkout BEFORE any Stripe session or payment record", () => {
  const idxReserve = CHECKOUT_SRC.indexOf("await reserveOrReuseVerifiedIntroDiscount({");
  const idxPayment = CHECKOUT_SRC.indexOf("createPendingPaymentRecord({");
  const idxSession = CHECKOUT_SRC.indexOf("await createRevenueStripeCheckoutSession({");
  assert.ok(idxReserve > 0 && idxPayment > idxReserve, "reservation must precede the payment record");
  assert.ok(idxSession > idxReserve, "reservation must precede the Stripe session");
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-servicios-golden-reference-promo-path: PASS");
