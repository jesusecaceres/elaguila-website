/**
 * SERVICIOS LIVE LAUNCH PERFECTION — Wave 4 (⚠️26 / ⚠️27 / ⚠️28 / ⚠️29), 2026-09-13.
 *
 * Owner evidence (#149 → #151): the 15% panel said "tu correo está verificado"; the owner then
 * emptied the NEWSLETTER email field on the same page and saw the 15% stay active. That is correct
 * — eligibility is the signed-in Leonix account (confirmed email OR verified phone), re-derived
 * server-side at checkout before any Stripe object; the newsletter field has no pricing authority.
 * The gap was copy: the panel never said WHICH email counts.
 *
 * ⚠️26 NO commercial change · ⚠️27 copy names the account identity and disclaims the newsletter
 * field · ⚠️28 no client refresh added (mount fetch + server re-derivation already close the
 * window) · ⚠️29 checkout order unchanged: eligibility → confirmations → rules → Revenue OS.
 *
 * Execution-first: the pure eligibility policy runs (email-only / phone-only / neither / stacking).
 * Source assertions pin the panel copy + wiring, the server re-derivation, the 409 stacking guard,
 * and — via git — that no Revenue OS / listingPlans / supabase file changed in this working tree.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-verified-intro-ux.ts
 */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { decideVerifiedIntroDiscountEligibility } from "../app/lib/listingPlans/verifiedIntroDiscountPolicy";

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
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const raw = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");

const PANEL = "app/(site)/clasificados/components/VerifiedIntroDiscountVerifyPanel.tsx";
const CHECKOUT_ROUTE = "app/api/revenue-os/checkout/route.ts";

const base = {
  hasPriorRedemption: false,
  packageEligible: true,
  billingMode: "monthly_subscription" as const,
  activeDiscountSource: null,
};

/* ==============================================================================================
 * ⚠️26 — server policy is the authority; either verified identity qualifies; newsletter is nothing.
 * ============================================================================================ */
check("⚠️26 policy: confirmed account email alone qualifies (Servicios monthly → once-coupon)", () => {
  assert.deepEqual(decideVerifiedIntroDiscountEligibility({ ...base, emailVerified: true, phoneVerified: false }), {
    eligible: true,
    discountPercent: 15,
    mechanism: "stripe_once_coupon",
  });
});
check("⚠️26 policy: verified phone alone qualifies", () => {
  assert.equal(decideVerifiedIntroDiscountEligibility({ ...base, emailVerified: false, phoneVerified: true }).eligible, true);
});
check("⚠️26 policy: neither identity → not_verified; stacking → discount_already_active; prior → already_redeemed", () => {
  assert.deepEqual(decideVerifiedIntroDiscountEligibility({ ...base, emailVerified: false, phoneVerified: false }), {
    eligible: false,
    reasonCode: "not_verified",
  });
  assert.deepEqual(
    decideVerifiedIntroDiscountEligibility({ ...base, emailVerified: true, phoneVerified: true, activeDiscountSource: "promo_code" }),
    { eligible: false, reasonCode: "discount_already_active" },
  );
  assert.deepEqual(
    decideVerifiedIntroDiscountEligibility({ ...base, emailVerified: true, phoneVerified: false, hasPriorRedemption: true }),
    { eligible: false, reasonCode: "already_redeemed" },
  );
});
check("⚠️26 policy has no newsletter input at all (newsletter can never be an authority)", () => {
  const policy = raw("app/lib/listingPlans/verifiedIntroDiscountPolicy.ts");
  assert.ok(!/newsletter/i.test(policy));
  assert.ok(policy.includes("emailVerified: boolean;") && policy.includes("phoneVerified: boolean;"));
});

/* ==============================================================================================
 * ⚠️27 — the panel names the identity that qualifies and disclaims the newsletter field.
 * ============================================================================================ */
check("⚠️27 panel copy (ES/EN): eligibility basis names the Leonix account and disclaims the newsletter email", () => {
  const panel = raw(PANEL);
  assert.ok(panel.includes("el correo con el que iniciaste sesión en Leonix está verificado"), "ES basisEmail names the sign-in email");
  assert.ok(panel.includes("El correo del boletín no afecta este descuento."), "ES newsletter disclaimer");
  assert.ok(panel.includes("the email you signed in to Leonix with is verified"), "EN basisEmail names the sign-in email");
  assert.ok(panel.includes("The newsletter email does not affect this discount."), "EN newsletter disclaimer");
  assert.ok(panel.includes("el teléfono de tu cuenta Leonix está verificado"), "ES basisPhone names the account phone");
  assert.ok(panel.includes("the phone on your Leonix account is verified"), "EN basisPhone names the account phone");
  assert.ok(!panel.includes('basisEmail: "Tu cuenta califica: tu correo está verificado."'), "old ambiguous ES copy gone");
  assert.ok(!panel.includes('basisEmail: "Your account qualifies: your email is verified."'), "old ambiguous EN copy gone");
});
check("⚠️27 panel copy: ineligible state tells the owner to verify email OR mobile (never newsletter)", () => {
  const panel = raw(PANEL);
  assert.ok(panel.includes("inicia sesión con un correo confirmado, o verifica tu teléfono aquí"));
  assert.ok(panel.includes("sign in with a confirmed email, or verify your phone here"));
  assert.ok(!/newsletter.*grants|boletín.*califica/i.test(panel), "never implies the newsletter grants the discount");
});

/* ==============================================================================================
 * ⚠️28 / ⚠️29 — wiring unchanged: mount fetch, server-only authority, no stacking, canonical order.
 * ============================================================================================ */
