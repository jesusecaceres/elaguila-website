/**
 * A5.RECOVERY-24 — Added inventory media hydration smoke escape audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_24_ADDED_INVENTORY_MEDIA_HYDRATION_SMOKE_ESCAPE_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Autos-only scope respected",
  "Live bug reproduced locally",
  "Browser object shape proof captured before fix",
  "Exact smoke escape/root cause documented",
  "Main media/video pipeline inspected",
  "Child media/video pipeline inspected",
  "Canonical child media shape defined/reused",
  "Child save stores full media/images",
  "Child save stores image URLs",
  "Child save stores media order",
  "Child save stores cover image",
  "Child save stores videoUrls",
  "Step 7 child card reads canonical child media",
  "Step 7 child card does not mutate child media",
  "Child preview reads canonical child media",
  "Child preview reads canonical child videoUrls",
  "Child preview does not write back reduced child object",
  "Child editor hydrate reads canonical child media",
  "Child editor hydrate restores image URLs/thumbnails",
  "Child editor hydrate restores media order",
  "Child editor hydrate restores cover image where supported",
  "Child editor hydrate restores videoUrls",
  "Default empty media state does not overwrite hydrated child media",
  "Active draft stores child media/images",
  "Active draft stores child videoUrls",
  "Refresh restores child card media",
  "Refresh restores child editor media",
  "Refresh restores child videoUrls",
  "Sibling children are preserved",
  "Parent media/video behavior not regressed",
  "Volver a editar preserves child media/video",
  "Preview/back paths do not clear/reset media",
  "Temporary debug logs removed or dev-guarded",
  "Local file limitation documented honestly",
  "Privado checked if shared helpers touched",
  "No dealer-only features leaked to Privado",
  "No unrelated categories touched",
  "No global Stripe/payment touched",
  "No schema/migration touched",
  "npm run build passed",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
  "app/(site)/publicar/bienes-raices/",
  "app/admin/",
];

const GATE_MARKERS = [
  "AUTOS_A5_RECOVERY_24",
  "autos-a5-recovery-24",
  "resolveCanonicalChildInventoryEditorDraft",
  "reconcileInProgressInventoryWithSavedChildren",
  "AutosNegociosAddInventoryDrawer",
];

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
    return GATE_MARKERS.some((m) => norm.includes(m)) || norm.includes("autosAdditionalInventoryDraft.ts") || norm === "package.json";
  });
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "R24 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");
  assert.match(auditText, /Browser object shape proof before fix/i, "Before-fix object proof required");
  assert.match(auditText, /Browser object shape proof after fix/i, "After-fix object proof required");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");
  const recommendation = recMatch![1]!.toUpperCase();

  for (const row of GATE_ROWS) {
    const line = auditText.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing gate row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
    }
  }

  const additional = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");
  assert.ok(additional.includes("resolveCanonicalChildInventoryEditorDraft"), "Canonical editor resolver");
  assert.ok(additional.includes("reconcileInProgressInventoryWithSavedChildren"), "Session reconcile");
  assert.ok(additional.includes("inProgressChildMediaIsStaleVsSaved"), "Stale media detector");
  assert.ok(additional.includes("hydrateChildInventoryEditorDraft"), "Editor hydrate helper");

  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx");
  assert.ok(drawer.includes("resolveCanonicalChildInventoryEditorDraft"), "Drawer uses canonical resolver");
  const persistBlock = drawer.slice(drawer.indexOf("const persist"));
  const clearIdx = persistBlock.indexOf("onInProgressChange?.(null)");
  const flushIdx = persistBlock.indexOf("flushDraft");
  assert.ok(clearIdx >= 0 && flushIdx > clearIdx, "Clear inProgress before flush on save");

  const hook = read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts");
  assert.ok(hook.includes("reconcileInProgressInventoryWithSavedChildren"), "Hook reconciles inProgress on hydrate");
  assert.ok(hook.includes("hydrateChildInventoryEditorDraft"), "Hook hydrates saved children");

  const preview = read("app/lib/clasificados/autos/autosInventoryInheritedPreview.ts");
  assert.ok(preview.includes("inventoryVehicleDraftToListingSlice"), "Preview uses child draft slice");
  assert.ok(preview.includes("inventoryVehicleCoverUrl"), "Card uses child cover helper");

  const bundle = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx");
  assert.ok(bundle.includes("rehydrateFromStorage"), "Preview back rehydrates");
  assert.ok(!bundle.includes("clearAutosNegociosDraft"), "Preview/back must not clear draft");

  const gateSources = [drawer, hook, additional, preview, bundle].join("\n");
  assert.ok(!gateSources.match(/console\.(log|debug|info)\(/), "No unguarded production debug logs in gate files");

  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(!privado.includes("additionalInventoryVehicles"), "Privado clean");

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    if (norm === "package.json") continue;
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden prefix: ${norm}`);
    }
  }

  console.log("A5.RECOVERY-24 added inventory media hydration smoke escape audit: PASS");
  console.log(`Final recommendation: ${recommendation}`);
}

run();
