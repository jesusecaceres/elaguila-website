#!/usr/bin/env node
/** AUTOS-DEALER-INVENTORY-ADDON-PARITY-01 verifier */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => {
  console.error(`verify-autos-dealer-inventory-addon-parity-01: FAIL — ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`OK: ${m}`);

const helperRel = "app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts";
const mapperRel = "app/(site)/publicar/autos/negocios/lib/autosPublishedToDealerApplicationDraft.ts";
const appRel = "app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx";
const boostRel = "app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBoostPanel.tsx";
const invModuleRel = "app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryValueModule.tsx";
const dashboardRel = "app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx";
const matrixRel = "app/lib/listingPlans/revenuePricingMatrix.ts";
const payloadRel = "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts";
const checkpointRel = "app/lib/listingPlans/publishCheckoutCheckpoint.ts";
const revenueResultRel = "app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx";
const dashboardInventoryRel = "app/(site)/dashboard/lib/dashboardInventory.ts";
const publicDealerRel = "app/api/clasificados/autos/public/dealer/[dealerInventoryGroupId]/route.ts";
const webhookRel = "app/api/stripe/webhook/route.ts";
const docRel = "docs/autos-dealer-inventory-addon-parity-01.md";

for (const rel of [
  helperRel,
  mapperRel,
  appRel,
  boostRel,
  invModuleRel,
  dashboardRel,
  docRel,
]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`Missing: ${rel}`);
}

const helper = read(helperRel);
const mapper = read(mapperRel);
const app = read(appRel);
const boost = read(boostRel);
const invModule = read(invModuleRel);
const dashboard = read(dashboardRel);
const matrix = read(matrixRel);
const payload = read(payloadRel);
const checkpoint = read(checkpointRel);
const revenueResult = read(revenueResultRel);
const dashboardInventory = read(dashboardInventoryRel);
const publicDealer = read(publicDealerRel);
const pkg = read("package.json");

for (const fn of [
  "autosDealerListingEditHref",
  "autosDealerInventoryEditHref",
  "autosDealerInventoryAddonHref",
  "autosDealerListingPreviewHref",
  "autosDealerBackToEditHrefFromPreview",
  "buildAutosDashboardListingContextParams",
  "fetchAutosDealerInventoryPackEntitlementActive",
  "startAutosDealerInventoryPackCheckout",
  "resolveAutosDealerInventoryPackSuccessPrimaryCta",
]) {
  if (!helper.includes(`export function ${fn}`) && !helper.includes(`export async function ${fn}`)) {
    fail(`helper must export ${fn}`);
  }
}
ok("Autos dashboard helper routes");

if (!helper.includes('AUTOS_DASHBOARD_APPLICATION_BASE = "/publicar/autos/negocios"')) {
  fail("helper must use direct negocio application base");
}
if (!helper.includes("listingSource: \"autos_classifieds_listings\"")) {
  fail("entitlement fetch must use autos_classifieds_listings source");
}
if (!helper.includes("AUTOS_DEALER_INVENTORY_PACK_DASHBOARD_CHECKOUT")) {
  fail("helper must use add-on-only checkout payload");
}
if (helper.includes("autos_dealer_monthly")) fail("helper must not charge base dealer package");
if (helper.includes("autos_privado")) fail("helper must not reference privado package");
ok("add-on-only checkout helper");

if (!checkpoint.includes("autos_dealer_inventory_pack_monthly")) fail("package key constant required");
if (!checkpoint.includes("REVENUE_OS_AUTOS_DEALER_INVENTORY_PACK_SUPPORTED = true")) {
  fail("inventory pack support must be enabled or honestly blocked");
}
if (!matrix.includes("autos_dealer_inventory_pack_monthly")) fail("matrix must define inventory pack");
if (!matrix.includes("12900")) fail("matrix price must match documented $129/mo (12900 cents)");
ok("package/pricing truth");

if (!payload.includes("AUTOS_DEALER_INVENTORY_PACK_DASHBOARD_CHECKOUT")) fail("checkout payload missing");
if (!payload.includes("AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY")) fail("payload must reference inventory pack key constant");
ok("Revenue OS payload");

if (!mapper.includes("hydrateAutosDealerListingForDashboardEdit")) fail("hydration mapper missing");
if (!mapper.includes("additionalInventoryVehicles")) fail("mapper must hydrate child inventory");
if (!mapper.includes("durableHttpUrls") && !mapper.includes('startsWith("http')) {
  fail("mapper must enforce durable URLs");
}
ok("hydration mapper");

for (const needle of [
  "isExistingDashboardListingMode",
  "fetchAutosDealerInventoryPackEntitlementActive",
  "hydrateAutosDealerListingForDashboardEdit",
  "redirectAutosDealerInventoryPackCheckout",
  "focusInventoryPack",
  "inventoryPackActive",
]) {
  if (!app.includes(needle)) fail(`application must reference ${needle}`);
}
ok("application dashboard unlock");

if (boost.includes("checkoutSoon") || boost.includes("checkout soon")) {
  fail("boost panel must not use checkout-soon fake path when supported");
}
if (!boost.includes("redirectAutosDealerInventoryPackCheckout")) fail("boost panel must start real checkout");
ok("boost panel checkout");

if (!invModule.includes("postPublishDashboardMode")) fail("inventory module must gate dashboard entitlement");
if (!invModule.includes("inventoryPackActive")) fail("inventory module must respect entitlement");
ok("inventory module entitlement gate");

if (!dashboard.includes("autosDealerInventoryEditHref")) fail("dashboard section must link inventory edit");
if (!dashboard.includes("redirectAutosDealerInventoryPackCheckout")) fail("dashboard must offer add-on checkout");
ok("dashboard CTAs");

if (!dashboardInventory.includes("autosDealerListingEditHref")) fail("dashboard inventory must use listing-bound edit");
if (!helper.includes('source: "dashboard"') && !helper.includes('"source", "dashboard"')) {
  fail("helper must set source=dashboard");
}
if (!helper.includes('params.set("returnPanel", "autos")')) fail("helper must set returnPanel=autos");
ok("dashboard inventory routes");

if (!revenueResult.includes("resolveAutosDealerInventoryPackSuccessPrimaryCta")) {
  fail("Revenue OS success view must handle autos inventory pack");
}
if (!revenueResult.includes("resolveBienesInventoryPackSuccessPrimaryCta")) {
  fail("must not break Bienes success CTA");
}
ok("success CTA");

if (!publicDealer.includes("listActiveDealerInventoryByGroupId")) fail("public child render path required");
ok("public child render path");

const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
if (privadoApp.includes("autosDealerInventoryPack") || privadoApp.includes("inventory-pack")) {
  fail("privado application must not expose dealer inventory add-on");
}
ok("Autos privado protected");

if (existsSync(path.join(ROOT, webhookRel))) {
  const webhook = read(webhookRel);
  if (webhook.includes("AUTOS_DEALER_INVENTORY") && webhook.includes("rawBody")) {
    fail("webhook raw body path must not be modified for this gate");
  }
}
ok("webhook untouched");

const bienesHelper = read("app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts");
if (!bienesHelper.includes("fetchBienesInventoryPackEntitlementActive")) fail("Bienes helper regression");
ok("Bienes runtime untouched");

if (!pkg.includes("verify:autos-dealer-inventory-addon-parity-01")) fail("package script missing");
if (!pkg.includes("smoke:autos-dealer-inventory-addon-parity-01")) fail("smoke script missing");

const doc = read(docRel);
if (!doc.includes("READY TO COMMIT")) fail("doc must include READY TO COMMIT status");
if (!doc.includes("autos_privado")) fail("doc must document privado protection");
ok("doc + package scripts");

console.log("verify-autos-dealer-inventory-addon-parity-01: PASS");
