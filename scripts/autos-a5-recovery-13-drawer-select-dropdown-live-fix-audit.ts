/**
 * A5.RECOVERY-13 — Autos Negocios drawer native select dropdown live fix audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_13_DRAWER_SELECT_DROPDOWN_LIVE_FIX_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Live dropdown bug reproduced locally",
  "Actual root cause documented",
  "Drawer Select portal/focus issue fixed",
  "Año dropdown opens without black flash",
  "Año value can be selected",
  "Marca dropdown opens without black flash",
  "Marca value can be selected",
  "Modelo works after Marca",
  "All child selects verified",
  "Dropdowns work mobile/tablet/desktop",
  "Dropdown interaction does not close drawer",
  "Dropdown interaction does not trigger dirty discard",
  "Siguiente works after Step 1 required fields",
  "Full 7-step child flow works after dropdown fix",
  "Step 5 inherited/prefilled appears",
  "Guardar en inventario works",
  "Saved child result card appears",
  "Guardar y agregar otro works",
  "Data-loss protection still works",
  "Parent app dropdowns still work",
  "Privado checked if shared Select components touched",
  "No dealer-only features leaked to Privado",
  "No unrelated categories touched",
  "No global Stripe/payment touched",
  "No schema/migration touched",
  "npm run build passed",
];

const REQUIRED_COPY = [
  "Agregar vehículo al inventario",
  "Guardar en inventario",
  "Guardar y agregar otro",
  "Esta información se toma de la solicitud principal del concesionario",
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
  assert.match(auditText, /Live dropdown proof table/i, "Live dropdown proof table required");
  assert.match(auditText, /## TRUE\/FALSE table/i, "TRUE/FALSE table required");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");

  if (recMatch[1]!.toUpperCase() === "GREEN") {
    const proofSection = auditText.slice(auditText.indexOf("Live dropdown proof table"));
    assert.ok(!proofSection.includes("| FALSE |"), "No FALSE in live proof table when GREEN");
    const gateSection = auditText.slice(auditText.indexOf("## TRUE/FALSE table"));
    assert.ok(!gateSection.includes("| FALSE |"), "No FALSE gate rows when GREEN");

    for (const row of GATE_ROWS) {
      assert.match(
        auditText,
        new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`),
        `Audit row must be TRUE when GREEN: ${row}`,
      );
    }
  }

  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx");
  const selectGuard = read("app/lib/clasificados/autos/autosDrawerNativeSelectInteraction.ts");
  const identity = read("app/(site)/publicar/autos/shared/components/AutosVehicleIdentityFields.tsx");
  const vehicleSteps = read("app/(site)/publicar/autos/negocios/components/AutosNegociosVehicleApplicationSteps.tsx");
  const bundleCopy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  const globals = read("app/globals.css");

  const copyPool = [bundleCopy, drawer, vehicleSteps].join("\n");
  for (const phrase of REQUIRED_COPY) {
    assert.ok(copyPool.includes(phrase), `Required copy missing: ${phrase}`);
  }

  assert.ok(drawer.includes("shouldIgnoreAutosDrawerOutsideInteraction"), "Drawer outside-interaction guard");
  assert.ok(drawer.includes("pointer-events-none"), "Decorative backdrop must not steal clicks");
  assert.ok(drawer.includes("stopPropagation"), "Panel must stop select pointer bubbling");
  assert.ok(!drawer.includes("[open, editingVehicle, inProgressDraft, drawerEditingId]"), "inProgressDraft must not reset drawer on every edit");
  assert.ok(drawer.includes("autos-drawer-scroll"), "Drawer scroll host class");
  assert.ok(selectGuard.includes("autosDrawerNativeSelectProps"), "Shared native select props helper");
  assert.ok(identity.includes("insideModal"), "Identity fields modal guard");
  assert.ok(vehicleSteps.includes("insideModal={isChild}"), "Child vehicle steps use modal select guard");
  assert.ok(globals.includes(".autos-drawer-scroll"), "Drawer scroll CSS");
  assert.ok(
    vehicleSteps.includes("additionalInventoryVehicles") ||
      read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx").includes(
        "additionalInventoryVehicles",
      ),
    "additionalInventoryVehicles still used",
  );
  assert.ok(!privado.includes("Guardar en inventario"), "Privado must not contain inventory save CTA");

  const changed = changedFiles();
  for (const file of changed) {
    const norm = file.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden path modified: ${file}`);
    }
  }

  console.log("A5.RECOVERY-13 drawer select dropdown live fix audit: PASS");
}

run();
