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

const docRel = "docs/bienes-child-editor-step10-media-url-truth-force-patch-01.md";
const mappingRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryFormMapping.ts";
const childAppRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx";
const sessionRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryEditorSession.ts";
const cardRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryCardModel.ts";
const draftRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioAdditionalInventoryDraft.ts";
const verifierRel = "scripts/verify-bienes-child-editor-step10-media-url-truth-force-patch-01.mjs";

for (const rel of [docRel, mappingRel, childAppRel, sessionRel, cardRel, draftRel, verifierRel]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const mapping = read(mappingRel);
const childApp = read(childAppRel);
const session = read(sessionRel);
const card = read(cardRel);
const draft = read(draftRel);
const pkg = read("package.json");

for (const section of [
  "User Browser Proof",
  "Root Cause",
  "Files Changed",
  "Live Editor Priority Rule",
  "Step 10 Card Fallback Rule",
  "URL Persistence Rule",
  "Manual QA Checklist",
  "What Was Not Touched",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(mapping.includes("export function buildLiveChildInventoryPreviewDraft"), "Canonical builder must exist");
assert(mapping.includes("function applyLiveChildEditorFieldsToPreviewDraft"), "Live apply helper must exist");
assert(mapping.includes("function preserveUrlText"), "URL text preservation must exist");
assert(mapping.includes("livePhotoUrlsFromSlice"), "Live photo priority helper must exist");
assert(mapping.includes("liveVideoUrlsFromSlice"), "Live video priority helper must exist");

const applyBlock = mapping.slice(
  mapping.indexOf("function applyLiveChildEditorFieldsToPreviewDraft"),
  mapping.indexOf("export function buildLiveChildInventoryPreviewDraft"),
);
assert(applyBlock.includes("livePhotosRaw.length > 0 ? livePhotosRaw"), "Live photos must win over stale");
assert(applyBlock.includes("liveVideos.length > 0 ? liveVideos"), "Live videoUrls must win over stale");
assert(applyBlock.includes("liveUrlFromSlice(editorSlice, \"tourUrl\")"), "Live tourUrl must win");
assert(applyBlock.includes("liveUrlFromSlice(editorSlice, \"brochureUrl\")"), "Live brochureUrl must win");
assert(applyBlock.includes("liveUrlFromSlice(editorSlice, \"listadoUrl\")"), "Live listadoUrl must win");
assert(
  applyBlock.includes("...staleSlice") && applyBlock.includes("...editorSlice"),
  "propertyForm must spread live editor fields last",
);

const builderBlock = mapping.slice(mapping.indexOf("export function buildLiveChildInventoryPreviewDraft"));
assert(
  builderBlock.includes("applyLiveChildEditorFieldsToPreviewDraft(bridged ?? withLiveFields, editorDraft)"),
  "Live editor priority must re-apply after media bridge",
);

assert(childApp.includes("applyLiveEditorPhotosToInventoryCard"), "Step 10 live photo fallback must be wired");
assert(
  childApp.includes("applyLiveEditorPhotosToInventoryCard(card, previewStateForCard)"),
  "Step 10 card must use live state fallback",
);

assert(card.includes("function resolveAdditionalDraftCardPhotoUrl"), "Card model photoUrls fallback must exist");
assert(card.includes("export function applyLiveEditorPhotosToInventoryCard"), "Live card fallback export must exist");

assert(session.includes("function normalizeSessionPropertyFormUrls"), "Session URL normalization must exist");
assert(session.includes("videoUrls"), "Session must preserve videoUrls");
for (const field of ["videoUrl", "tourUrl", "brochureUrl", "listadoUrl"]) {
  assert(session.includes(field), `Session must preserve ${field}`);
}

assert(draft.includes("function preserveUrlText"), "Draft sync must preserve URL text");

const lockedPathPrefixes = [
  "app/api/stripe/",
  "app/api/revenue-os/",
  "supabase/migrations/",
  "app/lib/clasificados/autos/",
  "app/(site)/clasificados/publicar/rentas/",
  "app/admin/",
  "app/(site)/dashboard/",
];

for (const prefix of lockedPathPrefixes) {
  const changed = gitDiffForPrefix(prefix);
  assert(!changed, `Locked path must not be modified: ${prefix}`);
}

assert(
  pkg.includes('"verify:bienes-child-editor-step10-media-url-truth-force-patch-01"'),
  "package.json must include verifier script",
);

console.log("verify:bienes-child-editor-step10-media-url-truth-force-patch-01 — all checks passed");
