#!/usr/bin/env node
/**
 * OWNER-DASHBOARD-GLOBAL-EDIT-HYDRATION-STANDARD-01
 * Verifies Servicios dashboard edit/preview CTAs hydrate from owner DB listing (not blank local draft).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (msg) => {
  console.error(`verify-owner-dashboard-global-edit-hydration-standard-01: FAIL — ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`OK: ${msg}`);

const PREVIOUS_GATES = {
  "verify:owner-dashboard-global-cta-standard-01": "scripts/verify-owner-dashboard-global-cta-standard-01.mjs",
  "verify:servicios-p0c-dashboard-addon-only-stripe-edit-route-parity":
    "scripts/verify-servicios-p0c-dashboard-addon-only-stripe-edit-route-parity.mjs",
  "verify:servicios-p0b-coupons-offers-persistence-preview-public-output":
    "scripts/verify-servicios-p0b-coupons-offers-persistence-preview-public-output.mjs",
  "verify:servicios-p0a-checkpoint-ver-mas-rules-modal-parity":
    "scripts/verify-servicios-p0a-checkpoint-ver-mas-rules-modal-parity.mjs",
};

function runVerify(scriptName) {
  const rel = PREVIOUS_GATES[scriptName];
  if (!rel || !existsSync(path.join(ROOT, rel))) {
    fail(`Unknown or missing previous gate script: ${scriptName}`);
  }
  try {
    execFileSync(process.execPath, [path.join(ROOT, rel)], { cwd: ROOT, stdio: "pipe", encoding: "utf8" });
    ok(`previous gate passed: ${scriptName}`);
  } catch (e) {
    const out = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim();
    fail(`previous gate ${scriptName} failed${out ? `: ${out.slice(0, 400)}` : ""}`);
  }
}

const appRel = "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx";
const mapperRel = "app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts";
const previewRel = "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx";
const helperRel = "app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts";
const inventoryRel = "app/(site)/dashboard/lib/dashboardInventory.ts";
const serviciosDashRel = "app/(site)/dashboard/servicios/page.tsx";
const misAnunciosRel = "app/(site)/dashboard/mis-anuncios/page.tsx";
const docRel = "docs/owner-dashboard-global-edit-hydration-standard-01.md";
const pkgRel = "package.json";

for (const rel of [appRel, mapperRel, previewRel, helperRel, inventoryRel, serviciosDashRel, misAnunciosRel, docRel]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`Missing required file: ${rel}`);
}

const app = read(appRel);
const mapper = read(mapperRel);
const preview = read(previewRel);
const helper = read(helperRel);
const inventory = read(inventoryRel);
const serviciosDash = read(serviciosDashRel);
const misAnuncios = read(misAnunciosRel);
const doc = read(docRel);
const pkg = read(pkgRel);

// --- Servicios application hydration ---
for (const needle of [
  "listingId",
  "listingSlug",
  "leonixAdId",
  "returnPanel",
  "listing-edit",
  "offers-edit",
  "offers-addon",
  "coupon-upgrade",
  "/api/clasificados/servicios/my-listing",
  "serviciosPublishedToApplicationDraft",
  "saveClasificadosServiciosApplicationResolved",
  "clearServiciosDraftStorageAndIdb",
]) {
  if (!app.includes(needle)) fail(`Application must reference ${needle}`);
}
if (!app.includes('q.set("id", editListingId)') || !app.includes('q.set("slug", editListingSlug)')) {
  fail("Application must pass id/slug/leonixAdId to my-listing API");
}
if (/catch \(err\)[\s\S]{0,400}setState\(createDefaultClasificadosServiciosState\(\)\)/.test(app)) {
  fail("Application must not silently fall back to blank default draft on dashboard edit fetch failure");
}
if (!app.includes("Cargando anuncio publicado")) fail("Application must show loading state for dashboard edit hydration");
if (!app.includes("No se pudo cargar el modo edición") && !app.includes("Edit mode could not load")) {
  fail("Application must block edit UI on fetch failure");
}
ok("Servicios application: dashboard edit hydrates from my-listing API");

// --- Mapper coverage ---
for (const needle of [
  "businessName",
  "businessTypeId",
  "city",
  "phone",
  "aboutText",
  "customServicesOffered",
  "logoUrl",
  "coverUrl",
  "gallery",
  "videos",
  "couponsAddOn",
  "couponFlyer",
  "couponMoreOffers",
  "normalizeClasificadosServiciosApplicationState",
  "listingProduct",
  "featuredGalleryIds",
]) {
  if (!mapper.includes(needle)) fail(`Mapper must map ${needle}`);
}
if (!mapper.includes("editIdentity")) fail("Mapper must preserve listing identity in editIdentity");
ok("Servicios mapper: published profile_json → application draft coverage");

// --- Preview hydration ---
for (const needle of [
  'preview") === "listing"',
  "listingBoundPreview",
  "/api/clasificados/servicios/my-listing",
  "serviciosPublishedToApplicationDraft",
  "listing-error",
]) {
  if (!preview.includes(needle)) fail(`Preview client must implement ${needle}`);
}
if (!preview.includes("listingBoundPreview")) fail("Preview must detect listing-bound preview");
ok("Servicios preview: listing-bound DB hydration");

// --- Dashboard routes ---
if (!helper.includes("serviciosListingPreviewHref")) fail("Helper must export serviciosListingPreviewHref");
if (!helper.includes('params.set("preview", "listing")')) fail("Preview href must set preview=listing");
if (!inventory.includes("serviciosListingPreviewHref")) fail("Inventory must use serviciosListingPreviewHref");
if (!inventory.includes("serviciosListingEditHref")) fail("Inventory editHref must use serviciosListingEditHref");
if (!serviciosDash.includes("serviciosListingPreviewHref") || !serviciosDash.includes("serviciosPreviewHref")) {
  fail("/dashboard/servicios must wire listing-bound preview links");
}
if (/product=servicios_profesionales/.test(serviciosDash) || /product=servicios_profesionales/.test(inventory)) {
  fail("Existing-listing dashboard routes must not point to blank new-app product URL");
}
ok("Dashboard surfaces: edit + preview carry listing identity");

// --- Mis anuncios CTA standard preserved ---
if (!misAnuncios.includes("serviciosListingEditHref")) fail("Mis anuncios must still use serviciosListingEditHref");
if (!misAnuncios.includes("serviciosOffersEditHref")) fail("Mis anuncios must still use serviciosOffersEditHref");
ok("Mis anuncios CTA standard preserved");

// --- Doc ---
for (const needle of [
  "OWNER-DASHBOARD-GLOBAL-EDIT-HYDRATION-STANDARD-01",
  "OWNER_EDIT_HYDRATION_CONTRACT",
  "preview=listing",
  "serviciosPublishedToApplicationDraft",
  "Future category checklist",
  "TRUE/FALSE",
  "leonixmedia.com/dashboard/mis-anuncios",
  "READY TO COMMIT",
]) {
  if (!doc.includes(needle)) fail(`Doc must include: ${needle}`);
}
ok("Documentation present with global contract + QA URLs");

// --- Package script ---
if (!pkg.includes("verify:owner-dashboard-global-edit-hydration-standard-01")) {
  fail("package.json must include verify:owner-dashboard-global-edit-hydration-standard-01 script");
}
ok("package.json script registered");

// --- Disallowed changes ---
const diff = (() => {
  try {
    return execFileSync("git", ["diff", "--name-only", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
})();
const untracked = (() => {
  try {
    return execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
})();
const changed = `${diff}\n${untracked}`.split(/\r?\n/).filter(Boolean);
const blocked = changed.filter(
  (f) =>
    /supabase\/migrations/i.test(f) ||
    /stripe.*webhook/i.test(f) ||
    (/restaurante/i.test(f) &&
      !/servicios-edit-route-restaurantes-parity/i.test(f) &&
      !/servicios-restaurantes-golden-loop-parity/i.test(f) &&
      !/SERVICIOS_COUPON_RESTAURANTE_PARITY_AUDIT/i.test(f)),
);
if (blocked.length) fail(`Disallowed files touched: ${blocked.join(", ")}`);
ok("No disallowed Stripe webhook / Supabase migration / Restaurante runtime changes");

// --- Previous gates ---
runVerify("verify:owner-dashboard-global-cta-standard-01");
runVerify("verify:servicios-p0c-dashboard-addon-only-stripe-edit-route-parity");
runVerify("verify:servicios-p0b-coupons-offers-persistence-preview-public-output");
runVerify("verify:servicios-p0a-checkpoint-ver-mas-rules-modal-parity");

console.log("\nverify-owner-dashboard-global-edit-hydration-standard-01: ALL CHECKS PASSED");
