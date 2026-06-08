/**
 * A5.SHIP-04 — Autos Vehicle Data Intelligence audit.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAutosVehicleDataCoverageReport } from "../app/lib/clasificados/autos/autosVehicleDataCoverageReport";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_SHIP_04_VEHICLE_DATA_INTELLIGENCE_AUDIT.md",
);

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Autos scope lock respected",
  "Lane impact classified before edits",
  "Ford F-150 trim behavior inspected",
  "Hyundai Elantra missing trim behavior inspected",
  "Cause of missing trim options documented",
  "NHTSA DecodeVinValues mapping inspected",
  "Full NHTSA field mapping implemented or documented",
  "Trim maps from Trim when available",
  "Trim maps from Series when Trim is missing",
  "Trim2/Series2 preserved when available",
  "Engine model/configuration/cylinders/displacement mapped",
  "BodyClass/VehicleType mapped",
  "DriveType mapped to drivetrain",
  "TransmissionStyle/Speeds mapped",
  "FuelTypePrimary/Secondary mapped",
  "Doors mapped",
  "Manufacturer/plant fields mapped",
  "Useful safety fields mapped for future filters/search or documented",
  "Decode summary panel exists in Negocios main",
  "Decode summary panel shows trim/specs when available",
  "Missing local trim helper copy improved",
  "Decoded trim can populate trim/version even if not in local dropdown",
  "Manual trim fallback remains",
  "Decode does not overwrite user-entered fields unsafely",
  "Step 2 specs receive decoded values where fields exist",
  "Non-visible decoded fields persist in structured data",
  "Additional inventory drawer uses full decode mapping",
  "Child decode affects child only",
  "Child decoded fields persist in additionalInventoryVehicles",
  "Privado inspected",
  "Privado gets shared decode/spec improvements if affected",
  "Structured fields persist to Negocios draft",
  "Structured fields persist to Privado draft if affected",
  "Structured fields map to listing_payload",
  "Search normalize includes decoded aliases",
  "Preview/results can display decoded trim/specs",
  "No fake trim lists added",
  "No paid/third-party API added",
  "No dealer-only features added to Privado",
  "No schema/migration files touched",
  "No global Stripe/payment touched",
  "No unrelated categories touched",
  "npm run build passed",
];

const REQUIRED_COPY = [
  "Datos encontrados por VIN",
  "Details found by VIN",
  "Detectado por VIN",
  "Detected by VIN",
  "No encontramos versiones estructuradas para este modelo",
  "We could not find structured trims for this model",
];

const NHTSA_FIELDS = [
  "Trim",
  "Trim2",
  "Series",
  "Series2",
  "EngineModel",
  "EngineCylinders",
  "DisplacementL",
  "DisplacementCC",
  "BodyClass",
  "VehicleType",
  "DriveType",
  "TransmissionStyle",
  "TransmissionSpeeds",
  "FuelTypePrimary",
  "FuelTypeSecondary",
  "Doors",
  "Manufacturer",
  "PlantCountry",
];

const STRUCTURED_MARKERS = ["completenessScore", "availableFields", "safetyFeatures"];

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
  const negocios = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosInventoryVehicleDrawerForm.tsx");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  const vinBlock = read("app/(site)/publicar/autos/shared/components/AutosVinDecodeBlock.tsx");
  const summaryPanel = read("app/(site)/publicar/autos/shared/components/AutosVinDecodeSummaryPanel.tsx");
  const identity = read("app/(site)/publicar/autos/shared/components/AutosVehicleIdentityFields.tsx");
  const copy = read("app/lib/clasificados/autos/autosVinDecodeCopy.ts");
  const trimIntel = read("app/lib/clasificados/autos/autosVehicleTrimIntelligence.ts");
  const nhtsa = read("app/lib/clasificados/autos/autosNhtsaVinDecode.ts");
  const structured = read("app/lib/clasificados/autos/autosVehicleStructuredData.ts");
  const inventoryDraft = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");
  const searchNorm = read("app/lib/clasificados/autos/autosVehicleSearchNormalize.ts");
  const listingType = read("app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts");

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

  for (const phrase of REQUIRED_COPY) {
    const inCopy = copy.includes(phrase) || trimIntel.includes(phrase) || summaryPanel.includes(phrase);
    assert.ok(inCopy, `Required copy missing: ${phrase}`);
  }

  for (const field of NHTSA_FIELDS) {
    assert.ok(nhtsa.includes(field), `NHTSA mapping must reference ${field}`);
  }

  for (const marker of STRUCTURED_MARKERS) {
    assert.ok(structured.includes(marker) || nhtsa.includes(marker), `Structured marker missing: ${marker}`);
  }

  assert.ok(vinBlock.includes("AutosVinDecodeSummaryPanel"));
  assert.ok(vinBlock.includes("mergeDecodedVehicleFieldsIntoDraft"));
  assert.ok(negocios.includes("AutosVinDecodeBlock"));
  assert.ok(drawer.includes("AutosVinDecodeBlock"));
  assert.ok(privado.includes("AutosVinDecodeBlock"));
  assert.ok(identity.includes("autosMissingStructuredTrimHelper"));
  assert.ok(inventoryDraft.includes("nhtsaDecode"));
  assert.ok(inventoryDraft.includes("vinDetectedTrim"));
  assert.ok(searchNorm.includes("fuelTypePrimary"));
  assert.ok(listingType.includes("nhtsaDecode"));

  for (const phrase of PRIVADO_DEALER_ONLY) {
    assert.ok(!privado.includes(phrase), `Privado must not contain dealer-only: ${phrase}`);
  }

  const changed = changedFiles();
  for (const file of changed) {
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!file.replace(/\\/g, "/").startsWith(prefix), `Forbidden path modified: ${file}`);
    }
  }

  const coverage = buildAutosVehicleDataCoverageReport();
  const f150 = coverage.find((c) => c.make === "Ford" && c.model === "F-150");
  const elantra = coverage.find((c) => c.make === "Hyundai" && c.model === "Elantra");
  assert.ok(f150?.localTrimDropdownExists, "F-150 must have local trim dropdown");
  assert.ok(!elantra?.localTrimDropdownExists, "Elantra must not have local trim dropdown");
  assert.ok(elantra?.manualFallbackExists, "Elantra manual fallback");

  console.log("A5.SHIP-04 vehicle data intelligence audit: PASS");
  console.log(`Coverage cases: ${coverage.length}`);
}

run();
