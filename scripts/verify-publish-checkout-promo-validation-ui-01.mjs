/**
 * PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01 verification.
 * Run: npm run verify:publish-checkout-promo-validation-ui-01
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
  console.error(`verify-publish-checkout-promo-validation-ui-01: FAIL - ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

const doc = "docs/publish-checkout-promo-validation-ui-01.md";
const validateRoute = "app/api/revenue-os/promo/validate/route.ts";
const validationLib = "app/lib/listingPlans/revenuePromoValidation.ts";
const checkpoint = "app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx";
const preview = "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx";
const checkoutRoute = "app/api/revenue-os/checkout/route.ts";
const redemptions = "app/lib/listingPlans/revenuePromoRedemptions.ts";
const fulfillment = "app/lib/listingPlans/revenueFulfillment.ts";
const adminActions = "app/admin/(dashboard)/workspace/promo-codes/actions.ts";
const pkg = "package.json";

for (const rel of [doc, validateRoute, validationLib, checkpoint, preview, checkoutRoute, redemptions, adminActions]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const docSrc = read(doc);
const validateSrc = read(validateRoute);
const validationSrc = read(validationLib);
const checkpointSrc = read(checkpoint);
const previewSrc = read(preview);
const checkoutSrc = read(checkoutRoute);
const redemptionsSrc = read(redemptions);
const fulfillmentSrc = read(fulfillment);
const adminSrc = read(adminActions);
const pkgSrc = read(pkg);

for (const section of [
  "Executive Summary",
  "Promo Code vs Public Cupones/Ofertas",
  "Discount Source Truth",
  "Validation Route",
  "Webhook Redemption Contract",
  "Manual QA Checklist",
]) {
  if (!docSrc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("documentation sections present");

if (!docSrc.includes("no fake 25") && !docSrc.includes("No fake 25") && !docSrc.includes("never inferred")) {
  if (!docSrc.includes("Do not assume 25%") && !docSrc.includes("never inferred from code text")) {
    fail("Doc must mention no fake 25% from code text");
  }
}
if (!docSrc.toLowerCase().includes("webhook")) fail("Doc must mention webhook redemption");
ok("documentation content checks passed");

if (!validateSrc.includes("validatePromoForPublishCheckout")) fail("Validate route must call validation helper");
if (!validationSrc.includes("leonix_promo_codes") && !validationSrc.includes("loadPromoByCode")) {
  fail("Validation lib must read leonix_promo_codes");
}
if (validateSrc.includes("markPromoRedemptionRedeemed") || validateSrc.includes(".insert(")) {
  fail("Validation route must not write redemptions");
}
ok("validation route is read-only");

if (!checkpointSrc.includes("Código promocional") || !checkpointSrc.includes("Promo code")) {
  fail("Checkpoint must include promo code UI labels");
}
if (!checkpointSrc.includes("Quitar") || !checkpointSrc.includes("Remove")) {
  fail("Checkpoint must include Remove promo control");
}
ok("checkpoint promo UI present");

if (!previewSrc.includes("promoEligible: true")) fail("Restaurante preview must enable promoEligible");
if (!previewSrc.includes("onPromoApply") || !previewSrc.includes("validateRevenuePromoForCheckout")) {
  fail("Restaurante preview must wire server promo validation");
}
ok("Restaurante promo wiring present");

if (!checkoutSrc.includes("resolvePromoForCheckout")) fail("Checkout must revalidate promo server-side");
if (
  !checkoutSrc.includes("createPendingPromoRedemption") ||
  (!checkoutSrc.includes("promoCode:") && !checkoutSrc.includes("promo_code_id"))
) {
  fail("Checkout must store promo snapshot / pending redemption");
}
ok("checkout revalidation and promo snapshot present");

if (!redemptionsSrc.includes("markPromoRedemptionRedeemed")) fail("Redemption finalization helper required");
if (!fulfillmentSrc.includes("markPromoRedemptionRedeemed")) fail("Webhook must finalize promo redemption");
if (!redemptionsSrc.includes("redemption_count")) fail("Redemption count increment required");
ok("webhook redemption finalization present");

if (!adminSrc.includes("percent_off") || !adminSrc.includes("amount_off_cents") || !adminSrc.includes("promo_type")) {
  fail("Admin create must store discount metadata/columns");
}
ok("admin discount fields on create");

if (!pkgSrc.includes("verify:publish-checkout-promo-validation-ui-01")) {
  fail("package.json missing verifier script");
}

const secretPatterns = [/sk_(live|test)_[A-Za-z0-9]{16,}/, /whsec_[A-Za-z0-9]{16,}/];
for (const file of [docSrc, validateSrc, validationSrc, checkpointSrc, previewSrc, pkgSrc]) {
  for (const pattern of secretPatterns) {
    if (pattern.test(file)) fail(`Secret-like content forbidden matching ${pattern}`);
  }
}
ok("no secrets in gate artifacts");

console.log("verify-publish-checkout-promo-validation-ui-01: PASS");
