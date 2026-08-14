// Package C Build 3 (C5+C6) — closure verifier.
// Run from repo root: node scripts/verify-package-c-c5-c6-commercial-grants-and-plan.mjs
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(ROOT, p), "utf8");
let failures = 0;
const check = (ok, label) => {
  if (ok) console.log(`PASS  ${label}`);
  else { failures += 1; console.error(`FAIL  ${label}`); }
};

// 1. Closure document exists.
const DOC = "docs/globalization/package-c/C5_C6_COMMERCIAL_GRANTS_AND_PACKAGE_CATALOG_CLOSURE.md";
check(existsSync(path.join(ROOT, DOC)), "closure document exists");

// 2. Gate 1 — package catalog: base packages include coupons_offers; retired add-ons unsellable.
// Each package object runs from its `packageKey:` line to the next `packageKey:` line (or EOF).
const matrix = read("app/lib/listingPlans/revenuePricingMatrix.ts");
function sliceMatrixEntry(key) {
  const idx = matrix.indexOf(`packageKey: "${key}"`);
  if (idx === -1) return null;
  const next = matrix.indexOf("packageKey:", idx + 1);
  return matrix.slice(idx, next === -1 ? matrix.length : next);
}
for (const key of ["restaurantes_base_monthly", "servicios_base_monthly"]) {
  const entry = sliceMatrixEntry(key);
  check(entry !== null, `${key} entry exists`);
  check(Boolean(entry) && /capabilities:\s*\["coupons_offers"\]/.test(entry), `${key} declares coupons_offers capability`);
}
for (const key of ["restaurantes_offers_addon", "servicios_offers_addon"]) {
  const entry = sliceMatrixEntry(key);
  check(entry !== null, `${key} entry still exists (historical reads)`);
  check(Boolean(entry) && /stripeEligible:\s*false/.test(entry), `${key} is stripeEligible:false`);
  check(Boolean(entry) && /promoEligible:\s*false/.test(entry), `${key} is promoEligible:false`);
  check(Boolean(entry) && /newSalesRetired:\s*true/.test(entry), `${key} is newSalesRetired:true`);
}

