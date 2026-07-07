/**
 * RESTAURANTES-P0C-DASHBOARD-COUPON-CTA-LISTING-CONTEXT-OWNER-LOCK verification.
 * Run: npm run verify:restaurantes-p0c-dashboard-coupon-context-owner-lock
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
  console.error(`verify-restaurantes-p0c-dashboard-coupon-context-owner-lock: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const doc = read("docs/restaurantes-p0c-dashboard-coupon-context-owner-lock.md");
const categoryTools = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");
const actionBar = read("app/(site)/dashboard/components/DashboardListingActionBar.tsx");
const dashboardHelper = read("app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts");
const misAnuncios = read("app/(site)/dashboard/mis-anuncios/page.tsx");
const checkoutClient = read("app/lib/listingPlans/revenueCategoryCheckoutClient.ts");
const checkoutRoute = read("app/api/revenue-os/checkout/route.ts");
const checkout = read("app/lib/listingPlans/revenueCheckout.ts");
const payload = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
const application = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
const fulfillment = read("app/lib/listingPlans/revenueRestaurantFulfillment.ts");
const preview = read("app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx");
const webhook = read("app/api/revenue-os/webhook/route.ts");
const pkg = read("package.json");

for (const section of [
  "Executive Summary",
  "Live QA Problem",
  "Root Cause",
  "Login User ID Ownership Chain",
  "Dashboard CTA Bug",
  "Manual QA",
  "Next Gate Recommendation",
]) {
  if (!doc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("documentation sections present");

if (!categoryTools.includes("onClick: opts.onCouponUpgrade")) {
  fail("Category tools must push coupon upgrade onClick action");
}
if (!categoryTools.includes("onClick: opts.onCouponEdit")) {
  fail("Category tools must push coupon edit onClick action");
}
if (categoryTools.includes("return actions.filter((action) => Boolean(action.href));")) {
  fail("Inventory actions must not filter out onClick-only actions");
}
if (!categoryTools.includes("Boolean(action.href) || Boolean(action.onClick)")) {
  fail("Inventory actions filter must keep href or onClick actions");
}
if (!actionBar.includes("action.onClick")) fail("Action bar must render onClick actions");
ok("dashboard action filter keeps onClick coupon CTAs");

if (!categoryTools.includes("Agregar cupones +$99/mes")) {
  fail("Upgrade label must include Agregar cupones +$99/mes");
}
if (!categoryTools.includes("Editar cupones")) fail("Edit label must include Editar cupones");
ok("dashboard Restaurante coupon CTA labels present");

if (!dashboardHelper.includes("startRestauranteDashboardCouponAddonCheckout")) {
  fail("Dashboard helper must expose add-on-only checkout starter");
}
if (!dashboardHelper.includes("listingId")) fail("Dashboard helper must require listingId");
if (
  !dashboardHelper.includes("RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT") &&
  !dashboardHelper.includes("restaurantes_offers_addon")
) {
  fail("Dashboard helper must use restaurantes_offers_addon");
}
if (dashboardHelper.includes("restaurantes_base_monthly")) {
  fail("Dashboard helper must not include restaurantes_base_monthly");
}
if (!misAnuncios.includes("redirectRestauranteDashboardCouponAddonCheckout")) {
  fail("Mis anuncios must wire dashboard coupon upgrade checkout");
}
ok("dashboard add-on-only checkout helper proof");

if (!checkoutClient.includes("Authorization: `Bearer ${token}`")) {
  fail("Client checkout must send bearer token");
}
if (!checkoutClient.includes("Sign in to continue")) fail("Client checkout must block without session");
ok("client checkout requires auth bearer token");

if (!checkout.includes("validateRestauranteAddonOnlyListingOwnership")) {
  fail("Checkout module must validate Restaurante add-on listing ownership");
}
if (!checkout.includes("owner_user_id")) fail("Owner validation must check owner_user_id");
if (!checkoutRoute.includes("validateRestauranteAddonOnlyListingOwnership")) {
  fail("Checkout route must call owner validation for add-on-only");
}
const routePaymentIdx = checkoutRoute.indexOf("createPendingPaymentRecord");
const routeOwnerIdx = checkoutRoute.indexOf("validateRestauranteAddonOnlyListingOwnership");
if (routeOwnerIdx < 0 || routePaymentIdx < 0 || routeOwnerIdx > routePaymentIdx) {
  fail("Owner validation must run before createPendingPaymentRecord");
}
const routeStripeIdx = checkoutRoute.indexOf("createRevenueStripeCheckoutSession");
if (routeOwnerIdx < 0 || routeStripeIdx < 0 || routeOwnerIdx > routeStripeIdx) {
  fail("Owner validation must run before createRevenueStripeCheckoutSession");
}
if (!checkoutRoute.includes("listing_owner_mismatch") && !checkout.includes("listing_owner_mismatch")) {
  fail("Owner mismatch must be blocked");
}
ok("server owner validation before Stripe/payment record");

if (!dashboardHelper.includes(".eq(\"owner_user_id\", userId)")) {
  fail("Coupon edit hydrate must filter by owner_user_id");
}
if (!dashboardHelper.includes("listingId")) fail("Edit href helper must include listingId");
if (!dashboardHelper.includes("mode: \"dashboard-edit\"")) {
  fail("Edit href must include dashboard-edit mode");
}
if (!application.includes("mode=dashboard-edit") && !application.includes("dashboard-edit")) {
  fail("Application must detect dashboard edit context");
}
if (!application.includes("dashboard-addon") && !application.includes("dashboardAddon")) {
  fail("Application must detect dashboard add-on context");
}
if (!application.includes("listingId")) fail("Application must require listingId in dashboard context");
if (!application.includes("startRestauranteDashboardCouponAddonCheckout") &&
    !application.includes("redirectRestauranteDashboardCouponAddonCheckout")) {
  fail("Application dashboard add-on mode must call add-on-only checkout");
}
if (!application.includes("$99")) fail("Application dashboard add-on banner must show $99-only copy");
ok("edit/hydrate owner-safe + application dashboard context");

if (!fulfillment.includes("owner_user_id")) {
  fail("Fulfillment must compare payment owner to listing owner");
}
if (!fulfillment.includes("couponUpgradeEnabled = true")) {
  fail("Fulfillment must set couponUpgradeEnabled after payment");
}
ok("add-on-only fulfillment owner/listing safety");

if (!preview.includes("RESTAURANTES_BASE_CHECKOUT")) fail("Initial preview must keep base checkout");
if (!preview.includes("addOns")) fail("Initial preview must support optional coupon add-on");
ok("initial application checkout protected");

if (!webhook.includes("verifyStripeWebhookEvent") || !webhook.includes("rawBody")) {
  fail("Stripe webhook raw signature path must remain untouched");
}
ok("Stripe webhook untouched");

if (!pkg.includes("verify:restaurantes-p0c-dashboard-coupon-context-owner-lock")) {
  fail("package.json must include P0C verifier script");
}

console.log("verify-restaurantes-p0c-dashboard-coupon-context-owner-lock: PASS");
