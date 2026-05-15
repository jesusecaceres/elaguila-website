/**
 * A2 structured vehicle taxonomy static gate (no DB / network).
 * Run: npm run autos:a2-taxonomy-audit
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
  const md = read("app/lib/clasificados/autos/AUTOS_A2_STRUCTURED_VEHICLE_TAXONOMY_AUDIT.md");
  const rows = [
    "Privado uses structured year input",
    "Privado uses structured make input",
    "Privado uses model options dependent on make",
    "Privado supports trim safely",
    "Negocios uses structured year input",
    "Negocios uses structured make input",
    "Negocios uses model options dependent on make",
    "Negocios supports trim safely",
    "Canonical title is generated from structured fields",
    "Legacy free-text values display professionally",
    "Existing drafts/listings remain compatible",
    "Search includes normalized year/make/model/trim",
    "Filters use normalized vehicle fields where wired",
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

  const tax = read("app/lib/clasificados/autos/autosVehicleTaxonomy.ts");
  assert.ok(tax.includes("export function coerceVehicleIdentityFromTaxonomy"), "Taxonomy must export coerceVehicleIdentityFromTaxonomy");
  assert.ok(tax.includes("export function getAutosVehicleYearOptions"), "Taxonomy must export getAutosVehicleYearOptions");
  assert.ok(tax.includes("AUTOS_VEHICLE_MAKES"), "Taxonomy must export AUTOS_VEHICLE_MAKES");

  const identity = read("app/(site)/publicar/autos/shared/components/AutosVehicleIdentityFields.tsx");
  assert.ok(identity.includes("autosVehicleTaxonomy"), "Vehicle identity fields must import taxonomy");

  const priv = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(priv.includes("AutosVehicleIdentityFields"), "Privado application must use AutosVehicleIdentityFields");

  const neg = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  assert.ok(neg.includes("AutosVehicleIdentityFields"), "Negocios application must use AutosVehicleIdentityFields");

  const mapper = read("app/lib/clasificados/autos/mapAutosClassifiedsToPublic.ts");
  assert.ok(mapper.includes("buildVehicleTitle"), "Mapper must use buildVehicleTitle for canonical title");
  assert.ok(mapper.includes("L.make") && mapper.includes("L.model") && mapper.includes("L.trim"), "Search blurb builder must reference listing identity fields");
  assert.ok(mapper.includes("L.year != null"), "Search blurb must include year in listing haystack");

  const display = read("app/lib/clasificados/autos/autosListingDisplayIdentity.ts");
  assert.ok(display.includes("coerceVehicleIdentityFromTaxonomy"), "Display normalizer must apply taxonomy coercion");

  const draftDefaults = read("app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts");
  assert.ok(draftDefaults.includes("coerceVehicleIdentityFromTaxonomy"), "normalizeLoadedListing path must coerce vehicle identity");

  console.log("autos-a2-structured-vehicle-taxonomy-audit: OK");
}

run();
