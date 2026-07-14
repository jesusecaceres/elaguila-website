#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (msg) => {
  console.error(`verify-bienes-raices-negocio-full-stacked-production-activation-01: FAIL - ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`OK: ${msg}`);

const files = {
  pkg: "package.json",
  matrix: "app/lib/listingPlans/revenuePricingMatrix.ts",
  payload: "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts",
  checkout: "app/lib/listingPlans/revenueCheckout.ts",
  checkoutRoute: "app/api/revenue-os/checkout/route.ts",
  paymentRecords: "app/lib/listingPlans/revenuePaymentRecords.ts",
  checkpoint: "app/lib/listingPlans/publishCheckoutCheckpoint.ts",
  checkpointUi: "app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx",
  preview: "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
  negocioPreview: "app/(site)/clasificados/bienes-raices/preview/negocio/components/BienesRaicesNegocioPreviewClient.tsx",
  publishCore: "app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts",
  publishDraft: "app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts",
  bundle: "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryBundlePendingPublish.ts",
  dashboardCheckout: "app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts",
  inventoryActions: "app/(site)/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx",
  brPayment: "app/lib/clasificados/bienes-raices/brListingPaymentService.ts",
  brFulfillment: "app/lib/listingPlans/revenueBienesNegocioFulfillment.ts",
  fulfillment: "app/lib/listingPlans/revenueFulfillment.ts",
  webhookRoute: "app/api/revenue-os/webhook/route.ts",
  publicFetch: "app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts",
  relatedFetch: "app/(site)/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser.ts",
  publicDetail: "app/(site)/clasificados/anuncio/[id]/page.tsx",
  analytics: "app/lib/clasificados/bienes-raices/brGlobalAnalytics.ts",
};

for (const [name, rel] of Object.entries(files)) {
  if (!existsSync(path.join(ROOT, rel))) fail(`missing ${name}: ${rel}`);
}

const src = Object.fromEntries(Object.entries(files).map(([k, rel]) => [k, read(rel)]));

const brBase = src.matrix.slice(Math.max(0, src.matrix.indexOf('packageKey: "br_agent_monthly"') - 120), src.matrix.indexOf('packageKey: "br_agent_monthly"') + 500);
if (!brBase.includes('category: "bienes-raices"')) fail("br_agent_monthly must be bienes-raices");
if (!brBase.includes("priceCents: 39900")) fail("br_agent_monthly must be $399");
if (!brBase.includes("br_inventory_pack_monthly ($99/mo)")) fail("base package must name $99 inventory add-on");
const brAddon = src.matrix.slice(Math.max(0, src.matrix.indexOf('packageKey: "br_inventory_pack_monthly"') - 120), src.matrix.indexOf('packageKey: "br_inventory_pack_monthly"') + 420);
if (!brAddon.includes("priceCents: 9900")) fail("br_inventory_pack_monthly must be +$99");
if (!src.checkpoint.includes("BR_INVENTORY_PACK_MAX_CHILDREN = 4")) fail("max children must be 4");
ok("canonical packages, prices, and four-child capacity");

if (!src.checkout.includes('"bienes-raices"') || !src.checkout.includes("BR_INVENTORY_PACK_PACKAGE_KEY")) {
  fail("Revenue checkout add-on allowlist must include Bienes inventory pack");
}
if (!src.checkout.includes("validateBienesInventoryAddonOwnership")) fail("dashboard add-on ownership validator missing");
if (!src.checkout.includes("private_fsbo_not_eligible")) fail("private/FSBO inventory must be blocked server-side");
if (!src.checkoutRoute.includes("validateBienesInventoryAddonOwnership")) fail("checkout route must call Bienes owner gate");
if (src.checkoutRoute.includes("body.amountCents")) fail("checkout route must not trust client amount");
ok("server price authority, add-on allowlist, and FSBO block");

if (!src.preview.includes("PublishCheckoutCheckpoint")) fail("agent preview must mount shared checkpoint");
if (!src.preview.includes("onPromoApply={handlePromoApply}")) fail("promo Apply must be wired");
if (!src.preview.includes("captureCheckoutNewsletterSubscriber")) fail("newsletter capture must be wired");
if (!src.preview.includes("BIENES_NEGOCIO_CHECKPOINT_CONFIRMATIONS")) fail("Bienes confirmations must be present");
if (!src.preview.includes('activationMode: needsPayment ? "pending_payment" : "immediate"')) {
  fail("parent must hidden pending-save before checkout");
}
if (!src.preview.includes("publishBrAgenteInventoryBundlePendingRows")) fail("children must hidden pending-save before checkout");
if (!src.preview.includes("BR_INVENTORY_PACK_PACKAGE_KEY")) fail("initial base+inventory checkout must send add-on");
if (!src.preview.includes("withBrAgenteResLangParam") || !src.preview.includes("checkout=cancelled")) fail("cancel must return to preview context");
ok("final checkpoint, promo, newsletter, pending saves, return routing");

if (!src.publishCore.includes("reusableRealEstatePending")) fail("pending retries must reuse Bienes/Rentas rows");
if (!src.publishCore.includes("category === \"bienes-raices\" && sellerType === \"business\"")) fail("Bienes reuse must be negocio scoped");
if (!src.publishCore.includes("leonixAdId?: string | null")) fail("pending save must return Leonix ID");
if (!src.publishCore.includes('params.activationMode !== "pending_payment"')) fail("pending save must not stamp published_at");
if (!src.bundle.includes("childListingId === parentListingId")) fail("child pending save must reject parent UUID reuse");
if (!src.bundle.includes("BR_INVENTORY_PACK_MAX_CHILDREN")) fail("child bundle must cap at four");
ok("hidden parent/child identity and duplicate prevention");

if (!src.brFulfillment.includes("activatePaidBienesNegocioListingFromRevenueOs")) fail("Bienes negocio fulfillment helper missing");
if (!src.brFulfillment.includes("BIENES_NEGOCIO_BASE_PACKAGE_KEY")) fail("base package guard missing");
if (!src.brFulfillment.includes("BIENES_INVENTORY_PACK_PACKAGE_KEY")) fail("inventory package must be entitlement-only in helper");
if (!src.brPayment.includes("BR_INVENTORY_PACK_MAX_CHILDREN")) fail("webhook child fan-out must cap at four");
if (!src.brPayment.includes("inventory_property")) fail("webhook must publish only child inventory siblings");
if (!src.fulfillment.includes("tryActivateBienesNegocioListingAfterEntitlement")) fail("shared fulfillment must call Bienes negocio activation");
if (!src.webhookRoute.includes("const rawBody = await request.text()") || !src.webhookRoute.includes("verifyStripeWebhookEvent")) {
  fail("webhook raw signature path must remain intact");
}
ok("verified webhook activation and child fan-out");

if (!src.dashboardCheckout.includes("BIENES_INVENTORY_PACK_DASHBOARD_CHECKOUT")) fail("dashboard $99 add-on checkout missing");
if (!src.inventoryActions.includes("fetchBienesInventoryPackEntitlementActive")) fail("dashboard must read server entitlement");
if (src.inventoryActions.includes("listingJsonBrInventoryPackEnabled")) fail("dashboard must not trust profile JSON flag for inventory active");
if (!src.dashboardCheckout.includes("br_inventory_pack_monthly")) fail("dashboard add-on checkout must be $99-only package");
ok("existing-listing $99 upgrade and entitlement enforcement");

if (!src.publicFetch.includes("is_published") || !src.publicFetch.includes("status")) fail("public readers must filter paid/active rows");
if (!src.relatedFetch.includes("br_inventory_parent_listing_id") || !src.relatedFetch.includes("is_published")) {
  fail("child public reader must preserve parent relationship and hide unpaid rows");
}
if (/children\s*=\{\s*\(/.test(src.publicDetail) || /renderProp/i.test(src.publicDetail)) {
  fail("public detail has suspicious server-to-client render prop");
}
if (src.publicDetail.includes("new URL(") && !src.publicDetail.includes("try")) {
  fail("optional URL construction must be guarded");
}
ok("public visibility and RSC serialization guard");

if (!src.analytics.includes("bienes-raices") || !src.publicDetail.includes("leonix_ad_id")) {
  fail("analytics/public identity must preserve category and Leonix ID");
}
ok("analytics identity preserved");

const diffFiles = execFileSync("git", ["diff", "--name-only"], { cwd: ROOT, encoding: "utf8" })
  .split(/\r?\n/)
  .map((f) => f.trim().replace(/\\/g, "/"))
  .filter(Boolean);
const allowedPrefixes = [
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/publicar/bienes-raices/",
  "app/(site)/clasificados/lib/leonix",
  "app/(site)/dashboard/",
  "app/api/revenue-os/",
  "app/lib/clasificados/bienes-raices/",
  "app/lib/listingPlans/",
  "scripts/",
  "package.json",
];
const forbidden = diffFiles.filter((f) => !allowedPrefixes.some((p) => f.startsWith(p) || f === p));
if (forbidden.length) fail(`unrelated changed files: ${forbidden.join(", ")}`);
ok("diff stays Bienes/Revenue OS scoped");

if (!src.pkg.includes("verify:bienes-raices-negocio-full-stacked-production-activation-01")) fail("package verify script missing");
if (!src.pkg.includes("smoke:bienes-raices-negocio-full-stacked-production-activation-01")) fail("package smoke script missing");

console.log("verify-bienes-raices-negocio-full-stacked-production-activation-01: PASS");
