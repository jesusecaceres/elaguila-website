/**
 * RESTAURANTES-P0G-REMOVE-DASHBOARD-OFFER-CTA-RETURN-ROUTE verification.
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
  console.error(`verify-restaurantes-p0g-remove-dashboard-offer-cta-return-route: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const doc = read("docs/restaurantes-p0g-remove-dashboard-offer-cta-return-route.md");
const dedicated = read("app/(site)/dashboard/restaurantes/page.tsx");
const helper = read("app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts");
const application = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
const resultView = read("app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx");
const publishPrepare = read("app/(site)/clasificados/restaurantes/application/restauranteDraftPublishPrepare.ts");
const publishPayload = read("app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts");
const couponsBlock = read("app/(site)/clasificados/restaurantes/shell/RestauranteShellCouponsBlock.tsx");
const webhook = read("app/api/revenue-os/webhook/route.ts");
const pkg = read("package.json");

for (const section of ["Executive summary", "Manual QA", "Post-payment return"]) {
  if (!doc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("documentation present");

if (dedicated.includes("startCouponAddonCheckout")) {
  fail("Inactive outside dashboard paid CTA handler must be removed");
}
if (dedicated.includes("restauranteCouponAddonUpgradeLabel(lang)")) {
  fail("Inactive outside Destacar ofertas CTA must not render on dashboard cards");
}
if (!dedicated.includes("restauranteCouponInactiveDashboardHint")) {
  fail("Inactive helper must point owners to Editar restaurante / Section G");
}
if (!helper.includes("Para agregar ofertas destacadas, entra a Editar restaurante")) {
  fail("Inactive ES helper copy required");
}
if (!dedicated.includes("restauranteCouponEditLabel")) fail("Active Editar ofertas shortcut must remain");
if (!dedicated.includes("restauranteListingEditHref")) fail("Editar restaurante listing-edit route must remain");
if (!dedicated.includes("t.hydrate") && !dedicated.includes("Editar restaurante")) {
  fail("Editar restaurante must remain visible");
}
ok("outside inactive CTA removed; active shortcut preserved");

if (!application.includes("listing-edit")) fail("Application must preserve listing-edit mode");
if (!application.includes("restauranteOffersModuleHeading")) fail("Section G heading helper required");
if (!application.includes("startDashboardAddonCheckout")) fail("Inside Section G activation checkout required");
if (!application.includes("redirectRestauranteDashboardCouponAddonCheckout")) {
  fail("Inside activation must use add-on-only checkout helper");
}
if (application.includes("isDashboardEditMode && !draft.couponUpgradeEnabled")) {
  fail("Fake auto couponUpgradeEnabled must remain removed");
}
if (!application.includes("isExistingDashboardListingMode")) fail("Dashboard edit payment guard required");
if (!application.includes("Save restaurant changes") && !application.includes("Guardar cambios del restaurante")) {
  fail("Dashboard edit must save without base payment");
}
ok("inside form activation path preserved");

if (!helper.includes("Editar ofertas ahora")) fail("Success CTA label required");
if (!helper.includes("resolveRestauranteOffersAddonSuccessPrimaryCta")) {
  fail("Success CTA resolver required");
}
if (!resultView.includes("resolveRestauranteOffersAddonSuccessPrimaryCta")) {
  fail("Revenue OS success view must use offers add-on success CTA");
}
if (!helper.includes('mode: "coupon-edit"')) fail("Success return must use coupon-edit mode");
if (!helper.includes("focus: \"coupon-upgrade\"")) fail("Success return must include coupon focus");
if (!helper.includes("returnPanel")) fail("Success return must preserve returnPanel");
ok("post-payment edit route");

if (!application.includes("uploadCouponImage")) fail("Coupon image upload must remain");
if (!publishPrepare.includes('slot: "coupon"')) fail("Coupon blob upload must remain");
if (!publishPayload.includes("imageUrl: row.imageUrl")) fail("Publish payload coupon imageUrl must remain");
if (!couponsBlock.includes("coupon.imageUrl")) fail("Public coupon image render must remain");
ok("coupon image persistence preserved");

if (helper.includes("restaurantes_base_monthly")) fail("Must not include base monthly in helper");
if (!webhook.includes("verifyStripeWebhookEvent")) fail("Webhook signature path must remain");
ok("pricing and webhook protected");

if (!pkg.includes("verify:restaurantes-p0g-remove-dashboard-offer-cta-return-route")) {
  fail("package.json must include P0G verifier script");
}

console.log("verify-restaurantes-p0g-remove-dashboard-offer-cta-return-route: PASS");
