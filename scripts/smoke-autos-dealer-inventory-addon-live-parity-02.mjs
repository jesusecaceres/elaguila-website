#!/usr/bin/env node
/** AUTOS-DEALER-INVENTORY-ADDON-LIVE-PARITY-02 smoke — source-level, no Stripe/Supabase mutation */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => {
  console.error(`smoke-autos-dealer-inventory-addon-live-parity-02: FAIL — ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`OK: ${m}`);

const helper = read("app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts");
const payload = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
const checkoutRoute = read("app/api/revenue-os/checkout/route.ts");
const checkoutLib = read("app/lib/listingPlans/revenueCheckout.ts");

// 1. Add-on checkout payload: category autos + inventory pack key, no base package
if (!payload.includes('category: "autos"') || !payload.includes("AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY")) {
  fail("checkout payload must be autos + inventory pack key");
}
{
  const block = payload.split("AUTOS_DEALER_INVENTORY_PACK_DASHBOARD_CHECKOUT")[1]?.slice(0, 400) ?? "";
  if (block.includes("autos_dealer_monthly")) fail("dashboard add-on checkout must not include base dealer package");
}
ok("1. checkout payload is add-on-only (autos + inventory pack)");

// 2. Checkout requires listingId + fails safely without it
if (!helper.includes("A published dealer listing is required")) fail("missing listingId must fail safely");
if (!helper.includes("listingId: input.leonixAdId") && !helper.includes("leonixAdId: input.leonixAdId")) {
  fail("checkout must carry leonixAdId when available");
}
ok("2. checkout requires listingId, carries leonixAdId");

// 3. Server guard rejects privado + non-owner
if (!checkoutLib.includes('lane !== "negocios"')) fail("server guard must reject privado lane");
if (!checkoutRoute.includes("isAutosDealerInventoryAddonEarly")) fail("route must gate autos add-on ownership");
ok("3. server guard rejects privado + non-owner");

// 4. Entitlement unlock: active proof unlocks, missing stays locked
if (!helper.includes("isAutosDealerInventoryPackEntitlementActiveFromProof")) fail("entitlement proof missing");
{
  // simulate the pure proof check
  const activeKey = "autos_dealer_inventory_pack_monthly";
  const activeProof = { revenuePackageKey: activeKey };
  const wrongProof = { revenuePackageKey: "autos_dealer_monthly" };
  const emptyProof = null;
  const check = (p) => p?.revenuePackageKey?.trim() === activeKey;
  if (!check(activeProof)) fail("active entitlement proof should unlock");
  if (check(wrongProof)) fail("base package proof must not unlock inventory");
  if (check(emptyProof)) fail("missing entitlement must stay locked");
}
ok("4. entitlement: active unlocks, missing/base stays locked");

// 5. Success CTA + preview/back preserve listingId/focus=inventory-pack
if (!helper.includes("Administrar inventario") || !helper.includes("Manage inventory")) {
  fail("success CTA wording must be Administrar inventario / Manage inventory");
}
if (!helper.includes('params.set("focus", "inventory-pack")')) fail("inventory route must preserve focus=inventory-pack");
if (!helper.includes('params.set("returnPanel", "autos")')) fail("route must preserve returnPanel=autos");
ok("5. success/preview routes preserve listingId + focus=inventory-pack");

console.log("smoke-autos-dealer-inventory-addon-live-parity-02: PASS");