// 3. Gate 2 — retired add-ons closed at checkout: allowlist removal + early route reject.
const revenueCheckout = read("app/lib/listingPlans/revenueCheckout.ts");
check(
  !/restaurantes:\s*\{[\s\S]{0,200}basePackageKey:\s*"restaurantes_base_monthly"/.test(revenueCheckout) &&
    !/servicios:\s*\{[\s\S]{0,200}basePackageKey:\s*"servicios_base_monthly"/.test(revenueCheckout),
  "CHECKOUT_ADDON_ALLOWLIST no longer has restaurantes/servicios entries",
);
const checkoutRoute = read("app/api/revenue-os/checkout/route.ts");
check(checkoutRoute.includes("addon_retired_included_in_base"), "checkout route rejects the retired add-ons early with a specific code");

// 4. Gate 3 — resolvers exist, are pure/impure-split, and are server-boundary-scoped.
check(existsSync(path.join(ROOT, "app/lib/listingPlans/categoryCommercialPlanPolicy.ts")), "categoryCommercialPlanPolicy.ts (pure) exists");
const planImpure = read("app/lib/listingPlans/categoryCommercialPlan.ts");
check(planImpure.includes('import "server-only"'), "categoryCommercialPlan.ts is server-only");
check(planImpure.includes("resolveCategoryListingPlan") && planImpure.includes("resolveBusinessToolsAccess"), "both resolver functions exported");
check(!planImpure.includes('.from("leonix_placement_entitlements")'), "resolver never queries leonix_placement_entitlements");

// 5. Gate 4 — writer split, backward-compatible wrapper, comp/partner isolation.
const fulfillment = read("app/lib/listingPlans/revenueEntitlementFulfillment.ts");
for (const fn of ["export async function activatePackageEntitlement", "export async function activatePlacementForRealPayment", "export async function activateEntitlementsForPayment", "export async function revokePackageEntitlement"]) {
  check(fulfillment.includes(fn), `revenueEntitlementFulfillment.ts exports: ${fn.replace("export async function ", "")}`);
}
const revenueFulfillment = read("app/lib/listingPlans/revenueFulfillment.ts");
check(revenueFulfillment.includes("activateEntitlementsForPayment({"), "webhook fulfillment still calls the unchanged-signature wrapper");
const manualCleared = read("app/lib/listingPlans/manualClearedPayments.ts");
check(manualCleared.includes("activateEntitlementsForPayment({"), "manualClearedPayments.ts still calls the unchanged-signature wrapper");

const complimentaryGrants = read("app/lib/listingPlans/complimentaryGrants.ts");
check(complimentaryGrants.includes('import "server-only"'), "complimentaryGrants.ts is server-only");
// Checked against the actual import statement from revenueEntitlementFulfillment.ts, not a bare
// substring — the file's own doc comment explains these primitives are deliberately never used
// (in prose, with call-syntax parens), which would otherwise false-positive a naive text search.
const complimentaryGrantsImportBlock = (complimentaryGrants.match(/import\s*\{[\s\S]*?\}\s*from\s*"\.\/revenueEntitlementFulfillment"/) ?? [""])[0];
check(!complimentaryGrantsImportBlock.includes("activateEntitlementsForPayment"), "complimentaryGrants.ts never imports activateEntitlementsForPayment");
check(!complimentaryGrantsImportBlock.includes("activatePlacementForRealPayment"), "complimentaryGrants.ts never imports activatePlacementForRealPayment");
check(!complimentaryGrants.includes('.from("leonix_payment_records")'), "complimentaryGrants.ts never queries leonix_payment_records");
check(complimentaryGrants.includes('grantSource: "comp"') && complimentaryGrants.includes('grantSource: "partner"'), "comp/partner grant sources present");

// 6. Gate 4b — legacy print-tier admin grant now stamps a real package_key for restaurantes/servicios.
const adminActions = read("app/admin/(dashboard)/workspace/package-entitlements/actions.ts");
check(adminActions.includes("CATEGORY_BASE_PACKAGE_KEY") && adminActions.includes("package_key: packageKeyForGrant"), "admin print-tier grant stamps package_key via CATEGORY_BASE_PACKAGE_KEY");

// 7. Gate 5 — checkout truth: retired add-ons never bundled into a real checkout request.
const publishCheckpoint = read("app/lib/listingPlans/publishCheckoutCheckpoint.ts");
check(/REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED\s*=\s*false/.test(publishCheckpoint), "publishCheckoutCheckpoint: restaurantes offers add-on permanently unsupported for checkout");
check(/REVENUE_OS_SERVICIOS_OFFERS_ADDON_SUPPORTED\s*=\s*false/.test(publishCheckpoint), "publishCheckoutCheckpoint: servicios offers add-on permanently unsupported for checkout");
const restaurantePreview = read("app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx");
check(!restaurantePreview.includes("RESTAURANTES_COUPON_ADDON_PACKAGE_KEY"), "Restaurante preview checkout no longer references the retired add-on package key");
const serviciosPreview = read("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
check(!serviciosPreview.includes("SERVICIOS_OFFERS_ADDON_PACKAGE_KEY"), "Servicios preview checkout no longer references the retired add-on package key");
check(existsSync(path.join(ROOT, "app/api/dashboard/enable-included-capability/route.ts")), "enable-included-capability route exists");

// 8. Gate 6 — dashboard capability reader, server-boundary-scoped.
const entitlementRoute = read("app/api/dashboard/listing-package-entitlements/route.ts");
check(entitlementRoute.includes("resolveBusinessToolsAccess"), "listing-package-entitlements route resolves capabilities server-side");
const importers = ["app/api/dashboard/listing-package-entitlements/route.ts", "app/api/dashboard/enable-included-capability/route.ts"];
for (const f of importers) {
  check(read(f).includes("categoryCommercialPlan"), `expected server importer of categoryCommercialPlan.ts: ${f}`);
}

// 9. No live "$79" copy remains in the repurposed dashboard checkout files (historical comments only).
for (const f of [
  "app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts",
  "app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts",
]) {
  const src = read(f);
  const liveLabelHasPrice = /UpgradeLabel[\s\S]{0,120}\$79/.test(src);
  check(!liveLabelHasPrice, `no live "$79" label copy in ${f}`);
}

// 10. Locked areas untouched by this build's section of the diff allowlist.
const allowSrc = read("scripts/globalizationCurrentPackageDiff.ts");
check(allowSrc.includes("PACKAGE C BUILD 3") || allowSrc.includes("PACKAGE C BUILD 3 (C5"), "Package C Build 3 allowlist section present");

console.log(
  failures === 0
    ? "verify-package-c-c5-c6-commercial-grants-and-plan: all checks passed."
    : `verify-package-c-c5-c6-commercial-grants-and-plan: ${failures} FAILURE(S).`,
);
process.exit(failures === 0 ? 0 : 1);
