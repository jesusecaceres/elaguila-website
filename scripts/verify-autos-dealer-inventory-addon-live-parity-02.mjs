#!/usr/bin/env node
/** AUTOS-DEALER-INVENTORY-ADDON-LIVE-PARITY-02 verifier */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => {
  console.error(`verify-autos-dealer-inventory-addon-live-parity-02: FAIL — ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`OK: ${m}`);

const helperRel = "app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts";
const checkpointRel = "app/lib/listingPlans/publishCheckoutCheckpoint.ts";
const matrixRel = "app/lib/listingPlans/revenuePricingMatrix.ts";
const checkoutLibRel = "app/lib/listingPlans/revenueCheckout.ts";
const checkoutRouteRel = "app/api/revenue-os/checkout/route.ts";
const revenueResultRel = "app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx";
const dashboardRel = "app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx";
const privadoAppRel = "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx";
const publicDealerRel = "app/api/clasificados/autos/public/dealer/[dealerInventoryGroupId]/route.ts";
const docRel = "docs/autos-dealer-inventory-addon-live-parity-02.md";

for (const rel of [
  helperRel,
  checkpointRel,
  matrixRel,
  checkoutLibRel,
  checkoutRouteRel,
  revenueResultRel,
  dashboardRel,
  docRel,
]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`Missing: ${rel}`);
}

const helper = read(helperRel);
const checkpoint = read(checkpointRel);
const matrix = read(matrixRel);
const checkoutLib = read(checkoutLibRel);
const checkoutRoute = read(checkoutRouteRel);
const revenueResult = read(revenueResultRel);
const dashboard = read(dashboardRel);
const pkg = read("package.json");

// Package / price truth
if (!checkpoint.includes("autos_dealer_inventory_pack_monthly")) fail("package key constant required");
if (!checkpoint.includes("AUTOS_DEALER_INVENTORY_PACK_PRICE_CENTS = 12900")) {
  fail("price must be locked at 12900 cents ($129/mo)");
}
if (!matrix.includes("autos_dealer_inventory_pack_monthly") || !matrix.includes("12900")) {
  fail("matrix must define inventory pack at 12900 cents");
}
ok("package key + $129/mo price locked");

// Add-on-only dashboard checkout
if (!helper.includes("AUTOS_DEALER_INVENTORY_PACK_DASHBOARD_CHECKOUT")) fail("dashboard must use add-on-only payload");
if (helper.includes("autos_dealer_monthly")) fail("dashboard checkout must not charge base dealer package");
if (helper.includes("autos_privado")) fail("dashboard checkout must not reference privado package");
if (!helper.includes("startRevenueCategoryCheckout")) fail("checkout must route through Revenue OS");
ok("dashboard add-on-only checkout ($129 only, no base)");

// Server-side dealer/lane ownership guard (new in parity-02)
if (!checkoutLib.includes("validateAutosDealerInventoryAddonOwnership")) {
  fail("server guard validateAutosDealerInventoryAddonOwnership required");
}
if (!checkoutLib.includes('lane !== "negocios"')) fail("server guard must reject non-dealer lane (privado)");
if (!checkoutLib.includes("listing_owner_mismatch")) fail("server guard must enforce owner match");
if (!checkoutRoute.includes("validateAutosDealerInventoryAddonOwnership")) {
  fail("checkout route must invoke autos dealer inventory ownership guard");
}
if (!checkoutRoute.includes("isAutosDealerInventoryAddonEarly")) fail("checkout route must gate autos add-on early");
ok("server guard: owner + dealer/negocio lane + active (privado rejected)");

// Entitlement truth
if (!helper.includes("AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY")) fail("entitlement check must match package key");
if (!helper.includes("listing_package_entitlements") && !helper.includes("fetchDashboardListingPackageEntitlementBadges")) {
  fail("entitlement must read real listing package entitlement");
}
if (!helper.includes("isAutosDealerInventoryPackEntitlementActiveFromProof")) {
  fail("entitlement active must derive from server proof, not local flag");
}
ok("entitlement package_key checked from paid proof");

// Success return / manage inventory wording
if (!revenueResult.includes("resolveAutosDealerInventoryPackSuccessPrimaryCta")) {
  fail("success view must handle autos inventory pack CTA");
}
if (!helper.includes("autosDealerInventoryEditHref")) fail("success CTA must return to inventory editor");
if (!(helper.includes("Administrar inventario") && helper.includes("Manage inventory"))) {
  fail("success CTA wording must be Administrar inventario / Manage inventory");
}
ok("success routing returns to inventory editor (Administrar inventario / Manage inventory)");

// Do not regress Bienes / Restaurante success paths
if (!revenueResult.includes("resolveBienesInventoryPackSuccessPrimaryCta")) fail("must not break Bienes success CTA");
if (!checkoutLib.includes("validateRestauranteAddonOnlyListingOwnership")) fail("must not break Restaurante guard");
ok("Bienes/Restaurante success + guards preserved");

// Public render path
if (!existsSync(path.join(ROOT, publicDealerRel))) fail(`Missing public dealer render route: ${publicDealerRel}`);
const publicDealer = read(publicDealerRel);
if (!publicDealer.includes("listActiveDealerInventoryByGroupId")) fail("public child render path required");
ok("public dealer child render path present");

// Autos privado protection
const privadoApp = read(privadoAppRel);
if (privadoApp.includes("autosDealerInventoryPack") || privadoApp.includes("inventory-pack")) {
  fail("privado application must not expose dealer inventory add-on");
}
if (dashboard.includes("privado") && dashboard.includes("redirectAutosDealerInventoryPackCheckout")) {
  const seg = dashboard.split("redirectAutosDealerInventoryPackCheckout")[0].slice(-400);
  if (seg.includes('lane === "privado"') && !seg.includes("!==")) {
    fail("dashboard must not offer inventory checkout for privado lane");
  }
}
ok("Autos privado protected (no add-on CTA/checkout/module)");

// Webhook raw body untouched
const webhookRel = "app/api/stripe/webhook/route.ts";
if (existsSync(path.join(ROOT, webhookRel))) {
  const webhook = read(webhookRel);
  if (webhook.includes("AUTOS_DEALER_INVENTORY") && webhook.includes("rawBody")) {
    fail("webhook raw body path must not be modified for this gate");
  }
}
ok("Stripe webhook raw body untouched");

// Package scripts + doc
if (!pkg.includes("verify:autos-dealer-inventory-addon-live-parity-02")) fail("verify package script missing");

const doc = read(docRel);
for (const heading of [
  "Package/pricing",
  "Autos privado",
  "Entitlement",
  "READY TO COMMIT",
]) {
  if (!doc.includes(heading)) fail(`doc must include heading/section: ${heading}`);
}
ok("doc + package script present");

console.log("verify-autos-dealer-inventory-addon-live-parity-02: PASS");
