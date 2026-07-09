#!/usr/bin/env node
/** AUTOS-DEALER-INVENTORY-ADDON-PARITY-01 smoke (source-level) */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => {
  console.error(`smoke-autos-dealer-inventory-addon-parity-01: FAIL — ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`OK: ${m}`);

const helper = read("app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts");
const payload = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
const checkpoint = read("app/lib/listingPlans/publishCheckoutCheckpoint.ts");
const revenueResult = read("app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx");
const app = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");

if (!payload.includes("AUTOS_DEALER_INVENTORY_PACK_DASHBOARD_CHECKOUT")) {
  fail("checkout payload must define AUTOS_DEALER_INVENTORY_PACK_DASHBOARD_CHECKOUT");
}
if (!payload.includes('category: "autos"') || !payload.includes("AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY")) {
  fail("checkout payload must use autos + dealer inventory pack key");
}
if (payload.includes("autos_dealer_monthly") && payload.includes("AUTOS_DEALER_INVENTORY_PACK_DASHBOARD")) {
  const block = payload.split("AUTOS_DEALER_INVENTORY_PACK_DASHBOARD_CHECKOUT")[1]?.slice(0, 400) ?? "";
  if (block.includes("autos_dealer_monthly")) fail("add-on payload must exclude base dealer package");
}
if (!helper.includes("listingId")) fail("checkout must require listingId");
ok("checkout payload smoke");

if (!helper.includes("mode: \"inventory-edit\"") && !helper.includes('mode: "inventory-edit"')) {
  fail("success/inventory edit href must use mode=inventory-edit");
}
if (!helper.includes("focus: \"inventory-pack\"") && !helper.includes('focus: "inventory-pack"')) {
  fail("inventory edit href must use focus=inventory-pack");
}
if (!revenueResult.includes("resolveAutosDealerInventoryPackSuccessPrimaryCta")) fail("success CTA resolver missing");
ok("success CTA smoke");

if (!helper.includes("fetchAutosDealerInventoryPackEntitlementActive")) fail("entitlement fetch missing");
if (!helper.includes("package_key") && !helper.includes("revenuePackageKey")) {
  fail("entitlement must use package key proof");
}
if (!app.includes("inventoryPackActive")) fail("application must unlock on entitlement");
ok("entitlement smoke");

if (privado.includes("inventory-pack") || privado.includes("autosDealerInventoryPack")) {
  fail("privado must not expose inventory add-on");
}
ok("private protection smoke");

if (!helper.includes("listingId") || !helper.includes("returnPanel")) {
  fail("preview/back routes must preserve listing identity");
}
if (!app.includes("focusInventoryPack")) fail("application must preserve inventory focus");
ok("preview/back smoke");

console.log("smoke-autos-dealer-inventory-addon-parity-01: PASS");