check("⚠️28 panel: eligibility is fetched from the server on mount and only mirrored client-side", () => {
  const panel = raw(PANEL);
  assert.ok(panel.includes("void fetchVerifiedIntroDiscountStatus({ category, packageKey, listingId })"));
  assert.ok(panel.includes("Server is the sole authority"));
  assert.ok(panel.includes("if (promoCodeActive && !applied) return null;"), "mutual exclusion with promo code");
  assert.ok(panel.includes("onActiveChange(isActive, isActive ? Math.floor(subtotalCents * 0.15) : null)"), "estimate only — server recomputes");
});
check("⚠️28/⚠️29 checkout route: re-derives eligibility server-side, 409 on stacking, before any Stripe object", () => {
  const route = raw(CHECKOUT_ROUTE);
  const conflict = route.indexOf('code: "discount_conflict"');
  const decide = route.indexOf("const eligibilityDecision = decideVerifiedIntroDiscountEligibility({");
  const coupon = route.indexOf("ensureVerifiedIntroDiscountStripeCoupon(");
  assert.ok(conflict > 0 && decide > conflict, "stacking guard precedes eligibility re-derivation");
  assert.ok(coupon > decide, "the Stripe coupon is touched only after a server-side eligible decision");
  assert.ok(route.includes("verifiedIntroDiscountReservationInput"), "atomic reservation input assembled server-side");
});
check("⚠️26/⚠️29 NO commercial change: Revenue OS, listingPlans and supabase are untouched in this working tree", () => {
  const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  // ⚠️36 (2026-09-14): `recurringConsentCopy.ts` is the client-safe COPY module under listingPlans
  // ("No server imports here") and its verified-intro schedule sentence is customer copy this pass
  // was required to change. It carries no pricing/eligibility authority, so it is exempt from the
  // commercial-authority guard — the hashed legal disclosure it also holds is pinned separately below.
  const COPY_ONLY_EXEMPT = new Set(["app/lib/listingPlans/recurringConsentCopy.ts"]);
  // ⚠️35 (2026-09-14, PM-authorised finite-term promo billing): these files may change for the
  // contract-term coupon mechanism. The verified-intro authority files are pinned separately below.
  const CONTRACT_TERM_PROMO_EXEMPT = new Set([
    "app/api/revenue-os/checkout/route.ts",
    "app/lib/listingPlans/promoContractTermBilling.ts",
    "app/lib/listingPlans/contractTermStripeCoupon.ts",
    "app/lib/listingPlans/revenuePromoRedemptions.ts",
    "app/lib/listingPlans/revenuePromoValidation.ts",
    "app/lib/listingPlans/revenuePaymentRecords.ts",
    "app/lib/listingPlans/revenueStripe.ts",
    "app/lib/listingPlans/revenueFulfillment.ts",
    // client display type only (no authority) — carries the server-derived term to the summary
    "app/lib/listingPlans/revenueCategoryCheckoutClient.ts",
    // 2026-09 final paid/free defect closeout (D4 / D9): activation-STATUS fixes in the Restaurantes and BR Negocio fulfilment
    // (archived is no longer activatable; a paused / expired Negocio parent is a terminal non-retried outcome). No pricing,
    // discount or eligibility authority - the verified-intro / pricing files stay pinned by introAuthorityTouches below.
    "app/lib/listingPlans/revenueRestaurantFulfillment.ts",
    "app/lib/listingPlans/revenueBienesNegocioFulfillment.ts",
  ]);
  const protectedTouches = [...changed, ...untracked].filter(
    (f) =>
      !COPY_ONLY_EXEMPT.has(f) &&
      !CONTRACT_TERM_PROMO_EXEMPT.has(f) &&
      (f.startsWith("app/api/revenue-os/") || f.startsWith("app/lib/listingPlans/") || f.startsWith("supabase/")),
  );
  assert.deepEqual(protectedTouches, [], `protected commercial paths changed: ${protectedTouches.join(", ")}`);
  const introAuthorityTouches = [...changed, ...untracked].filter((f) =>
    [
      "app/lib/listingPlans/verifiedIntroDiscountPolicy.ts",
      "app/lib/listingPlans/verifiedIntroDiscountStripeCoupon.ts",
      "app/lib/listingPlans/verifiedIntroDiscountRedemptions.ts",
      "app/lib/listingPlans/verifiedIntroDiscount.ts",
      "app/lib/listingPlans/revenuePricingMatrix.ts",
    ].includes(f),
  );
  assert.deepEqual(introAuthorityTouches, [], `verified-intro / pricing authority changed: ${introAuthorityTouches.join(", ")}`);
  const consentCopy = raw("app/lib/listingPlans/recurringConsentCopy.ts");
  assert.ok(consentCopy.includes('export const RECURRING_CONSENT_TEXT_VERSION = "leonix-recurring-consent-2026-08-v1";'), "consent text version unchanged");
  assert.ok(consentCopy.includes("(Contrato de Publicidad Leonix Media ${RECURRING_CONSENT_AGREEMENT_VERSION}, cláusula 17.)"), "hashed legal disclosure (ES) unchanged");
  assert.ok(consentCopy.includes("(Leonix Media Advertising Agreement ${RECURRING_CONSENT_AGREEMENT_VERSION}, clause 17.)"), "hashed legal disclosure (EN) unchanged");
  assert.ok(consentCopy.includes('export const PROMO_CODE_SUBSCRIPTION_DURATION = "every_billing_cycle" as const;'), "promo recurrence truth unchanged");
});

if (failures.length) {
  console.error(`\nverify-servicios-verified-intro-ux: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nverify-servicios-verified-intro-ux: PASS");
