#!/usr/bin/env node
/** REVENUE-OS-NEWSLETTER-PROMO-CHECKOUT-VALIDATION-01 verifier (source-level). */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => {
  console.error(`verify-revenue-os-newsletter-promo-checkout-validation-01: FAIL — ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`OK: ${m}`);

const redemptionsRel = "app/lib/listingPlans/revenuePromoRedemptions.ts";
const rulesRel = "app/lib/listingPlans/promoCodeRules.ts";
const validationRel = "app/lib/listingPlans/revenuePromoValidation.ts";
const validateRouteRel = "app/api/revenue-os/promo/validate/route.ts";
const checkoutRouteRel = "app/api/revenue-os/checkout/route.ts";
const docRel = "docs/revenue-os-newsletter-promo-checkout-validation-01.md";

for (const rel of [redemptionsRel, rulesRel, validationRel, validateRouteRel, checkoutRouteRel, docRel]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`Missing: ${rel}`);
}

const redemptions = read(redemptionsRel);
const rules = read(rulesRel);
const validation = read(validationRel);
const validateRoute = read(validateRouteRel);
const checkoutRoute = read(checkoutRouteRel);
const pkg = read("package.json");

// Root cause fix: Servicios base is on the website-checkout allowlist.
if (!/WEBSITE_LAUNCH_25_ALLOWLISTED_PACKAGE_KEYS[\s\S]*servicios_base_monthly/.test(redemptions)) {
  fail("website-checkout allowlist must include servicios_base_monthly");
}
if (!/restaurantes_base_monthly/.test(redemptions)) fail("must not drop restaurantes_base_monthly from allowlist");
ok("Launch-25 / newsletter website-checkout allowlist includes servicios_base_monthly");

// can_discount_payment handled in shared source.
if (!redemptions.includes("resolvePromoCanDiscountPayment")) fail("resolvePromoCanDiscountPayment helper required");
if (!/can_discount_payment/.test(redemptions)) fail("must read can_discount_payment flag");
if (!validation.includes("resolvePromoCanDiscountPayment")) fail("publish validator must enforce can_discount_payment");
if (!checkoutRoute.includes("resolvePromoForCheckout")) fail("checkout route must revalidate via resolvePromoForCheckout");
if (!redemptions.includes("promo_payment_discount_disabled")) fail("checkout revalidation must reject payment-discount-disabled codes");
ok("can_discount_payment enforced in validator + checkout revalidation");

// Newsletter promo source/type handled (percent_off resolution + code_type newsletter row support).
if (!redemptions.includes("code_type")) fail("promo row must carry code_type (newsletter source)");
if (!redemptions.includes("resolveRevenuePromoTypeFromRow")) fail("promo type resolver required");
ok("newsletter promo source/type handled");

// Scope wildcard normalization (Any category / Any package / any / all / * / empty).
if (!rules.includes("SCOPE_WILDCARD_TOKENS")) fail("scope wildcard token set required");
for (const t of ['"any"', '"all"', '"*"', '"any category"', '"any package"']) {
  if (!rules.includes(t)) fail(`scope wildcard set missing token ${t}`);
}
if (!/if \(!scope\?\.length\) return true;/.test(rules)) fail("empty/null scope must mean unrestricted");
ok("category/package scope normalization: Any / any / all / * / empty");

// Assigned/private does not block by itself; identity only when explicitly required.
if (!redemptions.includes("resolvePromoRequiresSubscriberIdentity")) fail("subscriber-identity resolver required");
if (!validation.includes("resolvePromoRequiresSubscriberIdentity")) fail("validator must gate identity only when required");
if (!redemptions.includes("promo_identity_required")) fail("checkout must reject only when identity required + missing");
ok("assigned/private allowed; identity enforced only when explicitly required");

// Clear failure reasons surfaced.
if (!validation.includes("localizeEligibilityReason")) fail("validator must surface clear eligibility reasons");
ok("clear failure reasons surfaced");

// Redemption still webhook-only (no redemption mutation on validate/apply).
if (/redemption_count:\s*nextCount/.test(validation) || /markPromoRedemptionRedeemed|createPendingPromoRedemption/.test(validation)) {
  fail("publish validator must not redeem/record promo usage");
}
if (!/status: "pending"/.test(redemptions)) fail("pending redemption doctrine must remain");
if (!redemptions.includes("markPromoRedemptionRedeemed")) fail("webhook-only redemption path must remain");
ok("redemption remains webhook-only (validator does not mutate usage)");

// Package scripts + doc headings.
if (!pkg.includes("verify:revenue-os-newsletter-promo-checkout-validation-01")) fail("verify script missing");
const doc = read(docRel);
for (const heading of ["Root cause", "Validation rule", "Discount math", "READY TO COMMIT"]) {
  if (!doc.includes(heading)) fail(`doc missing section: ${heading}`);
}
ok("package script + doc headings");

console.log("verify-revenue-os-newsletter-promo-checkout-validation-01: PASS");
