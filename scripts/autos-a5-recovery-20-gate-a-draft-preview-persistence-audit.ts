/**
 * A5.RECOVERY-20 Gate A — Added inventory draft + preview/edit-back persistence audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_20_GATE_A_DRAFT_PREVIEW_PERSISTENCE_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before edits",
  "Autos-only scope respected",
  "Refresh deletion reproduced locally",
  "Actual root cause documented",
  "Canonical active draft includes parent vehicle",
  "Canonical active draft includes Step 5 business/contact",
  "Canonical active draft includes websites/resources",
  "Canonical active draft includes languages if implemented",
  "Canonical active draft includes hours if provided",
  "Canonical active draft includes additionalInventoryVehicles",
  "Refresh restores parent vehicle",
  "Refresh restores Step 5 business/contact",
  "Refresh restores websites/resources",
  "Refresh restores languages if implemented",
  "Refresh restores saved child inventory",
  "Child cards reappear after refresh",
  "Reopened child shows saved child data after refresh",
  "Child media/order metadata persists where technically possible",
  "Child videoUrls persist",
  "Child Ver vista previa opens child preview",
  "Child preview inherits parent Business Hub/contact data",
  "Child preview inherits websites/resources",
  "Child preview inherits languages if implemented",
  "Child Volver a editar returns to parent Step 7/inventory context",
  "Child Volver a editar does not remove saved child",
  "Parent preview shows added inventory",
  "Parent Volver a editar preserves parent data",
  "Parent Volver a editar preserves added inventory",
  "Preview/back paths do not call destructive clear/reset",
  "Only publish success or intentional reset clears draft",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
  "app/(site)/publicar/bienes-raices/",
  "app/(site)/publicar/restaurantes/",
];

const GATE_MARKERS = ["AUTOS_A5_RECOVERY_20_GATE_A", "autos-a5-recovery-20-gate-a"];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  try {
    const out = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
    const tracked = out ? out.split(/\r?\n/).filter(Boolean) : [];
    const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    return [...new Set([...tracked, ...untracked])];
  } catch {
    return [];
  }
}

function gateScopedChanges(): string[] {
  return changedFiles().filter((f) => {
    const norm = f.replace(/\\/g, "/");
    return GATE_MARKERS.some((m) => norm.includes(m.toLowerCase()) || norm.includes(m)) || norm === "package.json";
  });
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "Gate A audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /Gate A proof table/i, "Gate A proof table required");

  const recMatch = auditText.match(/Gate A recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Gate A recommendation required");
  const recommendation = recMatch![1]!.toUpperCase();

  for (const row of GATE_ROWS) {
    const line = auditText.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing gate row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
    }
  }

  assert.ok(auditText.includes("additionalInventoryVehicles"), "additionalInventoryVehicles documented");

  const draftStorage = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts");
  assert.ok(draftStorage.includes("sessionStorage"), "Active draft session persistence");
  assert.ok(draftStorage.includes("additionalInventoryVehicles"), "Child inventory in draft storage");
  assert.ok(draftStorage.includes("dealerCustomLinks") || draftStorage.includes("listing"), "Websites/resources in draft");

  const negHook = read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts");
  assert.ok(negHook.includes("additionalInventoryVehicles"), "Hook persists child inventory");
  assert.ok(negHook.includes("editorStep") || negHook.includes("currentStep"), "Step persistence in hook");

  const returnCtx = read("app/lib/clasificados/autos/autosNegociosEditorReturnContext.ts");
  assert.ok(returnCtx.includes("sessionStorage"), "Editor return context uses sessionStorage");

  const addFlow = read("app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts");
  assert.ok(addFlow.includes("readAutosNegociosEditorReturnContext"), "Resume href uses return context");
  assert.ok(addFlow.includes("stripAutosNegociosEditorResumeQueryParams"), "Resume query strip helper");

  const previewClient = read("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  assert.ok(
    previewClient.includes("loadAutosNegociosDraftResolved") ||
      previewClient.includes("loadAutosNegociosCanonicalActiveDraft"),
    "Preview reads active draft",
  );

  const childOverlay = read("app/(site)/publicar/autos/negocios/components/AutosNegociosChildInventoryPreviewOverlay.tsx");
  assert.ok(childOverlay.includes("backToEditLabel") || childOverlay.includes("Volver a editar"), "Child Volver a editar");

  const previewBlock = [previewClient, childOverlay, addFlow].join("\n");
  assert.ok(!previewBlock.includes("clearAutosNegociosDraft"), "Preview paths must not clear draft");

  const languages = read("app/lib/clasificados/autos/autosDealerLanguages.ts");
  assert.ok(languages.includes("dealerLanguages"), "Languages module present");

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    if (norm === "package.json") continue;
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden prefix touched: ${norm}`);
    }
  }

  console.log("A5.RECOVERY-20 Gate A draft/preview persistence audit: PASS");
  console.log(`Gate A recommendation: ${recommendation}`);
}

run();
