#!/usr/bin/env node
/**
 * REVENUE-OS-RENTAS-PAID-PUBLISH-LOCKDOWN-01 verifier.
 * Doc + source-truth gate for Rentas paid publish lockdown.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function fail(msg) {
  console.error(`verify-revenue-os-rentas-paid-publish-lockdown-01: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function gitDiffNameOnly() {
  try {
    return execFileSync("git", ["diff", "--name-only"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

const docRel = "docs/revenue-os-rentas-paid-publish-lockdown-01.md";
const verifierRel = "scripts/verify-revenue-os-rentas-paid-publish-lockdown-01.mjs";
const smokeRel = "scripts/smoke-revenue-os-rentas-paid-publish-lockdown-01.mjs";

if (!existsSync(path.join(ROOT, docRel))) fail("Doc must exist");
if (!existsSync(path.join(ROOT, verifierRel))) fail("Verifier must exist");
if (!existsSync(path.join(ROOT, smokeRel))) fail("Smoke must exist");

const doc = read(docRel);
const pkg = read("package.json");
const matrix = read("app/lib/listingPlans/revenuePricingMatrix.ts");
const checkpoint = read("app/lib/listingPlans/publishCheckoutCheckpoint.ts");
const payload = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
const fulfillment = read("app/lib/listingPlans/revenueFulfillment.ts");
const rentasFulfillment = read("app/lib/listingPlans/revenueRentasFulfillment.ts");
const webhookRoute = read("app/api/revenue-os/webhook/route.ts");
const privadoPreview = read(
  "app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx",
);
const negocioPreview = read(
  "app/(site)/clasificados/rentas/preview/negocio/components/RentasNegocioPreviewClient.tsx",
);
const entryCheckpoints = read("app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts");
const publishCore = read("app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts");
const publishDraft = read("app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts");
const publicDetail = read("app/(site)/clasificados/rentas/lib/fetchRentasListingForPublicDetail.ts");
const manageCard = read("app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx");
const sharedCheckout = read("app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx");

const requiredHeadings = [
  "Executive Summary",
  "Business Rules",
  "Pipeline",
  "Entry Checkpoint",
  "Final Checkout Checkpoint",
  "Hidden Pending Save",
  "Revenue OS Checkout",
  "Webhook Activation",
  "Public Render",
  "Dashboard Edit",
  "SQL / Status Lifecycle",
  "Verification",
];

for (const heading of requiredHeadings) {
  if (!doc.includes(heading)) fail(`Doc missing heading: ${heading}`);
}
ok("doc headings present");

if (!doc.includes("rentas_30d") || !doc.includes("2499") || !doc.includes("$24.99")) {
  fail("Doc must document rentas_30d and canonical price");
}
ok("doc package key and price");

if (!pkg.includes("verify:revenue-os-rentas-paid-publish-lockdown-01")) {
  fail("package.json must register verify script");
}
if (!pkg.includes("smoke:revenue-os-rentas-paid-publish-lockdown-01")) {
  fail("package.json must register smoke script");
}
ok("package.json scripts registered");

if (!matrix.includes('packageKey: "rentas_30d"')) fail("Matrix must define rentas_30d");
const rentasSlice = matrix.slice(matrix.indexOf('packageKey: "rentas_30d"'), matrix.indexOf('packageKey: "rentas_30d"') + 350);
if (!rentasSlice.includes("priceCents: 2499")) fail("rentas_30d must be 2499 cents");
if (!rentasSlice.includes("addOnInventory: null")) fail("rentas_30d must have no addOnInventory");
ok("revenuePricingMatrix rentas_30d paid, no add-on");

if (!payload.includes("RENTAS_CATEGORY_CHECKOUT")) fail("RENTAS_CATEGORY_CHECKOUT must exist");
if (!payload.includes('packageKey: "rentas_30d"')) fail("RENTAS payload must use rentas_30d");
if (payload.match(/RENTAS[\s\S]{0,400}addOn/i)) {
  fail("RENTAS checkout payload must not define addOns");
}
ok("RENTAS_CATEGORY_CHECKOUT canonical, no addOns");

if (!checkpoint.includes("RENTAS_CHECKPOINT_CONFIRMATIONS")) fail("RENTAS confirmations must exist");
if (!checkpoint.includes("accurate_rental_info")) fail("Rentas confirmation accurate_rental_info missing");
if (!checkpoint.includes("authorized_to_publish")) fail("Rentas confirmation authorized_to_publish missing");
if (!checkpoint.includes("rentas_rules")) fail("Rentas confirmation rentas_rules missing");
if (!checkpoint.includes("payment_required")) fail("Rentas confirmation payment_required missing");
if (!checkpoint.includes('config.category === "rentas"')) fail("Rentas resolver branch required");
ok("RENTAS_CHECKPOINT_CONFIRMATIONS (4) + resolver branch");

for (const preview of [
  ["privado", privadoPreview],
  ["negocio", negocioPreview],
]) {
  const [lane, src] = preview;
  if (!src.includes("PublishCheckoutCheckpoint")) fail(`${lane} preview must use PublishCheckoutCheckpoint`);
  if (!src.includes('activationMode: "pending_payment"')) fail(`${lane} preview must pending-save`);
  if (!src.includes("startRevenueCategoryCheckout")) fail(`${lane} preview must Revenue OS checkout`);
  if (!src.includes("RENTAS_CATEGORY_CHECKOUT")) fail(`${lane} preview must use RENTAS_CATEGORY_CHECKOUT`);
  if (src.includes("addOns:") || src.includes("addOnKeys")) fail(`${lane} preview must not pass addOns`);
  if (src.includes("published=1")) fail(`${lane} preview must not redirect unpaid published=1`);
  if (src.includes("is_published: true") && !src.includes("pending_payment")) {
    fail(`${lane} preview must not set published without pending_payment path`);
  }
}
ok("privado + negocio preview: checkpoint, pending, Revenue OS, no unpaid publish");

if (negocioPreview.includes("router.push") && negocioPreview.match(/router\.push[\s\S]{0,120}listing/)) {
  fail("Negocio preview must not router.push to public listing before payment");
}
ok("negocio no direct public listing redirect");

if (!entryCheckpoints.includes("getRentasPrivadoCheckpointCard")) fail("Entry privado checkpoint missing");
if (!entryCheckpoints.includes("getRentasNegocioCheckpointCard")) fail("Entry negocio checkpoint missing");
if (!entryCheckpoints.includes("rentas_30d")) fail("Entry checkpoint must reference rentas_30d");
if (!entryCheckpoints.includes("nuevo anuncio") && !entryCheckpoints.includes("new listing")) {
  fail("Entry checkpoint must state more rentals = new ad");
}
if (!entryCheckpoints.includes("inventario") && !entryCheckpoints.includes("inventory")) {
  fail("Entry checkpoint must state no inventory add-on");
}
ok("entry checkpoints paid, no-upgrade copy");

if (!publishCore.includes("pending_payment")) fail("Publish core must support pending_payment");
if (!publishCore.includes("mergeRentasListingPaymentMeta")) fail("Publish core must merge rentas payment meta");
if (!publishDraft.includes('rentasPaymentLane: "privado"')) fail("Privado draft must set rentasPaymentLane");
if (!publishDraft.includes("publishLeonixListingFromRentasNegocioDraft") || !publishDraft.includes("pending_payment")) {
  fail("Negocio draft publish must accept pending_payment");
}
ok("publish core + draft pending_payment wiring");

if (!rentasFulfillment.includes("activatePaidRentasListingFromRevenueOs")) fail("Rentas fulfillment helper missing");
if (!rentasFulfillment.includes('status: "active"')) fail("Rentas fulfillment must activate to active");
if (!fulfillment.includes("tryActivateRentasListingAfterEntitlement")) fail("Webhook must call Rentas activation");
if (!fulfillment.includes("activatePaidRentasListingFromRevenueOs")) fail("Fulfillment must import Rentas activator");
ok("webhook Rentas fulfillment wired");

if (!webhookRoute.includes("const rawBody = await request.text()")) {
  fail("Webhook raw body read must remain intact");
}
if (!webhookRoute.includes("verifyStripeWebhookEvent")) {
  fail("Webhook signature verification must remain");
}
ok("Stripe webhook raw body / signature pattern preserved");

if (!publicDetail.includes("is_published === false")) fail("Public detail must hide unpublished");
ok("public query hides pending/unpaid");

if (!manageCard.includes("/publicar/rentas/privado")) fail("Dashboard edit route privado missing");
if (!manageCard.includes("/publicar/rentas/negocio")) fail("Dashboard edit route negocio missing");
if (
  manageCard.includes("rentas_inventory") ||
  manageCard.match(/cat\s*===?\s*["']rentas["'][\s\S]{0,300}inventory\s*pack/i) ||
  manageCard.match(/rentas[\s\S]{0,120}add.?on/i)
) {
  fail("Dashboard manage card must not show Rentas inventory/add-on CTA");
}
ok("dashboard edit routes; no inventory CTA");

if (!sharedCheckout.includes("newsletter")) fail("Shared checkpoint must support newsletter");
ok("shared PublishCheckoutCheckpoint present");

const forbiddenCategoryPaths = [
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/autos/",
  "app/(site)/clasificados/empleos/",
  "app/(site)/publicar/autos/",
  "app/(site)/clasificados/restaurantes/",
];
const diffFiles = gitDiffNameOnly()
  .split("\n")
  .map((f) => f.trim())
  .filter(Boolean);
const baselineUnrelated = new Set([
  "app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx",
  "app/(site)/clasificados/en-venta/EnVentaHubPageClient.tsx",
  "app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx",
  "app/(site)/clasificados/en-venta/results/contracts/enVentaResultsUrlParams.ts",
  "app/(site)/clasificados/en-venta/shared/components/EnVentaCompactSearchCanvas.tsx",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/previewDraft.ts",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryCard.tsx",
  "app/lib/clasificados/autos/AUTOS_A5_LAUNCH_READINESS_01_FINAL_PUBLISH_SQL_ANALYTICS_CTA_TRUTH_AUDIT.md",
  "scripts/autos-a5-launch-readiness-01-final-publish-sql-analytics-cta-truth-audit.ts",
  "scripts/verify-bienes-draft-hydration-media-lock-01.mjs",
]);
const rentasAllowedPrefixes = [
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/publicar/rentas/",
  "app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts",
  "app/(site)/clasificados/lib/leonixPublishRealEstate",
  "app/lib/clasificados/rentas/",
  "app/lib/listingPlans/",
  "docs/revenue-os-rentas-paid-publish-lockdown-01.md",
  "scripts/verify-revenue-os-rentas-paid-publish-lockdown-01.mjs",
  "scripts/smoke-revenue-os-rentas-paid-publish-lockdown-01.mjs",
  "package.json",
];
const unrelatedCategoryTouched = diffFiles.filter(
  (f) =>
    forbiddenCategoryPaths.some((p) => f.replace(/\\/g, "/").startsWith(p.replace(/\\/g, "/"))) &&
    !baselineUnrelated.has(f.replace(/\\/g, "/")),
);
if (unrelatedCategoryTouched.length > 0) {
  fail(`Unrelated category files in git diff: ${unrelatedCategoryTouched.join(", ")}`);
}
ok("no unrelated category paths in git diff");

const suspiciousDiff = diffFiles.filter(
  (f) =>
    f &&
    !rentasAllowedPrefixes.some((p) => f.replace(/\\/g, "/").startsWith(p.replace(/\\/g, "/"))),
);
if (suspiciousDiff.length > 0) {
  console.warn(
    `WARN: git diff includes files outside Rentas lockdown allowlist (may be pre-existing): ${suspiciousDiff.join(", ")}`,
  );
}

console.log("verify-revenue-os-rentas-paid-publish-lockdown-01: PASS");
