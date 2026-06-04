/**
 * A5.VDATA-A Autos shared vehicle data audit + lane impact policy gate (audit-only).
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_A5_VDATA_A_SHARED_VEHICLE_DATA_AUDIT.md");
const POLICY_MD = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_VEHICLE_DATA_POLICY.md");
const PRIVADO_APP = "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx";

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Current Autos vehicle data inspected",
  "Current trim dropdown behavior inspected",
  "Current engine field behavior inspected",
  "Negocios main vehicle fields inspected",
  "Negocios inventory drawer vehicle fields inspected",
  "Privado vehicle fields inspected",
  "Shared Autos helpers inspected",
  "Vehicle data policy created",
  "Normalized data shape documented",
  "Free-text fallback policy documented",
  "Search/filter readiness documented",
  "Data source recommendation documented",
  "Privado lane impact documented",
  "No dealer-only fields added to Privado",
  "No external paid API key added",
  "No dealership scraping added",
  "No unrelated categories touched",
  "No global Stripe/payment files touched",
  "git diff reviewed",
];

const GATE_A_MARKERS = [
  "AUTOS_A5_VDATA_A_SHARED",
  "autos-a5-vdata-a-shared",
  "AUTOS_VEHICLE_DATA_POLICY.md",
];

const PRIVADO_DEALER_ONLY_STRINGS = [
  "Inventory Boost",
  "additionalInventoryVehicles",
  "AutosNegociosInventoryBoostPanel",
  "AutosDealerFinanceFields",
  "DealerBusinessStack",
  "financeContactImage",
  "AutosNegociosAddInventoryDrawer",
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

function gateAScopedChanges(): string[] {
  const all = [...new Set([...changedFiles(), ...untrackedFiles()])];
  return all.filter((f) => {
    const norm = f.replace(/\\/g, "/");
    return (
      GATE_A_MARKERS.some((m) => norm.includes(m)) ||
      norm.endsWith("scripts/autos-a5-vdata-a-shared-vehicle-data-audit.ts") ||
      (norm === "package.json" && readIfExists("package.json").includes("autos:a5-vdata-a"))
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
  assert(fs.existsSync(AUDIT_MD), "Gate A audit markdown missing");
  assert(fs.existsSync(POLICY_MD), "Vehicle data policy missing");
  assertAuditTable();

  const policy = read("app/lib/clasificados/autos/AUTOS_VEHICLE_DATA_POLICY.md");
  assert(/free-text fallback must always remain/i.test(policy), "Free-text fallback policy missing");
  assert(policy.includes("NHTSA vPIC"), "NHTSA source note missing");
  assert(policy.includes("VehicleYearMakeModelData"), "Normalized shape missing");
  assert(policy.includes("No encontramos trims estructurados"), "Gate B trim ES copy planned");
  assert(policy.includes("We do not have structured trims"), "Gate B trim EN copy planned");
  assert(policy.includes("normalizedMake"), "Search normalize fields documented");

  const audit = read("app/lib/clasificados/autos/AUTOS_A5_VDATA_A_SHARED_VEHICLE_DATA_AUDIT.md");
  assert(audit.includes("Gate B"), "Gate B recommendation missing");
  assert(audit.includes("Gate C"), "Gate C recommendation missing");
  assert(audit.includes("AutosNegociosApplication"), "Negocios main inspected");
  assert(audit.includes("AutosInventoryVehicleDrawerForm"), "Inventory drawer inspected");
  assert(audit.includes("AutosPrivadoApplication"), "Privado inspected");

  const privado = read(PRIVADO_APP);
  for (const s of PRIVADO_DEALER_ONLY_STRINGS) {
    assert(!privado.includes(s), `Dealer-only string in Privado: ${s}`);
  }

  const scoped = gateAScopedChanges();
  for (const f of scoped) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert(!norm.startsWith(prefix), `Forbidden path in Gate A changes: ${f}`);
    }
    assert(!norm.includes("api/stripe"), "Stripe touched in Gate A scope");
    if (norm.endsWith(".ts") && norm.includes("scripts/autos-a5-vdata-a")) continue;
    const content = readIfExists(f);
    assert(!/\bEDMUNDS_API_KEY\b/.test(content), "External API key in Gate A file");
    assert(!/\bCAR_API_KEY\b/.test(content), "External API key in Gate A file");
    assert(!/cheerio|puppeteer|playwright.*dealer/i.test(content), "Scraping code in Gate A file");
  }

  console.log("A5.VDATA-A shared vehicle data audit: PASS");
  console.log(`Audit rows verified: ${AUDIT_ROWS.length}`);
  console.log(`Gate A scoped files: ${scoped.length}`);
}

main();
