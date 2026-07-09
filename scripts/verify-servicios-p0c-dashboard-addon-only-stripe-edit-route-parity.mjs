#!/usr/bin/env node
/**
 * SERVICIOS-P0C — dashboard add-on-only Stripe + edit route parity.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function fail(msg) {
  console.error(`verify-servicios-p0c-dashboard-addon-only-stripe-edit-route-parity: FAIL — ${msg}`);
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

const helperRel = "app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts";
const dashboardRel = "app/(site)/dashboard/servicios/page.tsx";
const applicationRel = "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx";
const payloadRel = "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts";
const checkpointRel = "app/lib/listingPlans/publishCheckoutCheckpoint.ts";
const successViewRel = "app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx";
const myListingsRel = "app/api/clasificados/servicios/my-listings/route.ts";
const docRel = "docs/servicios-p0c-dashboard-addon-only-stripe-edit-route-parity.md";
const pkg = read("package.json");

for (const rel of [helperRel, dashboardRel, applicationRel, payloadRel, checkpointRel, successViewRel, myListingsRel, docRel]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`Missing required file: ${rel}`);
}

const helper = read(helperRel);
const dashboard = read(dashboardRel);
const application = read(applicationRel);
const payload = read(payloadRel);
const checkpoint = read(checkpointRel);
const successView = read(successViewRel);
const myListings = read(myListingsRel);
const doc = read(docRel);

// --- Helper ---
if (!checkpoint.includes('SERVICIOS_OFFERS_ADDON_PACKAGE_KEY = "servicios_offers_addon"')) {
  fail("Package key constant servicios_offers_addon must exist");
}
if (!helper.includes("SERVICIOS_OFFERS_ADDON_PACKAGE_KEY")) fail("Helper must use the servicios add-on package key");
if (helper.includes("servicios_base_monthly")) fail("Helper must not reference servicios_base_monthly");
if (!helper.includes("startServiciosDashboardOffersAddonCheckout")) fail("Helper must export start checkout");
if (!helper.includes("redirectServiciosDashboardOffersAddonCheckout")) fail("Helper must export redirect checkout");
if (!helper.includes("serviciosListingEditHref")) fail("Helper must export listing edit href");
if (!helper.includes("serviciosOffersEditHref")) fail("Helper must export offers edit href");
if (!helper.includes("serviciosOffersAddonHref")) fail("Helper must export offers addon href");
if (!helper.includes("resolveServiciosOffersAddonSuccessPrimaryCta")) fail("Helper must export success CTA resolver");
if (!helper.includes("serviciosOffersInactiveDashboardHint")) fail("Helper must export inactive dashboard hint");
if (!helper.includes("serviciosListingJsonOffersEnabled")) fail("Helper must export offers-enabled display resolver");
if (!helper.includes('mode", "listing-edit"') && !helper.includes('set("mode", "listing-edit")')) {
  fail("Helper listing edit href must set mode=listing-edit");
}
if (!helper.includes('"offers-edit"')) fail("Helper must set mode offers-edit");
if (!helper.includes('"offers-addon"')) fail("Helper must set mode offers-addon");
if (!helper.includes('"coupon-upgrade"')) fail("Helper must set focus=coupon-upgrade");
if (!helper.includes('"edit", "1"') && !helper.includes('edit: "1"')) fail("Helper edit hrefs must set edit=1");
if (!helper.includes("/clasificados/publicar/servicios")) fail("Helper must route to /clasificados/publicar/servicios");
if (helper.includes('"/publicar/servicios?')) fail("Helper must not use legacy /publicar/servicios route");
if (!helper.includes('"servicios"') || !helper.includes("returnPanel")) fail("Helper must set returnPanel=servicios");
ok("dashboard helper: add-on-only package + edit route identity + success CTA");

// --- Revenue payload constant ---
if (!payload.includes("SERVICIOS_OFFERS_ADDON_DASHBOARD_CHECKOUT")) fail("Servicios dashboard checkout constant required");
if (!payload.includes('category: "servicios"')) fail("Servicios checkout constant must use category servicios");
if (!payload.includes("RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT")) fail("Restaurante constant must remain");
ok("revenue payload constant added; restaurante constant untouched");

// --- Dashboard actions ---
if (!dashboard.includes("serviciosListingEditHref")) fail("Dashboard must use listing edit href helper");
if (!dashboard.includes("serviciosOffersEditHref")) fail("Dashboard must use offers edit href helper");
if (!dashboard.includes("serviciosOffersInactiveDashboardHint")) fail("Dashboard must show inactive hint");
if (!dashboard.includes("offersAddonActive")) fail("Dashboard row must carry offers active state");
if (!dashboard.includes("offers_addon_active")) fail("Dashboard must read offers_addon_active from API");
if (dashboard.includes("Destacar ofertas") || dashboard.includes("Feature offers +$99")) {
  fail("Dashboard must NOT render an outside paid activation CTA (activation lives inside Editar servicio)");
}
ok("dashboard actions: listing-edit + active offers-edit shortcut + inactive hint, no outside paid CTA");

// --- Owner API entitlement source ---
if (!myListings.includes("serviciosListingJsonOffersEnabled")) fail("my-listings must compute offers active");
if (!myListings.includes("offers_addon_active")) fail("my-listings must return offers_addon_active");
if (!myListings.includes("auth_required") && !myListings.includes("invalid_token")) fail("my-listings must keep auth guard");
if (!myListings.includes("listServiciosPublicListingsForOwner")) fail("my-listings must keep owner filtering");
ok("owner API returns offers entitlement display flag with auth + owner filtering preserved");

// --- Application modes ---
if (!application.includes('searchParams?.get("mode")')) fail("Application must read mode param");
if (!application.includes('=== "coupon-upgrade"')) fail("Application must read focus=coupon-upgrade");
if (!application.includes("isDashboardListingEditMode")) fail("Application must support listing-edit mode");
if (!application.includes("isDashboardOffersEditMode")) fail("Application must support offers-edit mode");
if (!application.includes("isDashboardOffersAddonMode")) fail("Application must support offers-addon mode");
if (!application.includes("isExistingDashboardListingMode")) fail("Application must group existing dashboard modes");
if (!application.includes("SERVICIOS_COUPON_STEP_INDEX")) fail("Application must jump to coupon step on focus");
// No fake activation: offers-addon mode must not set couponsAddOn true just from mode.
if (/isDashboardOffersAddonMode[\s\S]{0,120}couponsAddOn:\s*true/.test(application)) {
  fail("offers-addon mode must not set couponsAddOn true without payment");
}
if (!application.includes("startDashboardOffersAddonCheckout")) fail("Application must have add-on checkout starter");
if (!application.includes("redirectServiciosDashboardOffersAddonCheckout")) fail("Application must call servicios add-on checkout helper");
if (!application.includes("serviciosOffersAddonUpgradeLabel")) fail("Application must render add-on upgrade label");
if (!application.includes("!isExistingDashboardListingMode && state.baseMonthlyPrice > 0")) {
  fail("Application must block $399 base pricing summary in dashboard edit mode");
}
ok("application: modes + focus + inside add-on-only checkout + base blocked, no fake activation");

// --- Success CTA ---
if (!successView.includes("resolveServiciosOffersAddonSuccessPrimaryCta")) fail("Success view must resolve servicios add-on CTA");
if (!successView.includes("resolveRestauranteOffersAddonSuccessPrimaryCta")) fail("Restaurante success CTA must remain");
ok("revenue success CTA handles servicios add-on; restaurante preserved");

// --- Guardrails ---
const disallowed = [
  "app/api/revenue-os/webhook",
  "app/api/stripe",
  "supabase/migrations",
  "app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout",
  "app/(site)/publicar/restaurantes",
  "app/(site)/dashboard/restaurantes",
];
const changed = gitDiffNameOnly()
  .split("\n")
  .map((f) => f.trim())
  .filter(Boolean);
for (const file of changed) {
  const norm = file.replace(/\\/g, "/");
  for (const bad of disallowed) {
    if (norm.includes(bad)) fail(`Disallowed file changed: ${norm}`);
  }
}
ok("no disallowed runtime files changed");

// --- Doc ---
for (const section of ["Gate title", "Manual QA", "Entitlement", "What was protected", "READY TO COMMIT"]) {
  if (!doc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("documentation present");

if (!pkg.includes("verify:servicios-p0c-dashboard-addon-only-stripe-edit-route-parity")) {
  fail("package.json must include P0C verifier script");
}

console.log("verify-servicios-p0c-dashboard-addon-only-stripe-edit-route-parity: PASS");
