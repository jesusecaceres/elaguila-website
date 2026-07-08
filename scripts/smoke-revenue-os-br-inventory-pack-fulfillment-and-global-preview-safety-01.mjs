#!/usr/bin/env node
/** REVENUE-OS-BR-INVENTORY-PACK-FULFILLMENT-AND-GLOBAL-PREVIEW-SAFETY-01 smoke */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => {
  console.error(`smoke-revenue-os-br-inventory-pack-fulfillment-and-global-preview-safety-01: FAIL — ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`OK: ${m}`);

const helper = read("app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts");
const payload = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
const pago = read("app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx");
const inventory = read("app/(site)/dashboard/lib/dashboardInventory.ts");
const serviciosHelper = read("app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts");
const card = read("app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx");

const listingId = "22222222-2222-2222-2222-222222222222";

if (!payload.includes('category: "bienes-raices"')) fail("checkout category must be bienes-raices");
if (!payload.includes("BR_INVENTORY_PACK_PACKAGE_KEY")) fail("checkout must use inventory pack key");
if (payload.includes("br_agent_monthly") && /BIENES_INVENTORY_PACK_DASHBOARD_CHECKOUT[\s\S]{0,120}br_agent_monthly/.test(payload)) {
  fail("checkout must exclude br_agent_monthly");
}
if (!helper.includes("listingId")) fail("checkout helper must require listingId");
ok("Bienes inventory checkout payload smoke");

if (!helper.includes("resolveBienesInventoryPackSuccessPrimaryCta")) fail("success CTA resolver missing");
if (!helper.includes("bienesInventoryEditHref")) fail("success CTA must route to inventory editor");
if (!helper.includes('"inventory-edit"')) fail("success CTA must use inventory-edit mode");
if (!helper.includes('"inventory-pack"')) fail("success CTA must focus inventory-pack");
if (!pago.includes("resolveBienesInventoryPackSuccessPrimaryCta")) fail("pago must wire success CTA");
ok("Bienes success CTA smoke");

if (!helper.includes("fetchBienesInventoryPackEntitlementActive")) fail("entitlement fetch missing");
if (!helper.includes("redirectBienesDashboardInventoryPackCheckout")) fail("inactive checkout CTA missing");
if (!helper.includes("bienesInventoryPackActive")) fail("active state helper missing");
ok("Entitlement unlock smoke");

const emptyRestPreview = "/clasificados/restaurantes/preview?lang=es";
if (inventory.includes(`previewHref: \`${emptyRestPreview}\``) || inventory.includes(`previewHref: '${emptyRestPreview}'`)) {
  fail("Restaurante preview must not be empty draft-only route");
}
if (!inventory.includes("restauranteDashboardListingPreviewHref")) fail("Restaurante preview helper missing");
if (!inventory.includes("listingId")) fail("Restaurante preview must include listing identity");
ok("Restaurante preview safety smoke");

if (!inventory.includes("serviciosListingPreviewHref")) fail("Servicios preview helper missing in inventory");
if (!serviciosHelper.includes('params.set("preview", "listing")')) fail("Servicios preview must be listing-bound");
if (!card.includes("bienesListingPreviewHref")) fail("Bienes preview must be listing-bound");
ok("Servicios/Bienes preview smoke");

console.log("\nsmoke-revenue-os-br-inventory-pack-fulfillment-and-global-preview-safety-01: ALL CHECKS PASSED");
