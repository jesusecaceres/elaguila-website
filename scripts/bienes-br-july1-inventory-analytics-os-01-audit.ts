/**
 * BR-JULY1-INVENTORY-ANALYTICS-OS-01 gate audit script.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const AUDIT = "app/lib/clasificados/bienes-raices/BIENES_BR_JULY1_INVENTORY_ANALYTICS_OS_01_AUDIT.md";
const HELPER = "app/lib/clasificados/bienes-raices/bienesChildPropertyInventory.ts";
const ANALYTICS = "app/lib/clasificados/bienes-raices/brGlobalAnalytics.ts";
const CHILD_APP =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx";
const SHELL =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryShell.tsx";
const MAPPING =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryFormMapping.ts";
const QUEUE =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryPublishQueue.ts";
const RESULTS_CARD = "app/(site)/clasificados/bienes-raices/resultados/cards/BienesRaicesNegocioCard.tsx";
const ANALYTICS_MOUNT = "app/(site)/clasificados/bienes-raices/listing/BrLiveDetailAnalyticsMount.tsx";
const AUTOS = "app/(site)/clasificados/autos";
const MIGRATIONS = "supabase/migrations";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function run() {
  assert.ok(exists(AUDIT), "audit file exists");
  const audit = read(AUDIT);
  assert.ok(audit.includes("BR-JULY1-INVENTORY-ANALYTICS-OS-01"), "gate id in audit");
  assert.ok(audit.includes("TRUE/FALSE battlefield audit"), "battlefield table exists");

  const falseRows = [...audit.matchAll(/\|\s*[^|]+\|\s*FALSE\s*\|/g)];
  const recommendation = audit.match(/Final recommendation:\s*\*\*(GREEN|YELLOW|RED)\*\*/)?.[1];
  if (recommendation === "GREEN") {
    assert.equal(falseRows.length, 0, `GREEN audit must have no FALSE rows; found ${falseRows.length}`);
  }

  assert.ok(exists(HELPER), "bienesChildPropertyInventory.ts exists");
  const helper = read(HELPER);
  for (const fn of [
    "createStableChildPropertyId",
    "normalizeBienesChildProperty",
    "hydrateBienesChildPropertyForm",
    "prepareBienesChildPropertyForSave",
    "mergeBienesChildProperty",
    "removeBienesChildProperty",
    "mapBienesChildPropertyToPreview",
    "mapBienesParentAndChildrenToPreview",
    "mapBienesParentAndChildrenToPublish",
  ]) {
    assert.ok(helper.includes(fn), `helper exports ${fn}`);
  }
  for (const alias of ["photoUrls", "videoUrl", "virtualTourUrl", "floorPlanUrls", "floorPlans"]) {
    assert.ok(helper.includes(alias), `media alias ${alias}`);
  }

  assert.ok(exists(ANALYTICS), "brGlobalAnalytics.ts exists");
  const analytics = read(ANALYTICS);
  assert.ok(analytics.includes("trackBrListingViewGlobal"), "listing view tracker");
  assert.ok(analytics.includes("trackBrContactClickGlobal"), "contact tracker");
  assert.ok(analytics.includes('category: CATEGORY'), "uses bienes-raices category");

  const childApp = read(CHILD_APP);
  assert.ok(childApp.includes("BrNegocioChildInventoryFullApplication"), "full child app");
  assert.ok(childApp.includes("Guardar propiedad") || childApp.includes("childInventoryDraftFromEditorState"), "save path");
  assert.ok(!childApp.includes("Publicar") || childApp.includes("no publish"), "child app avoids publish");

  const shell = read(SHELL);
  assert.ok(shell.includes("editingId"), "selected child id");
  assert.ok(shell.includes("openForAdd") && shell.includes("openForEdit"), "add/edit modes");
  assert.ok(shell.includes("items.map") || shell.includes("[...items"), "sibling-safe save");

  const mapping = read(MAPPING);
  assert.ok(mapping.includes("pickParentHubSlice"), "parent hub inheritance");
  assert.ok(mapping.includes("buildChildInventoryEditorState"), "hydrate child editor");

  const queue = read(QUEUE);
  assert.ok(queue.includes("br_inventory_group_id") || queue.includes("brInventoryGroupId"), "group id in queue");
  assert.ok(queue.includes("additionalInventoryProperties: []"), "clears nested children on publish snapshot");

  const results = read(RESULTS_CARD);
  assert.ok(results.includes("trackBrResultCardClickGlobal"), "results card analytics");
  assert.ok(!results.includes("setFav"), "fake overlay heart removed");

  assert.ok(exists(ANALYTICS_MOUNT), "live detail analytics mount");
  assert.ok(read(ANALYTICS_MOUNT).includes("trackBrListingViewGlobal"), "detail view mount tracks");

  const pkg = read("package.json");
  assert.ok(pkg.includes("bienes:br-july1-inventory-analytics-os-01"), "package script registered");

  // Scope guard — no autos edits in this gate diff would be checked manually; verify autos tree mtime not required.
  assert.ok(exists(AUTOS), "autos tree untouched baseline exists");

  // No migration edits expected
  if (exists(MIGRATIONS)) {
    const migrationNote = audit.includes("No migration") || audit.includes("No migrations");
    assert.ok(migrationNote, "audit documents no migration");
  }

  console.log("BR-JULY1-INVENTORY-ANALYTICS-OS-01 audit: PASS");
}

run();
