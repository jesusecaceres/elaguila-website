/**
 * A5.RECOVERY-11 — Autos Negocios drawer uses original application UX/UI audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_11_DRAWER_USES_ORIGINAL_APP_UX_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos-only scope respected",
  "Original main Autos Negocios UX/UI source identified",
  "Broken drawer root cause documented",
  "Drawer no longer uses weaker mini-form logic",
  "Drawer uses original app step components or shared extracted equivalent",
  "Child has same 7-step flow as main Autos Negocios app",
  "Child Step 1 works",
  "Child Step 2 works",
  "Child Step 3 works",
  "Child Step 4 works",
  "Child Step 5 inherited/prefilled works",
  "Child Step 6 works",
  "Child Step 7 works",
  "Step 5 parent dealer data is visible in child",
  "Step 5 child view does not corrupt parent data",
  "Guardar en inventario saves child",
  "Saved child result card appears",
  "Guardar y agregar otro saves current child and opens fresh child",
  "Parent app is never wiped",
  "Outside click cannot silently lose child data",
  "Escape/cancel cannot silently lose child data",
  "Native window.confirm removed from child close path",
  "Desktop drawer/sheet is large enough",
  "Mobile drawer/sheet is usable",
  "Required 12-step verification table completed",
  "Field-by-field child matrix completed",
  "No required child field remains FALSE",
  "Privado checked if shared helpers touched",
  "No dealer-only features leaked to Privado",
  "No unrelated categories touched",
  "No global Stripe/payment touched",
  "No schema/migration touched",
  "npm run build passed",
];

const REQUIRED_COPY = [
  "Guardar en inventario",
  "Guardar y agregar otro",
  "Esta información se toma de la solicitud principal del concesionario",
  "ID Leonix se generará al publicar",
  "Cambios sin guardar",
  "Seguir editando",
  "Cerrar sin guardar",
];

const PRIVADO_FORBIDDEN = [
  "Inventory Boost",
  "Agregar vehículo al inventario",
  "Guardar en inventario",
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
  assert.match(auditText, /Required 12-step verification table/i, "12-step verification table required");
  assert.match(auditText, /Field-by-field TRUE\/FALSE matrix/i, "Field-by-field matrix required");
  assert.match(auditText, /## TRUE\/FALSE table/i, "TRUE/FALSE table required");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");

  if (recMatch[1]!.toUpperCase() === "GREEN") {
    const tableSection = auditText.slice(auditText.indexOf("## TRUE/FALSE table"));
    assert.ok(!tableSection.includes("| FALSE |"), "No FALSE rows when GREEN");
    const verifySection = auditText.slice(auditText.indexOf("Required 12-step verification table"));
    assert.ok(!verifySection.includes("| FALSE |"), "No FALSE in 12-step table when GREEN");
  }

  for (const row of GATE_ROWS) {
    assert.match(
      auditText,
      new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`),
      `Audit row must be TRUE: ${row}`,
    );
  }

  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx");
  const childApp = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryChildApplication.tsx");
  const mainApp = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  const sharedSteps = read("app/(site)/publicar/autos/negocios/components/AutosNegociosVehicleApplicationSteps.tsx");
  const drawerForm = read("app/(site)/publicar/autos/negocios/components/AutosInventoryVehicleDrawerForm.tsx");
  const inheritedStep = read("app/(site)/publicar/autos/negocios/components/AutosInventoryInheritedDealerStep.tsx");
  const bundleCopy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");

  const copyPool = [bundleCopy, drawer, inheritedStep, childApp, sharedSteps].join("\n");
  for (const phrase of REQUIRED_COPY) {
    assert.ok(copyPool.includes(phrase), `Required copy missing: ${phrase}`);
  }

  assert.ok(mainApp.includes("AutosNegociosVehicleApplicationSteps"), "Main app must use shared vehicle steps");
  assert.ok(mainApp.includes('mode="main-negocios"'), "Main mode required");
  assert.ok(childApp.includes("AutosNegociosVehicleApplicationSteps"), "Child must use shared vehicle steps");
  assert.ok(childApp.includes('mode="inventory-child"'), "Child mode required");
  assert.ok(childApp.includes("AutosApplicationSteppedShell"), "Child must use main application stepped shell");
  assert.ok(childApp.includes('variant="embedded"'), "Embedded shell variant for drawer");
  assert.ok(drawerForm.includes("AutosNegociosVehicleApplicationSteps"), "Drawer form delegates to shared steps");
  assert.ok(sharedSteps.includes("AutosVehicleIdentityFields"), "Shared steps use main identity fields");
  assert.ok(sharedSteps.includes("AutosVinDecodeBlock"), "Shared steps use VIN decode");
  assert.ok(sharedSteps.includes("AutosNegociosMediaManager"), "Shared steps use main media manager");
  assert.ok(drawer.includes("AutosUnsavedChangesModal"), "Leonix unsaved modal required");
  assert.ok(!drawer.includes("window.confirm"), "No native confirm in child close path");
  assert.ok(drawer.includes("max-w-[min(1120px"), "Desktop modal width 1120px");
  assert.ok(drawer.includes("additionalInventoryVehicles") || mainApp.includes("additionalInventoryVehicles"), "additionalInventoryVehicles still used");
  assert.ok(inheritedStep.includes("autosInventoryChildStep5Intro"), "Step 5 inheritance copy");

  for (const phrase of PRIVADO_FORBIDDEN) {
    assert.ok(!privado.includes(phrase), `Privado must not contain: ${phrase}`);
  }

  const changed = changedFiles();
  for (const file of changed) {
    const norm = file.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden path modified: ${file}`);
    }
  }

  console.log("A5.RECOVERY-11 drawer uses original app UX audit: PASS");
}

run();
