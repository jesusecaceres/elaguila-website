import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function gitDiffForPrefix(prefix) {
  try {
    return execFileSync("git", ["diff", "--name-only", "--", prefix], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

const docRel = "docs/bienes-child-inventory-preview-media-navigation-truth-01.md";
const overlayRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullPreviewOverlay.tsx";
const shellRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryShell.tsx";
const childAppRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx";
const copyRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioPrePublishInventoryShellCopy.ts";
const verifierRel = "scripts/verify-bienes-child-inventory-preview-media-navigation-truth-01.mjs";

for (const rel of [docRel, overlayRel, shellRel, childAppRel, copyRel, verifierRel]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const overlay = read(overlayRel);
const shell = read(shellRel);
const childApp = read(childAppRel);
const copy = read(copyRel);
const pkg = read("package.json");

for (const section of [
  "Executive Summary",
  "Task Classification",
  "Files Inspected",
  "Files Changed",
  "Current Root Cause",
  "Media Pipeline Before",
  "Media Pipeline After",
  "Navigation Before",
  "Navigation After",
  "Refresh / Same-Tab Persistence Result",
  "Manual QA Checklist",
  "Remaining Risks",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(overlay.includes("onEdit"), "Overlay must support onEdit callback");
assert(
  overlay.includes("onContinueToParentPreview") || overlay.includes("onSaveAndReturnToParent"),
  "Overlay must support continue or save-return callback",
);
assert(!overlay.includes('editHref="#"'), "Overlay must not use dead editHref=\"#\"");
assert(!overlay.includes("editHref={"), "Overlay must not pass editHref to preview page");

assert(
  shell.includes("mergeChildInventoryWithMediaBridge"),
  "Shell must hydrate preview draft with media bridge",
);
const shellPreviewBlock = shell.slice(shell.indexOf("const previewDraft"));
assert(
  shellPreviewBlock.includes("hydratedItems") || shellPreviewBlock.includes("mergeChildInventoryWithMediaBridge"),
  "Shell previewDraft must not use raw items.find only",
);
assert(shell.includes("onEdit"), "Shell must wire onEdit to overlay");
assert(shell.includes("onContinueToParentPreview"), "Shell must wire continue to parent");

assert(childApp.includes("context=\"childApplication\""), "Child app must use childApplication context");
assert(
  childApp.includes("onSaveAndReturnToParent") || childApp.includes("attemptSave(\"goToParentPreview\")"),
  "Child app preview must support save and return",
);

for (const phrase of [
  "Close preview",
  "Edit this property",
  "Continue to parent publish step",
  "Cerrar vista previa",
  "Editar esta propiedad",
  "Continuar al paso de publicación",
]) {
  assert(copy.includes(phrase), `Copy must include: ${phrase}`);
}

const lockedPrefixes = [
  "app/api/stripe/",
  "app/api/revenue-os/",
  "app/api/revenue-os/webhook/",
  "supabase/migrations/",
  "app/lib/clasificados/autos/",
];

for (const prefix of lockedPrefixes) {
  const changed = gitDiffForPrefix(prefix);
  assert(!changed, `Locked path must not be modified: ${prefix}`);
}

assert(
  pkg.includes('"verify:bienes-child-inventory-preview-media-navigation-truth-01"'),
  "package.json must include verifier script",
);

console.log("verify:bienes-child-inventory-preview-media-navigation-truth-01 — all checks passed");
