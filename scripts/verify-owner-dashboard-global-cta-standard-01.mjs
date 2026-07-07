#!/usr/bin/env node
/**
 * OWNER-DASHBOARD-GLOBAL-CTA-STANDARD-01
 * Verifies Mis anuncios Servicios CTAs route to the existing-listing edit contract (not a blank new app),
 * and that the global CTA contract is documented.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (msg) => {
  console.error(`verify-owner-dashboard-global-cta-standard-01: FAIL — ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`OK: ${msg}`);

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

const misAnunciosRel = "app/(site)/dashboard/mis-anuncios/page.tsx";
const toolsRel = "app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts";
const helperRel = "app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts";
const inventoryRel = "app/(site)/dashboard/lib/dashboardInventory.ts";
const docRel = "docs/owner-dashboard-global-cta-standard-01.md";

for (const rel of [misAnunciosRel, toolsRel, helperRel, inventoryRel, docRel]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`Missing required file: ${rel}`);
}

const misAnuncios = read(misAnunciosRel);
const tools = read(toolsRel);
const helper = read(helperRel);
const inventory = read(inventoryRel);
const doc = read(docRel);
const pkg = read("package.json");

// --- Mis anuncios page: imports Servicios helper + passes overrides (not a plain servicios call) ---
if (!misAnuncios.includes("serviciosListingEditHref") || !misAnuncios.includes("serviciosOffersEditHref")) {
  fail("Mis anuncios must import the Servicios P0C listing/offers edit href helpers");
}
if (!misAnuncios.includes("serviciosDashboardOffersAddonCheckout")) {
  fail("Mis anuncios must import from serviciosDashboardOffersAddonCheckout");
}
if (!misAnuncios.includes("serviciosEditHref:")) {
  fail("Servicios inventory actions must pass a serviciosEditHref override (not a plain builder call)");
}
if (!misAnuncios.includes("serviciosOffersEditHref:")) {
  fail("Servicios inventory actions must pass a serviciosOffersEditHref override");
}
if (/product=servicios_profesionales/.test(misAnuncios)) {
  fail("Mis anuncios must not route existing Servicios listings to a new application (product=servicios_profesionales)");
}
ok("Mis anuncios wires Servicios edit + offers-edit via P0C helper overrides");

// --- Action builder supports category-specific Servicios override ---
if (!tools.includes("serviciosEditHref")) fail("Action builder must support serviciosEditHref override");
if (!tools.includes("serviciosOffersEditHref")) fail("Action builder must support serviciosOffersEditHref override");
if (!tools.includes("opts?.serviciosEditHref")) fail("Servicios branch must use the serviciosEditHref override");
if (!tools.includes("serviciosOffersActive")) fail("Action builder must gate offers-edit on serviciosOffersActive");
// Restaurante callbacks preserved
if (!tools.includes("onCouponUpgrade") || !tools.includes("onCouponEdit")) {
  fail("Restaurante coupon callbacks must remain in the action builder");
}
ok("action builder: Servicios overrides added; Restaurante callbacks preserved");

// --- Servicios helper route contract ---
const listingEditBlock = helper.slice(helper.indexOf("serviciosListingEditHref"));
if (!helper.includes('"listing-edit"')) fail("Helper must set mode=listing-edit");
if (!helper.includes('"offers-edit"')) fail("Helper must set mode=offers-edit");
if (!helper.includes('"coupon-upgrade"')) fail("Helper offers edit must set focus=coupon-upgrade");
if (!helper.includes("returnPanel")) fail("Helper must set returnPanel=servicios");
if (!helper.includes('edit: "1"')) fail("Helper edit hrefs must set edit=1");
if (!helper.includes('"source"') && !helper.includes("source: \"dashboard\"")) {
  fail("Helper edit hrefs must set source=dashboard");
}
if (!helper.includes("/clasificados/publicar/servicios")) fail("Helper must route to /clasificados/publicar/servicios");
if (listingEditBlock.length === 0) fail("Helper must export serviciosListingEditHref");
ok("Servicios helper produces edit=1 + source=dashboard + mode=listing-edit + returnPanel + offers-edit/focus contract");

// --- Inventory carries offers-active display flag ---
if (!inventory.includes("serviciosOffersAddonActive")) fail("Inventory item must carry serviciosOffersAddonActive");
if (!inventory.includes("offers_addon_active")) fail("Inventory must read offers_addon_active from API row");
ok("inventory carries Servicios offers-active display flag");

// --- Doc CTA contract ---
const docNeedles = [
  "Editar anuncio",
  "never start",
  "Publicar",
  "Editar ofertas",
  "Ficha pública",
  "Vista previa",
  "Administrar anuncio",
  "Analíticas",
  "Formulario",
  "mode=listing-edit",
  "mode=offers-edit",
  "focus=coupon-upgrade",
  "returnPanel=servicios",
  "READY TO COMMIT",
];
for (const needle of docNeedles) {
  if (!doc.includes(needle)) fail(`Doc missing required content: ${needle}`);
}
if (!doc.includes("leonixmedia.com/dashboard/mis-anuncios")) fail("Doc must include production QA URLs");
ok("documentation includes global CTA contract + URL contract + production QA URLs");

// --- Doc: global {category} helper strategy ---
if (!doc.includes("{category}` helper strategy") && !doc.includes("{category} helper strategy")) {
  fail("Doc must include the global {category} helper strategy section");
}
ok("documentation includes global {category} helper strategy");

// --- Doc: pipeline audit standard (all required pipelines enumerated) ---
if (!doc.includes("Pipeline audit standard")) fail("Doc must include the pipeline audit standard section");
const pipelineNeedles = [
  "professional/white-collar",
  "blue-collar/trades",
  "truck/mobile/pop-up",
  "weekly flyer/supermarket",
  "coupon/promo lane",
  "privado",
  "dealer",
  "parent agent/business",
  "child property inventory",
  "free class",
  "paid class",
  "No-upgrade categories",
];
for (const needle of pipelineNeedles) {
  if (!doc.includes(needle)) fail(`Pipeline audit standard missing: ${needle}`);
}
ok("documentation includes pipeline audit standard with all required pipelines");

// --- package script ---
if (!pkg.includes("verify:owner-dashboard-global-cta-standard-01")) {
  fail("package.json must include the owner CTA verifier script");
}

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
  .map((f) => f.trim().replace(/\\/g, "/"))
  .filter(Boolean);
for (const file of changed) {
  for (const bad of disallowed) {
    if (file.includes(bad)) fail(`Disallowed file changed: ${file}`);
  }
}
ok("no disallowed runtime files changed");

console.log("verify-owner-dashboard-global-cta-standard-01: PASS");
