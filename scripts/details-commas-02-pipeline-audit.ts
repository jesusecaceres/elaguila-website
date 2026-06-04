/**
 * DETAILS-COMMAS-02 — Bienes Raíces + Rentas numeric/detail comma formatting audit (no network).
 * Run: npm run details:commas-02-pipeline-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const AUDIT = "app/(site)/clasificados/bienes-raices/DETAILS_COMMAS_02_PIPELINE_AUDIT.md";
const HELPERS = "app/(site)/clasificados/bienes-raices/shared/realEstateAddressPriceFormat.ts";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function run() {
  assert.ok(exists(AUDIT), "DETAILS-COMMAS-02 audit doc must exist");
  assert.ok(exists(HELPERS), "Shared BR numeric helpers must exist");

  const audit = read(AUDIT);
  const helpers = read(HELPERS);

  for (const required of [
    "DETAILS-COMMAS-02",
    "BR Privado",
    "BR Negocio",
    "Rentas Privado",
    "Rentas Negocio",
    "price/rent formatting",
    "deposit formatting",
    "interior size",
    "lot size",
    "commercial/office",
    "garage/storage",
    "land/lote/terreno",
  ]) {
    assert.ok(audit.includes(required), `Audit doc must mention: ${required}`);
  }

  assert.ok(audit.includes("| TRUE |") || audit.includes("| FALSE |") || audit.includes("| N/A |"), "Audit doc must include TRUE/FALSE/N/A table");
  assert.ok(helpers.includes("formatUsdWhole"), "Helpers must export formatUsdWhole");
  assert.ok(helpers.includes("formatIntegerWithCommas"), "Helpers must export formatIntegerWithCommas");
  assert.ok(helpers.includes("formatSqftDisplay"), "Helpers must export formatSqftDisplay");
  assert.ok(helpers.includes("formatYearBuiltDisplay"), "Helpers must export formatYearBuiltDisplay");

  for (const unrelated of ["autos/", "servicios/", "restaurantes/", "tienda/", "empleos/"]) {
    assert.equal(
      audit.toLowerCase().includes(`changed: \`${unrelated}`) || audit.toLowerCase().includes(`modified \`${unrelated}`),
      false,
      `Audit doc should not list unrelated category as changed: ${unrelated}`,
    );
  }

  console.log("details-commas-02-pipeline-audit: OK");
}

run();
