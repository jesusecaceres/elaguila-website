#!/usr/bin/env node
/**
 * SERVICIOS-EDIT-ROUTE-RESTAURANTES-PARITY-HARD-FIX-01
 * Hard-blocks Servicios existing-listing dashboard routes from checkpoint/product new-app flows.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (msg) => {
  console.error(`verify-servicios-edit-route-restaurantes-parity-hard-fix-01: FAIL — ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`OK: ${msg}`);

const helperRel = "app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts";
const misAnunciosRel = "app/(site)/dashboard/mis-anuncios/page.tsx";
const inventoryRel = "app/(site)/dashboard/lib/dashboardInventory.ts";
const serviciosDashRel = "app/(site)/dashboard/servicios/page.tsx";
const toolsRel = "app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts";
const appRel = "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx";
const docRel = "docs/servicios-edit-route-restaurantes-parity-hard-fix-01.md";

for (const rel of [helperRel, misAnunciosRel, inventoryRel, serviciosDashRel, toolsRel, appRel, docRel]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`Missing required file: ${rel}`);
}

const helper = read(helperRel);
const misAnuncios = read(misAnunciosRel);
const inventory = read(inventoryRel);
const serviciosDash = read(serviciosDashRel);
const tools = read(toolsRel);
const app = read(appRel);
const doc = read(docRel);
const pkg = read("package.json");

const dashboardSources = [helper, misAnuncios, inventory, serviciosDash, tools].join("\n");

for (const fn of [
  "serviciosListingEditHref",
  "serviciosOffersEditHref",
  "serviciosOffersAddonHref",
  "serviciosListingPreviewHref",
]) {
  if (!helper.includes(`export function ${fn}`)) fail(`Helper must export ${fn}`);
}

if (!helper.includes("SERVICIOS_DASHBOARD_APPLICATION_BASE")) {
  fail("Helper must define SERVICIOS_DASHBOARD_APPLICATION_BASE");
}
if (!helper.includes('"/publicar/servicios"')) {
  fail("Helper must use direct /publicar/servicios application base");
}

const editHrefBlock = helper.slice(helper.indexOf("serviciosListingEditHref"));
if (editHrefBlock.includes("/clasificados/publicar/servicios/checkpoint")) {
  fail("serviciosListingEditHref must not use checkpoint");
}
if (/serviciosListingEditHref[\s\S]{0,600}product=servicios_profesionales/.test(helper)) {
  fail("serviciosListingEditHref must not use product=servicios_profesionales");
}
if (!helper.includes("mode=listing-edit") && !helper.includes('"listing-edit"')) {
  fail("Listing edit helper must set mode=listing-edit");
}
if (!helper.includes("source=dashboard") && !helper.includes('"dashboard"')) {
  fail("Listing edit helper must set source=dashboard");
}
if (!helper.includes("listingId")) fail("Helper must support listingId");
if (!helper.includes("preview=listing") && !helper.includes('"listing"')) {
  fail("Preview helper must set preview=listing");
}
ok("Servicios helper: direct /publicar/servicios routes, no checkpoint/product for existing edit");

if (/serviciosListingEditHref[\s\S]{0,400}\/clasificados\/publicar\/servicios\?/.test(helper)) {
  fail("Existing listing edit must not target /clasificados/publicar/servicios (checkpoint redirect)");
}

if (!misAnuncios.includes("serviciosListingEditHref")) {
  fail("Mis anuncios must use serviciosListingEditHref");
}
if (!inventory.includes("serviciosListingEditHref") || !inventory.includes("serviciosListingPreviewHref")) {
  fail("dashboardInventory must use Servicios listing edit + preview helpers");
}
if (!serviciosDash.includes("serviciosListingEditHref") || !serviciosDash.includes("serviciosListingPreviewHref")) {
  fail("/dashboard/servicios must use Servicios listing edit + preview helpers");
}
if (/buildInventoryListingActions\("servicios"[\s\S]{0,800}checkpoint/.test(misAnuncios)) {
  fail("Mis anuncios Servicios actions must not reference checkpoint");
}
ok("Dashboard surfaces wire Servicios helper routes");

if (!app.includes("isExistingDashboardListingMode")) fail("App must define isExistingDashboardListingMode");
if (!app.includes("isDashboardListingEditMode")) fail("App must define isDashboardListingEditMode");
if (!/isExistingDashboardListingMode[\s\S]{0,120}return/.test(app)) {
  fail("App must bypass product init when isExistingDashboardListingMode");
}
if (!app.includes("/api/clasificados/servicios/my-listing")) {
  fail("App must fetch my-listing for dashboard edit hydration");
}
if (!app.includes("serviciosPublishedToApplicationDraft")) {
  fail("App must map published listing to application draft");
}
ok("Servicios application: Restaurante-style dashboard mode + hydration");

for (const needle of [
  "SERVICIOS-EDIT-ROUTE-RESTAURANTES-PARITY-HARD-FIX-01",
  "checkpoint",
  "product=servicios_profesionales",
  "/publicar/servicios",
  "Restaurante",
  "leonixmedia.com/dashboard/mis-anuncios",
  "TRUE/FALSE",
]) {
  if (!doc.includes(needle)) fail(`Doc must include: ${needle}`);
}
ok("Documentation present");

if (!pkg.includes("verify:servicios-edit-route-restaurantes-parity-hard-fix-01")) {
  fail("package.json must register verify script");
}
if (!pkg.includes("smoke:servicios-edit-route-restaurantes-parity-hard-fix-01")) {
  fail("package.json must register smoke script");
}

const changed = (() => {
  try {
    const diff = execFileSync("git", ["diff", "--name-only", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    return `${diff}\n${untracked}`.split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
})();
const blocked = changed.filter(
  (f) =>
    /supabase\/migrations/i.test(f) ||
    /stripe.*webhook/i.test(f) ||
    (/restaurante/i.test(f) &&
      !/servicios-edit-route-restaurantes-parity/i.test(f) &&
      !/servicios-restaurantes-golden-loop-parity/i.test(f) &&
      !/serviciosDashboard/i.test(f)),
);
if (blocked.length) fail(`Disallowed files touched: ${blocked.join(", ")}`);
ok("No disallowed Stripe/Supabase/Restaurante runtime changes");

const PREVIOUS = {
  "verify:owner-dashboard-global-edit-hydration-standard-01":
    "scripts/verify-owner-dashboard-global-edit-hydration-standard-01.mjs",
  "verify:owner-dashboard-global-cta-standard-01": "scripts/verify-owner-dashboard-global-cta-standard-01.mjs",
  "verify:servicios-p0b-coupons-offers-persistence-preview-public-output":
    "scripts/verify-servicios-p0b-coupons-offers-persistence-preview-public-output.mjs",
  "verify:servicios-p0a-checkpoint-ver-mas-rules-modal-parity":
    "scripts/verify-servicios-p0a-checkpoint-ver-mas-rules-modal-parity.mjs",
};

for (const [name, rel] of Object.entries(PREVIOUS)) {
  if (!existsSync(path.join(ROOT, rel))) continue;
  try {
    execFileSync(process.execPath, [path.join(ROOT, rel)], { cwd: ROOT, stdio: "pipe", encoding: "utf8" });
    ok(`previous gate passed: ${name}`);
  } catch (e) {
    const out = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim();
    fail(`previous gate ${name} failed${out ? `: ${out.slice(0, 500)}` : ""}`);
  }
}

console.log("\nverify-servicios-edit-route-restaurantes-parity-hard-fix-01: ALL CHECKS PASSED");
