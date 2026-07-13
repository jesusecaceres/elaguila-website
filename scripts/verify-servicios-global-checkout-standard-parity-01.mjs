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

// Add-on allowlist (server)
if (!checkoutLib.includes("SERVICIOS_OFFERS_ADDON_PACKAGE_KEY")) fail("checkout allowlist must import servicios add-on key");
if (!/servicios:\s*\{[\s\S]*servicios_base_monthly[\s\S]*allowedKeys/.test(checkoutLib)) {
  fail("server add-on allowlist must include servicios base → offers add-on");
}
ok("checkout payload + server add-on allowlist");

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
if (!checkoutLib.includes("restaurantes:")) fail("must not remove Restaurante add-on allowlist");
ok("Restaurante checkout/activation preserved");

// Package scripts + doc headings
if (!pkg.includes("verify:servicios-global-checkout-standard-parity-01")) fail("verify package script missing");
const doc = read(docRel);
for (const heading of ["Package/pricing", "Autos", "Both Servicios", "Pending", "READY TO COMMIT"]) {
  if (!doc.includes(heading)) fail(`doc missing section: ${heading}`);
}
ok("package script + doc headings");

console.log("verify-servicios-global-checkout-standard-parity-01: PASS");
