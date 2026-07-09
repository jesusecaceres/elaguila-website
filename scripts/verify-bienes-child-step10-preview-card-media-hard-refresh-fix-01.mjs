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

function gitDiffNameOnly() {
  try {
    return execFileSync("git", ["diff", "--name-only"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return "";
  }
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

const docRel = "docs/bienes-child-step10-preview-card-media-hard-refresh-fix-01.md";
const mappingRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryFormMapping.ts";
const childAppRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx";
const sessionRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryEditorSession.ts";
const verifierRel = "scripts/verify-bienes-child-step10-preview-card-media-hard-refresh-fix-01.mjs";

for (const rel of [docRel, mappingRel, childAppRel, sessionRel, verifierRel]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const mapping = read(mappingRel);
const childApp = read(childAppRel);
const session = read(sessionRel);
const pkg = read("package.json");

for (const section of [
  "Executive Summary",
  "Task Classification",
  "User Browser Proof",
  "Files Inspected",
  "Files Changed",
  "Root Cause",
  "Step 3 Media Source",
  "Step 10 Old Preview Card Source",
  "New Canonical Preview Draft Source",
  "Hard Refresh Behavior",
  "What Was Not Touched",
  "Manual QA Checklist",
  "Remaining Risks",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(
  mapping.includes("export function buildLiveChildInventoryPreviewDraft"),
  "Canonical live child preview builder must exist",
);

for (const field of [
  "fotosDataUrls",
  "fotoPortadaIndex",
  "videoUrls",
  "videoUrl",
  "tourUrl",
  "brochureUrl",
  "listadoUrl",
]) {
  assert(mapping.includes(field), `Builder must reference editor media field: ${field}`);
}

assert(mapping.includes("initialDraft"), "Builder must reference initialDraft fallback");
assert(mapping.includes("mergeChildEditorSessionWithDraft"), "Builder must merge live editor session media");
assert(mapping.includes("mergeChildInventoryWithMediaBridge"), "Builder must use media bridge");
assert(mapping.includes("syncChildInventoryDraftMedia"), "Builder must sync/normalize media");

assert(childApp.includes("buildLiveChildInventoryPreviewDraft"), "Child app must import/use canonical builder");
assert(childApp.includes("canonicalPreviewDraft"), "Child app must use canonicalPreviewDraft");
assert(
  childApp.includes("childDraft={canonicalPreviewDraft}"),
  "Full child preview overlay must use same canonical draft",
);

const step10CardBlock = childApp.slice(childApp.indexOf("const previewCard"));
assert(
  !step10CardBlock.includes("mapAdditionalDraftToInventoryCard(hydratedPreviewDraft"),
  "Step 10 must not use legacy hydratedPreviewDraft card source",
);
assert(
  !step10CardBlock.includes("mapAdditionalDraftToInventoryCard(previewDraft"),
  "Step 10 must not use raw previewDraft as final card source",
);
assert(
  step10CardBlock.includes("mapAdditionalDraftToInventoryCard(canonicalPreviewDraft"),
  "Step 10 preview card must map canonicalPreviewDraft",
);

assert(
  session.includes("resolveChildPropertySliceMediaFromIdb"),
  "Durable child media helper must exist for IDB hard refresh",
);
assert(
  session.includes("childEditorSliceHasUnresolvedIdbMedia"),
  "Child editor must detect unresolved IDB media",
);

const lockedPathPrefixes = [
  "app/api/stripe/",
  "app/api/revenue-os/",
  "app/api/revenue-os/webhook/",
  "supabase/migrations/",
  "app/lib/clasificados/autos/",
];

for (const prefix of lockedPathPrefixes) {
  const changed = gitDiffForPrefix(prefix);
  assert(!changed, `Locked path must not be modified: ${prefix} (${changed})`);
}

assert(
  pkg.includes('"verify:bienes-child-step10-preview-card-media-hard-refresh-fix-01"'),
  "package.json must include verifier script",
);

const gateScopePrefixes = [
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/",
  "docs/bienes-child-step10-preview-card-media-hard-refresh-fix-01.md",
  "scripts/verify-bienes-child-step10-preview-card-media-hard-refresh-fix-01.mjs",
];

function isGateScopedPath(line) {
  if (line === "package.json") return true;
  return gateScopePrefixes.some((p) => line === p || line.startsWith(p));
}

for (const line of gitDiffNameOnly().split("\n").filter(Boolean)) {
  if (isGateScopedPath(line)) continue;
  const unrelatedCategory =
    /^app\/\(site\)\/clasificados\/(rentas|restaurantes|autos|empleos|servicios)\//.test(line) ||
    /^app\/\(site\)\/publicar\/(restaurantes|empleos|autos)\//.test(line);
  if (unrelatedCategory) {
    console.warn(`warn: unrelated dirty file present (untouched by gate): ${line}`);
  }
}

console.log("verify:bienes-child-step10-preview-card-media-hard-refresh-fix-01 — all checks passed");
