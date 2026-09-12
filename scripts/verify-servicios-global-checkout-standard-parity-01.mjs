#!/usr/bin/env node
/** SERVICIOS-GLOBAL-CHECKOUT-STANDARD-PARITY-01 verifier */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => {
  console.error(`verify-servicios-global-checkout-standard-parity-01: FAIL — ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`OK: ${m}`);

const checkpointRel = "app/lib/listingPlans/publishCheckoutCheckpoint.ts";
const matrixRel = "app/lib/listingPlans/revenuePricingMatrix.ts";
const payloadRel = "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts";
const checkoutLibRel = "app/lib/listingPlans/revenueCheckout.ts";
const fulfillmentRel = "app/lib/listingPlans/revenueFulfillment.ts";
const serviciosFulfillmentRel = "app/lib/listingPlans/revenueServiciosFulfillment.ts";
const previewRel = "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx";
const publishRouteRel = "app/api/clasificados/servicios/publish/route.ts";
const pendingHelperRel = "app/(site)/clasificados/publicar/servicios/lib/saveServiciosPendingBeforeCheckout.ts";
const sharedCheckpointUiRel = "app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx";
const docRel = "docs/servicios-global-checkout-standard-parity-01.md";

for (const rel of [
  checkpointRel, matrixRel, payloadRel, checkoutLibRel, fulfillmentRel,
  serviciosFulfillmentRel, previewRel, publishRouteRel, pendingHelperRel, sharedCheckpointUiRel, docRel,
]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`Missing: ${rel}`);
}

const checkpoint = read(checkpointRel);
const matrix = read(matrixRel);
const payload = read(payloadRel);
const checkoutLib = read(checkoutLibRel);
const fulfillment = read(fulfillmentRel);
const serviciosFulfillment = read(serviciosFulfillmentRel);
const preview = read(previewRel);
const publishRoute = read(publishRouteRel);
const pendingHelper = read(pendingHelperRel);
const sharedUi = read(sharedCheckpointUiRel);
const pkg = read("package.json");

// Package + price truth
if (!checkpoint.includes('SERVICIOS_OFFERS_ADDON_PACKAGE_KEY = "servicios_offers_addon"')) {
  fail("canonical servicios_offers_addon key required");
}
if (!checkpoint.includes('SERVICIOS_BASE_MONTHLY_PACKAGE_KEY = "servicios_base_monthly"')) {
  fail("canonical servicios_base_monthly key required");
}
if (!(matrix.includes("servicios_base_monthly") && matrix.includes("39900"))) {
  fail("matrix must define servicios base at 39900 ($399/mo)");
}
if (!(matrix.includes("servicios_offers_addon") && matrix.includes("9900"))) {
  fail("matrix must define servicios offers add-on at 9900 (+$99/mo)");
}
ok("package keys + $399 base / +$99 add-on price truth");

// Shared checkpoint has servicios branch + confirmations
if (!checkpoint.includes("SERVICIOS_CHECKPOINT_CONFIRMATIONS")) fail("Servicios confirmations preset required");
if (!checkpoint.includes('config.category === "servicios" && config.packageKey === SERVICIOS_BASE_MONTHLY_PACKAGE_KEY')) {
  fail("resolver must have a Servicios branch");
}
if (!checkpoint.includes("serviciosOffersAddonSelected")) fail("config must support serviciosOffersAddonSelected");
if (!checkpoint.includes("servicios_offers_addon_selected")) fail("metadata must include servicios_offers_addon_selected");
for (const needle of ["service area", "authorized to offer", "marketplace rules", "payment is required"]) {
  if (!checkpoint.toLowerCase().includes(needle)) fail(`Servicios confirmation copy missing: ${needle}`);
}
ok("shared checkpoint Servicios branch + 4 confirmations");

// Checkout payload constant
if (!payload.includes("SERVICIOS_BASE_CHECKOUT")) fail("SERVICIOS_BASE_CHECKOUT payload constant required");
if (!payload.includes('packageKey: "servicios_base_monthly"')) fail("base checkout must use servicios_base_monthly");

// Add-on allowlist (server) — Gate SERVICIOS-P7-BLOCKER-REPAIR-01 (B4): updated to current doctrine.
// This used to REQUIRE a servicios → offers add-on entry, i.e. the retired $79 model. Coupons/offers
// are now INCLUDED in servicios_base_monthly (Package C Build 3, owner-locked), so the add-on must
// NOT be purchasable: assert there is no Servicios entry in the server add-on allowlist.
{
  const start = checkoutLib.indexOf("const CHECKOUT_ADDON_ALLOWLIST");
  const allowlistBlock = start >= 0 ? checkoutLib.slice(start, checkoutLib.indexOf("\n};", start)) : "";
  if (!allowlistBlock) fail("CHECKOUT_ADDON_ALLOWLIST must exist");
  if (/\bservicios:\s*\{/.test(allowlistBlock)) {
    fail("the retired servicios offers add-on must NOT be purchasable via the server add-on allowlist");
  }
}
ok("checkout payload + server add-on allowlist (offers add-on not purchasable)");

// Preview UI wiring
if (!preview.includes("PublishCheckoutCheckpoint")) fail("preview must render shared checkpoint");
if (!preview.includes("saveServiciosPendingBeforeCheckout")) fail("preview must save pending before checkout");
if (!preview.includes("startRevenueCategoryCheckout")) fail("preview must call Revenue OS checkout");
if (!preview.includes("onPromoApply") || !preview.includes("validateRevenuePromoForCheckout")) {
  fail("preview must wire promo Apply validation");
}
if (!preview.includes("CHECKOUT_NEWSLETTER_SOURCES.servicios")) fail("preview must wire servicios newsletter capture");
if (!preview.includes("rulesModal")) fail("preview must pass Leonix rules modal");
if (!preview.includes("showFinalCheckout")) fail("preview must gate final checkout to application flow (preview stays viewable)");
ok("preview final checkout UI (promo/newsletter/rules) for both lanes");

// Pending save + publish route pending_payment
if (!pendingHelper.includes('activationMode: "pending_payment"')) fail("pending helper must request pending_payment");
if (!publishRoute.includes("pending_payment")) fail("publish route must support pending_payment");
if (!publishRoute.includes("payment_required")) fail("publish route must block unpaid first publish in strict env");
if (!publishRoute.includes("pendingPayment: true")) fail("publish route must return pendingPayment result with listingId");
if (!publishRoute.includes("persistedListingId")) fail("publish route must return real listingId for checkout");
ok("pending_payment save + Revenue OS handoff");

// Webhook fulfillment activation (no raw-body change)
if (!serviciosFulfillment.includes("activatePaidServiciosListingFromRevenueOs")) fail("servicios fulfillment activation required");
if (!serviciosFulfillment.includes('listing_status: "published"')) fail("fulfillment must flip to published on paid truth");
if (!fulfillment.includes("tryActivateServiciosListingAfterEntitlement")) fail("fulfillment orchestration must call servicios activation");
if (!fulfillment.includes("activatePaidServiciosListingFromRevenueOs")) fail("fulfillment must import servicios activation");
ok("webhook fulfillment activates paid Servicios listing (pending_payment → published)");

// Rules modal in shared UI (optional prop)
if (!sharedUi.includes("rulesModal")) fail("shared checkpoint must support optional rules modal");

// No regression to Restaurante checkout behavior
if (!fulfillment.includes("tryActivateRestauranteListingAfterEntitlement")) fail("must not remove Restaurante activation");
// Gate SERVICIOS-P7-BLOCKER-REPAIR-01 — updated to current doctrine. The Restaurante offers add-on was
// retired by Package C Build 3 (coupons included in its base too), so its allowlist entry is
// legitimately gone and this check could never pass again. What Servicios work must not regress is
// the SHARED add-on allowlist that still serves the categories with real add-ons.
if (!checkoutLib.includes("const CHECKOUT_ADDON_ALLOWLIST")) fail("must not remove the shared add-on allowlist");
if (!checkoutLib.includes('basePackageKey: "br_agent_monthly"') || !checkoutLib.includes('basePackageKey: "autos_dealer_monthly"')) {
  fail("must not remove the Bienes / Autos add-on allowlist entries");
}
ok("Restaurante checkout/activation preserved");

// Package scripts + doc headings
if (!pkg.includes("verify:servicios-global-checkout-standard-parity-01")) fail("verify package script missing");
const doc = read(docRel);
for (const heading of ["Package/pricing", "Autos", "Both Servicios", "Pending", "READY TO COMMIT"]) {
  if (!doc.includes(heading)) fail(`doc missing section: ${heading}`);
}
ok("package script + doc headings");

console.log("verify-servicios-global-checkout-standard-parity-01: PASS");
