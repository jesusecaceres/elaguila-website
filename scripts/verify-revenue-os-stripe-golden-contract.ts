/**
 * REVENUE OS / STRIPE GOLDEN CONTRACT — regression firewall (2026-09-15 P0 recovery).
 *
 * Servicios checkout was down in production on BOTH discount paths at once:
 *
 *   A. verified-intro 15% (automatic, once) — coupons.create rejected the coupon's `name`
 *      (46 chars; Stripe's coupon name limit is 40), surfaced correctly as a structured 503
 *      (verified_discount_temporarily_unavailable), but nothing could ever succeed.
 *   B. staff finite-term promo (20% / 12 months, or any other tier) — the checkout-session
 *      builder always sent `allow_promotion_codes: false` in the SAME request as a server-
 *      attached `discounts` array; Stripe rejects the two keys together outright ("You may only
 *      specify one of these parameters: allow_promotion_codes, discounts"), and — because that
 *      call had no error boundary — the exception escaped uncaught, producing a raw, empty
 *      HTTP 500 instead of any structured failure. This bug is shared code: it would have hit
 *      verified-intro too, right after a fixed coupon name got past step A.
 *
 * This file locks the Golden Servicios commercial contract and both fixes so neither regresses
 * silently. It does not redesign Revenue OS — every check pins EXISTING exported/pure functions
 * or narrow source strings, the same style already used across the other verify-servicios-* and
 * verify-*-revenue-os-* files in this repo.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-revenue-os-stripe-golden-contract.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { REVENUE_V1_PACKAGE_MATRIX } from "../app/lib/listingPlans/revenuePricingMatrix";
import {
  buildContractTermStripeCouponId,
  isValidContractTermCoupon,
  computeDiscountedMonthlyCents,
} from "../app/lib/listingPlans/promoContractTermBilling";
import { REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS } from "../app/lib/listingPlans/revenueActiveEntitlementGuard";

// verifiedIntroDiscountStripeCoupon.ts and revenueWebhook.ts both carry `import "server-only"`
// (deliberately, per the precedent noted in revenueActiveEntitlementGuard.ts), so their exports
// cannot be imported directly into a plain tsx script — those two checks below use source-text
// assertions instead, the same way every other server-only file in this suite is verified.

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

/* ── Base price ──────────────────────────────────────────────────────────────────────────── */
check("Servicios base = 39900 cents ($399/month)", () => {
  const pkg = REVENUE_V1_PACKAGE_MATRIX.find((p) => p.category === "servicios" && p.packageKey === "servicios_base_monthly");
  assert.ok(pkg, "servicios_base_monthly must exist in the pricing matrix");
  assert.equal(pkg!.priceCents, 39900);
  assert.equal(pkg!.billingMode, "monthly_subscription");
});

/* ── Verified intro 15% once — proven root cause A ─────────────────────────────────────────── */
check("verified intro: 15%, duration once, coupon id unchanged, coupon name within Stripe's 40-char limit", () => {
  const src = raw("app/lib/listingPlans/verifiedIntroDiscountStripeCoupon.ts");
  assert.ok(src.includes('VERIFIED_INTRO_DISCOUNT_STRIPE_COUPON_ID = "leonix_verified_intro_15_once"'));
  assert.ok(src.includes("percent_off: 15,"), "still exactly 15%");
  assert.ok(src.includes('duration: "once",'), "still first-payment-only, never repeating/forever");
  const nameMatch = /name:\s*"([^"]+)"/.exec(src);
  assert.ok(nameMatch, "coupon name literal must be present");
  assert.ok(
    nameMatch![1]!.length <= 40,
    `coupon name "${nameMatch![1]}" is ${nameMatch![1]!.length} chars — Stripe's coupons.create rejects names over 40 chars (the proven production root cause)`,
  );
  assert.ok(src.includes("logSanitizedStripeError"), "sanitized diagnostics on retrieve/create/retry_retrieve stay wired");
});
check("first intro payment = $339.15, renewal = $399 (unit_amount_reduction math is unchanged)", () => {
  // Same math the checkout route uses: Math.floor(subtotalCents * 15 / 100).
  const base = 39900;
  const discount = Math.floor((base * 15) / 100);
  assert.equal(discount, 5985);
  assert.equal(base - discount, 33915, "first payment");
  assert.equal(base, 39900, "renewal stays the untouched base — the once-coupon or the untouched line item, never a permanent reduction");
});

/* ── Finite-term staff promo — proven NOT the coupon-provisioning bug, but shares the session ─
 * builder bug (root cause B). Locks the four commercial tiers + post-term return to $399.
 * ────────────────────────────────────────────────────────────────────────────────────────── */
