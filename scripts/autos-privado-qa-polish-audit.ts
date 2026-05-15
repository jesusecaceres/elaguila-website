/**
 * Autos Privado QA polish static gate (no DB / Stripe / network).
 * Run: npm run autos:privado-qa-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function assertAuditTable() {
  const md = read("app/lib/clasificados/autos/AUTOS_PRIVADO_QA_POLISH_AUDIT.md");
  const rows = [
    "Test publish bypass does not go to Stripe when enabled",
    "Publish loading state is clear",
    "Privado title is generated from structured fields",
    "Custom title cannot break search/filter identity",
    "Make/model/trim display is professionally normalized",
    "Preview card has stronger listing hierarchy",
    "Fake preview engagement metrics were removed",
    "Gallery images are clickable or misleading overlay was removed",
    "Equipment/upgrades additional field exists or blocker documented",
    "Additional equipment/upgrades appears in preview/detail/search if implemented",
    "Privado contact card CTA hierarchy improved",
    "Social links are implemented safely or documented for next phase",
    "Every collected field maps to preview/detail/search/filter where appropriate",
    "No fake filters were added",
    "No unrelated categories were touched",
    "npm run build passed",
  ];
  for (const r of rows) {
    assert.ok(md.includes(`| ${r} |`), `Audit markdown must include row: ${r}`);
  }
}

function run() {
  assertAuditTable();

  const privPreview = read("app/(site)/clasificados/autos/privado/components/AutoPrivadoPreviewPage.tsx");
  assert.ok(
    !privPreview.includes("AUTOS_LISTING_ANALYTICS_DRAFT_DEMO"),
    "Privado preview must not use demo analytics constant",
  );

  const flowCopy = read("app/(site)/clasificados/autos/lib/autosPublishFlowCopy.ts");
  assert.ok(flowCopy.includes("Publicar anuncio de prueba"), "ES test-publish CTA copy must exist");
  assert.ok(flowCopy.includes("Publish test listing"), "EN test-publish CTA copy must exist");
  assert.ok(flowCopy.includes("Publicando anuncio de prueba"), "ES test-publish busy copy must exist");
  assert.ok(flowCopy.includes("Publishing test listing"), "EN test-publish busy copy must exist");

  const privApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(!privApp.includes("vehicleTitleOverride"), "Privado application must not reference title override toggle");

  const confirm = read("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");
  assert.ok(confirm.includes("publish-options"), "Confirm flow must load publish-options for bypass-aware copy");
  assert.ok(confirm.includes("testPublishBypass") || confirm.includes("internalBypass"), "Confirm checkout must handle bypass responses");

  const listingType = read("app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts");
  assert.ok(listingType.includes("otherEquipmentDetails"), "Listing type must declare otherEquipmentDetails");

  const mapper = read("app/lib/clasificados/autos/mapAutosClassifiedsToPublic.ts");
  assert.ok(mapper.includes("otherEquipmentDetails"), "Public mapper blurb must include otherEquipmentDetails");

  const vehicleDesc = read("app/(site)/clasificados/autos/negocios/components/VehicleDescription.tsx");
  assert.ok(vehicleDesc.includes("otherEquipmentDetails"), "VehicleDescription must render otherEquipmentDetails");

  const gallery = read("app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx");
  assert.ok(gallery.includes("lightbox") && gallery.includes("setLightbox"), "AutoGallery must implement lightbox state");

  const publishOpts = read("app/api/clasificados/autos/publish-options/route.ts");
  assert.ok(publishOpts.includes("isAutosAllowTestPublishBypassEnabled"), "publish-options must expose test bypass flag");

  console.log("autos-privado-qa-polish-audit: OK");
}

run();
