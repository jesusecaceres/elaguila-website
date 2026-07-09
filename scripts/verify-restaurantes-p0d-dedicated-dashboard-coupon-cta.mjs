/**
 * RESTAURANTES-P0D-DEDICATED-DASHBOARD-COUPON-CTA verification.
 * Run: npm run verify:restaurantes-p0d-dedicated-dashboard-coupon-cta
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
  console.error(`verify-restaurantes-p0d-dedicated-dashboard-coupon-cta: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const doc = read("docs/restaurantes-p0d-dedicated-dashboard-coupon-cta.md");
const dedicatedPage = read("app/(site)/dashboard/restaurantes/page.tsx");
const dashboardHelper = read("app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts");
const application = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
const checkoutRoute = read("app/api/revenue-os/checkout/route.ts");
const checkout = read("app/lib/listingPlans/revenueCheckout.ts");
const preview = read("app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx");
const webhook = read("app/api/revenue-os/webhook/route.ts");
const pkg = read("package.json");

for (const section of [
  "Executive Summary",
  "Live QA problem",
  "Root cause",
  "Dedicated dashboard vs Mis anuncios",
  "Manual QA",
  "Next Gate Recommendation",
]) {
  if (!doc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("documentation sections present");

if (!dedicatedPage.includes("listing_json")) fail("Dedicated dashboard must select listing_json");
if (!dedicatedPage.includes('.eq("owner_user_id", user.id)')) {
  fail("Dedicated dashboard must filter by owner_user_id");
}
ok("dedicated dashboard query selects listing_json with owner filter");

if (!dedicatedPage.includes("restauranteCouponInactiveDashboardHint")) {
  fail("Inactive listings must point owners to Editar restaurante / Section G");
}
if (dedicatedPage.includes("startCouponAddonCheckout")) {
  fail("Inactive outside Destacar ofertas CTA must be removed from dashboard cards");
}
if (!dedicatedPage.includes("Editar ofertas") && !dedicatedPage.includes("restauranteCouponEditLabel")) {
  fail("Dedicated dashboard must show Editar ofertas for active listings");
}
if (!dedicatedPage.includes("Editar restaurante") && !dedicatedPage.includes("t.hydrate")) {
  fail("Editar restaurante must remain on dedicated dashboard");
}
ok("dedicated dashboard coupon CTA labels present");

if (dedicatedPage.includes("redirectRestauranteDashboardCouponAddonCheckout")) {
  fail("Outside dashboard card must not start add-on checkout directly");
}
if (!dedicatedPage.includes("restauranteListingEditHref")) {
  fail("Editar restaurante must route with listing-edit context");
}
ok("inactive outside checkout removed; listing-edit route preserved");

if (!dedicatedPage.includes("hydrateRestauranteListingForCouponEdit")) {
  fail("Active CTA must hydrate listing for coupon edit");
}
if (!dedicatedPage.includes("restauranteCouponEditHref")) {
  fail("Active CTA must use coupon edit href with listing context");
}
if (!dedicatedPage.includes("mode: \"coupon-edit\"") && !dashboardHelper.includes("mode: \"coupon-edit\"")) {
  fail("Active CTA must include coupon-edit mode");
}
ok("active CTA opens coupon-only edit with listing context");

if (
  !dashboardHelper.includes("restaurantes_offers_addon") &&
  !dashboardHelper.includes("RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT")
) {
  fail("Checkout helper must use restaurantes_offers_addon");
}
if (dashboardHelper.includes("restaurantes_base_monthly")) {
  fail("Checkout helper must exclude restaurantes_base_monthly");
}
ok("add-on-only checkout package proof");

if (!checkoutRoute.includes("validateRestauranteAddonOnlyListingOwnership")) {
  fail("Checkout route must validate Restaurante add-on listing ownership");
}
const routePaymentIdx = checkoutRoute.indexOf("createPendingPaymentRecord");
const routeOwnerIdx = checkoutRoute.indexOf("validateRestauranteAddonOnlyListingOwnership");
if (routeOwnerIdx < 0 || routePaymentIdx < 0 || routeOwnerIdx > routePaymentIdx) {
  fail("Owner validation must run before createPendingPaymentRecord");
}
if (!checkout.includes("owner_user_id")) fail("Owner validation must check owner_user_id");
ok("server owner validation before payment/Stripe");

if (!application.includes("coupon-edit") && !application.includes("coupon-addon")) {
  fail("Application must detect dashboard coupon-edit/addon context");
}
if (!application.includes("Estás editando cupones") && !application.includes("editing coupons for an existing listing")) {
  fail("Application must show coupon edit banner");
}
ok("application dashboard coupon context");

if (!preview.includes("RESTAURANTES_BASE_CHECKOUT")) fail("Initial preview must keep base checkout");
if (!preview.includes("addOns")) fail("Initial preview must support optional add-on");
ok("initial application checkout protected");

if (!webhook.includes("verifyStripeWebhookEvent") || !webhook.includes("rawBody")) {
  fail("Stripe webhook raw signature path must remain untouched");
}
ok("Stripe webhook untouched");

if (!pkg.includes("verify:restaurantes-p0d-dedicated-dashboard-coupon-cta")) {
  fail("package.json must include P0D verifier script");
}

console.log("verify-restaurantes-p0d-dedicated-dashboard-coupon-cta: PASS");
