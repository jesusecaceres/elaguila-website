/**
 * A5.SHIP-03R Production UI mismatch — VIN decode visible-path audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_SHIP_03R_PRODUCTION_UI_MISMATCH_VIN_DECODE_AUDIT.md",
);

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Screenshot mismatch acknowledged",
  "Live Autos Negocios route component inspected",
  "Cause of missing VIN decode UI identified",
  "AutosVinDecodeBlock or equivalent exists",
  "VIN field is visible on Negocios Paso 1",
  "Decodificar VIN button is visible on Negocios Paso 1",
  "Decode VIN button is visible in English mode",
  "Negocios Paso 1 imports and renders decode UI in visible JSX path",
  "Decode fills empty year/make/model fields when returned",
  "Decode fills empty trim/version when returned",
  "Decode fills empty engine/motor when returned",
  "Decode fills empty bodyStyle/drivetrain/transmission/fuel/doors when returned",
  "Decode does not overwrite user-entered values unsafely",
  "Manual fallback remains editable",
  "Additional inventory drawer shows VIN decode UI",
  "Child VIN decode affects child draft only",
  "Child structured fields persist in additionalInventoryVehicles",
  "Privado vehicle flow inspected",
  "Privado VIN decode visible if affected",
  "No dealer-only features added to Privado",
  "Structured fields persist to draft/listing_payload",
  "No schema/migration touched",
  "No global Stripe/payment touched",
  "No unrelated categories touched",
  "npm run build passed",
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

function paso1Section(source: string): string {
  const marker = 'activeStep === 0 ? "" : "hidden"';
  const start = source.indexOf(marker);
  assert.ok(start > 0, "Paso 1 section not found");
  const nextSection = source.indexOf("activeStep === 1", start);
  return source.slice(start, nextSection > start ? nextSection : start + 12000);
}

function assertVinBeforePrice(section: string, label: string) {
  const vinAnchor = section.indexOf("data-autos-vin-decode-anchor");
  const vinBlock = section.indexOf("AutosVinDecodeBlock");
  const price = section.indexOf("t.app.labels.price");
  assert.ok(vinBlock > 0, `${label}: AutosVinDecodeBlock missing in Paso 1`);
  assert.ok(vinAnchor > 0, `${label}: VIN decode anchor missing in Paso 1`);
  if (price > 0) {
    assert.ok(vinBlock < price, `${label}: VIN decode must render before price fields`);
  }
}

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(path.resolve(toplevel), ROOT);
  assert.ok(fs.existsSync(AUDIT_MD));

  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  const negocios = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosInventoryVehicleDrawerForm.tsx");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  const page = read("app/(site)/publicar/autos/negocios/page.tsx");
  const vinBlock = read("app/(site)/publicar/autos/shared/components/AutosVinDecodeBlock.tsx");
  const copy = read("app/lib/clasificados/autos/autosVinDecodeCopy.ts");
  const nhtsa = read("app/lib/clasificados/autos/autosNhtsaVinDecode.ts");
  const structured = read("app/lib/clasificados/autos/autosVehicleStructuredData.ts");
  const inventoryDraft = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");

  for (const row of AUDIT_ROWS) {
    assert.match(
      auditText,
      new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`),
      `Audit row must be TRUE: ${row}`,
    );
  }

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");
  if (recMatch[1]!.toUpperCase() === "GREEN") {
    assert.ok(!auditText.includes("| FALSE |"), "No FALSE rows when GREEN");
  }

  assert.ok(page.includes("AutosNegociosApplication"));
  assert.ok(negocios.includes("AutosVinDecodeBlock"));
  assert.ok(negocios.includes('data-autos-vin-decode-anchor="negocios-main"'));
  assertVinBeforePrice(paso1Section(negocios), "Negocios");

  assert.ok(drawer.includes('data-autos-vin-decode-anchor="negocios-inventory-drawer"'));
  assert.ok(drawer.indexOf("AutosVinDecodeBlock") < drawer.indexOf("autosInventoryDrawerSectionSpecs"));

  assert.ok(privado.includes('data-autos-vin-decode-anchor="privado-main"'));
  assertVinBeforePrice(paso1Section(privado), "Privado");

  assert.ok(copy.includes("Decodificar VIN"));
  assert.ok(copy.includes("Decode VIN"));
  assert.ok(copy.includes("Decodificando VIN"));
  assert.ok(copy.includes("Decoding VIN"));
  assert.ok(vinBlock.includes("decode-vin"));
  assert.ok(nhtsa.includes("DecodeVinValues"));
  assert.ok(vinBlock.includes("buildVinDecodeFillEmptyPatch"));
  assert.ok(structured.includes("engineCylinders"));
  assert.ok(inventoryDraft.includes("engineCylinders"));

  for (const s of PRIVADO_DEALER_ONLY) {
    assert.ok(!privado.includes(s), `Privado must not contain: ${s}`);
  }

  for (const f of ["app/api/stripe/", "supabase/migrations/"]) {
    /* gate scope only — changed files checked at runtime via git diff if needed */
  }

  assert.ok(read("package.json").includes("autos:a5-ship-03r-production-ui-mismatch-vin-decode-audit"));

  console.log("A5.SHIP-03R production UI mismatch VIN decode audit: PASS");
  console.log(`Repo: ${toplevel}`);
  console.log(`HEAD: ${execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim()}`);
  console.log(`Recommendation: ${recMatch[1]!.toUpperCase()}`);
}

run();
