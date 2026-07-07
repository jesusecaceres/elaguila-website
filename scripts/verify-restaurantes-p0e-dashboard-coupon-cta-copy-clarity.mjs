/**
 * RESTAURANTES-P0E-DASHBOARD-COUPON-CTA-COPY-CLARITY verification.
 * Run: npm run verify:restaurantes-p0e-dashboard-coupon-cta-copy-clarity
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
  console.error(`verify-restaurantes-p0e-dashboard-coupon-cta-copy-clarity: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const helper = read("app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts");
const dedicatedPage = read("app/(site)/dashboard/restaurantes/page.tsx");
const pkg = read("package.json");

if (!helper.includes("Activar cupones +$99/mes")) {
  fail("Spanish inactive CTA must be Activar cupones +$99/mes");
}
if (!helper.includes("Activate coupons +$99/mo")) {
  fail("English inactive CTA must be Activate coupons +$99/mo");
}
if (!helper.includes("Editar cupones")) fail("Spanish edit CTA must remain Editar cupones");
if (!helper.includes("Edit coupons")) fail("English edit CTA must remain Edit coupons");
ok("CTA label clarity");

if (!dedicatedPage.includes("Editar restaurante") && !dedicatedPage.includes("t.hydrate")) {
  fail("Editar restaurante must remain on dedicated dashboard");
}
if (!dedicatedPage.includes("startCouponAddonCheckout")) fail("Page must still start add-on checkout");
if (!dedicatedPage.includes("openCouponEdit")) fail("Page must still open coupon edit");
if (!dedicatedPage.includes("restaurantCouponAddonUpgradeEligible")) {
  fail("Page must still use upgrade eligibility");
}
if (!dedicatedPage.includes("restaurantCouponEditEligible")) {
  fail("Page must still use edit eligibility");
}
ok("action wiring preserved");

if (!helper.includes("Activa el módulo y luego podrás agregar hasta 4 cupones destacados.")) {
  fail("Missing ES activation helper copy");
}
if (!helper.includes("Activate the module, then you can add up to 4 featured coupons.")) {
  fail("Missing EN activation helper copy");
}
if (!helper.includes("Administra hasta 4 cupones destacados de este anuncio.")) {
  fail("Missing ES edit helper copy");
}
if (!helper.includes("Manage up to 4 featured coupons for this listing.")) {
  fail("Missing EN edit helper copy");
}
if (!dedicatedPage.includes("restauranteCouponAddonUpgradeFooterHint")) {
  fail("Page must use activation footer hint helper");
}
if (!dedicatedPage.includes("restauranteCouponEditFooterHint")) {
  fail("Page must use edit footer hint helper");
}
ok("helper copy present");

if (helper.includes("restaurantes_base_monthly")) {
  fail("Dashboard coupon helper must not include restaurantes_base_monthly");
}
if (
  !helper.includes("restaurantes_offers_addon") &&
  !helper.includes("RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT")
) {
  fail("Add-on checkout helper must still reference restaurantes_offers_addon");
}
ok("no pricing regression in helper");

const unrelated = ["servicios", "autos", "bienes-raices", "empleos", "en-venta"];
for (const cat of unrelated) {
  if (helper.includes(`/${cat}/`) || dedicatedPage.includes(`/${cat}/`)) {
    fail(`Unrelated category touched: ${cat}`);
  }
}
ok("unrelated categories untouched");

if (!pkg.includes("verify:restaurantes-p0e-dashboard-coupon-cta-copy-clarity")) {
  fail("package.json must include P0E verifier script");
}

console.log("verify-restaurantes-p0e-dashboard-coupon-cta-copy-clarity: PASS");
