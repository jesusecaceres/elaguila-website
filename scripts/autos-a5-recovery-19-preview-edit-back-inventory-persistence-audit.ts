/**
 * A5.RECOVERY-19 — Autos Preview/Edit-Back Added Inventory Persistence Gate audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_19_PREVIEW_EDIT_BACK_INVENTORY_PERSISTENCE_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Autos-only scope respected",
  "Preview/edit-back failure reproduced locally",
  "Actual root cause documented",
  "Canonical active draft includes parent vehicle data",
  "Canonical active draft includes Step 5 data",
  "Canonical active draft includes websites/resources",
  "Canonical active draft includes languages if implemented",
  "Canonical active draft includes hours",
  "Canonical active draft includes added inventory children",
  "Parent preview reads from active draft",
  "Parent preview shows added inventory vehicles",
  "Parent preview shows Business Hub data",
  "Parent preview shows languages if selected",
  "Child preview reads saved child data",
  "Child preview inherits parent Business Hub data",
  "Child preview inherits languages if selected",
  "Child preview has Volver a editar",
  "Parent Volver a editar preserves parent data",
  "Parent Volver a editar preserves Step 5 data",
  "Parent Volver a editar preserves added inventory",
  "Parent Volver a editar returns to Paso 7 or safe context",
  "Child Volver a editar preserves saved child",
  "Child Volver a editar preserves all added inventory",
  "Preview/back does not call destructive clear/reset",
  "Refresh after preview preserves draft",
  "Successful publish can still clear draft",
  "Intentional reset can still clear draft",
  "No unrelated categories touched",
  "No global Stripe/payment touched",
  "No schema/migration touched",
  "npm run build passed",
];

const PROOF_ROWS = [
  "Parent preview | Reads parent vehicle from active draft",
  "Parent preview | Reads Step 5 dealer/contact data from active draft",
  "Parent preview | Shows websites/resources when valid",
  "Parent preview | Shows languages chips if selected",
  "Parent preview | Shows hours if provided",
  "Parent preview | Shows saved added inventory vehicles",
  "Parent preview | Does not create fake IDs/URLs before publish",
  "Parent Volver a editar | Returns to publish route without clearing draft",
  "Parent Volver a editar | Restores parent vehicle fields",
  "Parent Volver a editar | Restores Step 5 data",
  "Parent Volver a editar | Restores websites/resources",
  "Parent Volver a editar | Restores languages if selected",
  "Parent Volver a editar | Restores saved child inventory cards",
  "Parent Volver a editar | Returns to Paso 7 or safe review context",
  "Child preview | Opens from saved child card",
  "Child preview | Reads child vehicle data from saved child draft",
  "Child preview | Inherits parent Step 5 dealer/contact data",
  "Child preview | Inherits parent websites/resources",
  "Child preview | Inherits parent languages if selected",
  "Child preview | Preserves child media/order/cover",
  "Child preview | Has visible Volver a editar",
  "Child Volver a editar | Returns to parent Paso 7/inventory context",
  "Child Volver a editar | Does not remove saved child",
  "Child Volver a editar | Does not remove other added vehicles",
  "Refresh after preview | Preserves parent draft",
  "Refresh after preview | Preserves saved child inventory",
  "Data-loss guard | Preview paths do not call destructive clear/reset",
  "Data-loss guard | Only publish success/intentional reset clears draft",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
  "app/(site)/publicar/bienes-raices/",
  "app/(site)/publicar/restaurantes/",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const out = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).trim();
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" }).trim();
  return [...out.split("\n").filter(Boolean), ...untracked.split("\n").filter(Boolean)];
}

function isAllowedPath(p: string): boolean {
  if (p === "package.json") return true;
  return (
    p.startsWith("app/(site)/clasificados/autos/") ||
    p.startsWith("app/(site)/publicar/autos/") ||
    p.startsWith("app/lib/clasificados/autos/") ||
    p.startsWith("scripts/autos-a5-recovery-19") ||
    p.startsWith("scripts/autos-a5-recovery-18")
  );
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "Audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /Preview\/edit-back proof table/i, "Preview/edit-back proof table required");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");

  for (const row of PROOF_ROWS) {
    assert.ok(auditText.includes(row.split("|")[0]?.trim() ?? row), `Missing proof row: ${row}`);
  }

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");
  const recommendation = recMatch![1]!.toUpperCase();

  for (const row of GATE_ROWS) {
    const line = auditText
      .split("\n")
      .find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing gate row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
    }
  }

  assert.ok(auditText.includes("Volver a editar"), "Volver a editar copy required");
  assert.ok(auditText.includes("Ver vista previa") || auditText.includes("Vista previa"), "Preview CTA copy required");
  assert.ok(auditText.includes("additionalInventoryVehicles"), "additionalInventoryVehicles documented");

  const returnCtx = read("app/lib/clasificados/autos/autosNegociosEditorReturnContext.ts");
  assert.ok(returnCtx.includes("sessionStorage"), "Editor return context uses sessionStorage");

  const addFlow = read("app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts");
  assert.ok(addFlow.includes("readAutosNegociosEditorReturnContext"), "Resume href uses return context");
  assert.ok(addFlow.includes("stripAutosNegociosEditorResumeQueryParams"), "Resume query strip helper");
  assert.ok(!addFlow.includes("readInventoryAddContextFromSession();\n  const p = new URLSearchParams"), "Resume must not use stale session alone");

  const previewClient = read("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  assert.ok(previewClient.includes("loadAutosNegociosDraftResolved"), "Preview reads active draft");
  assert.ok(previewClient.includes("additionalInventoryVehicles"), "Preview loads child inventory");

  const childOverlay = read("app/(site)/publicar/autos/negocios/components/AutosNegociosChildInventoryPreviewOverlay.tsx");
  assert.ok(childOverlay.includes("backToEditLabel"), "Child overlay Volver a editar");
  assert.ok(childOverlay.includes("mapInheritedDealerPreviewListing"), "Child inherits parent dealer data");

  const bundlePreview = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx");
  assert.ok(bundlePreview.includes("writeAutosNegociosEditorReturnContext"), "Child preview writes return context");
  assert.ok(bundlePreview.includes("flushDraft"), "Child preview flushes draft before open");

  const app = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  assert.ok(app.includes("writeAutosNegociosEditorReturnContext"), "Parent preview writes return context");
  assert.ok(app.includes("stripAutosNegociosEditorResumeQueryParams"), "Resume strips spurious inventory params");

  const negHook = read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts");
  assert.ok(negHook.includes("additionalInventoryVehicles"), "Hook persists child inventory");
  const resetBlock = negHook.slice(negHook.indexOf("const resetDraft"), negHook.indexOf("const flushDraft"));
  assert.ok(resetBlock.includes("clearAutosNegociosDraft"), "reset clears draft");
  assert.ok(resetBlock.includes("clearAutosNegociosEditorReturnContext"), "reset clears return context");

  const previewBlock = [
    previewClient,
    childOverlay,
    bundlePreview,
    app,
    addFlow,
  ].join("\n");
  assert.ok(!previewBlock.includes("clearAutosNegociosDraft"), "Preview paths must not clear draft");

  const draftStorage = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts");
  assert.ok(draftStorage.includes("sessionStorage"), "Active draft session persistence");
  assert.ok(draftStorage.includes("dealerCustomLinks") || draftStorage.includes("listing"), "Websites/resources in draft");

  const languages = read("app/lib/clasificados/autos/autosDealerLanguages.ts");
  assert.ok(languages.includes("dealerLanguages"), "Languages module present");

  for (const f of changedFiles()) {
    const norm = f.replace(/\\/g, "/");
    if (!isAllowedPath(norm)) {
      throw new Error(`Out-of-scope file changed: ${norm}`);
    }
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden prefix touched: ${norm}`);
    }
  }

  console.log("A5.RECOVERY-19 preview/edit-back inventory persistence audit: PASS");
  console.log(`Final recommendation: ${recommendation}`);
}

run();
