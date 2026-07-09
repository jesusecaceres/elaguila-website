/**
 * RESTAURANTES-P0F-DASHBOARD-EDIT-COUPON-ROUTE-IMAGE-PERSISTENCE verification.
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
  console.error(`verify-restaurantes-p0f-dashboard-edit-coupon-route-image-persistence: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const doc = read("docs/restaurantes-p0f-dashboard-edit-coupon-route-image-persistence.md");
const dedicated = read("app/(site)/dashboard/restaurantes/page.tsx");
const helper = read("app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts");
const application = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
const publishPrepare = read("app/(site)/clasificados/restaurantes/application/restauranteDraftPublishPrepare.ts");
const publishPayload = read("app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts");
const couponsBlock = read("app/(site)/clasificados/restaurantes/shell/RestauranteShellCouponsBlock.tsx");
const webhook = read("app/api/revenue-os/webhook/route.ts");
const pkg = read("package.json");

for (const section of ["Executive summary", "Manual QA", "Coupon image persistence"]) {
  if (!doc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("documentation present");

if (!dedicated.includes("restauranteListingEditHref")) fail("Dashboard must use listing edit href");
if (!dedicated.includes('mode: "listing-edit"') && !helper.includes('mode: "listing-edit"')) {
  fail("Listing edit mode must be defined");
}
if (!dedicated.includes("listingId")) fail("Dashboard edit must include listingId");
if (!dedicated.includes("returnPanel")) fail("Dashboard edit must include returnPanel");
if (dedicated.includes('router.push(appendLangToPath("/publicar/restaurantes", lang))')) {
  fail("Editar restaurante must not route to plain /publicar/restaurantes");
}
if (!dedicated.includes('.eq("owner_user_id", user.id)')) fail("Owner filter required");
ok("dashboard listing-edit route context");

if (!helper.includes("Destacar ofertas +$99/mes")) fail("Inactive CTA must be Destacar ofertas");
if (!helper.includes("Feature offers +$99/mo")) fail("Inactive EN CTA must be Feature offers");
if (!helper.includes("Editar ofertas")) fail("Active CTA must be Editar ofertas");
if (!helper.includes("Edit offers")) fail("Active EN CTA must be Edit offers");
if (!helper.includes("ofertas/cupones destacados")) fail("Helper must explain offers/coupons value");
ok("CTA copy clarity");

if (!application.includes("listing-edit")) fail("Application must recognize listing-edit mode");
if (!application.includes("coupon-edit")) fail("Application must preserve coupon-edit mode");
if (!application.includes("coupon-addon")) fail("Application must preserve coupon-addon mode");
if (!application.includes("isExistingDashboardListingMode")) fail("Application must detect existing dashboard listing mode");
if (application.includes("setDraftPatch({ couponUpgradeEnabled: true, couponMonthlyPrice: 99 })") &&
    application.includes("isDashboardEditMode && !draft.couponUpgradeEnabled")) {
  fail("Fake auto couponUpgradeEnabled must be removed for dashboard edit");
}
if (!application.includes("startDashboardAddonCheckout")) fail("Inside-form add-on checkout required");
if (!application.includes("saveExistingDashboardListing")) fail("Dashboard save without preview payment required");
if (!application.includes("Save restaurant changes") && !application.includes("Guardar cambios del restaurante")) {
  fail("Dashboard listing edit must offer save without base payment");
}
if (!application.includes("if (isExistingDashboardListingMode) return")) {
  fail("goPreview must be blocked for existing dashboard listing mode");
}
ok("application dashboard edit guards");

if (!publishPrepare.includes('slot: "coupon"')) fail("Coupon images must upload in publish prepare");
if (!publishPayload.includes("imageUrl: row.imageUrl")) fail("Publish payload must include coupon imageUrl");
if (!couponsBlock.includes("coupon.imageUrl")) fail("Public shell must render coupon.imageUrl");
ok("coupon image persistence pipeline");

if (helper.includes("restaurantes_base_monthly")) fail("Helper must not include base monthly");
if (
  !helper.includes("restaurantes_offers_addon") &&
  !helper.includes("RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT")
) {
  fail("Add-on checkout helper must remain");
}
if (!webhook.includes("verifyStripeWebhookEvent")) fail("Webhook signature path must remain");
ok("pricing and webhook protected");

if (!pkg.includes("verify:restaurantes-p0f-dashboard-edit-coupon-route-image-persistence")) {
  fail("package.json must include P0F verifier");
}

console.log("verify-restaurantes-p0f-dashboard-edit-coupon-route-image-persistence: PASS");
