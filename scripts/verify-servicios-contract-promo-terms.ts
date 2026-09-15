/**
 * SERVICIOS GOLDEN COMMERCIAL CLOSEOUT — ⚠️35 finite-term promo-code billing (2026-09-14).
 *
 * Root cause: a promo code lowered the Stripe subscription line item's recurring unit_amount, so a
 * 12-month 20 % contract code billed $319.20 EVERY cycle indefinitely; the promo row's contract_term
 * was never read by checkout and the webhook guard accepted only the full amount or the verified-
 * intro first charge.
 *
 * Doctrine now enforced (executed here against the real pure modules):
 *   base $399/month billed MONTHLY · 3 mo = 10 % · 6 mo = 15 % · 12 mo = 20 % · founding partner =
 *   25 % (owner approval) · a finite-term percent code = Stripe duration:"repeating" coupon for
 *   exactly the term with the line item at FULL price (Stripe returns to $399 by itself) · verified
 *   intro = duration:"once" · no stacking (409) · codes without a finite term keep the pre-existing
 *   every-cycle mechanism (explicit owner/admin scope) · no client field ever decides term/percent/price.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-contract-promo-terms.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  buildContractTermStripeCouponId,
  computeDiscountedMonthlyCents,
  isAcceptedCheckoutSessionAmount,
  isValidContractTermCoupon,
  resolveAcceptedCheckoutAmounts,
  resolvePromoBillingMechanism,
  resolvePromoFiniteTermMonths,
} from "../app/lib/listingPlans/promoContractTermBilling";
import { getContractTermDiscount } from "../app/lib/listingPlans/packagePricingRules";
import { resolveEffectivePromoCodeStatus } from "../app/lib/listingPlans/promoCodeLifecycle";
import { decideVerifiedIntroDiscountEligibility } from "../app/lib/listingPlans/verifiedIntroDiscountPolicy";
import {
  PROMO_CODE_CONTRACT_TERM_DURATION,
  PROMO_CODE_SUBSCRIPTION_DURATION,
  buildPromoCodeRecurrenceText,
  buildVerifiedIntroChargeScheduleText,
} from "../app/lib/listingPlans/recurringConsentCopy";
import { PACKAGE_ENTITLEMENT_CONTRACT_TERMS } from "../app/admin/_lib/packageEntitlementConstants";

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
const BASE = 39900;
const MONTHLY = "monthly_subscription";
const plan = (percentOff: number | null, contractTerm: string | null, billingMode = MONTHLY, promoType = "percent_off") =>
  resolvePromoBillingMechanism({ billingMode, promoType, percentOff, contractTerm });

/* AUTHORITATIVE TERMS ----------------------------------------------------------------------- */
check("authoritative contract terms: month_to_month / 3 / 6 / 12 / founding_partner — no 9-month term exists", () => {
  const values = PACKAGE_ENTITLEMENT_CONTRACT_TERMS.map((t) => t.value);
  assert.deepEqual(values, ["month_to_month", "3_month", "6_month", "12_month", "founding_partner"]);
  assert.equal(resolvePromoFiniteTermMonths("9_month"), null, "9-month is not a supported term — never invented");
  assert.equal(getContractTermDiscount("9_month").termMonths, 1, "unknown term collapses to no finite term");
});