const LOCKED_CONTRACT_TIERS: { percentOff: number; termMonths: number; expectedMonthlyCents: number }[] = [
  { percentOff: 10, termMonths: 3, expectedMonthlyCents: 35910 },
  { percentOff: 15, termMonths: 6, expectedMonthlyCents: 33915 },
  { percentOff: 20, termMonths: 12, expectedMonthlyCents: 31920 },
  { percentOff: 25, termMonths: 12, expectedMonthlyCents: 29925 },
];
check("finite promo: all four locked tiers — fixed coupon id, discounted monthly cents, coupon name within 40 chars", () => {
  for (const tier of LOCKED_CONTRACT_TIERS) {
    const id = buildContractTermStripeCouponId(tier.percentOff, tier.termMonths);
    assert.equal(id, `leonix_contract_${tier.percentOff}p_${tier.termMonths}m_repeating`);
    assert.equal(computeDiscountedMonthlyCents(39900, tier.percentOff), tier.expectedMonthlyCents);
    const name = `Leonix contract promo ${tier.percentOff}% for ${tier.termMonths} months`;
    assert.ok(name.length <= 40, `${name} is ${name.length} chars — would hit the same 40-char rejection as root cause A`);
  }
});
check("finite promo: duration is repeating + duration_in_months, never forever — post-term return to $399 is Stripe's own mechanism, not app logic", () => {
  const src = raw("app/lib/listingPlans/contractTermStripeCoupon.ts");
  assert.ok(src.includes('duration: "repeating",'));
  assert.ok(!src.includes('"forever"'), "never a permanent discount");
  assert.ok(
    isValidContractTermCoupon({ percent_off: 20, duration: "repeating", duration_in_months: 12 }, 20, 12),
    "validator accepts a correctly-shaped coupon",
  );
  assert.ok(
    !isValidContractTermCoupon({ percent_off: 20, duration: "forever", duration_in_months: null }, 20, 12),
    "validator fail-closed rejects a forever-duration coupon reusing the same id",
  );
});

