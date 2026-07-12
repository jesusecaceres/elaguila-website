#!/usr/bin/env node
/**
 * EMPLEOS-REVENUE-OS-PAID-PUBLISH-CHECKPOINT-01 verifier.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

function fail(msg) {
  console.error(`verify-revenue-os-empleos-paid-publish-checkpoint-01: FAIL — ${msg}`);
  process.exit(1);
}
function ok(msg) {
  console.log(`OK: ${msg}`);
}

const docRel = "docs/revenue-os-empleos-paid-publish-checkpoint-01.md";
const verifierRel = "scripts/verify-revenue-os-empleos-paid-publish-checkpoint-01.mjs";
const smokeRel = "scripts/smoke-revenue-os-empleos-paid-publish-checkpoint-01.mjs";

if (!existsSync(path.join(ROOT, docRel))) fail("Doc must exist");
if (!existsSync(path.join(ROOT, verifierRel))) fail("Verifier must exist");
if (!existsSync(path.join(ROOT, smokeRel))) fail("Smoke must exist");

const pkg = read("package.json");
const matrix = read("app/lib/listingPlans/revenuePricingMatrix.ts");
const checkpoint = read("app/lib/listingPlans/publishCheckoutCheckpoint.ts");
const quickPreview = read(
  "app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx",
);
const premiumPreview = read(
  "app/(site)/clasificados/empleos/premium-preview/EmpleoPremiumPreviewClient.tsx",
);
const feriaPreview = read(
  "app/(site)/clasificados/empleos/feria-preview/EmpleoFeriaPreviewClient.tsx",
);
const quickApp = read("app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx");
const premiumApp = read("app/(site)/publicar/empleos/premium/EmpleoPremiumApplicationClient.tsx");
const feriaApp = read("app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx");
const revenueCheckout = read("app/(site)/publicar/empleos/shared/publish/empleosRevenueCheckout.ts");
const fulfillment = read("app/lib/listingPlans/revenueFulfillment.ts");
const empleosFulfillment = read("app/lib/listingPlans/revenueEmpleosFulfillment.ts");
const webhook = read("app/api/revenue-os/webhook/route.ts");
const publicDb = read("app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts");

if (!pkg.includes("verify:revenue-os-empleos-paid-publish-checkpoint-01")) {
  fail("package.json missing verify script");
}
if (!pkg.includes("smoke:revenue-os-empleos-paid-publish-checkpoint-01")) {
  fail("package.json missing smoke script");
}
ok("package.json scripts");

if (!matrix.includes("empleos_job_post_paid") || !matrix.includes("empleos_job_fair_free")) {
  fail("Matrix must define paid + feria packages");
}
const paidAnchor = matrix.indexOf("EMPLEOS_JOB_POST_PAID_PACKAGE_KEY");
const paidSlice =
  paidAnchor >= 0
    ? matrix.slice(paidAnchor, paidAnchor + 500)
    : matrix.slice(matrix.indexOf("empleos_job_post_paid"), matrix.indexOf("empleos_job_post_paid") + 500);
if (!paidSlice.includes("priceCents: 2499") && !matrix.includes("priceCents: 2499")) {
  fail("empleos_job_post_paid must be 2499 cents");
}
// Prefer the job-post block specifically
const jobPostBlock = matrix.match(
  /packageKey:\s*EMPLEOS_JOB_POST_PAID_PACKAGE_KEY[\s\S]{0,350}priceCents:\s*(\d+)/,
);
if (!jobPostBlock || jobPostBlock[1] !== "2499") {
  fail("empleos_job_post_paid package block must have priceCents: 2499");
}
ok("matrix package + price");

if (!checkpoint.includes("EMPLEOS_CHECKPOINT_CONFIRMATIONS")) fail("EMPLEOS confirmations missing");
if (!checkpoint.includes('config.category === "empleos"')) fail("Empleos resolver branch missing");
ok("checkpoint confirmations + resolver");

for (const [lane, src] of [
  ["quick", quickPreview],
  ["premium", premiumPreview],
]) {
  if (!src.includes("PublishCheckoutCheckpoint")) fail(`${lane} preview must mount PublishCheckoutCheckpoint`);
  if (!src.includes("saveEmpleosDraftAndStartPaidJobCheckout")) fail(`${lane} must draft-save before checkout`);
  if (!src.includes("onPromoApply")) fail(`${lane} must wire promo Apply`);
  if (!src.includes("EMPLEOS_PREVIEW_RULES_MODAL")) fail(`${lane} must include Leonix rules modal`);
  if (!src.includes("captureCheckoutNewsletterSubscriber")) fail(`${lane} must capture newsletter`);
}
ok("paid previews mount shared checkpoint");

if (feriaPreview.includes("PublishCheckoutCheckpoint")) {
  fail("Feria preview must NOT render PublishCheckoutCheckpoint");
}
if (feriaPreview.includes("startRevenueCategoryCheckout") || feriaPreview.includes("saveEmpleosDraftAndStartPaidJobCheckout")) {
  fail("Feria preview must never call Revenue OS checkout");
}
ok("feria preview has no paid checkpoint");

if (quickApp.includes("EmpleosPublishConfirmModal") || premiumApp.includes("EmpleosPublishConfirmModal")) {
  fail("Paid application forms must not use EmpleosPublishConfirmModal bypass");
}
if (!quickApp.includes("onPublicar={goPreview}") || !premiumApp.includes("onPublicar={goPreview}")) {
  fail("Paid application Publicar must route to preview");
}
if (!feriaApp.includes("EmpleosPublishConfirmModal") || !feriaApp.includes('mode: "publish"')) {
  fail("Feria must keep free confirm + publish path");
}
if (feriaApp.includes("saveEmpleosDraftAndStartPaidJobCheckout") || feriaApp.includes("startRevenueCategoryCheckout")) {
  fail("Feria application must never call Stripe/Revenue OS");
}
ok("paid app bypass removed; feria free path intact");

if (!revenueCheckout.includes('mode: "draft"') || !revenueCheckout.includes("startRevenueCategoryCheckout")) {
  fail("empleosRevenueCheckout must draft then Revenue OS");
}
if (revenueCheckout.includes("addOns")) fail("Empleos checkout must not pass addOns");
ok("draft save + Revenue OS checkout helper");

if (!empleosFulfillment.includes("activatePaidEmpleosListingFromRevenueOs")) {
  fail("Empleos fulfillment helper missing");
}
if (!fulfillment.includes("tryActivateEmpleosListingAfterEntitlement")) {
  fail("Webhook must call Empleos activation");
}
if (!webhook.includes("verifyStripeWebhookEvent") || !webhook.includes("rawBody")) {
  fail("Webhook signature/raw body must remain");
}
ok("webhook Empleos activation wired; raw body intact");

if (!publicDb.includes('.eq("lifecycle_status", "published")')) {
  fail("Public queries must require published lifecycle");
}
ok("public hides draft/pending");

console.log("verify-revenue-os-empleos-paid-publish-checkpoint-01: PASS");
