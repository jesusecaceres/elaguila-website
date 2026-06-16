/**
 * A5.RECOVERY-23 — Added inventory reuse main media/video pipeline audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_23_ADDED_INVENTORY_REUSE_MAIN_MEDIA_PIPELINE_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Autos-only scope respected",
  "Main vehicle media/video pipeline inspected",
  "Main vehicle media field names documented",
  "Main vehicle videoUrls field documented",
  "Child media/video pipeline inspected",
  "Divergence between main and child documented",
  "Failure reproduced with child object shape proof",
  "Root cause documented specifically",
  "Child uses same media/video normalization as main",
  "Child save stores media/images",
  "Child save stores image order",
  "Child save stores cover image",
  "Child save stores videoUrls",
  "Child edit hydrates media/images",
  "Child edit hydrates image order",
  "Child edit hydrates cover image",
  "Child edit hydrates videoUrls",
  "Child preview reads saved child media",
  "Child preview reads saved child videoUrls",
  "Child Volver a editar preserves media/images",
  "Child Volver a editar preserves image order",
  "Child Volver a editar preserves cover image",
  "Child Volver a editar preserves videoUrls",
  "Parent draft serializer includes child media/images",
  "Parent draft serializer includes child videoUrls",
  "Parent draft hydrate restores child media/images",
  "Parent draft hydrate restores child videoUrls",
  "Refresh preserves saved child media metadata where main supports it",
  "Refresh preserves child videoUrls",
  "Sibling children are preserved",
  "Parent media/video behavior not regressed",
  "Volver a editar does not call destructive reset/clear",
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
];

const GATE_MARKERS = [
  "AUTOS_A5_RECOVERY_23",
  "autos-a5-recovery-23",
  "autosVehicleMediaDraft",
  "autosAdditionalInventoryDraft",
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
    return GATE_MARKERS.some((m) => norm.includes(m)) || norm.includes("autoDealerDraftDefaults.ts") || norm === "package.json";
  });
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "R23 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");

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

  const mediaHelper = read("app/lib/clasificados/autos/autosVehicleMediaDraft.ts");
  assert.ok(mediaHelper.includes("normalizeAutosVehicleMediaDraft"), "Shared media normalizer");
  assert.ok(mediaHelper.includes("coerceAutosVehicleMediaImageEntries"), "Shared media coerce");
  assert.ok(mediaHelper.includes("videoUrls"), "Shared videoUrls handling");

  const additional = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");
  assert.ok(additional.includes("normalizeAutosVehicleMediaDraft"), "Child uses shared normalizer");
  assert.ok(additional.includes("prepareInventoryVehicleForSave"), "Child save helper");
  assert.match(additional, /mediaImages[\s\S]*videoUrls/, "Child draft media/video fields");

  const defaults = read("app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts");
  assert.ok(defaults.includes("applyAutosVehicleMediaDraftFields"), "Main vehicle uses shared media helper");

  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx");
  assert.ok(drawer.includes("prepareInventoryVehicleForSave"), "Drawer save prepares media");
  const persistBlock = drawer.slice(drawer.indexOf("const persist"));
  assert.ok(persistBlock.includes("onSave(prepared)"), "Drawer saves child first");
  const saveIdx = persistBlock.indexOf("onSave(prepared)");
  const flushIdx = persistBlock.indexOf("flushDraft");
  assert.ok(saveIdx >= 0 && flushIdx > saveIdx, "flushDraft must run after onSave (not before)");

  const draftStorage = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts");
  assert.ok(draftStorage.includes("additionalInventoryVehicles"), "Parent draft stores children");
  assert.ok(
    draftStorage.includes("offloadAdditionalInventoryVehiclesToIdb") ||
      draftStorage.includes("inlineAdditionalInventoryVehiclesFromIdb"),
    "Child media IDB pipeline",
  );

  const bundle = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx");
  assert.ok(bundle.includes("rehydrateFromStorage"), "Child bundle preview rehydrate on back");
  assert.ok(!bundle.includes("clearAutosNegociosDraft"), "Preview/back must not clear draft");

  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(!privado.includes("additionalInventoryVehicles"), "Privado clean");

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    if (norm === "package.json") continue;
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden prefix: ${norm}`);
    }
  }

  console.log("A5.RECOVERY-23 added inventory reuse main media pipeline audit: PASS");
  console.log(`Final recommendation: ${recommendation}`);
}

run();
