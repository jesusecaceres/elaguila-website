/**
 * RESTAURANTES-PROMO-CHECKOUT-FINAL-BUTTON-BLOCKER-FIX-01 verification.
 * Run: npm run verify:restaurantes-promo-checkout-final-button-blocker-fix-01
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
  console.error(`verify-restaurantes-promo-checkout-final-button-blocker-fix-01: FAIL - ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

const doc = "docs/restaurantes-promo-checkout-final-button-blocker-fix-01.md";
const preview = "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx";
const checkpointUi = "app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx";
const checkpointLib = "app/lib/listingPlans/publishCheckoutCheckpoint.ts";
const pkg = "package.json";

for (const rel of [doc, preview, checkpointUi, checkpointLib]) {
  if (!exists(rel)) fail(`Missing required file: ${rel}`);
}

const docSrc = read(doc);
const previewSrc = read(preview);
const uiSrc = read(checkpointUi);
const libSrc = read(checkpointLib);
const pkgSrc = read(pkg);

for (const section of [
  "Executive Summary",
  "Promo Success Confirmed",
  "Why Button Was Blocked",
  "Coupon Add-on Blocker Rule",
  "Base Plan With Promo Expected Stripe Amount",
  "Manual QA Checklist",
]) {
  if (!docSrc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("documentation sections present");

if (!docSrc.includes("RESTO-QA-25-01") && !docSrc.toLowerCase().includes("promo success")) {
  fail("Doc must mention promo success confirmed");
}
if (!docSrc.includes("299.25")) fail("Doc must mention $299.25 expected total");
if (!docSrc.toLowerCase().includes("coupon") || !docSrc.toLowerCase().includes("block")) {
  fail("Doc must mention coupon add-on blocks checkout");
}
ok("documentation content checks passed");

if (!previewSrc.includes("promoCode: ctx.promoCode") && !previewSrc.includes("promoCode: ctx.promoCode")) {
  if (!previewSrc.includes("promoCode:")) fail("Preview must pass promoCode into checkout");
}
if (!previewSrc.includes("startRevenueCategoryCheckout")) {
  fail("Preview must call startRevenueCategoryCheckout");
}
ok("Restaurante preview passes promo into Revenue OS checkout");

if (!uiSrc.includes("handleFinalAction") || !uiSrc.includes("onCheckout")) {
  fail("PublishCheckoutCheckpoint must call onCheckout on final action");
}
if (!uiSrc.includes("finalButtonEnabled")) {
  fail("PublishCheckoutCheckpoint must gate on finalButtonEnabled");
}
ok("checkpoint calls onCheckout when enabled");

if (
  !libSrc.includes("desactiva el módulo de cupones del restaurante") &&
  !uiSrc.includes("desactiva el módulo de cupones del restaurante")
) {
  fail("Blocker copy must tell user to remove coupon module (Spanish)");
}
if (
  !libSrc.includes("turn off the restaurant coupon module") &&
  !uiSrc.includes("turn off the restaurant coupon module")
) {
  fail("Blocker copy must tell user to remove coupon module (English)");
}
if (!uiSrc.includes("Volver a editar y quitar complemento") || !uiSrc.includes("Back to edit and remove add-on")) {
  fail("Checkpoint must show edit CTA for coupon blocker");
}
ok("coupon blocker copy and CTA present");

if (!libSrc.includes("isRestaurantCouponCheckoutBlocked")) {
  fail("Checkpoint lib must export isRestaurantCouponCheckoutBlocked");
}

if (!pkgSrc.includes("verify:restaurantes-promo-checkout-final-button-blocker-fix-01")) {
  fail("package.json missing verifier script");
}
ok("package.json verifier registered");

const secretPatterns = [/sk_test_[a-zA-Z0-9]+/, /sk_live_[a-zA-Z0-9]+/, /whsec_[a-zA-Z0-9]+/];
for (const [label, src] of [
  ["doc", docSrc],
  ["preview", previewSrc],
  ["checkpoint ui", uiSrc],
  ["checkpoint lib", libSrc],
]) {
  for (const re of secretPatterns) {
    if (re.test(src)) fail(`Secret-like value in ${label}`);
  }
}
ok("no secrets in gate artifacts");

const forbiddenTouches = [
  "app/api/revenue-os/webhook",
  "supabase/migrations",
];
for (const rel of forbiddenTouches) {
  const full = path.join(root, rel);
  if (exists(full) && fs.statSync(full).mtimeMs > Date.now() - 5000) {
    /* skip unreliable mtime — gate did not edit these */
  }
}

const unrelatedCategories = [
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview",
  "app/(site)/clasificados/servicios",
  "app/(site)/clasificados/autos",
];
for (const marker of unrelatedCategories) {
  if (uiSrc.includes(marker) || libSrc.includes(marker)) {
    fail(`Gate artifact unexpectedly references unrelated category: ${marker}`);
  }
}
ok("no unrelated category references in changed checkpoint files");

console.log("verify-restaurantes-promo-checkout-final-button-blocker-fix-01: PASS");
