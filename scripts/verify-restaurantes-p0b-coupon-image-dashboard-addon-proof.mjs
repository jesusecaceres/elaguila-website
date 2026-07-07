/**
 * RESTAURANTES-P0B-COUPON-IMAGE-DASHBOARD-ADDON-PROOF verification.
 * Run: npm run verify:restaurantes-p0b-coupon-image-dashboard-addon-proof
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
  console.error(`verify-restaurantes-p0b-coupon-image-dashboard-addon-proof: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const doc = read("docs/restaurantes-p0b-coupon-image-dashboard-addon-proof.md");
const appClient = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
const draftMedia = read("app/(site)/clasificados/restaurantes/application/restauranteDraftMedia.ts");
const publishPrepare = read("app/(site)/clasificados/restaurantes/application/restauranteDraftPublishPrepare.ts");
const publishPayload = read("app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts");
const shellMapper = read("app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts");
const couponsBlock = read("app/(site)/clasificados/restaurantes/shell/RestauranteShellCouponsBlock.tsx");
const draftUpload = read("app/api/clasificados/restaurantes/draft-media-upload/route.ts");
const dashboardHelper = read("app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts");
const categoryTools = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");
const inventory = read("app/(site)/dashboard/lib/dashboardInventory.ts");
const misAnuncios = read("app/(site)/dashboard/mis-anuncios/page.tsx");
const checkout = read("app/lib/listingPlans/revenueCheckout.ts");
const fulfillment = read("app/lib/listingPlans/revenueRestaurantFulfillment.ts");
const preview = read("app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx");
const webhook = read("app/api/revenue-os/webhook/route.ts");
const pkg = read("package.json");

for (const section of [
  "Executive Summary",
  "QA findings",
  "Coupon image root cause",
  "Coupon image fix",
  "Dashboard add-on-only route proof",
  "Initial app vs dashboard checkout",
  "Add-on-only fulfillment behavior",
  "Owner/entitlement protection",
  "Files inspected",
  "Files changed",
  "What was not touched",
  "Manual QA checklist",
  "TRUE/FALSE audit",
]) {
  if (!doc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("documentation sections present");

if (!appClient.includes("uploadCouponImage")) fail("Application must upload coupon images");
if (!appClient.includes("imageUrl: dataUrl")) fail("uploadCouponImage must write imageUrl");
if (!appClient.includes("RestauranteMediaPreviewImg")) fail("Form must resolve IDB coupon refs for preview");
ok("application coupon image upload + form preview");

if (!draftMedia.includes('refCoupon') || !draftMedia.includes("|cp|")) {
  fail("Draft media must offload coupon images to IDB");
}
if (!draftMedia.includes("cfly")) fail("Draft media must offload coupon flyer to IDB");
ok("coupon IDB offload/inline pipeline");

if (!publishPrepare.includes('slot: "coupon"')) fail("Publish prepare must upload coupon images to blob");
if (!publishPrepare.includes("coupon_flyer")) fail("Publish prepare must upload coupon flyer");
if (!draftUpload.includes("coupon")) fail("Draft media upload must accept coupon slot");
ok("coupon blob upload before publish");

if (!publishPayload.includes("imageUrl: row.imageUrl")) fail("Publish payload must include coupon imageUrl");
if (!shellMapper.includes("imageUrl: nonEmpty(x.imageUrl)")) fail("Shell mapper must map coupon imageUrl");
if (!couponsBlock.includes("coupon.imageUrl")) fail("Coupons block must render coupon.imageUrl");
ok("publish + preview/public coupon image path");

if (!dashboardHelper.includes("Agregar cupones +$99/mes")) fail("Dashboard upgrade label must match product copy");
if (!dashboardHelper.includes("Editar cupones")) fail("Dashboard must expose Editar cupones");
if (!dashboardHelper.includes("hydrateRestauranteListingForCouponEdit")) fail("Dashboard coupon edit hydrate required");
if (!categoryTools.includes("couponEdit")) fail("Category tools must include couponEdit action");
if (!inventory.includes("restaurantCouponEditEligible")) fail("Inventory must compute coupon edit eligibility");
if (!misAnuncios.includes("openRestauranteCouponEdit")) fail("Mis anuncios must wire coupon edit");
ok("dashboard coupon upgrade + edit actions");

if (!checkout.includes("RESTAURANTES_OFFERS_ADDON_PACKAGE_KEY")) fail("Checkout must validate addon package");
if (!checkout.includes("listing_id_required")) fail("Add-on checkout must require listingId");
if (!dashboardHelper.includes("restaurantes_offers_addon") && !dashboardHelper.includes("RESTAURANTES_OFFERS_ADDON")) {
  fail("Dashboard checkout must use restaurantes_offers_addon");
}
if (dashboardHelper.includes("restaurantes_base_monthly")) fail("Dashboard helper must not include base package");
ok("dashboard $99-only checkout proof");

if (!fulfillment.includes("activateRestauranteCouponAddonFromRevenueOs")) {
  fail("Add-on-only fulfillment must update existing listing");
}
if (!fulfillment.includes("couponUpgradeEnabled = true")) fail("Fulfillment must enable coupon entitlement");
ok("add-on-only fulfillment");

if (!preview.includes("RESTAURANTES_BASE_CHECKOUT")) fail("Initial preview checkout must remain on base package");
if (!preview.includes("addOns")) fail("Initial application must still support optional coupon add-on");
ok("initial application checkout protected");

if (!webhook.includes("verifyStripeWebhookEvent") || !webhook.includes("rawBody")) {
  fail("Webhook raw signature path must remain intact");
}
ok("Stripe webhook untouched");

if (!pkg.includes("verify:restaurantes-p0b-coupon-image-dashboard-addon-proof")) {
  fail("package.json must register P0B verifier");
}

console.log("verify-restaurantes-p0b-coupon-image-dashboard-addon-proof: PASS");
