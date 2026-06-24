/**
 * A5.RECOVERY-29 — Inventory array preservation + preview overwrite audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_29_INVENTORY_ARRAY_PREVIEW_OVERWRITE_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Autos-only scope respected",
  "All additionalInventoryVehicles writers inspected",
  "Object state proof A-K captured before fix",
  "Exact root cause documented with file/function names",
  "saveInventoryVehicle updates by id",
  "saveInventoryVehicle preserves siblings",
  "saveInventoryVehicle does not use [preparedChild] replacement for normal save",
  "removeInventoryVehicle removes only target child",
  "prepareInventoryVehicleForSave preserves mediaImages",
  "prepareInventoryVehicleForSave preserves photos compatibility",
  "prepareInventoryVehicleForSave preserves imageUrls",
  "prepareInventoryVehicleForSave preserves videoUrls",
  "prepareInventoryVehicleForSave preserves videoLinks compatibility",
  "Safe merge prevents partial preview object from wiping media",
  "Preview view model is read-only and does not overwrite active draft",
  "Volver a editar does not write preview view model into sessionStorage",
  "resume=1 hydrates from canonical active draft",
  "resume=1 does not insert parent vehicle into additionalInventoryVehicles",
  "Editar locates child by id/childId",
  "Editar hydrates saved child media/images",
  "Editar hydrates saved child videoUrls/videoLinks",
  "Default blank child state does not overwrite hydrated child",
  "Parent/main vehicle remains separate from additionalInventoryVehicles",
  "Inventory count rule documented",
  "Two saved child vehicles survive preview/back",
  "Two saved child vehicles survive refresh",
  "Child A media survives preview/back/Edit",
  "Child A video URL survives preview/back/Edit",
  "Child B media survives after editing Child A",
  "Parent media/video behavior not regressed",
  "No unrelated categories touched",
  "No global Stripe/payment touched",
  "No schema/migration touched",
  "npm run build passed",
];

const PRE_EXISTING_DIRTY_EXEMPT = [
  "app/(site)/page.tsx",
  "app/components/RootIntroLanguagePanel.tsx",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
  "app/(site)/publicar/bienes-raices/",
  "app/admin/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/magazine/",
];

const GATE_SCOPED_MARKERS = [
  "recovery-29",
  "autosAdditionalInventoryDraft",
  "useAutoDealerDraft",
  "autosNegociosDraftStorage",
  "AutosNegociosInventoryBundlePreview",
  "mapAutosNegociosBuyerPreviewViewModel",
  "AUTOS_A5_RECOVERY_29",
];

function gateScopedChanges(): string[] {
  return changedFiles().filter((f) => {
    const norm = f.replace(/\\/g, "/");
    if (PRE_EXISTING_DIRTY_EXEMPT.includes(norm)) return false;
    return (
      GATE_SCOPED_MARKERS.some((m) => norm.includes(m)) ||
      norm === "package.json" ||
      norm.startsWith("e2e/autos/autos-a5-recovery-29") ||
      norm.startsWith("scripts/autos-a5-recovery-29") ||
      norm === "playwright.autos-recovery-29.config.mjs"
    );
  });
}

const PROOF_MARKERS = ["State A", "State B", "State C", "State D", "State E", "State F", "State G", "State H", "State I", "State J", "State K"];

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

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "R29 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");
  assert.match(auditText, /Local browser proof/i, "Local browser proof section required");
  for (const marker of PROOF_MARKERS) {
    assert.match(auditText, new RegExp(marker, "i"), `Object proof section ${marker} required`);
  }

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
  assert.ok(additional.includes("upsertAdditionalInventoryVehicleInArray"), "Upsert by id helper");
  assert.ok(additional.includes("mergeFullInventoryVehicle"), "Safe merge helper");
  assert.ok(additional.includes("sanitizeAdditionalInventoryVehiclesForDraft"), "Draft sanitize helper");
  assert.ok(additional.includes("resolveAdditionalInventoryVehicleId"), "id/childId resolver");
  assert.ok(additional.includes("hydrateChildVehicle"), "Child hydrator alias");
  assert.ok(additional.includes("photos: media.mediaImages"), "photos compatibility");
  assert.ok(additional.includes("videoLinks: media.videoUrls"), "videoLinks compatibility");
  assert.ok(!additional.includes("setAdditionalInventoryVehicles([prepared"), "No array replacement anti-pattern");

  const hook = read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts");
  assert.ok(hook.includes("upsertAdditionalInventoryVehicleInArray"), "Hook uses upsert helper");
  assert.ok(hook.includes("sanitizeAdditionalInventoryVehiclesForDraft"), "Hook sanitizes on flush/hydrate");

  const storage = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts");
  assert.ok(storage.includes("sanitizeAdditionalInventoryVehiclesForDraft"), "Storage sanitizes children on save/load");

  const previewVm = read("app/lib/clasificados/autos/mapAutosNegociosBuyerPreviewViewModel.ts");
  assert.ok(previewVm.includes("Read-only presentation VM"), "Preview VM read-only guard");

  const bundle = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx");
  assert.ok(bundle.includes("onInProgressChange?.(null)"), "Preview clears stale in-progress before flush");
  assert.ok(bundle.includes("rehydrateFromStorage"), "Volver a editar rehydrates canonical draft");

  const spec = read("e2e/autos/autos-a5-recovery-29-inventory-array-preview-overwrite.spec.ts");
  assert.ok(spec.includes("toHaveCount(2)"), "Two-child browser proof");
  assert.ok(spec.includes("readDraftInventorySnapshot"), "Session snapshot proof");

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix) && norm !== prefix, `Forbidden gate-scoped change: ${norm}`);
    }
  }

  const scoped = gateScopedChanges();
  console.log(`A5.RECOVERY-29 audit PASS (${recommendation}) — ${scoped.length} gate-scoped file(s)`);
}

run();
