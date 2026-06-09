/**
 * A5.SHIP-06 — Autos added inventory end-to-end truth audit.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_SHIP_06_ADDED_INVENTORY_END_TO_END_AUDIT.md",
);

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Autos scope lock respected",
  "Lane impact classified before edits",
  "Current Add Inventory behavior inspected",
  "Pre-publish Add Vehicle opens drawer inside same app",
  "Drawer is not a weak mini form",
  "Drawer uses full vehicle-only application flow",
  "Drawer includes Información principal",
  "Drawer includes Especificaciones",
  "Drawer includes Destacados/equipamiento",
  "Drawer includes Fotos y medios",
  "Drawer includes Descripción",
  "Drawer excludes Negocio/contacto step",
  "Drawer shows inherited business/contact notice",
  "Child inherits dealer/business/contact data from parent",
  "Child owns only vehicle-specific data",
  "Save to inventory saves child draft and closes drawer",
  "Save and add another saves child draft and resets only child form",
  "Cancel does not wipe parent app",
  "Drawer has no Publish CTA",
  "Drawer save does not publish child",
  "Outside click cannot silently lose child work",
  "Escape key cannot silently lose child work",
  "Dirty close confirmation exists",
  "Saved child has its own result-card preview",
  "Saved child result card has Preview action",
  "Saved child result card has Edit action",
  "Saved child result card has Remove action",
  "Saved child preview does not show fake Leonix ID",
  "Saved child preview does not show fake public URL",
  "Child full ad preview exists before publish",
  "Child full preview uses child vehicle data",
  "Child full preview inherits dealer Business Hub from parent",
  "Child full preview excludes itself from related inventory list",
  "Parent full preview shows all added inventory vehicles",
  "Parent full preview lets user open child preview",
  "Public main detail shows added vehicles from same dealer group",
  "Public child detail shows main plus other siblings excluding itself",
  "Related inventory cards link to real detail pages after publish",
  "Public buyer does not see owner inventory CTAs",
  "Main vehicle counts as 1 of 10",
  "Added vehicles count toward 10 included",
  "11th vehicle is blocked or points to boost without fake entitlement",
  "Final publish creates or preserves plan to create separate real listing for each child",
  "Each child gets own listing ID after publish or blocker documented",
  "Each child gets own Leonix Ad ID after publish or blocker documented",
  "Each child gets own detail URL after publish or blocker documented",
  "Child listings share dealerInventoryGroupId after publish or blocker documented",
  "Children are not nested-only fake records",
  "Post-publish add-inventory mode inspected",
  "Post-publish mode preloads dealer/business data or blocker documented",
  "Post-publish mode blanks vehicle-specific fields or blocker documented",
  "Parent draft survives drawer open/close/save",
  "Child draft survives refresh",
  "Child draft survives preview/back",
  "Child edit/remove works",
  "Privado checked for shared impact",
  "No dealer inventory drawer added to Privado",
  "No dealer-only Business Hub/inventory/finance/review/custom links added to Privado",
  "No global Stripe/payment touched",
  "No schema/migration touched",
  "No unrelated categories touched",
  "npm run build passed",
];

const DRAWER_COPY_ES = [
  "Agregar vehículo al inventario",
  "Guardar en inventario",
  "Guardar y agregar otro",
  "Tienes cambios sin guardar",
  "La información del negocio, contacto, ubicación",
];

const DRAWER_COPY_EN = [
  "Add vehicle to inventory",
  "Save to inventory",
  "Save and add another",
  "You have unsaved changes",
  "Business, contact, location",
];

const CHILD_PREVIEW_COPY = [
  "Vista previa del vehículo adicional",
  "Additional vehicle preview",
  "Este vehículo se publicará como una ficha propia",
  "This vehicle will publish as its own listing",
];

const INVENTORY_PREVIEW_COPY = [
  "Inventario incluido en esta solicitud",
  "Inventory included in this application",
  "Vista previa del inventario del dealer",
  "Dealer inventory preview",
];

const RELATED_COPY = [
  "Más vehículos de este dealer",
  "More vehicles from this dealer",
  "Explora otros vehículos activos de este inventario",
  "Explore other active vehicles from this inventory",
];

const MULTI_LISTING_MARKERS = [
  "additionalInventoryVehicles",
  "dealerInventoryGroupId",
  "dealerInventoryParentListingId",
  "inventoryRole",
  "leonix",
];

const PRIVADO_DEALER_ONLY = [
  "Inventory Boost",
  "Agregar vehículo al inventario",
  "Más vehículos de este dealer",
  "financeContactImage",
  "dealerCustomLinks",
  "googleReviewsUrl",
  "yelpReviewsUrl",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const out = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).trim();
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" }).trim();
  return [...out.split("\n").filter(Boolean), ...untracked.split("\n").filter(Boolean)];
}

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(path.resolve(toplevel), ROOT);
  assert.ok(fs.existsSync(AUDIT_MD), "Audit markdown must exist");

  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx");
  const drawerForm = read("app/(site)/publicar/autos/negocios/components/AutosInventoryVehicleDrawerForm.tsx");
  const bundleCopy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  const bundlePreview = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx");
  const childOverlay = read("app/(site)/publicar/autos/negocios/components/AutosNegociosChildInventoryPreviewOverlay.tsx");
  const inherited = read("app/lib/clasificados/autos/autosInventoryInheritedPreview.ts");
  const related = read("app/(site)/clasificados/autos/lib/mapAutosPublicListingToAutoDealer.ts");
  const bundlePublish = read("app/lib/clasificados/autos/autosNegociosBundlePublish.ts");
  const listingService = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  const additionalDraft = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");
  const checkout = read("app/api/clasificados/autos/checkout/route.ts");
  const publishCore = read("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");
  const multiListingPool = [bundlePublish, listingService, inherited, additionalDraft, checkout, publishCore].join("\n");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");

  for (const row of AUDIT_ROWS) {
    assert.match(
      auditText,
      new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`),
      `Audit row must be TRUE: ${row}`,
    );
  }

  if (recMatch[1]!.toUpperCase() === "GREEN") {
    const tableSection = auditText.slice(auditText.indexOf("## TRUE/FALSE table"));
    assert.ok(!tableSection.includes("| FALSE |"), "No FALSE rows when GREEN");
  }

  for (const phrase of [...DRAWER_COPY_ES, ...DRAWER_COPY_EN]) {
    assert.ok(bundleCopy.includes(phrase) || drawer.includes(phrase), `Drawer copy missing: ${phrase}`);
  }

  for (const phrase of CHILD_PREVIEW_COPY) {
    assert.ok(bundleCopy.includes(phrase) || childOverlay.includes(phrase), `Child preview copy missing: ${phrase}`);
  }

  for (const phrase of INVENTORY_PREVIEW_COPY) {
    assert.ok(bundleCopy.includes(phrase), `Inventory preview copy missing: ${phrase}`);
  }

  for (const phrase of RELATED_COPY) {
    assert.ok(
      bundleCopy.includes(phrase) || read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts").includes(phrase),
      `Related inventory copy missing: ${phrase}`,
    );
  }

  assert.ok(inherited.includes("buildRelatedDraftPreviewListings"));
  assert.ok(inherited.includes("excludeChildId"));
  assert.ok(related.includes("row.id !== current.id"));
  assert.ok(drawer.includes("autosInventoryDrawerUnsavedCloseConfirm"));
  assert.ok(drawer.includes("max-w-[min(960px"));
  assert.ok(drawerForm.includes("autosInventoryInheritedBusinessNotice"));
  assert.ok(drawerForm.includes("autosInventoryDrawerSectionMain"));
  assert.ok(drawerForm.includes("autosInventoryDrawerSectionSpecs"));
  assert.ok(drawerForm.includes("autosInventoryDrawerSectionHighlights"));
  assert.ok(drawerForm.includes("autosInventoryDrawerSectionMedia"));
  assert.ok(drawerForm.includes("autosInventoryDrawerSectionDescription"));
  assert.ok(bundlePreview.includes("AutosNegociosChildInventoryPreviewOverlay"));
  assert.ok(bundlePreview.includes("autosInventoryBundlePreviewCta"));
  assert.ok(!/Publish/i.test(drawer), "Drawer must not contain Publish CTA");
  assert.ok(bundleCopy.includes("Leonix ID generated on publish"));

  for (const marker of MULTI_LISTING_MARKERS) {
    assert.ok(multiListingPool.includes(marker), `Multi-listing marker missing: ${marker}`);
  }

  for (const phrase of PRIVADO_DEALER_ONLY) {
    assert.ok(!privado.includes(phrase), `Privado must not contain: ${phrase}`);
  }

  const changed = changedFiles();
  for (const file of changed) {
    const norm = file.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden path modified: ${file}`);
    }
  }

  console.log("A5.SHIP-06 added inventory end-to-end audit: PASS");
}

run();