/* A ---------------------------------------------------------------------------------------- */
check("A MONTH-TO-MONTH: 0 % · $399 every month · no coupon (unit_amount mechanism, nothing to discount)", () => {
  assert.deepEqual(getContractTermDiscount("month_to_month"), { termMonths: 1, discountPercent: 0, requiresOwnerApproval: false });
  assert.equal(resolvePromoFiniteTermMonths("month_to_month"), null);
  assert.equal(plan(0, "month_to_month").mechanism, "unit_amount_reduction");
  assert.equal(computeDiscountedMonthlyCents(BASE, 0), 39900);
});
/* B ---------------------------------------------------------------------------------------- */
check("B 3 MONTH: 10 % · $399 → $359.10 for months 1–3 · repeating coupon 3 months · month 4 = $399", () => {
  assert.deepEqual(getContractTermDiscount("3_month"), { termMonths: 3, discountPercent: 10, requiresOwnerApproval: false });
  assert.equal(computeDiscountedMonthlyCents(BASE, 10), 35910);
  assert.deepEqual(plan(10, "3_month"), { mechanism: "stripe_repeating_coupon", finiteTerm: { contractTerm: "3_month", termMonths: 3, percentOff: 10 } });
  assert.equal(buildContractTermStripeCouponId(10, 3), "leonix_contract_10p_3m_repeating");
});
/* C ---------------------------------------------------------------------------------------- */
check("C 6 MONTH: 15 % · $399 → $339.15 for months 1–6 · repeating coupon 6 months · month 7 = $399", () => {
  assert.deepEqual(getContractTermDiscount("6_month"), { termMonths: 6, discountPercent: 15, requiresOwnerApproval: false });
  assert.equal(computeDiscountedMonthlyCents(BASE, 15), 33915);
  assert.deepEqual(plan(15, "6_month").finiteTerm, { contractTerm: "6_month", termMonths: 6, percentOff: 15 });
});
/* D ---------------------------------------------------------------------------------------- */
check("D 12 MONTH: 20 % · $399 → $319.20 for months 1–12 · repeating coupon 12 months · month 13 = $399", () => {
  assert.deepEqual(getContractTermDiscount("12_month"), { termMonths: 12, discountPercent: 20, requiresOwnerApproval: false });
  assert.equal(computeDiscountedMonthlyCents(BASE, 20), 31920);
  assert.deepEqual(plan(20, "12_month"), { mechanism: "stripe_repeating_coupon", finiteTerm: { contractTerm: "12_month", termMonths: 12, percentOff: 20 } });
  assert.equal(buildContractTermStripeCouponId(20, 12), "leonix_contract_20p_12m_repeating");
  assert.equal(isValidContractTermCoupon({ percent_off: 20, duration: "repeating", duration_in_months: 12 }, 20, 12), true);
  assert.equal(isValidContractTermCoupon({ percent_off: 20, duration: "forever", duration_in_months: null }, 20, 12), false, "a forever coupon is never trusted");
  assert.equal(isValidContractTermCoupon({ percent_off: 20, duration: "repeating", duration_in_months: 6 }, 20, 12), false);
  assert.equal(isValidContractTermCoupon({ percent_off: 25, duration: "repeating", duration_in_months: 12 }, 20, 12), false);
});
check("FOUNDING PARTNER: 12 months, the row's own percent (25 %) drives the coupon, owner approval flagged", () => {
  assert.deepEqual(getContractTermDiscount("founding_partner"), { termMonths: 12, discountPercent: 25, requiresOwnerApproval: true });
  assert.deepEqual(plan(25, "founding_partner").finiteTerm, { contractTerm: "founding_partner", termMonths: 12, percentOff: 25 });
  assert.equal(computeDiscountedMonthlyCents(BASE, 25), 29925);
});
/* E ---------------------------------------------------------------------------------------- */
check("E VERIFIED INTRO: 15 % once · first payment $339.15 · month 2 = $399 · duration once · separate mechanism", () => {
  const d = decideVerifiedIntroDiscountEligibility({
    emailVerified: true, phoneVerified: false, hasPriorRedemption: false, packageEligible: true,
    billingMode: "monthly_subscription", activeDiscountSource: null,
  });
  assert.deepEqual(d, { eligible: true, discountPercent: 15, mechanism: "stripe_once_coupon" });
  assert.equal(BASE - Math.floor((BASE * 15) / 100), 33915);
  const coupon = raw("app/lib/listingPlans/verifiedIntroDiscountStripeCoupon.ts");
  assert.ok(coupon.includes("percent_off: 15,") && coupon.includes('duration: "once"'), "intro coupon untouched: 15 % once");
  assert.equal(
    buildVerifiedIntroChargeScheduleText({ firstChargeCents: 33915, renewalCents: BASE, lang: "es" }),
    "Primer pago: $339.15 — solo esta vez. Después: $399.00 al mes.",
  );
});
/* F ---------------------------------------------------------------------------------------- */
check("F NO STACKING: promo + verified intro → 409 discount_conflict before either path; never two coupons", () => {
  const route = raw("app/api/revenue-os/checkout/route.ts");
  const conflict = route.indexOf('code: "discount_conflict"');
  const promoBlock = route.indexOf("const promoResult = await resolvePromoForCheckout({");
  const introBlock = route.indexOf('if (requestedDiscountSource === "verified_intro_15") {');
  assert.ok(conflict > 0 && conflict < promoBlock && conflict < introBlock, "409 guard runs first");
  assert.ok(route.includes("{ status: 409 }"));
  const stripe = raw("app/lib/listingPlans/revenueStripe.ts");
  assert.ok(stripe.includes("discounts: [{ coupon: (input.verifiedIntroDiscountStripeCouponId || input.contractTermStripeCouponId) as string }]"), "one discounts entry, one coupon");
  assert.equal((stripe.match(/discounts:/g) ?? []).length, 1, "exactly one discounts attachment site");
  assert.ok(stripe.includes("allow_promotion_codes: false"), "customer-typed Stripe promotion codes stay off");
  const policy = decideVerifiedIntroDiscountEligibility({
    emailVerified: true, phoneVerified: true, hasPriorRedemption: false, packageEligible: true,
    billingMode: "monthly_subscription", activeDiscountSource: "promo_code",
  });
  assert.deepEqual(policy, { eligible: false, reasonCode: "discount_already_active" });
});
/* G ---------------------------------------------------------------------------------------- */
check("G INVALID / EXPIRED / REVOKED promo → not active (fail closed)", () => {
  const past = new Date(Date.now() - 86_400_000).toISOString();
  const future = new Date(Date.now() + 86_400_000).toISOString();
  assert.notEqual(resolveEffectivePromoCodeStatus({ status: "active", startsAt: null, endsAt: past, redemptionCount: 0, maxRedemptions: null }), "active", "expired");
  assert.notEqual(resolveEffectivePromoCodeStatus({ status: "revoked", startsAt: null, endsAt: null, redemptionCount: 0, maxRedemptions: null }), "active", "revoked");
  assert.notEqual(resolveEffectivePromoCodeStatus({ status: "active", startsAt: null, endsAt: null, redemptionCount: 5, maxRedemptions: 5 }), "active", "limit reached");
  // A future starts_at is rejected by validatePromoEligibility ("not yet active"), which checkout
  // and the validation preview both call with the row's starts_at / ends_at.
  const rules = raw("app/lib/listingPlans/promoCodeRules.ts");
  assert.ok(/not yet active/i.test(rules), "eligibility rules reject a code before its start");
  assert.equal(resolveEffectivePromoCodeStatus({ status: "active", startsAt: null, endsAt: future, redemptionCount: 0, maxRedemptions: 10 }), "active");
  const redemptions = raw("app/lib/listingPlans/revenuePromoRedemptions.ts");
  assert.ok(redemptions.includes('if (effectiveStatus !== "active") {') && redemptions.includes('code: "promo_ineligible", message: "Promo code is not active."'));
  assert.ok(redemptions.includes("startsAt: row.starts_at,") && redemptions.includes("expiresAt: row.ends_at,"), "checkout eligibility receives the row's window");
});
/* H ---------------------------------------------------------------------------------------- */
check("H OWNER / SPECIAL promos: no term → pre-existing every-cycle mechanism (never a silent term); a stored term is honoured with the row's percent; amount-off and one-time keep unit_amount", () => {
  assert.equal(plan(50, null).mechanism, "unit_amount_reduction", "50 % without a term is NOT converted into a contract");
  assert.equal(plan(50, "").mechanism, "unit_amount_reduction");
  assert.equal(plan(50, "month_to_month").mechanism, "unit_amount_reduction");
  assert.deepEqual(plan(50, "12_month").finiteTerm, { contractTerm: "12_month", termMonths: 12, percentOff: 50 }, "admin-stored 12-month term with a special 50 % is honoured as stored");
  assert.equal(plan(null, "12_month", MONTHLY, "amount_off").mechanism, "unit_amount_reduction", "amount-off codes are not term-billed (limitation, reported)");
  assert.equal(plan(20, "12_month", "one_time").mechanism, "unit_amount_reduction", "one-time packages have no recurring term");
  assert.equal(plan(0, "12_month").mechanism, "unit_amount_reduction", "0 % never mints a coupon");
});
/* I ---------------------------------------------------------------------------------------- */
check("I FULFILLMENT: the term's discounted first invoice is accepted; wrong amounts are rejected; no-term promo accepts only the full amount", () => {
  const contract = resolveAcceptedCheckoutAmounts({
    billing_mode: MONTHLY, amount_total_cents: BASE, amount_cents: BASE, amount_discount_cents: 7980,
    verified_intro_discount_redemption_id: null, promo_code_id: "promo-1", contract_term: "12_month",
  }, BASE);
  assert.deepEqual(contract, { expectedAmountCents: BASE, discountedFirstInvoiceCents: 31920, discountSource: "contract_term_promo" });
  assert.equal(isAcceptedCheckoutSessionAmount(contract, 31920), true, "$319.20 first invoice accepted");
  assert.equal(isAcceptedCheckoutSessionAmount(contract, BASE), true, "full amount always accepted");
  assert.equal(isAcceptedCheckoutSessionAmount(contract, 30000), false, "arbitrary amount rejected");
  assert.equal(isAcceptedCheckoutSessionAmount(contract, 31919), false, "off-by-one rejected — no tolerance window");
  const intro = resolveAcceptedCheckoutAmounts({
    billing_mode: MONTHLY, amount_total_cents: BASE, amount_cents: BASE, amount_discount_cents: 5985,
    verified_intro_discount_redemption_id: "vi-1", promo_code_id: null, contract_term: null,
  }, BASE);
  assert.deepEqual(intro, { expectedAmountCents: BASE, discountedFirstInvoiceCents: 33915, discountSource: "verified_intro_15" });
  assert.equal(isAcceptedCheckoutSessionAmount(intro, 33915), true);
  const noTerm = resolveAcceptedCheckoutAmounts({
    billing_mode: MONTHLY, amount_total_cents: 19950, amount_cents: 19950, amount_discount_cents: 19950,
    verified_intro_discount_redemption_id: null, promo_code_id: "promo-2", contract_term: "month_to_month",
  }, BASE);
  assert.deepEqual(noTerm, { expectedAmountCents: 19950, discountedFirstInvoiceCents: null, discountSource: null }, "every-cycle promo: the record total IS the discounted line item");
  assert.equal(isAcceptedCheckoutSessionAmount(noTerm, 19950), true);
  assert.equal(isAcceptedCheckoutSessionAmount(noTerm, 0), false);
  const oneTime = resolveAcceptedCheckoutAmounts({
    billing_mode: "one_time", amount_total_cents: 4999, amount_cents: 4999, amount_discount_cents: 500,
    verified_intro_discount_redemption_id: null, promo_code_id: "promo-3", contract_term: "12_month",
  }, 4999);
  assert.equal(oneTime.discountedFirstInvoiceCents, null, "one-time packages never get a coupon allowance");
  assert.equal(isAcceptedCheckoutSessionAmount(contract, null), true, "a session without amount_total is not amount-checked (pre-existing behaviour)");
  const fulfillment = raw("app/lib/listingPlans/revenueFulfillment.ts");
  assert.ok(fulfillment.includes("resolveAcceptedCheckoutAmounts(paymentRecord, packageDef.priceCents)") && fulfillment.includes("isAcceptedCheckoutSessionAmount(acceptedAmounts, session.amount_total)"), "webhook guard uses the pure resolver");
  assert.ok(fulfillment.includes('code: "amount_mismatch"'), "hard mismatch path kept");
});
/* J ---------------------------------------------------------------------------------------- */
check("J STRIPE / CHECKOUT: finite-term promo never rewrites the recurring unit_amount; coupon attached; term persisted; nothing client-supplied", () => {
  const route = raw("app/api/revenue-os/checkout/route.ts");
  const branch = route.indexOf('if (promoResult.billing.mechanism === "stripe_repeating_coupon" && promoResult.billing.finiteTerm) {');
  const elseIdx = route.indexOf("finalAmountCents = promoResult.finalAmountCents;");
  assert.ok(branch > 0 && elseIdx > branch, "the unit_amount reduction is the ELSE branch only");
  assert.ok(route.slice(branch, elseIdx).includes("await ensureContractTermStripeCoupon(promoResult.billing.finiteTerm)"), "coupon-first inside the term branch");
  assert.ok(route.slice(branch, elseIdx).includes('code: "promo_discount_temporarily_unavailable"') && route.slice(branch, elseIdx).includes("{ status: 503 }"), "fail closed — no silent permanent reduction");
  assert.ok(!route.slice(branch, elseIdx).includes("finalAmountCents ="), "finalAmountCents untouched in the term branch → amountCents = full subtotal");
  assert.ok(route.includes("contractTerm: contractTermForRecord,"), "term persisted on the payment record");
  assert.ok(route.includes("contractTermStripeCouponId,\n  });"), "coupon handed to the session builder");
  for (const clientField of ["body.termMonths", "body.percentOff", "body.discountCents", "body.contractTerm", "body.finalAmountCents"]) {
    assert.ok(!route.includes(clientField), `client never supplies ${clientField}`);
  }
  const stripe = raw("app/lib/listingPlans/revenueStripe.ts");
  assert.ok(stripe.includes("unit_amount: Math.max(0, Math.floor(item.unitAmountCents))"), "line-item price path unchanged");
  assert.ok(stripe.includes('recurring: { interval: "month" as const }'), "billing cadence stays monthly");
  assert.ok(stripe.includes("contractTermStripeCouponId?: string | null;"));
  const records = raw("app/lib/listingPlans/revenuePaymentRecords.ts");
  assert.ok(records.includes("contract_term: input.contractTerm ?? null,") && records.includes("verified_intro_discount_redemption_id, contract_term, package_entitlement_id"), "record writes + reads contract_term (existing column, no migration)");
  const redemptions = raw("app/lib/listingPlans/revenuePromoRedemptions.ts");
  assert.ok(redemptions.includes("per_customer_limit, contract_term, metadata") && redemptions.includes("contractTerm: row.contract_term,"), "promo row's contract_term is the term authority");
  const validation = raw("app/lib/listingPlans/revenuePromoValidation.ts");
  assert.ok(validation.includes("termMonths: billing.finiteTerm?.termMonths ?? null,"), "summary receives the server-derived term");
  const couponSrc = raw("app/lib/listingPlans/contractTermStripeCoupon.ts");
  assert.ok(couponSrc.includes('duration: "repeating"') && couponSrc.includes("duration_in_months: term.termMonths"), "repeating coupon for exactly the term");
  assert.ok(couponSrc.includes("isValidContractTermCoupon(existing, term.percentOff, term.termMonths)"), "retrieved coupons are validated before trust");
  const migrations = raw("supabase/migrations/20260526120000_leonix_payment_records.sql");
  assert.ok(migrations.includes("contract_term text,"), "payment_records.contract_term already exists — no schema change");
});
/* COPY ------------------------------------------------------------------------------------- */
check("COPY: finite-term sentences render dynamically for 3 / 6 / 12 months (ES/EN); no-term codes keep the every-cycle truth; no customer selector", () => {
  assert.equal(buildPromoCodeRecurrenceText({ amountCents: 35910, lang: "es", termMonths: 3, percentOff: 10, renewalCents: BASE }), "10% de descuento durante 3 meses. Pagarás $359.10 al mes durante 3 meses. Después: $399.00/mes.");
  assert.equal(buildPromoCodeRecurrenceText({ amountCents: 33915, lang: "en", termMonths: 6, percentOff: 15, renewalCents: BASE }), "15% off for 6 months. You'll pay $339.15/month for 6 months. Then: $399.00/month.");
  assert.equal(buildPromoCodeRecurrenceText({ amountCents: 31920, lang: "es", termMonths: 12, percentOff: 20, renewalCents: BASE }), "20% de descuento durante 12 meses. Pagarás $319.20 al mes durante 12 meses. Después: $399.00/mes.");
  assert.equal(buildPromoCodeRecurrenceText({ amountCents: 31920, lang: "en", termMonths: 12, percentOff: 20, renewalCents: BASE }), "20% off for 12 months. You'll pay $319.20/month for 12 months. Then: $399.00/month.");
  assert.equal(buildPromoCodeRecurrenceText({ amountCents: 19950, lang: "es" }), "Este código reduce tu precio mensual: pagarás $199.50 cada mes mientras tu suscripción siga activa.");
  assert.equal(PROMO_CODE_SUBSCRIPTION_DURATION, "every_billing_cycle");
  assert.equal(PROMO_CODE_CONTRACT_TERM_DURATION, "contract_term_months");
  const cp = raw("app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx");
  assert.ok(cp.includes('data-promo-recurrence={promoTermMonths && promoTermMonths > 1 ? "contract_term_months" : "every_billing_cycle"}'));
  assert.ok(cp.includes("renewalCents: resolved.subtotalCents,"), "post-term price is the server-derived base");
  assert.ok(cp.includes("amountCents: promoTermMonths && promoTermMonths > 1 ? resolved.subtotalCents : resolved.totalCents,"), "recurring consent names the FULL recurring price for a term promo (what the server hashes)");
  assert.ok(!/<select[^>]*(term|duration)/i.test(cp), "no customer duration selector");
  const preview = raw("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
  assert.ok(preview.includes("termMonths,") && preview.includes("percentOff: result.percentOff ?? null,"), "Servicios host forwards the server-derived term");
});

if (failures.length) {
  console.error(`\nverify-servicios-contract-promo-terms: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nverify-servicios-contract-promo-terms: PASS");
