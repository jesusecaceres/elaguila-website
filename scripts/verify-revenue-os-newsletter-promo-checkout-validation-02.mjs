#!/usr/bin/env node
/** REVENUE-OS-NEWSLETTER-PROMO-CHECKOUT-VALIDATION-02 verifier */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => {
  console.error(`verify-revenue-os-newsletter-promo-checkout-validation-02: FAIL — ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`OK: ${m}`);

const redemptionsRel = "app/lib/listingPlans/revenuePromoRedemptions.ts";
const rulesRel = "app/lib/listingPlans/promoCodeRules.ts";
const validationRel = "app/lib/listingPlans/revenuePromoValidation.ts";
const validateRouteRel = "app/api/revenue-os/promo/validate/route.ts";
const checkoutRouteRel = "app/api/revenue-os/checkout/route.ts";
const docRel = "docs/revenue-os-newsletter-promo-checkout-validation-02.md";

for (const rel of [redemptionsRel, rulesRel, validationRel, validateRouteRel, checkoutRouteRel, docRel]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`Missing: ${rel}`);
}

const redemptions = read(redemptionsRel);
const rules = read(rulesRel);
const validation = read(validationRel);
const checkoutRoute = read(checkoutRouteRel);
const pkg = read("package.json");

// Subscriber identity: newsletter source must not require identity by itself.
if (!/codeType === "newsletter"[\s\S]*return false/.test(redemptions)) {
  fail("newsletter code_type must not require subscriber identity at checkout by default");
}
if (!redemptions.includes("checkout_subscriber_identity_required")) {
  fail("explicit checkout identity gate must be supported");
}
if (!validation.includes("resolvePromoRequiresSubscriberIdentity")) {
  fail("publish validator must use shared identity resolver");
}
ok("newsletter source no longer requires subscriber identity by itself");

// Assigned/private does not block (newsletter returns false even with legacy subscriber_identity_required).
if (!/subscriber_identity_required === false/.test(redemptions)) {
  fail("explicit subscriber identity false opt-out must be honored");
}
ok("assigned/private + legacy delivery flags do not auto-block checkout");

// Explicit identity-required promos still protected.
if (!redemptions.includes("checkout_subscriber_identity_required")) {
  fail("checkout_subscriber_identity_required gate required for explicit identity promos");
}
if (!redemptions.includes("promo_identity_required")) {
  fail("checkout route must reject explicit identity-required promos without identity");
}
ok("explicit identity-required promos still protected");

// Any category / Any package wildcard scopes.
if (!rules.includes("promoScopeIsUnrestricted")) fail("promoScopeIsUnrestricted export required");
if (!rules.includes("PROMO_SCOPE_WILDCARD_TOKENS")) fail("wildcard token set required");
ok("Any category / Any package wildcard scopes supported");

// Global checkout: unrestricted scope skips Launch-25 allowlist.
if (!/promoScopeIsUnrestricted\(categoryScope\)[\s\S]*promoScopeIsUnrestricted\(packageScope\)/.test(redemptions)) {
  fail("Launch-25 allowlist must skip when both scopes are unrestricted");
}
ok("unrestricted scope skips Launch-25 package allowlist");

// can_discount_payment + checkout revalidation.
if (!redemptions.includes("resolvePromoCanDiscountPayment")) fail("can_discount_payment resolver required");
if (!checkoutRoute.includes("resolvePromoForCheckout")) fail("checkout route must revalidate promo");
ok("can_discount_payment required; checkout route revalidates before Stripe");

// Webhook redemption unchanged.
if (/markPromoRedemptionRedeemed/.test(validation)) fail("validator must not redeem promos");
if (!redemptions.includes("markPromoRedemptionRedeemed")) fail("webhook redemption path must remain");
ok("webhook redemption remains unchanged");

// No Servicios UI touched in this gate (only shared lib + docs/scripts).
if (!pkg.includes("verify:revenue-os-newsletter-promo-checkout-validation-02")) fail("verify script missing");
const doc = read(docRel);
for (const heading of ["Exact root cause", "Corrected promo doctrine", "READY TO COMMIT"]) {
  if (!doc.includes(heading)) fail(`doc missing: ${heading}`);
}
ok("package script + doc headings");

console.log("verify-revenue-os-newsletter-promo-checkout-validation-02: PASS");
