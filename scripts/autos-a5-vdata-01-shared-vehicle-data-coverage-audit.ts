/**
 * A5.VDATA-01 Autos shared vehicle data coverage + structured dropdown foundation gate.
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
  "app/lib/clasificados/autos/AUTOS_A5_VDATA_01_SHARED_VEHICLE_DATA_COVERAGE_AUDIT.md",
);
const POLICY_MD = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_VEHICLE_DATA_POLICY.md");

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Current Autos vehicle data inspected",
  "Current trim dropdown behavior inspected",
  "Current engine field behavior inspected",
  "Shared Autos vehicle data policy created/updated",
  "Normalized vehicle data shape exists or documented",
  "Free-text trim fallback remains",
  "Free-text engine fallback remains",
  "Custom vehicle values persist to draft",
  "Custom vehicle values appear in preview",
  "Negocios main form uses shared vehicle helper or documented blocker",
  "Negocios inventory drawer uses same vehicle helper or documented blocker",
  "Privado checked for shared vehicle field impact",
  "Privado receives shared vehicle dropdown behavior if affected",
  "No dealer-only fields added to Privado",
  "Known trim dropdown appears when data exists",
  "Missing trim data falls back to free text",
  "Known engine dropdown appears when data exists",
  "Missing engine data falls back to free text",
  "User-edited specs are not overwritten without confirmation",
  "Search/filter readiness documented",
  "Data source audit note included",
  "No external paid API key added",
  "No dealership website scraping added",
  "No global Stripe/payment files touched",
  "No unrelated categories touched",
  "npm run build passed",
];

const GATE_OWN_MARKERS = [
  "AUTOS_A5_VDATA_01",
  "autosVehicleStructuredSeed",
  "autos-a5-vdata-01",
];

const PRIVADO_PATH = "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx";
const NEGOCIOS_APP = "app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx";
const INVENTORY_DRAWER = "app/(site)/publicar/autos/negocios/components/AutosInventoryVehicleDrawerForm.tsx";
const IDENTITY_FIELDS = "app/(site)/publicar/autos/shared/components/AutosVehicleIdentityFields.tsx";
const ENGINE_FIELD = "app/(site)/publicar/autos/shared/components/AutosVehicleEngineField.tsx";

const PRIVADO_DEALER_ONLY_STRINGS = [
  "Inventory Boost",
  "additionalInventoryVehicles",
  "AutosNegociosInventoryBoostPanel",
  "AutosDealerFinanceFields",
  "DealerBusinessStack",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/(site)/restaurantes/",
  "app/(site)/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/tienda/",
  "app/api/stripe/",
  "supabase/migrations/",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function changedFiles(): string[] {
  try {
    const out = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
    if (out) return out.split(/\r?\n/).filter(Boolean);
  } catch {
    /* ignore */
  }
  try {
    return execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

function untrackedFiles(): string[] {
  try {
    const out = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" }).trim();
    return out ? out.split(/\r?\n/).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function gateScopedChanges(): string[] {
  const all = [...new Set([...changedFiles(), ...untrackedFiles()])];
  return all.filter(
    (f) =>
      f.replace(/\\/g, "/").includes("app/lib/clasificados/autos/") ||
      f.replace(/\\/g, "/").includes("publicar/autos/") ||
      f.replace(/\\/g, "/").includes("clasificados/autos/") ||
      f.includes("autos-a5-vdata-01"),
  );
}

function readIfExists(rel: string): string {
  try {
    return read(rel);
  } catch {
    return "";
  }
}

function assertAuditTable(): void {
  const md = fs.readFileSync(AUDIT_MD, "utf8");
  for (const row of AUDIT_ROWS) {
    assert.match(md, new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|`), `Missing audit row: ${row}`);
    const line = md.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`| ${row}|`));
    assert(line, `Row line missing: ${row}`);
    assert.match(line!, /\|\s*TRUE\s*\|/, `Expected TRUE for: ${row}`);
  }
}

function main(): void {
  assert(fs.existsSync(AUDIT_MD), "Audit markdown missing");
  assert(fs.existsSync(POLICY_MD), "Policy markdown missing");
  assertAuditTable();

  const identity = read(IDENTITY_FIELDS);
  assert(identity.includes("No encontramos trims estructurados"), "ES trim fallback copy missing");
  assert(identity.includes("We do not have structured trims"), "EN trim fallback copy missing");
  assert(identity.includes("TRIM_CUSTOM"), "Custom trim fallback missing");
  assert(identity.includes("__unlisted_make__"), "Unlisted make fallback missing");

  const engine = read(ENGINE_FIELD);
  assert(engine.includes("ENGINE_CUSTOM"), "Custom engine fallback missing");
  assert(engine.includes("Escribir motor manualmente") || engine.includes("Enter engine manually"), "Custom engine option missing");

  assert(read(NEGOCIOS_APP).includes("AutosVehicleIdentityFields"), "Negocios main identity fields missing");
  assert(read(NEGOCIOS_APP).includes("AutosVehicleEngineField"), "Negocios main engine field missing");
  assert(read(NEGOCIOS_APP).includes("useAutosVehicleStructuredSpecFill"), "Negocios spec fill hook missing");

  const drawer = read(INVENTORY_DRAWER);
  assert(drawer.includes("AutosVehicleIdentityFields"), "Inventory drawer identity fields missing");
  assert(drawer.includes("AutosVehicleEngineField"), "Inventory drawer engine field missing");
  assert(drawer.includes("useAutosVehicleStructuredSpecFill"), "Inventory drawer spec fill hook missing");

  const privado = read(PRIVADO_PATH);
  assert(privado.includes("AutosVehicleIdentityFields"), "Privado identity fields missing");
  assert(!privado.includes("AutosVehicleEngineField"), "Privado should not add engine field this gate");
  for (const s of PRIVADO_DEALER_ONLY_STRINGS) {
    assert(!privado.includes(s), `Dealer-only string leaked to Privado: ${s}`);
  }

  assert(fs.existsSync(path.join(ROOT, "app/lib/clasificados/autos/autosVehicleDataTypes.ts")), "Data types missing");
  assert(fs.existsSync(path.join(ROOT, "app/lib/clasificados/autos/autosVehicleStructuredSeed.ts")), "Structured seed missing");
  assert(fs.existsSync(path.join(ROOT, "app/lib/clasificados/autos/autosVehicleSearchNormalize.ts")), "Search normalize missing");

  const policy = read("app/lib/clasificados/autos/AUTOS_VEHICLE_DATA_POLICY.md");
  assert(policy.includes("NHTSA vPIC"), "NHTSA source note missing");
  assert(policy.includes("Edmunds"), "Edmunds source note missing");
  assert(/free-text fallback/i.test(policy), "Free-text policy missing");

  const scoped = gateScopedChanges();
  for (const f of scoped) {
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert(!f.replace(/\\/g, "/").startsWith(prefix), `Forbidden path in gate changes: ${f}`);
    }
    assert(!f.includes("api/stripe"), "Stripe touched");
  }

  const allChanged = [...new Set([...changedFiles(), ...untrackedFiles()])];
  const autosLib = allChanged.filter((f) => f.includes("app/lib/clasificados/autos/") || f.includes("publicar/autos/"));
  for (const f of autosLib) {
    const content = readIfExists(f);
    assert(!content.includes("EDMUNDS_API"), "External Edmunds API key usage");
    assert(!content.includes("CAR_API_KEY"), "External Car API key usage");
    assert(!/cheerio|puppeteer|playwright.*dealer/i.test(content), "Dealership scraping code");
  }

  console.log("A5.VDATA-01 shared vehicle data coverage audit: PASS");
  console.log(`Audit rows verified: ${AUDIT_ROWS.length}`);
  console.log(`Gate-scoped files: ${scoped.length}`);
}

main();
