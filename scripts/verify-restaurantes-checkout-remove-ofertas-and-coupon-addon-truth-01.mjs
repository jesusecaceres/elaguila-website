/**
 * RESTAURANTES-CHECKOUT-REMOVE-OFERTAS-AND-COUPON-ADDON-TRUTH-01 verification.
 * Run: npm run verify:restaurantes-checkout-remove-ofertas-and-coupon-addon-truth-01
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function fail(message) {
  console.error(`verify-restaurantes-checkout-remove-ofertas-and-coupon-addon-truth-01: FAIL - ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

function gitStatusShort() {
  return execFileSync("git", ["status", "--short"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const docRel = "docs/restaurantes-checkout-remove-ofertas-and-coupon-addon-truth-01.md";
const previewRel = "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx";
const checkpointRel = "app/lib/listingPlans/publishCheckoutCheckpoint.ts";
const modelRel = "app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts";

for (const rel of [docRel, previewRel, checkpointRel, modelRel]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`${rel} must exist`);
}

const doc = read(docRel);
const preview = read(previewRel);
const checkpoint = read(checkpointRel);
const model = read(modelRel);
const pkg = read("package.json");

const docSections = [
  "Executive Summary",
  "Why Ofertas Locales Was Removed From Restaurante Checkout",
  "Promo Code vs Restaurante Coupon Add-on vs Public Ofertas/Cupones",
  "Files Inspected",
  "Files Changed",
  "Restaurante Coupon/Add-on Field Found",
  "Revenue OS Add-on Support Result",
  "Checkout Summary Result",
  "Blocking Behavior If Add-on Unsupported",
  "Base $399 Flow Preservation",
  "What This Gate Does Not Do",
  "Manual QA Checklist",
  "Next Recommended Gates",
];

for (const section of docSections) {
  if (!doc.includes(section)) fail(`Document missing section: ${section}`);
}
ok("documentation sections present");

const docChecks = [
  ["Ofertas Locales removed", doc.includes("Ofertas Locales") && doc.includes("Removed")],
  ["promo vs coupon vs ofertas", doc.includes("Promo Code vs Restaurante Coupon Add-on")],
  ["coupon field", doc.includes("couponUpgradeEnabled")],
  ["revenue os result", doc.includes("REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED")],
  ["no fake add-on", doc.includes("No fake") || doc.includes("no fake")],
  ["promo deferred", doc.includes("PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01")],
  ["stripe/webhook untouched", doc.toLowerCase().includes("webhook")],
];

for (const [label, pass] of docChecks) {
  if (!pass) fail(`Doc check failed: ${label}`);
}
ok("documentation content checks passed");

if (preview.includes("RestauranteOfertasLocalesCheckoutSecondaryCard")) {
  fail("Preview must not import/render RestauranteOfertasLocalesCheckoutSecondaryCard");
}
for (const forbidden of ["Ver Ofertas Locales", "View Local Offers", "Agrega Ofertas Locales"]) {
  if (preview.includes(forbidden)) fail(`Preview must not contain "${forbidden}"`);
}
ok("generic Ofertas Locales UI removed from Restaurante checkout");

if (
  !preview.includes("restaurantOffersAddonSelected") ||
  !preview.includes("couponUpgradeEnabled")
) {
  fail("Preview must wire couponUpgradeEnabled to restaurantOffersAddonSelected");
}
ok("Restaurante coupon add-on field wired to checkpoint");

if (!preview.includes("PublishCheckoutCheckpoint")) fail("Preview must use shared checkpoint");
if (!preview.includes("saveRestaurantePendingBeforeCheckout")) fail("Pending save must remain");
ok("shared checkpoint and pending save preserved");

if (!checkpoint.includes("restaurantCouponAddonBlockReason")) {
  fail("Checkpoint must block unsupported selected restaurant coupon add-on");
}
if (!checkpoint.includes("Módulo de cupones del restaurante")) {
  fail("Checkpoint must use restaurant coupon module labels");
}
if (!checkpoint.includes("RESTAURANTES_COUPON_ADDON_PACKAGE_KEY")) {
  fail("Checkpoint must reference canonical add-on package key");
}
if (!checkpoint.includes("REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED = false")) {
  fail("Add-on support flag must remain false until Revenue OS bundles add-on");
}
ok("checkpoint restaurant coupon add-on truth present");

if (!model.includes("couponUpgradeEnabled")) {
  fail("Draft model must define couponUpgradeEnabled");
}

if (!pkg.includes('"verify:restaurantes-checkout-remove-ofertas-and-coupon-addon-truth-01"')) {
  fail("package.json missing verifier script");
}

const secretPatterns = [/sk_(live|test)_[A-Za-z0-9]{16,}/, /whsec_[A-Za-z0-9]{16,}/];
for (const file of [doc, preview, checkpoint, pkg]) {
  for (const pattern of secretPatterns) {
    if (pattern.test(file)) fail(`Secret-like content forbidden matching ${pattern}`);
  }
}
ok("no secrets in gate artifacts");

if (existsSync(path.join(ROOT, ".env"))) {
  // .env may exist locally — gate must not modify it; we only assert we did not create it in this gate's allowed files
}

const status = gitStatusShort();
const migrationAdded = status
  .split("\n")
  .some((line) => line.includes("supabase/migrations/") && (line.startsWith("??") || line.startsWith("A ")));
if (migrationAdded) fail("No new migration files should be added by this gate");

const unrelatedCategoryPaths = [
  "app/(site)/clasificados/servicios/page.tsx",
  "app/(site)/clasificados/bienes-raices/page.tsx",
  "app/admin/_components/AdminCommandCenterDashboard.tsx",
];

for (const rel of unrelatedCategoryPaths) {
  if (!existsSync(path.join(ROOT, rel))) continue;
  const content = read(rel);
  if (content.includes("RESTAURANTES-CHECKOUT-REMOVE-OFERTAS-AND-COUPON-ADDON-TRUTH-01")) {
    fail(`Unrelated file modified by this gate: ${rel}`);
  }
}
ok("no unrelated category files modified by this gate");

console.log("verify-restaurantes-checkout-remove-ofertas-and-coupon-addon-truth-01: PASS");
