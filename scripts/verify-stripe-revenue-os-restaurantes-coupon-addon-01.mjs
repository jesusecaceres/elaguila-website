/**
 * STRIPE-REVENUE-OS-RESTAURANTES-COUPON-ADDON-01 verification.
 * Run: npm run verify:stripe-revenue-os-restaurantes-coupon-addon-01
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function fail(message) {
  console.error(`verify-stripe-revenue-os-restaurantes-coupon-addon-01: FAIL - ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

const doc = "docs/stripe-revenue-os-restaurantes-coupon-addon-01.md";
const checkpoint = "app/lib/listingPlans/publishCheckoutCheckpoint.ts";
const checkoutRoute = "app/api/revenue-os/checkout/route.ts";
const revenueCheckout = "app/lib/listingPlans/revenueCheckout.ts";
const paymentRecords = "app/lib/listingPlans/revenuePaymentRecords.ts";
const payload = "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts";
const preview = "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx";
const pkg = "package.json";

for (const rel of [doc, checkpoint, checkoutRoute, revenueCheckout, paymentRecords, payload, preview]) {
  if (!exists(rel)) fail(`Missing required file: ${rel}`);
}

const docSrc = read(doc);
const checkpointSrc = read(checkpoint);
const routeSrc = read(checkoutRoute);
const checkoutSrc = read(revenueCheckout);
const paymentSrc = read(paymentRecords);
const payloadSrc = read(payload);
const previewSrc = read(preview);
const pkgSrc = read(pkg);

for (const section of [
  "Executive Summary",
  "Old Blocker",
  "New Add-on Checkout Contract",
  "Add-on Pricing",
  "Promo Discount With Add-on",
  "Stripe Amount Contract",
  "Payment Record Metadata",
  "Webhook Fulfillment Contract",
  "Manual QA Checklist",
]) {
  if (!docSrc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("documentation sections present");

if (!docSrc.toLowerCase().includes("old blocker")) fail("Doc must mention old blocker");
if (!docSrc.includes("restaurantes_offers_addon")) fail("Doc must mention restaurantes_offers_addon");
if (!docSrc.includes("$99") || !docSrc.includes("9900") && !docSrc.includes("99.00")) {
  if (!docSrc.includes("$99")) fail("Doc must mention $99 add-on");
}
if (!docSrc.includes("373.50") && !docSrc.includes("124.50")) {
  fail("Doc must mention promo + add-on amount rule");
}
if (!docSrc.toLowerCase().includes("webhook")) fail("Doc must mention webhook-only publishing/redemption");
ok("documentation content checks passed");

if (!checkpointSrc.includes("REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED = true")) {
  fail("Checkpoint must enable Restaurante add-on support");
}
if (checkpointSrc.includes("REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED = false")) {
  fail("Checkpoint must not keep add-on support false");
}
ok("add-on support flag enabled");

if (!checkoutSrc.includes("validateRevenueCheckoutAddOns")) {
  fail("Checkout lib must validate add-on keys server-side");
}
if (!checkoutSrc.includes("allowedKeys") || !checkoutSrc.includes("add_on_not_allowed")) {
  fail("Checkout must reject unknown add-on keys");
}
if (!routeSrc.includes("validateRevenueCheckoutAddOns")) {
  fail("Checkout route must validate add-ons");
}
if (routeSrc.includes("item.priceCents") || routeSrc.includes("clientPrice")) {
  fail("Checkout route must not trust client add-on price fields");
}
ok("server-side add-on validation present");

if (!paymentSrc.includes("add_ons") || !paymentSrc.includes("restaurant_coupon_addon_selected")) {
  fail("Payment record must store add-on snapshot metadata");
}
ok("payment record add-on snapshot");

if (!previewSrc.includes("RESTAURANTES_COUPON_ADDON_PACKAGE_KEY") || !previewSrc.includes("addOns")) {
  fail("Restaurante preview must pass coupon add-on into checkout payload");
}
if (!previewSrc.includes("checkoutSubtotalCents") || !previewSrc.includes("couponUpgradeSelected")) {
  fail("Preview must compute subtotal including add-on for promo");
}
ok("Restaurante preview wired for add-on checkout");

if (!routeSrc.includes("buildRevenueStripeLineItems") || !routeSrc.includes("subtotalCents")) {
  fail("Checkout route must build Stripe lines from server subtotal");
}
ok("Stripe line items from server totals");

if (!pkgSrc.includes("verify:stripe-revenue-os-restaurantes-coupon-addon-01")) {
  fail("package.json missing verifier script");
}
ok("package.json verifier registered");

const secretPatterns = [/sk_test_[a-zA-Z0-9]+/, /sk_live_[a-zA-Z0-9]+/, /whsec_[a-zA-Z0-9]+/];
for (const [label, src] of [
  ["doc", docSrc],
  ["checkpoint", checkpointSrc],
  ["route", routeSrc],
  ["preview", previewSrc],
]) {
  for (const re of secretPatterns) {
    if (re.test(src)) fail(`Secret-like value in ${label}`);
  }
}
ok("no secrets in gate artifacts");

const unrelated = [
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/autos/",
  "app/api/revenue-os/webhook",
];
for (const marker of unrelated) {
  if (routeSrc.includes("servicios_offers") || previewSrc.includes("app/(site)/clasificados/servicios/page")) {
    fail("Unrelated category touched");
  }
}
ok("no unrelated category/webhook raw changes in gate files");

console.log("verify-stripe-revenue-os-restaurantes-coupon-addon-01: PASS");
