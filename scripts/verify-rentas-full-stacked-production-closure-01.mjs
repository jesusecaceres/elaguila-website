#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (msg) => {
  console.error(`verify-rentas-full-stacked-production-closure-01: FAIL - ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`OK: ${msg}`);

const files = {
  pkg: "package.json",
  matrix: "app/lib/listingPlans/revenuePricingMatrix.ts",
  checkpointContract: "app/lib/listingPlans/publishCheckoutCheckpoint.ts",
  checkpointUi: "app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx",
  payload: "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts",
  checkout: "app/lib/listingPlans/revenueCheckout.ts",
  checkoutRoute: "app/api/revenue-os/checkout/route.ts",
  webhookRoute: "app/api/revenue-os/webhook/route.ts",
  fulfillment: "app/lib/listingPlans/revenueFulfillment.ts",
  rentasFulfillment: "app/lib/listingPlans/revenueRentasFulfillment.ts",
  privadoPreview: "app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx",
  negocioPreview: "app/(site)/clasificados/rentas/preview/negocio/components/RentasNegocioPreviewClient.tsx",
  checkoutConfig: "app/(site)/clasificados/rentas/preview/shared/rentasPreviewPaidCheckout.ts",
  publishDraft: "app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts",
  publishCore: "app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts",
  mediaPrepare: "app/(site)/clasificados/rentas/shared/rentasDraftPublishPrepare.ts",
  mediaGuards: "app/(site)/clasificados/rentas/lib/rentasListingPublishedMediaGuards.ts",
  publicSelect: "app/(site)/clasificados/rentas/lib/rentasListingPublicSelect.ts",
  publicDetailFetch: "app/(site)/clasificados/rentas/lib/fetchRentasListingForPublicDetail.ts",
  browseFetch: "app/(site)/clasificados/rentas/lib/fetchRentasPublicListingsForBrowse.ts",
  mapper: "app/(site)/clasificados/rentas/data/mapListingRowToRentasPublicListing.ts",
  detailPage: "app/(site)/clasificados/rentas/listing/[id]/page.tsx",
  detailClient: "app/(site)/clasificados/rentas/listing/[id]/RentasListingDetailClient.tsx",
  manageCard: "app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx",
  analytics: "app/(site)/clasificados/rentas/analytics/rentasAnalytics.ts",
};

for (const [name, rel] of Object.entries(files)) {
  if (!existsSync(path.join(ROOT, rel))) fail(`missing ${name}: ${rel}`);
}

const src = Object.fromEntries(Object.entries(files).map(([k, rel]) => [k, read(rel)]));

const rentasMatrixStart = src.matrix.indexOf('packageKey: "rentas_30d"');
if (rentasMatrixStart < 0) fail("rentas_30d missing from revenuePricingMatrix");
const rentasMatrix = src.matrix.slice(Math.max(0, rentasMatrixStart - 160), rentasMatrixStart + 500);
if (!rentasMatrix.includes('category: "rentas"')) fail("rentas_30d category must be rentas");
if (!rentasMatrix.includes("priceCents: 2499")) fail("rentas_30d must be $24.99");
if (!rentasMatrix.includes("durationDays: 30")) fail("rentas_30d must be 30 days");
if (!rentasMatrix.includes("includedInventory: \"1 listing\"")) fail("rentas_30d must be one listing");
if (!rentasMatrix.includes("addOnInventory: null")) fail("rentas_30d must have no add-on inventory");
ok("canonical rentas_30d package, price, duration, one-listing truth");

if (!src.payload.includes("RENTAS_CATEGORY_CHECKOUT")) fail("RENTAS_CATEGORY_CHECKOUT missing");
if (!src.payload.includes('category: "rentas"') || !src.payload.includes('packageKey: "rentas_30d"')) {
  fail("Rentas checkout payload must use category rentas + rentas_30d");
}
if (/RENTAS_CATEGORY_CHECKOUT[\s\S]{0,220}addOns/i.test(src.payload)) fail("Rentas checkout payload must not define addOns");
ok("Rentas Revenue OS payload canonical and no add-ons");

if (!src.checkout.includes("CHECKOUT_ADDON_ALLOWLIST")) fail("checkout add-on allowlist missing");
if (/CHECKOUT_ADDON_ALLOWLIST[\s\S]{0,800}rentas/.test(src.checkout)) fail("Rentas must not be in checkout add-on allowlist");
if (!src.checkout.includes("validateRevenueCheckoutRequest")) fail("server checkout validation missing");
if (src.checkoutRoute.includes("amountCents") && src.checkoutRoute.includes("body.amountCents")) {
  fail("checkout route must not trust client amount");
}
ok("server price authority and no Rentas add-ons");

if (!src.checkpointContract.includes("RENTAS_CHECKPOINT_CONFIRMATIONS")) fail("Rentas confirmations missing");
for (const token of ["accurate_rental_info", "authorized_to_publish", "rentas_rules", "payment_required"]) {
  if (!src.checkpointContract.includes(token)) fail(`Rentas confirmation missing: ${token}`);
}
if (!src.checkpointUi.includes("Aplicar") || !src.checkpointUi.includes("Apply")) fail("promo Apply button missing");
if (!src.checkpointUi.includes("newsletterOptIn")) fail("newsletter opt-in missing");
if (!src.checkpointUi.includes("requiredRemaining") || !src.checkpointUi.includes("finalButtonEnabled")) {
  fail("required confirmations must gate checkout");
}
ok("shared checkpoint promo, newsletter, confirmations, disabled checkout");

for (const [lane, preview] of [
  ["privado", src.privadoPreview],
  ["negocio", src.negocioPreview],
]) {
  if (!preview.includes("PublishCheckoutCheckpoint")) fail(`${lane} preview must mount shared checkpoint`);
  if (!preview.includes("rentasPreviewCheckpointConfig(lang")) fail(`${lane} preview must use Rentas checkpoint config`);
  if (!preview.includes('activationMode: "pending_payment"')) fail(`${lane} preview must hidden pending-save`);
  if (!preview.includes("resolveRentas") || !preview.includes("DraftMediaToRemoteUrls")) fail(`${lane} preview must prepare durable media`);
  if (!preview.includes("startRevenueCategoryCheckout")) fail(`${lane} preview must call Revenue OS checkout`);
  if (!preview.includes("RENTAS_CATEGORY_CHECKOUT")) fail(`${lane} preview must use Rentas checkout constant`);
  if (!preview.includes("r.leonixAdId")) fail(`${lane} preview must use persisted Leonix ID from pending save`);
  if (/addOns\s*:/.test(preview)) fail(`${lane} preview must not attach add-ons`);
}
ok("both Rentas preview lanes checkpoint, pending-save, media, Revenue OS");

if (!src.publishDraft.includes("publishLeonixListingFromRentasPrivadoDraft")) fail("private publish helper missing");
if (!src.publishDraft.includes("publishLeonixListingFromRentasNegocioDraft")) fail("business publish helper missing");
if (!src.publishDraft.includes('rentasPaymentLane: "privado"')) fail("private lane discriminator missing");
if (!src.publishDraft.includes('rentasPaymentLane: "negocio"')) fail("business lane discriminator missing");
if (!src.publishDraft.includes("orderedRentasGallerySourcesForPublish")) fail("image ordering must be preserved");
if (!src.publishCore.includes("leonixAdId?: string | null")) fail("pending save must return Leonix ID");
if (!src.publishCore.includes("listingStatus?: string | null")) fail("pending save must return listing status");
if (!src.publishCore.includes("reusableRentasPending")) fail("pending retries must reuse an existing Rentas row");
if (!src.publishCore.includes('params.activationMode !== "pending_payment"')) fail("pending save must not stamp published_at in gallery patch");
ok("hidden pending-save returns identity, preserves pending lifecycle, reuses row");

if (!src.mediaPrepare.includes("assertGalleryTransportClean")) fail("Rentas media transport clean guard missing");
if (!src.mediaPrepare.includes("must be HTTPS before publish")) fail("temporary media must be rejected before publish");
if (!src.mediaGuards.includes("blob:") || !src.mediaGuards.includes("data:")) fail("published media guards must reject temporary media");
if (!src.mapper.includes("sanitizeHttpUrl") || !src.mapper.includes("new URL")) fail("optional URL safety helper missing");
ok("media durability and optional URL safety guards");

if (!src.publicDetailFetch.includes("statusNorm") || !src.publicDetailFetch.includes('statusNorm === "active"')) {
  fail("public detail must explicitly require active status");
}
if (!src.publicDetailFetch.includes("row.is_published === false")) fail("public detail must hide unpublished rows");
if (!src.mapper.includes("browseActive") || !src.mapper.includes('status === "active"')) fail("browse mapping must hide non-active rows");
if (!src.browseFetch.includes("m && m.browseActive !== false")) fail("browse fetch must filter unpublished/inactive mapped rows");
ok("public results/detail hide unpaid rows");

if (!src.rentasFulfillment.includes("activatePaidRentasListingFromRevenueOs")) fail("Rentas fulfillment helper missing");
for (const token of ["RENTAS_30D_PACKAGE_KEY", "missing_listing_id", "wrong_category", "unsafe_status", "already_published"]) {
  if (!src.rentasFulfillment.includes(token)) fail(`Rentas fulfillment guard missing: ${token}`);
}
if (!src.rentasFulfillment.includes('status: "active"') || !src.rentasFulfillment.includes("is_published: true")) {
  fail("Rentas webhook must activate exact row");
}
if (!src.fulfillment.includes("tryActivateRentasListingAfterEntitlement")) fail("shared fulfillment must call Rentas activation");
if (!src.webhookRoute.includes("const rawBody = await request.text()")) fail("webhook raw body handling changed/missing");
if (!src.webhookRoute.includes("verifyStripeWebhookEvent")) fail("webhook signature verification missing");
ok("webhook activation wired and raw signature path preserved");

if (!src.manageCard.includes("/publicar/rentas/privado") || !src.manageCard.includes("/publicar/rentas/negocio")) {
  fail("dashboard Rentas edit routes missing");
}
if (/rentas_(inventory|add.?on)/i.test(src.manageCard) || /rentas[\s\S]{0,120}(Stripe|checkout)/i.test(src.manageCard)) {
  fail("dashboard Rentas card must not expose checkout/add-on/inventory CTA");
}
ok("dashboard edit routes avoid recharge/add-on/inventory CTA");

if (!src.detailPage.includes("<RentasListingDetailClient listing={listing} extra={extra} />")) {
  fail("Rentas detail page should pass serializable data into client");
}
if (/function\s*\(/.test(src.detailPage.split("<RentasListingDetailClient")[0]) && src.detailPage.includes("children")) {
  fail("suspicious function-valued prop before Rentas detail client");
}
if (!src.detailClient.startsWith('"use client";')) fail("Rentas detail client must be a client component");
if (src.detailPage.includes("onTranslated=") || src.detailPage.includes("requestTranslation=")) {
  fail("server detail page must not pass function props to client");
}
ok("RSC boundary avoids server-to-client function props");

if (!src.analytics.includes('const CATEGORY = "rentas"') && !src.analytics.includes('category: "rentas"')) {
  fail("Rentas analytics identity must include category");
}
if (!src.detailClient.includes("trackRentasListingView") || !src.detailClient.includes("trackRentasMessageSent")) {
  fail("Rentas detail analytics hooks missing");
}
ok("Rentas analytics identity/hooks preserved");

const diffFiles = execFileSync("git", ["diff", "--name-only"], { cwd: ROOT, encoding: "utf8" })
  .split(/\r?\n/)
  .map((f) => f.trim().replace(/\\/g, "/"))
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
const forbiddenPrefixes = [
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/clasificados/autos/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/empleos/",
];
const newForbidden = diffFiles.filter((f) => forbiddenPrefixes.some((p) => f.startsWith(p)) && !baselineUnrelated.has(f));
if (newForbidden.length) fail(`new unrelated category files changed: ${newForbidden.join(", ")}`);
ok("no new unrelated category files changed beyond recorded baseline");

if (!src.pkg.includes("verify:rentas-full-stacked-production-closure-01")) {
  fail("package.json must register focused verifier");
}

console.log("verify-rentas-full-stacked-production-closure-01: PASS");
