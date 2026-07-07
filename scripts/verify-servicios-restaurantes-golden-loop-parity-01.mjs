#!/usr/bin/env node
/**
 * SERVICIOS-RESTAURANTES-GOLDEN-LOOP-PARITY-01
 * Verifies the full Servicios owner-edit loop keeps dashboard context (no checkpoint/product regressions)
 * from dashboard → edit → preview → Volver a editar → save/update.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (msg) => {
  console.error(`verify-servicios-restaurantes-golden-loop-parity-01: FAIL — ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`OK: ${msg}`);

const restHelperRel = "app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts";
const restAppRel = "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx";
const helperRel = "app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts";
const appRel = "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx";
const previewRel = "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx";
const misAnunciosRel = "app/(site)/dashboard/mis-anuncios/page.tsx";
const serviciosDashRel = "app/(site)/dashboard/servicios/page.tsx";
const inventoryRel = "app/(site)/dashboard/lib/dashboardInventory.ts";
const docRel = "docs/servicios-restaurantes-golden-loop-parity-01.md";

for (const rel of [restHelperRel, restAppRel, helperRel, appRel, previewRel, misAnunciosRel, serviciosDashRel, inventoryRel, docRel]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`Missing required file: ${rel}`);
}

const restHelper = read(restHelperRel);
const restApp = read(restAppRel);
const helper = read(helperRel);
const app = read(appRel);
const preview = read(previewRel);
const misAnuncios = read(misAnunciosRel);
const serviciosDash = read(serviciosDashRel);
const inventory = read(inventoryRel);
const doc = read(docRel);
const pkg = read("package.json");

// --- Restaurante reference ---
if (!restHelper.includes("restauranteListingEditHref")) fail("Restaurante helper must expose restauranteListingEditHref");
if (!restHelper.includes("restauranteCouponEditHref")) fail("Restaurante helper must expose restauranteCouponEditHref");
if (!restApp.includes("isExistingDashboardListingMode")) fail("Restaurante app must define isExistingDashboardListingMode");
ok("Restaurante golden loop reference present");

// --- Servicios helpers ---
for (const fn of [
  "serviciosListingEditHref",
  "serviciosOffersEditHref",
  "serviciosOffersAddonHref",
  "serviciosListingPreviewHref",
  "serviciosBackToEditHrefFromPreview",
  "buildServiciosDashboardListingContextParams",
]) {
  if (!helper.includes(`export function ${fn}`)) fail(`Helper must export ${fn}`);
}
if (!helper.includes('SERVICIOS_DASHBOARD_APPLICATION_BASE = "/publicar/servicios"')) {
  fail("Helper application base must be /publicar/servicios");
}
if (helper.includes("/clasificados/publicar/servicios/checkpoint")) {
  fail("Helper must not emit checkpoint route");
}
if (/serviciosBackToEditHrefFromPreview[\s\S]{0,600}product=servicios_profesionales/.test(helper)) {
  fail("Back-to-edit helper must not emit product param");
}
if (!helper.includes('"listing-edit"') || !helper.includes('"offers-edit"') || !helper.includes('"offers-addon"')) {
  fail("Helper must support listing-edit/offers-edit/offers-addon modes");
}
ok("Servicios golden-loop helpers: direct app routes + context/back-to-edit builders");

// --- Servicios application ---
for (const needle of [
  "isExistingDashboardListingMode",
  "isDashboardListingEditMode",
  "isDashboardOffersEditMode",
  "isDashboardOffersAddonMode",
  "serviciosListingPreviewHref",
  "/api/clasificados/servicios/my-listing",
  "serviciosPublishedToApplicationDraft",
]) {
  if (!app.includes(needle)) fail(`Application must reference ${needle}`);
}
if (!/isExistingDashboardListingMode\s*\?[\s\S]{0,200}serviciosListingPreviewHref/.test(app)) {
  fail("goPreview/previewHref must use listing-bound preview in dashboard mode");
}
if (!/isExistingDashboardListingMode[\s\S]{0,120}return/.test(app)) {
  fail("Application must bypass product init when isExistingDashboardListingMode");
}
// Change-plan checkpoint link must be gated so existing dashboard listings do not reach checkpoint.
if (!/isExistingDashboardListingMode[\s\S]{0,400}dashboardReturnHref/.test(app)) {
  fail("Existing dashboard mode must route change-plan/back to dashboard, not checkpoint");
}
ok("Servicios application: dashboard context preserved through preview + no checkpoint drop");

// --- Servicios preview back loop ---
for (const needle of [
  "serviciosBackToEditHrefFromPreview",
  "listingBoundPreview",
  "/api/clasificados/servicios/my-listing",
  "serviciosPublishedToApplicationDraft",
  "primeServiciosExistingPublicSlug",
]) {
  if (!preview.includes(needle)) fail(`Preview must reference ${needle}`);
}
if (!/editHref\s*=\s*[\s\S]{0,200}serviciosBackToEditHrefFromPreview/.test(preview)) {
  fail("Preview editHref (Volver a editar) must use serviciosBackToEditHrefFromPreview for dashboard listing preview");
}
// The dashboard back-to-edit must be produced by the helper (which is checkpoint-free); the checkpoint
// route may only survive as the NEW-application fallback (checkpointEditHref), never as the dashboard value.
if (!/serviciosBackToEditHrefFromPreview[\s\S]{0,300}:\s*checkpointEditHref/.test(preview)) {
  fail("Preview must fall back to checkpointEditHref only for the new-application (non-dashboard) case");
}
if (preview.includes('editHref = withClasificadosPublishLang("/clasificados/publicar/servicios/checkpoint"')) {
  fail("Preview editHref must not be hard-bound to checkpoint");
}
ok("Servicios preview: Volver a editar preserves dashboard identity, no checkpoint/product drop");

// --- Dashboard surfaces ---
if (!misAnuncios.includes("serviciosListingEditHref")) fail("Mis anuncios must use serviciosListingEditHref");
if (!inventory.includes("serviciosListingEditHref") || !inventory.includes("serviciosListingPreviewHref")) {
  fail("dashboardInventory must wire listing edit + preview helpers");
}
if (!serviciosDash.includes("serviciosListingEditHref") || !serviciosDash.includes("serviciosListingPreviewHref")) {
  fail("/dashboard/servicios must wire listing edit + preview helpers");
}
ok("Dashboard surfaces wire golden-loop helpers");

// --- Doc ---
for (const needle of [
  "SERVICIOS-RESTAURANTES-GOLDEN-LOOP-PARITY-01",
  "Volver a editar",
  "golden loop",
  "product=servicios_profesionales",
  "checkpoint",
  "leonixmedia.com/dashboard/mis-anuncios",
  "TRUE/FALSE",
  "READY TO COMMIT",
]) {
  if (!doc.includes(needle)) fail(`Doc must include: ${needle}`);
}
ok("Documentation present");

// --- Package scripts ---
if (!pkg.includes("verify:servicios-restaurantes-golden-loop-parity-01")) fail("verify script must be registered");
if (!pkg.includes("smoke:servicios-restaurantes-golden-loop-parity-01")) fail("smoke script must be registered");
ok("package.json scripts registered");

// --- Disallowed files ---
const changed = (() => {
  try {
    const diff = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
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
      !/servicios-restaurantes-golden-loop-parity/i.test(f) &&
      !/servicios-edit-route-restaurantes-parity/i.test(f) &&
      !/serviciosDashboard/i.test(f)),
);
if (blocked.length) fail(`Disallowed files touched: ${blocked.join(", ")}`);
ok("No disallowed Stripe/Supabase/Restaurante runtime changes");

// --- Previous gates ---
const PREVIOUS = {
  "verify:servicios-edit-route-restaurantes-parity-hard-fix-01":
    "scripts/verify-servicios-edit-route-restaurantes-parity-hard-fix-01.mjs",
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

console.log("\nverify-servicios-restaurantes-golden-loop-parity-01: ALL CHECKS PASSED");
