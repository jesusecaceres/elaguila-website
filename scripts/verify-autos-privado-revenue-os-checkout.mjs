/**
 * Autos Privado Revenue OS preview checkout — static verification.
 * Run: npm run verify:autos-privado-revenue-os-checkout
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}
function fail(message) {
  console.error(`verify-autos-privado-revenue-os-checkout: FAIL - ${message}`);
  process.exit(1);
}
function ok(message) {
  console.log(`OK: ${message}`);
}

const preview = "app/(site)/clasificados/autos/privado/preview/AutosPrivadoPreviewClient.tsx";
const paidCheckout = "app/(site)/clasificados/autos/privado/lib/autosPrivadoPreviewPaidCheckout.ts";
const pendingSave = "app/(site)/clasificados/autos/privado/lib/saveAutosPrivadoPendingBeforeCheckout.ts";
const checkpoint = "app/lib/listingPlans/publishCheckoutCheckpoint.ts";
const fulfillment = "app/lib/listingPlans/revenueFulfillment.ts";
const autosFulfillment = "app/lib/listingPlans/revenueAutosPrivadoFulfillment.ts";
const checkoutRoute = "app/api/revenue-os/checkout/route.ts";
const dealerApp = "app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx";
const pkg = "package.json";

for (const rel of [preview, paidCheckout, pendingSave, checkpoint, fulfillment, autosFulfillment, checkoutRoute, pkg]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const previewSrc = read(preview);
const paidSrc = read(paidCheckout);
const pendingSrc = read(pendingSave);
const checkpointSrc = read(checkpoint);
const fulfillmentSrc = read(fulfillment);
const autosFulfillmentSrc = read(autosFulfillment);
const checkoutSrc = read(checkoutRoute);
const pkgSrc = read(pkg);

if (!previewSrc.includes("PublishCheckoutCheckpoint")) {
  fail("Preview must mount shared PublishCheckoutCheckpoint");
}
if (!previewSrc.includes("onPromoApply") || !previewSrc.includes("promoCode: ctx.promoCode")) {
  fail("Preview must wire promo apply + forward promo code");
}
if (!previewSrc.includes("startRevenueCategoryCheckout")) {
  fail("Preview must call central Revenue OS checkout");
}
if (!previewSrc.includes("saveAutosPrivadoPendingBeforeCheckout")) {
  fail("Preview must hidden-save pending listing before Stripe");
}
if (!previewSrc.includes("captureCheckoutNewsletterSubscriber")) {
  fail("Preview must include newsletter capture");
}
if (!previewSrc.includes('mode === "draft"')) {
  fail("Checkout must show only for seller draft preview (not demo)");
}
ok("preview mounts shared Revenue OS checkout block");

if (!paidSrc.includes("AUTOS_PRIVADO_30D_PACKAGE_KEY") || !paidSrc.includes("$24.99")) {
  fail("Paid checkout helper must reference autos_privado_30d / $24.99");
}
if (!paidSrc.includes("AUTOS_PRIVADO_CHECKPOINT_CONFIRMATIONS")) {
  fail("Paid checkout helper must use privado confirmations");
}
ok("autos privado checkpoint config present");

if (!pendingSrc.includes('lane: "privado"') || !pendingSrc.includes("/api/clasificados/autos/listings")) {
  fail("Pending save must create/sync privado listing via autos listings API");
}
if (pendingSrc.match(/publish|active/i) && pendingSrc.includes('status: "active"')) {
  fail("Pending save must not publish before payment");
}
ok("hidden pending save before Stripe");

if (!checkpointSrc.includes("AUTOS_PRIVADO_30D_PACKAGE_KEY")) {
  fail("publishCheckoutCheckpoint must define AUTOS_PRIVADO_30D_PACKAGE_KEY");
}
if (!checkpointSrc.includes("AUTOS_PRIVADO_CHECKPOINT_CONFIRMATIONS")) {
  fail("publishCheckoutCheckpoint must define privado confirmations");
}
ok("shared checkpoint package key + confirmations");

if (!autosFulfillmentSrc.includes("tryActivateAutosListingAfterPayment")) {
  fail("Autos privado fulfillment must call tryActivateAutosListingAfterPayment");
}
if (!autosFulfillmentSrc.includes('row.lane !== "privado"')) {
  fail("Autos privado fulfillment must exclude dealer lane");
}
if (!fulfillmentSrc.includes("tryActivateAutosPrivadoListingAfterEntitlement")) {
  fail("revenueFulfillment must wire Autos Privado activation");
}
ok("Revenue OS webhook activates Autos Privado pending listings");

if (!checkoutSrc.includes("setAutosListingPendingPayment")) {
  fail("Revenue OS checkout must mark autos privado listing pending_payment");
}
if (!checkoutSrc.includes("AUTOS_PRIVADO_30D_PACKAGE_KEY")) {
  fail("Revenue OS checkout must gate pending_payment to autos_privado_30d");
}
ok("checkout marks listing pending before Stripe");

if (existsSync(path.join(root, dealerApp))) {
  const dealerSrc = read(dealerApp);
  if (dealerSrc.includes("autos-privado-publish-checkout-checkpoint")) {
    fail("Dealer application must not mount privado preview checkout");
  }
}
ok("dealer inventory checkout untouched");

if (!pkgSrc.includes("verify:autos-privado-revenue-os-checkout")) {
  fail("package.json missing verifier script");
}

console.log("verify-autos-privado-revenue-os-checkout: PASS");
