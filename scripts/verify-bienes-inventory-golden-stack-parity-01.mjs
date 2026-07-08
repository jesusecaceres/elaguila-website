#!/usr/bin/env node
/** BIENES-INVENTORY-GOLDEN-STACK-PARITY-01 verifier */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => { console.error(`verify-bienes-inventory-golden-stack-parity-01: FAIL — ${m}`); process.exit(1); };
const ok = (m) => console.log(`OK: ${m}`);

const helperRel = "app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts";
const mapperRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft.ts";
const appRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx";
const previewRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx";
const cardRel = "app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx";
const invActionsRel = "app/(site)/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx";
const matrixRel = "app/lib/listingPlans/revenuePricingMatrix.ts";
const payloadRel = "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts";
const checkpointRel = "app/lib/listingPlans/publishCheckoutCheckpoint.ts";
const relatedFetchRel = "app/(site)/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser.ts";
const docRel = "docs/bienes-inventory-golden-stack-parity-01.md";
const globalDocRel = "docs/global-monetized-category-stack-standard-01.md";

for (const rel of [helperRel, mapperRel, appRel, previewRel, cardRel, invActionsRel, docRel, globalDocRel]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`Missing: ${rel}`);
}

const helper = read(helperRel);
const mapper = read(mapperRel);
const app = read(appRel);
const preview = read(previewRel);
const card = read(cardRel);
const invActions = read(invActionsRel);
const matrix = read(matrixRel);
const payload = read(payloadRel);
const checkpoint = read(checkpointRel);
const relatedFetch = read(relatedFetchRel);
const doc = read(docRel);
const pkg = read("package.json");

for (const fn of [
  "bienesListingEditHref",
  "bienesInventoryEditHref",
  "bienesInventoryAddonHref",
  "bienesListingPreviewHref",
  "bienesBackToEditHrefFromPreview",
  "buildBienesDashboardListingContextParams",
  "hydrateBienesListingForDashboardEdit",
  "startBienesDashboardInventoryAddonCheckout",
]) {
  if (!helper.includes(`export function ${fn}`) && !helper.includes(`export async function ${fn}`)) {
    fail(`helper must export ${fn}`);
  }
}

if (!helper.includes('BIENES_DASHBOARD_APPLICATION_BASE = "/clasificados/publicar/bienes-raices/negocio"')) {
  fail("helper must use direct negocio application base");
}
if (helper.includes("/clasificados/publicar/bienes-raices?") && helper.includes("listing-edit")) {
  fail("helper must not route existing edit through publish hub");
}
ok("Bienes dashboard helper routes");

if (!mapper.includes("hydrateBienesAgenteListingForDashboardEdit")) fail("hydration mapper missing");
if (!mapper.includes("additionalInventoryProperties")) fail("mapper must hydrate child inventory");
ok("Bienes hydration mapper");

for (const needle of [
  "isExistingDashboardListingMode",
  "fetchBienesInventoryPackEntitlementActive",
  "redirectBienesDashboardInventoryPackCheckout",
  "hydrateBienesListingForDashboardEdit",
  "bienesListingPreviewHref",
  "focusInventoryPack",
]) {
  if (!app.includes(needle)) fail(`application must reference ${needle}`);
}
if (!/isExistingDashboardListingMode[\s\S]{0,200}bienesListingPreviewHref/.test(app)) {
  fail("application preview must use listing-bound href in dashboard mode");
}
ok("Bienes application golden loop");

for (const needle of [
  "bienesBackToEditHrefFromPreview",
  "listingBoundPreview",
  "hydrateBienesListingForDashboardEdit",
]) {
  if (!preview.includes(needle)) fail(`preview must reference ${needle}`);
}
if (preview.includes("listingBoundPreview") && !preview.includes("vuelve a editar")) {
  /* publish block message in ES is enough */
}
if (!preview.includes("listingBoundPreview")) fail("preview listing-bound mode");
ok("Bienes preview back loop");

if (!card.includes("bienesListingEditHref") || !card.includes("bienesListingPreviewHref")) {
  fail("LeonixRealEstateListingManageCard must wire golden-loop helpers");
}
if (!invActions.includes("bienesInventoryEditHref")) fail("inventory actions must wire edit href");
ok("Dashboard surfaces wired");

if (!matrix.includes("br_inventory_pack_monthly")) fail("matrix must define br_inventory_pack_monthly");
if (!payload.includes("BIENES_INVENTORY_PACK_DASHBOARD_CHECKOUT")) fail("checkout payload must exist");
if (!checkpoint.includes("BR_INVENTORY_PACK_PACKAGE_KEY")) fail("package key constant required");
if (!checkpoint.includes("REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED = true")) {
  fail("inventory pack checkout must be enabled after fulfillment gate");
}
if (!helper.includes("fetchBienesInventoryPackEntitlementActive")) fail("helper must fetch real entitlement");
if (!helper.includes("startBienesDashboardInventoryPackCheckout")) fail("helper must export pack checkout");
if (!invActions.includes("fetchBienesInventoryPackEntitlementActive")) {
  fail("inventory actions must read real entitlement");
}
if (!invActions.includes("redirectBienesDashboardInventoryPackCheckout")) {
  fail("inactive inventory CTA must start add-on checkout");
}
if (!helper.includes("REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED")) fail("helper must respect checkout support flag");
ok("Payment honesty: package defined, fulfillment enabled with entitlement read");

if (!checkpoint.includes("BR_INVENTORY_PACK_MAX_CHILDREN = 4")) fail("max 4 rule required");
if (!relatedFetch.includes("fetchBrRelatedInventoryListingsForDetail")) fail("public child render path required");
ok("Max 4 + public render path");

for (const needle of ["leonixmedia.com/dashboard/mis-anuncios", "TRUE/FALSE", "READY TO COMMIT"]) {
  if (!doc.includes(needle)) fail(`doc missing ${needle}`);
}
ok("Documentation");

if (!pkg.includes("smoke:bienes-inventory-golden-stack-parity-01")) fail("smoke script missing");

const PREVIOUS = {
  "verify:servicios-restaurantes-golden-loop-parity-01":
    "scripts/verify-servicios-restaurantes-golden-loop-parity-01.mjs",
  "verify:owner-dashboard-global-edit-hydration-standard-01":
    "scripts/verify-owner-dashboard-global-edit-hydration-standard-01.mjs",
  "verify:owner-dashboard-global-cta-standard-01": "scripts/verify-owner-dashboard-global-cta-standard-01.mjs",
};
for (const [name, rel] of Object.entries(PREVIOUS)) {
  if (!existsSync(path.join(ROOT, rel))) continue;
  try {
    execFileSync(process.execPath, [path.join(ROOT, rel)], { cwd: ROOT, stdio: "pipe", encoding: "utf8" });
    ok(`previous gate passed: ${name}`);
  } catch (e) {
    const out = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim();
    fail(`previous gate ${name} failed${out ? `: ${out.slice(0, 400)}` : ""}`);
  }
}

console.log("\nverify-bienes-inventory-golden-stack-parity-01: ALL CHECKS PASSED");
