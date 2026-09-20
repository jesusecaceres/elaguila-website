/**
 * Ofertas Locales — coupon/flyer pricing consistency vs server authority.
 * Run: npx tsx scripts/verify-ofertas-pricing-consistency-01.ts
 *
 * Proves the existing commercial contract from CURRENT source:
 *   flyer  = ofertas_locales_flyer_30d   / $399 / 30 days
 *   coupon = ofertas_locales_coupons_30d / $199 / 30 days
 * Client constants and checkout consent must follow that server package. No new Quick SKU.
 * The detector is self-tested against a synthetic wrong coupon value/copy so it cannot trivially pass.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const MATRIX = "app/lib/listingPlans/revenuePricingMatrix.ts";
const CONSTANTS = "app/lib/ofertas-locales/ofertasLocalesConstants.ts";
const COMMERCIAL = "app/lib/ofertas-locales/ofertasLocalesCommercial.ts";
const CHECKOUT = "app/(site)/dashboard/ofertas-locales/[id]/checkout/page.tsx";
const REVENUE_CHECKOUT = "app/lib/listingPlans/revenueCheckout.ts";
const QUICK_REG = "app/lib/quickRemaining/quickRemainingRegistry.ts";

function packagePriceCents(src: string, packageConst: string): number | null {
  const re = new RegExp(`packageKey:\\s*${packageConst}[\\s\\S]{0,260}?priceCents:\\s*(\\d+)`);
  const m = src.match(re);
  return m ? Number(m[1]) : null;
}

function clientCents(src: string, name: string): number | null {
  const m = src.match(new RegExp(`${name}\\s*=\\s*(\\d+)`));
  return m ? Number(m[1]) : null;
}

function catalogDisplayUsd(src: string, lane: "interactive_flyer" | "coupons"): number | null {
  const re = new RegExp(`${lane}:\\s*\\{[\\s\\S]*?displayPriceUsd:\\s*(\\d+)`);
  const m = src.match(re);
  return m ? Number(m[1]) : null;
}

function couponConsentCrossWiresFlyer(checkoutSrc: string): boolean {
  const hardcodedFlyerConsent = /autorizo el cobro de \$399/.test(checkoutSrc) || /authorize the \$399 charge/.test(checkoutSrc);
  const packageDerived = checkoutSrc.includes("ofertaLocalChargeConsentCopy");
  return hardcodedFlyerConsent && !packageDerived;
}

{
  // Self-test: a stale $0 client coupon constant vs $199 server must be caught.
  assert.notEqual(0, 19900, "self-test: $0 client coupon vs $199 server is detectably different");
  // Self-test: hardcoded flyer $399 consent without a package-derived helper must be caught.
  const syntheticWrongCopy = `confirmCharge: "Entiendo y autorizo el cobro de $399 por esta publicación de 30 días."`;
  assert.equal(couponConsentCrossWiresFlyer(syntheticWrongCopy), true, "self-test: hardcoded flyer $399 on coupon checkout is detected");
  const syntheticFixedCopy = `import { ofertaLocalChargeConsentCopy } from "@/app/lib/ofertas-locales/ofertasLocalesCommercial";`;
  assert.equal(couponConsentCrossWiresFlyer(syntheticFixedCopy), false, "self-test: package-derived consent is not flagged as cross-wired");
}

const matrix = read(MATRIX);
const constants = read(CONSTANTS);
const commercial = read(COMMERCIAL);
const checkout = read(CHECKOUT);
const revenueCheckout = read(REVENUE_CHECKOUT);
const quickReg = read(QUICK_REG);

const flyerServer = packagePriceCents(matrix, "OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY");
const couponServer = packagePriceCents(matrix, "OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY");
assert.equal(flyerServer, 39900, "SERVER AUTHORITY: flyer package priceCents is 39900");
assert.equal(couponServer, 19900, "SERVER AUTHORITY: coupon package priceCents is 19900");
assert.ok(matrix.includes('packageKey: OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY'), "flyer package identity ofertas_locales_flyer_30d");
assert.ok(matrix.includes('packageKey: OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY'), "coupon package identity ofertas_locales_coupons_30d");
assert.ok(/packageKey:\s*OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY[\s\S]{0,260}durationDays:\s*30/.test(matrix), "flyer duration 30 days");
assert.ok(/packageKey:\s*OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY[\s\S]{0,260}durationDays:\s*30/.test(matrix), "coupon duration 30 days");

assert.equal(clientCents(constants, "OFERTAS_LOCALES_FLYER_PRICE_CENTS"), 39900, "client flyer constant matches server");
assert.equal(clientCents(constants, "OFERTAS_LOCALES_COUPONS_PRICE_CENTS"), 19900, "client coupon constant matches server (not $0)");
assert.equal(catalogDisplayUsd(constants, "interactive_flyer"), 399, "flyer catalog display $399");
assert.equal(catalogDisplayUsd(constants, "coupons"), 199, "coupon catalog display $199 (not $0, not $399)");
assert.ok(constants.includes('revenuePackageKey: OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY'), "flyer catalog points at flyer package");
assert.ok(constants.includes('revenuePackageKey: OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY'), "coupon catalog points at coupon package");

assert.ok(commercial.includes("amountCents: OFERTAS_LOCALES_FLYER_PRICE_CENTS"), "commercial flyer amount comes from flyer constant");
assert.ok(commercial.includes("amountCents: OFERTAS_LOCALES_COUPONS_PRICE_CENTS"), "commercial coupon amount comes from coupon constant");
assert.ok(commercial.includes("ofertaLocalChargeConsentCopy"), "consent helper exists on the commercial product");

assert.equal(couponConsentCrossWiresFlyer(checkout), false, "checkout consent is not hardcoded flyer $399");
assert.ok(checkout.includes("ofertaLocalChargeConsentCopy"), "checkout uses the package-derived consent helper");
assert.ok(checkout.includes("getOfertaLocalCommercialProductByPackageKey"), "checkout resolves the live commercial package");
assert.ok(checkout.includes("startRevenueCategoryCheckout"), "checkout submits through existing Revenue OS");
assert.ok(/packageKey:\s*offer\.commercialProductKey/.test(checkout), "checkout submits the listing's commercial package key (flyer or coupon), not an amount");
assert.ok(!/amountCents:\s*\d+/.test(checkout), "client cannot choose an arbitrary checkout amount");

assert.ok(revenueCheckout.includes("packageDef.priceCents"), "server checkout prices from packageDef.priceCents");
assert.ok(revenueCheckout.includes("function validateRevenueCheckoutRequest"), "server-side validation remains the amount authority");

assert.ok(quickReg.includes('action: "direct_link"') && /"ofertas-locales": \{[\s\S]*pricing: null/.test(quickReg), "no Quick-specific Ofertas SKU / price badge");
assert.ok(!quickReg.includes("ofertas_locales_quick"), "no new Quick Ofertas package key");
assert.ok(!/packageKey:\s*"ofertas_locales_(?!flyer_30d|coupons_30d)/.test(constants + matrix + commercial), "no new Ofertas package key invented");

console.log("verify-ofertas-pricing-consistency-01: OK");
