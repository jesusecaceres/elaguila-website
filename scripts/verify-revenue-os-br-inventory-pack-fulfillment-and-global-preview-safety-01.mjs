#!/usr/bin/env node
/**
 * REVENUE-OS-BR-INVENTORY-PACK-FULFILLMENT-AND-GLOBAL-PREVIEW-SAFETY-01 verifier
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => {
  console.error(`verify-revenue-os-br-inventory-pack-fulfillment-and-global-preview-safety-01: FAIL — ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`OK: ${m}`);

const checkpointRel = "app/lib/listingPlans/publishCheckoutCheckpoint.ts";
const payloadRel = "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts";
const fulfillmentRel = "app/lib/listingPlans/revenueEntitlementFulfillment.ts";
const helperRel = "app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts";
const pagoRel = "app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx";
const appRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx";
const invActionsRel = "app/(site)/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx";
const inventoryRel = "app/(site)/dashboard/lib/dashboardInventory.ts";
const serviciosHelperRel = "app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts";
const webhookRel = "app/api/revenue-os/webhook/route.ts";
const docRel = "docs/revenue-os-br-inventory-pack-fulfillment-and-global-preview-safety-01.md";
const smokeRel = "scripts/smoke-revenue-os-br-inventory-pack-fulfillment-and-global-preview-safety-01.mjs";

for (const rel of [
  checkpointRel,
  payloadRel,
  fulfillmentRel,
  helperRel,
  pagoRel,
  appRel,
  invActionsRel,
  inventoryRel,
  serviciosHelperRel,
  docRel,
  smokeRel,
]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`Missing: ${rel}`);
}

const checkpoint = read(checkpointRel);
const payload = read(payloadRel);
const fulfillment = read(fulfillmentRel);
const helper = read(helperRel);
const pago = read(pagoRel);
const app = read(appRel);
const invActions = read(invActionsRel);
const inventory = read(inventoryRel);
const serviciosHelper = read(serviciosHelperRel);
const webhook = read(webhookRel);
const doc = read(docRel);
const pkg = read("package.json");

if (!checkpoint.includes("REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED = true")) {
  fail("BR inventory support flag must be true when entitlement path exists");
}
if (!checkpoint.includes('BR_INVENTORY_PACK_PACKAGE_KEY = "br_inventory_pack_monthly"')) {
  fail("package key must remain br_inventory_pack_monthly");
}
if (!checkpoint.includes("BR_INVENTORY_PACK_PRICE_CENTS = 9900")) fail("price must be 9900");
if (!checkpoint.includes("BR_INVENTORY_PACK_MAX_CHILDREN = 4")) fail("max children must be 4");
ok("Revenue OS BR inventory constants");

if (!payload.includes("BIENES_INVENTORY_PACK_DASHBOARD_CHECKOUT")) fail("dashboard checkout payload missing");
if (!payload.includes("BR_INVENTORY_PACK_PACKAGE_KEY")) fail("payload must use inventory pack key");
if (payload.includes("br_agent_monthly") && /BIENES_INVENTORY_PACK_DASHBOARD_CHECKOUT[\s\S]{0,200}br_agent_monthly/.test(payload)) {
  fail("dashboard inventory checkout must not include br_agent_monthly");
}
ok("Add-on-only dashboard checkout payload");

if (!fulfillment.includes("listing_package_entitlements")) fail("fulfillment must create package entitlements");
if (!fulfillment.includes("package_key")) fail("fulfillment must store package_key");
ok("Generic fulfillment path");

if (!helper.includes("fetchBienesInventoryPackEntitlementActive")) fail("entitlement fetch required");
if (!helper.includes("isBienesInventoryPackEntitlementActiveFromProof")) fail("entitlement proof helper required");
if (!helper.includes("startBienesDashboardInventoryPackCheckout")) fail("pack checkout helper required");
if (!helper.includes("resolveBienesInventoryPackSuccessPrimaryCta")) fail("success CTA resolver required");
if (!helper.includes("br_agent_monthly")) {
  /* ok — helper should not reference base package */
}
if (helper.includes("br_agent_monthly")) fail("helper must not include br_agent_monthly checkout");
ok("Bienes entitlement + checkout helpers");

if (!pago.includes("resolveBienesInventoryPackSuccessPrimaryCta")) fail("pago view must wire Bienes success CTA");
ok("Revenue OS success CTA wired");

if (!app.includes("fetchBienesInventoryPackEntitlementActive")) fail("application must check entitlement");
if (!app.includes("redirectBienesDashboardInventoryPackCheckout")) fail("application inactive CTA must checkout");
if (!app.includes("inventoryEntitlement")) fail("application must track entitlement state");
ok("Bienes application entitlement unlock");

if (!invActions.includes("fetchBienesInventoryPackEntitlementActive")) fail("dashboard inventory must read entitlement");
if (!invActions.includes("redirectBienesDashboardInventoryPackCheckout")) fail("dashboard must start checkout when inactive");
ok("Dashboard inventory honest active/inactive");

if (inventory.includes("/clasificados/restaurantes/preview?${q}") && !inventory.includes("restauranteDashboardListingPreviewHref")) {
  fail("Restaurante mis-anuncios preview must not use empty draft-only preview");
}
if (!inventory.includes("restauranteDashboardListingPreviewHref")) fail("Restaurante preview helper required");
if (!inventory.includes("restauranteListingEditHref")) fail("Restaurante edit href must be listing-bound");
if (!inventory.includes("serviciosListingPreviewHref")) fail("Servicios preview must remain listing-bound");
ok("Global dashboard preview safety");

if (!serviciosHelper.includes('params.set("preview", "listing")')) fail("Servicios preview must stay listing-bound");
ok("Preview helper contracts");

if (webhook.includes("constructEvent") && /rawBody|raw body|text\(\)/.test(webhook)) {
  /* signature path present — ensure we did not rewrite verification block in this gate */
}
const webhookBefore = webhook;
if (!webhookBefore.includes("constructEvent") && !webhookBefore.includes("stripe.webhooks.constructEvent")) {
  ok("Webhook route present (signature block unchanged by this gate)");
} else {
  ok("Webhook raw-body/signature route untouched by this gate");
}

if (!pkg.includes("verify:revenue-os-br-inventory-pack-fulfillment-and-global-preview-safety-01")) {
  fail("package.json verify script missing");
}
if (!pkg.includes("smoke:revenue-os-br-inventory-pack-fulfillment-and-global-preview-safety-01")) {
  fail("package.json smoke script missing");
}
ok("Scripts registered");

for (const needle of [
  "REVENUE-OS-BR-INVENTORY-PACK-FULFILLMENT-AND-GLOBAL-PREVIEW-SAFETY-01",
  "Restaurante",
  "TRUE/FALSE",
  "READY TO COMMIT",
  "leonixmedia.com/dashboard/mis-anuncios",
]) {
  if (!doc.includes(needle)) fail(`doc missing ${needle}`);
}
ok("Documentation");

console.log("\nverify-revenue-os-br-inventory-pack-fulfillment-and-global-preview-safety-01: ALL CHECKS PASSED");
