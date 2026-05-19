/**
 * A5.1 Autos Negocios draft preview persistence static gate.
 * Run: npm run autos:a5-1-negocios-draft-preview-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_ROWS = [
  "Autos Negocios draft state is saved before preview",
  "Preview hydrates from saved draft/listing data",
  "Preview no longer resets the application",
  "Back from preview restores vehicle fields",
  "Back from preview restores specs fields",
  "Back from preview restores business/contact fields",
  "Back from preview restores structured address fields",
  "Back from preview restores schedule/hour rows",
  "Back from preview restores description",
  "Back from preview preserves photos where browser/session allows",
  "Back from preview preserves photo order",
  "Back from preview preserves dealer logo where browser/session allows",
  "Draft is not cleared except after successful publish or explicit reset",
  "Inventory add mode keeps parent/group context",
  "Inventory add mode does not overwrite edited child vehicle fields",
  "No fake persistence was added",
  "No unrelated categories were touched",
  "npm run build passed",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function isAllowedPath(p: string): boolean {
  if (p === "package.json") return true;
  return (
    p.startsWith("app/(site)/clasificados/autos/") ||
    p.startsWith("app/(site)/publicar/autos/") ||
    p.startsWith("app/lib/clasificados/autos/") ||
    p.startsWith("scripts/autos-")
  );
}

function run() {
  const md = read("app/lib/clasificados/autos/AUTOS_A5_1_NEGOCIOS_DRAFT_PREVIEW_PERSISTENCE_AUDIT.md");
  for (const row of AUDIT_ROWS) assert.ok(md.includes(`| ${row} |`), `Missing audit row: ${row}`);

  const hook = read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts");
  assert.ok(hook.includes("shouldResetAutosDraftForFreshEditorTab"), "Must use fresh-tab session guard");
  assert.ok(hook.includes("await hydrateFromNamespace(ns)"), "Must hydrate on same-tab remount");
  assert.ok(hook.includes("if (confirmRoute || resume)"), "Resume/confirm branch");
  const resumeBlock = hook.slice(hook.indexOf("if (confirmRoute || resume)"), hook.indexOf("if (inventoryAdd.inventoryModeAdd"));
  assert.ok(!resumeBlock.includes("clearAutosNegociosDraft(ns)"), "Resume path must not clear draft");
  assert.ok(hook.includes("flushDraft"), "Draft flush support");

  const app = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  assert.ok(app.includes("await flushDraft()"), "Must save before preview navigation");
  assert.ok(app.includes("router.push(previewHref)"), "Preview navigation present");

  const preview = read("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  assert.ok(preview.includes("loadAutosNegociosDraftResolved"), "Preview hydrates from storage");
  assert.ok(preview.includes("buildAutosNegociosEditorResumeHref"), "Resume link preserves inventory context");

  const addFlow = read("app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts");
  assert.ok(addFlow.includes("resolveAutosInventoryAddContextForEditor"));
  assert.ok(addFlow.includes("buildAutosNegociosEditorResumeHref"));

  assert.ok(!hook.includes("inventoryAdd.inventoryModeAdd && inventoryAdd.context && !confirmRoute"));
  const invBlock = hook.slice(hook.indexOf("inventoryAdd.inventoryModeAdd"));
  assert.ok(invBlock.includes("loadAutosNegociosDraftResolved"), "Inventory add must check existing draft first");

  const dangerous = /clearAutosNegociosDraft\(ns\)[\s\S]{0,120}emptyListing\(\)/g;
  const matches = hook.match(dangerous) ?? [];
  assert.ok(matches.length >= 1, "Fresh-tab wipe still exists");
  assert.ok(
    hook.indexOf("if (confirmRoute || resume)") < hook.indexOf("if (freshTab)"),
    "Resume branch must run before fresh-tab wipe",
  );

  const phaseMarkers = [
    "useAutoDealerDraft.ts",
    "AutosNegociosPreviewClient.tsx",
    "autosDealerInventoryAddFlow.ts",
    "AutosNegociosApplication.tsx",
    "AUTOS_A5_1_",
    "autos-a5-1-negocios-draft-preview",
  ];
  const phaseChanges = changedFiles().filter((p) => phaseMarkers.some((m) => p.includes(m)));
  for (const p of phaseChanges) {
    if (!isAllowedPath(p)) throw new Error(`A5.1 out of scope: ${p}`);
  }

  console.log("autos:a5-1-negocios-draft-preview-audit OK");
}

run();
