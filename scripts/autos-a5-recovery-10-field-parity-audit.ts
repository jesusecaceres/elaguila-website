/**
 * A5.RECOVERY-10 — Autos Negocios added inventory field parity audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_10_FIELD_PARITY_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos-only scope respected",
  "Broken mini drawer root cause documented",
  "Added inventory uses same application field logic as main",
  "Added inventory uses same UX/UI step flow as main",
  "Child Step 1 rendered and works",
  "Child Step 2 rendered and works",
  "Child Step 3 rendered and works",
  "Child Step 4 rendered and works",
  "Child Step 5 rendered with inherited parent data",
  "Child Step 6 rendered and works",
  "Child Step 7 rendered and works",
  "Child final CTA is Save to Inventory, not Publish",
  "Save to inventory creates/updates child draft",
  "Save to inventory shows child result card",
  "Save and add another keeps saved child and starts new child",
  "Parent data is never wiped",
  "No fake child Leonix ID before publish",
  "No fake child public URL before publish",
  "Child full preview works",
  "Child Step 5 inherits dealer data from parent",
  "Child Step 5 does not corrupt parent data",
  "Child year dropdown works",
  "Child make dropdown works",
  "Child model dropdown works",
  "Child trim/manual trim works",
  "Child VIN/VIN decode works if main supports it",
  "Child media works",
  "Child media reorder works",
  "Desktop child modal is large enough",
  "Mobile child modal works",
  "Native confirm removed",
  "Leonix unsaved changes modal works",
  "Outside click cannot silently lose child data",
  "Escape/cancel cannot silently lose child data",
  "Field-by-field parity matrix completed",
  "No required field has unresolved FALSE",
  "Image reorder persists",
  "Custom city persists and feeds search normalization",
  "Dealership links section clearly labeled",
  "Custom dealership links fixed and limited to 2",
  "Hours AM/PM UX fixed",
  "Privado checked if shared helpers touched",
  "No dealer-only features leaked to Privado",
  "No unrelated categories touched",
  "No Stripe/payment touched",
  "No schema/migration touched",
  "npm run build passed",
];

const REQUIRED_COPY = [
  "Guardar en inventario",
  "Guardar y agregar otro",
  "ID Leonix se generará al publicar",
  "Esta información se toma de la solicitud principal del concesionario",
  "Editar en solicitud principal",
  "Cambios sin guardar",
  "Seguir editando",
  "Cerrar sin guardar",
  "Contactos y enlaces del concesionario",
  "Websites y recursos del concesionario",
  "Añadir website",
  "Añadir horario especial",
];

const PRIVADO_FORBIDDEN = [
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
  assert.match(auditText, /Field-by-field parity matrix/i, "Field parity matrix required");
  assert.match(auditText, /## TRUE\/FALSE table/i, "TRUE/FALSE table required");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");

  if (recMatch[1]!.toUpperCase() === "GREEN") {
    const tableSection = auditText.slice(auditText.indexOf("## TRUE/FALSE table"));
    assert.ok(!tableSection.includes("| FALSE |"), "No FALSE rows when GREEN");
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
  const inheritedStep = read("app/(site)/publicar/autos/negocios/components/AutosInventoryInheritedDealerStep.tsx");
  const bundleCopy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  const negociosCopy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  const customLinks = read("app/lib/clasificados/autos/autosDealerCustomLinks.ts");
  const mediaManager = read("app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx");
  const draftDefaults = read("app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");

  const copyPool = [bundleCopy, negociosCopy, drawer, inheritedStep, childApp].join("\n");
  for (const phrase of REQUIRED_COPY) {
    assert.ok(copyPool.includes(phrase), `Required copy missing: ${phrase}`);
  }

  assert.ok(drawer.includes("AutosNegociosInventoryChildApplication"), "Child must use stepped application");
  assert.ok(drawer.includes("AutosUnsavedChangesModal"), "Leonix unsaved modal required");
  assert.ok(!drawer.includes("window.confirm"), "No native confirm in child close path");
  assert.ok(drawer.includes("max-w-[min(1120px"), "Desktop modal width 1120px");
  assert.ok(
    childApp.includes("AutosApplicationSteppedShell") || childApp.includes("AutosInventoryChildSteppedShell"),
    "Stepped shell required",
  );
  assert.ok(inheritedStep.includes("autosInventoryChildStep5Intro"), "Step 5 inheritance copy");
  assert.ok(customLinks.includes("MAX_CUSTOM_LINKS = 2"), "Custom links max 2");
  assert.ok(read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx").includes("AutosDealerHoursEditor"));
  assert.ok(mediaManager.includes("reindex") || mediaManager.includes("commitImages"), "Media reorder persistence");
  assert.ok(draftDefaults.includes("return leadingTrimmed"), "Custom city preserved in draft normalize");

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

  console.log("A5.RECOVERY-10 field parity audit: PASS");
}

run();
