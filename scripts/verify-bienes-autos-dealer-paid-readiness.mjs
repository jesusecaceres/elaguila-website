/**
 * BIENES-AUTOS-DEALER-PAID-READINESS-01 verification.
 * Static assertions only — protects honest paid-pipeline + Launch 25 decisions.
 * Run: npm run verify:bienes-autos-dealer-paid-readiness
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}
function fail(message) {
  console.error(`verify-bienes-autos-dealer-paid-readiness: FAIL - ${message}`);
  process.exit(1);
}
function ok(message) {
  console.log(`OK: ${message}`);
}

const redemptions = "app/lib/listingPlans/revenuePromoRedemptions.ts";
const fulfillment = "app/lib/listingPlans/revenueFulfillment.ts";
const bienesAgentPreview =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx";
const bienesFsboPreview =
  "app/(site)/clasificados/bienes-raices/preview/privado/components/BienesRaicesPrivadoPreviewClient.tsx";
const autosConfirm = "app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx";
const autosCheckoutRoute = "app/api/clasificados/autos/checkout/route.ts";
const autosPrivadoPreview = "app/(site)/clasificados/autos/privado/preview/AutosPrivadoPreviewClient.tsx";
const serviciosPreview =
  "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx";
const doc = "docs/bienes-autos-dealer-paid-readiness-01.md";
const pkg = "package.json";

for (const rel of [
  redemptions,
  fulfillment,
  bienesAgentPreview,
  bienesFsboPreview,
  autosConfirm,
  autosCheckoutRoute,
  autosPrivadoPreview,
  serviciosPreview,
  doc,
  pkg,
]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const redemptionsSrc = read(redemptions);
const fulfillmentSrc = read(fulfillment);
const bienesAgentSrc = read(bienesAgentPreview);
const bienesFsboSrc = read(bienesFsboPreview);
const autosConfirmSrc = read(autosConfirm);
const autosCheckoutSrc = read(autosCheckoutRoute);
const autosPrivadoPreviewSrc = read(autosPrivadoPreview);
const serviciosPreviewSrc = read(serviciosPreview);
const docSrc = read(doc);
const pkgSrc = read(pkg);

const allowlistBlock =
  redemptionsSrc.match(/WEBSITE_LAUNCH_25_ALLOWLISTED_PACKAGE_KEYS[\s\S]*?];/)?.[0] ?? "";

// Launch 25 allowlist must not expand to bienes/autos dealer until future gates
for (const key of [
  "br_agent_monthly",
  "br_fsbo_45d",
  "br_inventory_pack_monthly",
  "autos_dealer_monthly",
  "autos_dealer_inventory_pack_monthly",
]) {
  if (new RegExp(`["']${key}["']`).test(allowlistBlock)) {
    fail(`Launch 25 allowlist must not include ${key} until a dedicated fulfillment/migration gate`);
  }
}
ok("Launch 25 allowlist excludes bienes + autos dealer keys");

// Bienes agent: Revenue OS checkout exists but promo not forwarded; no onPromoApply yet
if (!bienesAgentSrc.includes("PublishCheckoutCheckpoint")) {
  fail("Bienes agent preview must use PublishCheckoutCheckpoint");
}
if (!bienesAgentSrc.includes("startRevenueCategoryCheckout")) {
  fail("Bienes agent must use central Revenue OS checkout");
}
if (!bienesAgentSrc.includes("BIENES_RAICES_NEGOCIO_CHECKOUT")) {
  fail("Bienes agent must use br_agent_monthly checkout payload");
}
if (bienesAgentSrc.includes("onPromoApply")) {
  fail("Bienes agent must not wire onPromoApply until webhook fulfillment gate ships");
}
if (bienesAgentSrc.includes("promoCode:")) {
  fail("Bienes agent must not forward promoCode until fulfillment + Launch 25 gate");
}
if (!bienesAgentSrc.includes("pending_payment")) {
  fail("Bienes agent must save pending_payment before checkout when payment required");
}
ok("Bienes agent Revenue OS checkout present; promo/Launch 25 correctly deferred");

// Webhook fulfillment gap documented in code truth
if (fulfillmentSrc.includes("br_agent_monthly") || fulfillmentSrc.includes("tryActivateBienes")) {
  fail("Bienes webhook fulfillment must not be faked in this gate — missing activation is expected");
}
ok("revenueFulfillment has no premature Bienes activation hook");

// Bienes FSBO: no Revenue OS checkout
if (bienesFsboSrc.includes("startRevenueCategoryCheckout") || bienesFsboSrc.includes("PublishCheckoutCheckpoint")) {
  fail("Bienes FSBO must not fake Revenue OS checkout");
}
if (!bienesFsboSrc.includes("publishLeonixListingFromBienesRaicesPrivadoDraft")) {
  fail("Bienes FSBO preview must use direct publish draft helper");
}
ok("Bienes FSBO documented as no-checkout / future migration");

// Autos dealer: legacy checkout on negocios lane
if (!autosConfirmSrc.includes('lane === "negocios"') || !autosConfirmSrc.includes("/api/clasificados/autos/checkout")) {
  fail("Autos dealer must use legacy autos checkout route");
}
if (autosConfirmSrc.match(/lane === "negocios"[\s\S]{0,800}RevenuePromoField/)) {
  fail("Autos dealer must not show RevenuePromoField on negocios lane");
}
if (!autosCheckoutSrc.includes("setAutosListingPendingPayment")) {
  fail("Autos legacy checkout must set pending_payment before Stripe redirect");
}
if (!autosCheckoutSrc.includes("getStripePriceIdForAutosLane")) {
  fail("Autos legacy checkout must resolve lane-specific Stripe price");
}
ok("Autos dealer legacy paid pipeline preserved; Launch 25 excluded");

// Green categories protected (spot checks)
if (!autosPrivadoPreviewSrc.includes("PublishCheckoutCheckpoint") || !autosPrivadoPreviewSrc.includes("onPromoApply")) {
  fail("Autos privado preview must remain Revenue OS checkpoint ready");
}
if (!serviciosPreviewSrc.includes("PublishCheckoutCheckpoint") || !serviciosPreviewSrc.includes("onPromoApply")) {
  fail("Servicios preview must remain untouched and Launch 25 ready");
}
ok("green categories (Autos privado, Servicios) protected");

// Documentation truth
if (!docSrc.includes("BIENES-AUTOS-DEALER-PAID-READINESS-01")) fail("Readiness doc missing gate id");
for (const key of ["br_agent_monthly", "br_fsbo_45d", "autos_dealer_monthly", "autos_dealer_inventory_pack_monthly"]) {
  if (!docSrc.includes(key)) fail(`Readiness doc must mention package key: ${key}`);
}
if (!docSrc.includes("NOT READY") || !docSrc.includes("EXCLUDED")) {
  fail("Readiness doc must document NOT READY and EXCLUDED lanes");
}
if (!docSrc.includes("Can Chuy use Launch 25 on Bienes today?") || !docSrc.includes("**NO**")) {
  fail("Readiness doc must state Launch 25 NO for Bienes");
}
ok("readiness documentation complete");

if (!pkgSrc.includes("verify:bienes-autos-dealer-paid-readiness")) {
  fail("package.json missing verifier script");
}
ok("package.json script registered");

console.log("verify-bienes-autos-dealer-paid-readiness: PASS");
