/**
 * A5.VDATA-B Autos shared vehicle helper + dropdown wiring gate.
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
  "app/lib/clasificados/autos/AUTOS_A5_VDATA_B_SHARED_VEHICLE_HELPER_WIRING_AUDIT.md",
);
const HELPER_TS = path.join(ROOT, "app/lib/clasificados/autos/autosVehicleData.ts");
const IDENTITY_FIELDS = path.join(
  ROOT,
  "app/(site)/publicar/autos/shared/components/AutosVehicleIdentityFields.tsx",
);
const ENGINE_FIELD = path.join(ROOT, "app/(site)/publicar/autos/shared/components/AutosVehicleEngineField.tsx");
const NEGOCIOS_APP = path.join(ROOT, "app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
const INVENTORY_DRAWER = path.join(
  ROOT,
  "app/(site)/publicar/autos/negocios/components/AutosInventoryVehicleDrawerForm.tsx",
);
const PRIVADO_APP = "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx";
const GATE_A_AUDIT = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_A5_VDATA_A_SHARED_VEHICLE_DATA_AUDIT.md");

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Gate A policy/audit inspected",
  "Shared Autos vehicle helper exists",
  "Helper supports structured trim lookup",
  "Helper supports structured engine lookup",
  "Helper handles missing data gracefully",
  "Helper preserves custom values",
  "Free-text trim fallback remains",
  "Free-text engine fallback remains",
  "Known trim dropdown appears when data exists",
  "Missing trim data shows free-text helper copy",
  "Known engine dropdown appears when data exists",
  "Missing engine data keeps free-text engine field",
  "User-edited specs are not overwritten without confirmation",
  "Negocios main form wired to shared helper",
  "Negocios inventory drawer wired to same helper",
  "Privado checked for shared vehicle field impact",
  "Privado updated if shared vehicle fields are affected",
  "No dealer-only fields added to Privado",
  "Custom trim/engine values persist to draft",
  "Custom trim/engine values appear in preview",
  "Search/filter readiness values documented/prepared",
  "No external paid API key added",
  "No dealership scraping added",
  "No global Stripe/payment files touched",
  "No unrelated categories touched",
  "git diff reviewed",
];

const GATE_B_MARKERS = [
  "AUTOS_A5_VDATA_B",
  "autos-a5-vdata-b",
  "autosVehicleData.ts",
];

const PRIVADO_DEALER_ONLY_STRINGS = [
  "Inventory Boost",
  "additionalInventoryVehicles",
  "AutosNegociosInventoryBoostPanel",
  "AutosDealerFinanceFields",
  "DealerBusinessStack",
  "AutosNegociosAddInventoryDrawer",
  "Más vehículos de este dealer",
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

function gateBScopedChanges(): string[] {
  const all = [...new Set([...changedFiles(), ...untrackedFiles()])];
  return all.filter((f) => {
    const norm = f.replace(/\\/g, "/");
    return (
      GATE_B_MARKERS.some((m) => norm.includes(m)) ||
      norm.includes("publicar/autos/") ||
      (norm.includes("app/lib/clasificados/autos/") &&
        !norm.includes("AUTOS_A5_VDATA_A") &&
        !norm.includes("VDATA_01"))
    );
  });
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
  assert(fs.existsSync(AUDIT_MD), "Gate B audit markdown missing");
  assert(fs.existsSync(HELPER_TS), "autosVehicleData.ts missing");
  assert(fs.existsSync(GATE_A_AUDIT), "Gate A audit missing");
  assertAuditTable();

  const helper = fs.readFileSync(HELPER_TS, "utf8");
  assert(helper.includes("getKnownTrimsForVehicle"), "getKnownTrimsForVehicle missing");
  assert(helper.includes("getKnownEnginesForTrim"), "getKnownEnginesForTrim missing");
  assert(helper.includes("normalizeVehicleMake"), "normalizeVehicleMake missing");
  assert(helper.includes("buildVehicleSearchKeywords"), "buildVehicleSearchKeywords missing");
  assert(helper.includes("No encontramos trims estructurados"), "Trim ES copy in helper");
  assert(helper.includes("We do not have structured trims"), "Trim EN copy in helper");

  const identity = fs.readFileSync(IDENTITY_FIELDS, "utf8");
  assert(identity.includes("autosVehicleData"), "Identity fields must use autosVehicleData");
  assert(identity.includes("getKnownTrimsForVehicle"), "Identity trim lookup wired");
  assert(identity.includes("TRIM_CUSTOM"), "Custom trim fallback");

  const engine = fs.readFileSync(ENGINE_FIELD, "utf8");
  assert(engine.includes("autosVehicleData"), "Engine field must use autosVehicleData");
  assert(engine.includes("getKnownEnginesForTrim"), "Engine lookup wired");
  assert(engine.includes("ENGINE_CUSTOM"), "Custom engine fallback");
  assert(engine.includes("Puedes ajustar estos datos") || engine.includes("autosVehicleSpecAdjustHelper"), "Spec adjust copy");

  const negocios = fs.readFileSync(NEGOCIOS_APP, "utf8");
  assert(negocios.includes("AutosVehicleIdentityFields"), "Negocios identity fields");
  assert(negocios.includes("AutosVehicleEngineField"), "Negocios engine field");
  assert(negocios.includes("useAutosVehicleStructuredSpecFill"), "Negocios spec fill hook");

  const drawer = fs.readFileSync(INVENTORY_DRAWER, "utf8");
  assert(drawer.includes("AutosVehicleIdentityFields"), "Drawer identity fields");
  assert(drawer.includes("AutosVehicleEngineField"), "Drawer engine field");
  assert(drawer.includes("useAutosVehicleStructuredSpecFill"), "Drawer spec fill hook");

  const privado = read(PRIVADO_APP);
  assert(privado.includes("AutosVehicleIdentityFields"), "Privado identity fields");
  assert(!privado.includes("AutosVehicleEngineField"), "Privado must not add engine field");
  for (const s of PRIVADO_DEALER_ONLY_STRINGS) {
    assert(!privado.includes(s), `Dealer-only string in Privado: ${s}`);
  }

  const scoped = gateBScopedChanges();
  for (const f of scoped) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert(!norm.startsWith(prefix), `Forbidden path in Gate B changes: ${f}`);
    }
    if (norm.endsWith(".ts") && norm.includes("scripts/autos-a5-vdata-b")) continue;
    const content = readIfExists(f);
    assert(!/\bEDMUNDS_API_KEY\b/.test(content), `External API key in: ${f}`);
    assert(!/\bCAR_API_KEY\b/.test(content), `External API key in: ${f}`);
  }

  console.log("A5.VDATA-B shared vehicle helper wiring audit: PASS");
  console.log(`Audit rows verified: ${AUDIT_ROWS.length}`);
  console.log(`Gate B scoped files: ${scoped.length}`);
}

main();
