/**
 * RESTAURANTES-DASHBOARD-ADDON-ONLY-CHECKOUT-RETURN-LOCK-01 verification.
 * Run: npm run verify:restaurantes-dashboard-addon-only-checkout-return-lock-01
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function fail(msg) {
  console.error(`verify-restaurantes-dashboard-addon-only-checkout-return-lock-01: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const doc = read("docs/restaurantes-dashboard-addon-only-checkout-return-lock-01.md");
const payload = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
const checkout = read("app/lib/listingPlans/revenueCheckout.ts");
const route = read("app/api/revenue-os/checkout/route.ts");
const dashboardHelper = read("app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts");
const misAnuncios = read("app/(site)/dashboard/mis-anuncios/page.tsx");
const categoryTools = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");
const inventory = read("app/(site)/dashboard/lib/dashboardInventory.ts");
const fulfillment = read("app/lib/listingPlans/revenueRestaurantFulfillment.ts");
const revenueFulfillment = read("app/lib/listingPlans/revenueFulfillment.ts");
const preview = read("app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx");
const webhook = read("app/api/revenue-os/webhook/route.ts");
const pkg = read("package.json");

for (const section of [
  "Problem",
  "Correct initial checkout",
  "Add-on-only payload",
  "Return path",
  "Fulfillment behavior",
  "Manual QA",
  "What was protected",
]) {
  if (!doc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("restaurante addon doc sections present");

if (!payload.includes("RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT")) {
  fail("Payload must define dashboard add-on-only checkout constant");
}
if (
  !payload.includes("restaurantes_offers_addon") &&
  !payload.includes("RESTAURANTES_COUPON_ADDON_PACKAGE_KEY")
) {
  fail("Dashboard checkout must use restaurantes_offers_addon");
}
ok("dashboard checkout payload uses restaurantes_offers_addon");

if (
  !dashboardHelper.includes("restaurantes_offers_addon") &&
  !dashboardHelper.includes("RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT")
) {
  fail("Dashboard helper must use restaurantes_offers_addon");
}
if (dashboardHelper.includes("restaurantes_base_monthly")) {
  fail("Dashboard helper must not include restaurantes_base_monthly");
}
if (!dashboardHelper.includes("listingId")) fail("Dashboard helper must require listingId");
if (!dashboardHelper.includes("buildDashboardMisAnunciosReturnPath")) {
  fail("Dashboard helper must use dashboard-safe return path");
}
ok("dashboard helper is add-on-only with listing id");

if (!checkout.includes("RESTAURANTES_OFFERS_ADDON_PACKAGE_KEY")) fail("Checkout validation must know addon package");
if (!checkout.includes("listing_id_required")) fail("Checkout must require listingId for addon-only");
ok("server validates add-on-only checkout");

if (!misAnuncios.includes("redirectRestauranteDashboardCouponAddonCheckout")) {
  fail("Mis anuncios must wire dashboard coupon upgrade checkout");
}
if (!categoryTools.includes("couponUpgrade")) fail("Category tools must expose couponUpgrade action");
if (!inventory.includes("restaurantCouponUpgradeEligible")) fail("Inventory must compute coupon upgrade eligibility");
ok("dashboard UI wired for coupon upgrade");

if (!fulfillment.includes("activateRestauranteCouponAddonFromRevenueOs")) {
  fail("Fulfillment must activate coupon addon on existing listing");
}
if (!fulfillment.includes("couponUpgradeEnabled = true")) fail("Fulfillment must set couponUpgradeEnabled");
if (!revenueFulfillment.includes("tryActivateRestauranteCouponAddonAfterEntitlement")) {
  fail("Revenue fulfillment must call coupon addon activation");
}
ok("add-on-only fulfillment updates existing listing");

if (!preview.includes("RESTAURANTES_BASE_CHECKOUT")) fail("Initial preview checkout must remain on base package");
if (!preview.includes("addOns")) fail("Initial preview must still support optional coupon add-on");
ok("initial Restaurante application checkout unchanged");

if (!webhook.includes("verifyStripeWebhookEvent") || !webhook.includes("rawBody")) {
  fail("Webhook route must retain Stripe signature verification with raw body");
}
ok("Stripe webhook raw signature path untouched by this gate");

if (!pkg.includes("verify:restaurantes-dashboard-addon-only-checkout-return-lock-01")) {
  fail("package.json must include restaurantes dashboard addon verifier script");
}

console.log("verify-restaurantes-dashboard-addon-only-checkout-return-lock-01: PASS");
