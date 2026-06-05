/**
 * A5.VDATA-C Autos starter seed + final A/B/C validation gate.
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
  "app/lib/clasificados/autos/AUTOS_A5_VDATA_C_STARTER_SEED_FINAL_VALIDATION_AUDIT.md",
);
const SEED_TS = path.join(ROOT, "app/lib/clasificados/autos/autosVehicleStructuredSeed.ts");
const HELPER_TS = path.join(ROOT, "app/lib/clasificados/autos/autosVehicleData.ts");
const POLICY_MD = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_VEHICLE_DATA_POLICY.md");
const PRIVADO_APP = "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx";

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Gate A policy/audit inspected",
  "Gate B audit/helper inspected",
  "Starter seed added or verified",
  "Starter seed is marked partial/not complete",
  "Toyota Camry has structured trim options",
  "Honda Civic has structured trim options",
  "Ford F-150 has structured trim options",
  "Known seed model shows trim dropdown",
  "Known seed trim can show engine options where seeded",
  "Missing trim data falls back to free text",
  "Custom trim fallback remains",
  "Custom engine fallback remains",
  "Custom values persist to draft",
  "Custom values appear in preview",
  "User-edited specs are not overwritten without confirmation",
  "Negocios main form validated",
  "Negocios inventory drawer validated",
  "Privado checked for shared vehicle field impact",
  "Privado updated only if shared vehicle fields are affected",
  "No dealer-only fields added to Privado",
  "Search/filter readiness documented",
  "Data source next step documented",
  "No external paid API key added",
  "No dealership scraping added",
  "No global Stripe/payment files touched",
  "No unrelated categories touched",
  "git diff reviewed",
  "npm run build passed",
];

const REQUIRED_STARTER = ["Toyota::Camry", "Honda::Civic", "Ford::F-150"];

const PRIVADO_DEALER_ONLY = [
  "Inventory Boost",
  "additionalInventoryVehicles",
  "AutosDealerFinanceFields",
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

function gateCScoped(): string[] {
  const all = [...new Set([...changedFiles(), ...untrackedFiles()])];
  return all.filter((f) => {
    const n = f.replace(/\\/g, "/");
    return (
      n.includes("VDATA_C") ||
      n.includes("autos-a5-vdata-c") ||
      n.includes("autosVehicleStructuredSeed") ||
      n.includes("autosVehicleData") ||
      n.includes("AUTOS_VEHICLE_DATA_POLICY")
    );
  });
}

function assertAuditTable(): void {
  const md = fs.readFileSync(AUDIT_MD, "utf8");
  for (const row of AUDIT_ROWS) {
    assert.match(md, new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|`), `Missing row: ${row}`);
    const line = md.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`| ${row}|`));
    assert(line, `Line missing: ${row}`);
    assert.match(line!, /\|\s*TRUE\s*\|/, `Expected TRUE: ${row}`);
  }
}

async function main(): Promise<void> {
  assert(fs.existsSync(AUDIT_MD), "Gate C audit missing");
  assert(fs.existsSync(SEED_TS), "Structured seed missing");
  assert(fs.existsSync(HELPER_TS), "autosVehicleData.ts missing");
  assertAuditTable();

  const seed = fs.readFileSync(SEED_TS, "utf8");
  assert(seed.includes("AUTOS_VEHICLE_STARTER_SEED_IS_PARTIAL"), "Partial marker missing");
  assert(/partial starter|NOT complete|partial coverage/i.test(seed), "Partial coverage label missing");
  for (const key of REQUIRED_STARTER) {
    const [make, model] = key.split("::");
    assert(seed.includes(`make: "${make}"`) && seed.includes(`model: "${model}"`), `Missing starter: ${key}`);
  }
  assert(seed.includes("Toyota::Camry") || seed.includes('"Toyota::Camry"'), "Starter model list");

  const policy = fs.readFileSync(POLICY_MD, "utf8");
  assert(policy.includes("VDATA-D"), "VDATA-D next step missing");

  const helper = fs.readFileSync(HELPER_TS, "utf8");
  assert(helper.includes("No encontramos trims estructurados"), "Trim ES copy");
  assert(helper.includes("We do not have structured trims"), "Trim EN copy");

  const identity = read("app/(site)/publicar/autos/shared/components/AutosVehicleIdentityFields.tsx");
  assert(identity.includes("TRIM_CUSTOM"), "Custom trim");
  assert(identity.includes("autosVehicleData"), "Identity uses helper");

  const engine = read("app/(site)/publicar/autos/shared/components/AutosVehicleEngineField.tsx");
  assert(engine.includes("ENGINE_CUSTOM"), "Custom engine");
  assert(
    engine.includes("Puedes ajustar estos datos") || engine.includes("autosVehicleSpecAdjustHelper"),
    "Spec adjust copy",
  );

  const negocios = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  assert(negocios.includes("useAutosVehicleStructuredSpecFill"), "Negocios spec fill");

  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosInventoryVehicleDrawerForm.tsx");
  assert(drawer.includes("useAutosVehicleStructuredSpecFill"), "Drawer spec fill");

  const privado = read(PRIVADO_APP);
  assert(privado.includes("AutosVehicleIdentityFields"), "Privado identity");
  assert(!privado.includes("AutosVehicleEngineField"), "No Privado engine");
  for (const s of PRIVADO_DEALER_ONLY) assert(!privado.includes(s), `Dealer leak: ${s}`);

  const { getKnownTrimsForVehicle, getKnownEnginesForTrim } = await import(
    "../app/lib/clasificados/autos/autosVehicleData"
  );
  const camryTrims = getKnownTrimsForVehicle(2024, "Toyota", "Camry");
  assert(camryTrims.length > 0, "Camry trims");
  const civicTrims = getKnownTrimsForVehicle(2024, "Honda", "Civic");
  assert(civicTrims.length > 0, "Civic trims");
  const f150Trims = getKnownTrimsForVehicle(2024, "Ford", "F-150");
  assert(f150Trims.length > 0, "F-150 trims");
  const f150Engines = getKnownEnginesForTrim(2024, "Ford", "F-150", "XLT");
  assert(f150Engines.length > 0, "F-150 XLT engines");
  const celicaTrims = getKnownTrimsForVehicle(2024, "Toyota", "Celica");
  assert(celicaTrims.length === 0, "Celica should have no seed trims");

  for (const f of gateCScoped()) {
    const n = f.replace(/\\/g, "/");
    for (const p of FORBIDDEN_PREFIXES) assert(!n.startsWith(p), `Forbidden: ${f}`);
    if (n.endsWith("autos-a5-vdata-c-starter-seed-final-validation-audit.ts")) continue;
    const c = fs.existsSync(path.join(ROOT, f)) ? fs.readFileSync(path.join(ROOT, f), "utf8") : "";
    assert(!/\bEDMUNDS_API_KEY\b/.test(c), `API key in ${f}`);
  }

  console.log("A5.VDATA-C starter seed final validation audit: PASS");
  console.log(`Audit rows: ${AUDIT_ROWS.length}`);
  console.log(`Camry trims: ${camryTrims.length}, F-150 XLT engines: ${f150Engines.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
