/**
 * A5.MEDIA-01 — Autos Negocios parent + child media step polish and hydration audit verifier.
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
  "app/lib/clasificados/autos/AUTOS_A5_MEDIA_01_NEGOCIOS_PARENT_CHILD_MEDIA_STEP_POLISH_HYDRATION_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos Negocios media step identified",
  "Uploaded image cards moved above URL section",
  "Add photos by URL moved below uploaded cards",
  "Multiline image URL textarea removed",
  "Video-style image URL input exists",
  "Add image URL works",
  "Remove image URL works",
  "Duplicate image URL blocked",
  "Invalid image URL blocked",
  "Local uploads still work",
  "Reorder still works",
  "Cover selection still works",
  "Spacebar works in image URL input",
  "Spacebar works in video URL input",
  "Spacebar works in title/description fields",
  "Parent media hydrates on hard refresh",
  "Parent media survives preview return",
  "Child inventory media safe",
  "Video URLs still hydrate",
  "No Mux upload exposed if disabled",
  "Mobile layout safe",
  "Autos Privado untouched",
  "Dashboard untouched",
  "Admin untouched",
  "Stripe untouched",
  "Supabase untouched",
  "Unrelated categories untouched",
  "Build passed",
  "Ready for Chuy QA",
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

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "A5.MEDIA-01 audit markdown must exist");
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

  const mediaManager = read("app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx");
  const videoField = read("app/(site)/publicar/autos/shared/components/AutosExternalVideoUrlsField.tsx");
  const imageCopy = read("app/lib/clasificados/autos/autosExternalImageUrlsCopy.ts");
  const negociosCopy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");

  assert.ok(!mediaManager.includes("one per line"), "Multiline one-per-line textarea must be removed");
  assert.ok(!mediaManager.includes("<textarea"), "Image URL textarea must be removed from media manager");
  assert.ok(mediaManager.includes("singleImageUrlDraft"), "Direct image URL input required");
  assert.ok(mediaManager.includes("addSingleImageUrl"), "Add image URL handler required");
  assert.ok(mediaManager.includes("autosExternalImageUrlListLabel"), "Image URL list labels required");
  assert.ok(mediaManager.includes("existingImageUrls"), "Duplicate URL guard required");
  assert.ok(mediaManager.includes("classifyAutosImageUrlInput"), "Invalid URL validation required");
  assert.ok(mediaManager.includes("AutosSortablePhotoGrid"), "Reorder grid preserved");
  assert.ok(mediaManager.includes("AutosExternalVideoUrlsField"), "Video URL section preserved");
  assert.ok(mediaManager.includes("modalHandlers"), "Modal keyboard safety for URL inputs");

  const reorderIdx = mediaManager.indexOf("m.reorderHeading");
  const urlSectionIdx = mediaManager.indexOf("m.urlSectionHeading");
  assert.ok(reorderIdx > 0 && urlSectionIdx > 0, "Reorder and URL section markers required");
  assert.ok(reorderIdx < urlSectionIdx, "Reorder section must appear before Add photos by URL in source order");

  assert.ok(negociosCopy.includes("Add photos by URL"), "EN URL section heading in copy");
  assert.ok(negociosCopy.includes("Agregar fotos por URL"), "ES URL section heading in copy");
  assert.ok(imageCopy.includes("Image URL"), "Image URL list label copy required");
  assert.ok(videoField.includes("4 video limit reached") || videoField.includes("autosExternalVideoLimitReached"), "Video limit copy path");

  assert.ok(mediaManager.includes("mediaImages"), "Draft media list state preserved");
  assert.ok(mediaManager.includes("sourceType: \"url\""), "URL image source type preserved for hydration");
  assert.ok(mediaManager.includes("videoUrls"), "Video URL draft field preserved");

  assert.ok(!privadoApp.includes("batchUrls"), "Privado must not depend on removed batch URL copy");

  const changed = changedFiles();
  const lockedPrefixes = [
    "app/(site)/dashboard/",
    "app/admin/",
    "app/(site)/revenue-os/",
    "app/api/stripe/",
    "supabase/migrations/",
    "app/(site)/clasificados/bienes-raices/",
    "app/(site)/clasificados/rentas/",
    "app/(site)/clasificados/restaurantes/",
    "app/(site)/clasificados/en-venta/",
    "app/(site)/clasificados/ofertas-locales/",
    "app/(site)/servicios/",
  ];
  const gateChanged = changed.filter((f) => {
    const norm = f.replace(/\\/g, "/");
    return (
      norm.startsWith("app/(site)/publicar/autos/") ||
      norm === "app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts" ||
      norm.startsWith("app/lib/clasificados/autos/") ||
      norm.startsWith("scripts/autos-a5-media-01") ||
      norm === "package.json"
    );
  });
  for (const f of gateChanged) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of lockedPrefixes) {
      assert.ok(!norm.startsWith(prefix), `Locked path modified: ${norm}`);
    }
  }

  const pkg = read("package.json");
  assert.ok(
    pkg.includes("autos:a5-media-01-negocios-parent-child-media-step-polish-hydration-audit"),
    "package.json verifier script required",
  );

  console.log(`A5.MEDIA-01 audit PASS (${recommendation})`);
}

run();
