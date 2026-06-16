/**
 * A5.RECOVERY-21 — Volver a editar media + video URL persistence audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_21_VOLVER_EDITAR_MEDIA_VIDEO_PERSISTENCE_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Autos-only scope respected",
  "Failure reproduced locally before editing",
  "Main preview source of truth inspected",
  "Root cause documented",
  "Parent preview receives media from active draft",
  "Parent preview receives videoUrls from active draft",
  "Parent Volver a editar preserves image list",
  "Parent Volver a editar preserves image order",
  "Parent Volver a editar preserves cover image",
  "Parent Volver a editar preserves videoUrls",
  "Parent Volver a editar preserves current step/context",
  "Child preview receives child media from saved child draft",
  "Child preview receives child videoUrls from saved child draft",
  "Child Volver a editar preserves child image list",
  "Child Volver a editar preserves child image order",
  "Child Volver a editar preserves child cover image",
  "Child Volver a editar preserves child videoUrls",
  "Child Volver a editar preserves all sibling children",
  "Active draft serializer includes media/videoUrls",
  "Active draft hydrate restores media/videoUrls",
  "Reduced preview snapshot does not overwrite full active draft",
  "Volver a editar does not call destructive reset/clear",
  "Refresh-safe draft behavior not regressed",
  "Local file limitation documented honestly",
  "Privado checked if shared helper touched",
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

const GATE_MARKERS = ["AUTOS_A5_RECOVERY_21", "autos-a5-recovery-21", "autosNegociosCanonicalDraftLoad"];

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
    return GATE_MARKERS.some((m) => norm.includes(m)) || norm.includes("autosNegociosCanonicalDraftLoad") || norm === "package.json";
  });
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "R21 audit markdown must exist");
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

  const canonical = read("app/lib/clasificados/autos/autosNegociosCanonicalDraftLoad.ts");
  assert.ok(canonical.includes("loadAutosNegociosCanonicalActiveDraft"), "Canonical loader");
  assert.ok(canonical.includes("loadAutosNegociosDraftResolved"), "Resolved draft load");
  assert.ok(canonical.includes("peekAutosDraftNamespaceHint"), "Namespace hint");

  const hook = read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts");
  assert.ok(hook.includes("loadAutosNegociosCanonicalActiveDraft"), "Editor uses canonical loader");
  assert.ok(hook.includes("fromResolvedLoad"), "Non-destructive hydrate");
  assert.ok(hook.includes("rehydrateFromStorage"), "Child edit-back rehydrate");

  const additional = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");
  assert.ok(additional.includes("mediaImages") && additional.includes("videoUrls"), "Child draft media/video fields");

  const preview = read("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  assert.ok(preview.includes("loadAutosNegociosCanonicalActiveDraft"), "Preview uses canonical loader");

  const bundle = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx");
  assert.ok(bundle.includes("rehydrateFromStorage"), "Child preview rehydrate on back");

  const draftStorage = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts");
  assert.ok(draftStorage.includes("mediaImages") || draftStorage.includes("inlineDraftListingAssetsFromIdb"), "Draft storage media terms");
  assert.ok(draftStorage.includes("additionalInventoryVehicles"), "Child inventory in draft");

  const safeNorm = read("app/(site)/clasificados/autos/shared/lib/safeNormalizeAutosDraftListing.ts");
  assert.ok(safeNorm.includes("preservedMedia"), "Safe normalize preserves media on error");

  const previewBlock = [preview, bundle].join("\n");
  assert.ok(!previewBlock.includes("clearAutosNegociosDraft"), "Preview/back must not clear draft");

  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(!privado.includes("additionalInventoryVehicles"), "Privado clean");

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    if (norm === "package.json") continue;
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden prefix: ${norm}`);
    }
  }

  console.log("A5.RECOVERY-21 volver a editar media/video persistence audit: PASS");
  console.log(`Final recommendation: ${recommendation}`);
}

run();