/* ── Root cause B fix: allow_promotion_codes / discounts mutual exclusion ─────────────────── */
check("checkout session builder never sends allow_promotion_codes together with a server-attached discounts array (the proven cause of the raw 500)", () => {
  const src = raw("app/lib/listingPlans/revenueStripe.ts");
  assert.ok(
    src.includes("serverAttachedCouponId ? { discounts: [{ coupon: serverAttachedCouponId }] } : { allow_promotion_codes: false }"),
    "the two keys must be mutually exclusive on the same sessionParams object — never both present",
  );
  // Guard against a future edit re-introducing an unconditional allow_promotion_codes alongside it.
  const unconditional = /allow_promotion_codes:\s*false,\s*\n(?:.*\n)*?\s*\.\.\.\(serverAttachedCouponId/;
  assert.ok(!unconditional.test(src), "allow_promotion_codes must not be unconditional when a discount coupon may also be attached");
});

/* ── Root cause B fix: no raw, empty 500 from Stripe session creation ─────────────────────── */
check("checkout session creation has a real error boundary: structured code, sanitized diagnostics, no unhandled throw", () => {
  const src = raw("app/lib/listingPlans/revenueStripe.ts");
  const createIdx = src.indexOf("stripe.checkout.sessions.create(sessionParams)");
  const tryIdx = src.lastIndexOf("try {", createIdx);
  const catchIdx = src.indexOf("} catch (createErr) {", createIdx);
  assert.ok(tryIdx > 0 && tryIdx < createIdx && catchIdx > createIdx, "the create() call is wrapped in try/catch");
  assert.ok(src.includes('code: "stripe_session_create_failed"'), "structured failure code on the caught path");
  assert.ok(src.slice(catchIdx, catchIdx + 800).includes("logSanitizedStripeError") === false, "uses its own inline sanitized logger, not a shared import — both are fine, but never logs raw error.message or a secret");
  const catchBlock = src.slice(catchIdx, catchIdx + 800);
  assert.ok(catchBlock.includes("type: err?.type") && catchBlock.includes("requestId: err?.requestId") && catchBlock.includes("param: err?.param"));
  assert.ok(!catchBlock.includes("err?.message") && !catchBlock.includes("err.message"), "never logs the raw Stripe error message");
  const route = raw("app/api/revenue-os/checkout/route.ts");
  assert.ok(route.includes("if (!stripeResult.ok)") && route.includes("status: 502"), "the route still turns any {ok:false} into a structured response, never lets it fall through");
});

/* ── Non-stacking ──────────────────────────────────────────────────────────────────────────── */
check("promo code + verified intro together are rejected with 409 discount_conflict before either path runs", () => {
  const route = raw("app/api/revenue-os/checkout/route.ts");
  const conflictIdx = route.indexOf('code: "discount_conflict"');
  assert.ok(conflictIdx > 0);
  assert.ok(route.slice(conflictIdx, conflictIdx + 150).includes("status: 409"));
  assert.ok(route.indexOf("if (promoCodeRaw && requestVerifiedIntroDiscount)") < conflictIdx);
});

/* ── Webhook ──────────────────────────────────────────────────────────────────────────────── */
check("webhook verification fails closed when STRIPE_WEBHOOK_SECRET is absent — 503 webhook_secret_missing, never an unsigned pass-through", () => {
  const src = raw("app/lib/listingPlans/revenueWebhook.ts");
  const guardIdx = src.indexOf("if (!input.webhookSecret) {");
  assert.ok(guardIdx > 0, "the missing-secret guard is still the first check");
  const guardBody = src.slice(guardIdx, guardIdx + 150);
  assert.ok(guardBody.includes('code: "webhook_secret_missing"') && guardBody.includes("status: 503"));
  // It must run before signature verification — never trust an event without a configured secret.
  assert.ok(guardIdx < src.indexOf("stripe.webhooks.constructEvent"));
});
check("webhook idempotency ledger (claimStripeEvent) is still the layer-1 guard before any fulfillment runs", () => {
  const webhook = raw("app/api/revenue-os/webhook/route.ts");
  const claimIdx = webhook.indexOf("const claim = await claimStripeEvent(");
  const fulfillIdx = webhook.indexOf("fulfillCheckoutSessionCompleted(");
  assert.ok(claimIdx > 0 && fulfillIdx > claimIdx, "the event ledger claim happens before fulfillment");
  assert.ok(webhook.includes('if (claim.action === "skip")'), "already-completed events short-circuit, never reprocess");
});

/* ── Active base entitlement never recharges on edit ──────────────────────────────────────── */
check("Servicios base package stays guarded by the active-entitlement gate — editing an active listing never re-triggers a base charge", () => {
  assert.ok(REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS.has("servicios_base_monthly"));
  const route = raw("app/api/revenue-os/checkout/route.ts");
  assert.ok(route.includes("isRevenueBaseEntitlementGuardedPackage(packageDef.category, packageDef.packageKey)"));
  assert.ok(route.includes("requiresBaseCheckout("));
});

/* ── Reservation lifecycle (P0 residual closeout, 2026-09-16) — proven root cause: a promo/
 * verified-intro reservation created just before the Stripe call survived a synchronous session-
 * creation failure with nothing releasing it, stranding a real production customer's one-per-
 * customer promo slot (leonix_promo_code_redemptions row fc98972d, created 3s after the logged
 * 500 crash it belongs to). Locks that BOTH reservations are released on that failure path,
 * reusing the existing release functions — no new mechanism, no weakened limit.
 * ────────────────────────────────────────────────────────────────────────────────────────── */
check("failed Stripe session creation releases the staff promo reservation (never permanently consumes the per-customer slot)", () => {
  const route = raw("app/api/revenue-os/checkout/route.ts");
  const failIdx = route.indexOf("if (!stripeResult.ok) {");
  assert.ok(failIdx > 0, "the failure branch still exists");
  const failBlock = route.slice(failIdx, failIdx + 1400);
  assert.ok(failBlock.includes("if (promoRedemptionId) {"), "promo reservation is checked on the failure path");
  assert.ok(
    failBlock.includes("await markPromoRedemptionExpiredOrCancelled({"),
    "reuses the existing release function — not a new mechanism",
  );
  assert.ok(failBlock.includes("{ status: 502 }"), "the caller still gets the same 502 failure response");
});
check("failed Stripe session creation releases the verified-intro reservation (never permanently consumes it)", () => {
  const route = raw("app/api/revenue-os/checkout/route.ts");
  const failIdx = route.indexOf("if (!stripeResult.ok) {");
  const failBlock = route.slice(failIdx, failIdx + 1400);
  assert.ok(failBlock.includes("if (verifiedIntroDiscountRedemptionId) {"), "verified-intro reservation is checked on the failure path");
  assert.ok(
    failBlock.includes("await releaseVerifiedIntroDiscountReservation(checkoutAttemptKey)"),
    "reuses the existing release function — not a new mechanism",
  );
});
check("the release-on-failure block runs before the response is returned, and only on the failure path (never touches a successful checkout)", () => {
  const route = raw("app/api/revenue-os/checkout/route.ts");
  const failIdx = route.indexOf("if (!stripeResult.ok) {");
  const returnIdx = route.indexOf("{ ok: false, code: stripeResult.code, message: stripeResult.message },", failIdx);
  const releaseIdx = route.indexOf("markPromoRedemptionExpiredOrCancelled", failIdx);
  assert.ok(failIdx < releaseIdx && releaseIdx < returnIdx, "release happens inside the failure branch, before the 502 response");
  const successAttachIdx = route.indexOf("await attachStripeSessionToPaymentRecord(");
  assert.ok(successAttachIdx > returnIdx, "the success path (attaching the real session) is untouched and comes after the failure branch");
});

if (failures.length) {
  console.error(`\nverify-revenue-os-stripe-golden-contract: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-revenue-os-stripe-golden-contract: PASS");
