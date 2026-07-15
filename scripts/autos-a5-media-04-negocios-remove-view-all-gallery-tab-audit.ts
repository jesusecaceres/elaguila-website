/**
 * A5.MEDIA-04 — Autos Negocios remove View All gallery tab verifier.
 * Supersedes A5.MEDIA-03 VIEW ALL requirement.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_MEDIA_04_NEGOCIOS_REMOVE_VIEW_ALL_GALLERY_TAB_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos gallery file found",
  "VIEW ALL tab removed",
  "PHOTOS tab preserved",
  "VIDEO tab preserved",
  "PHOTOS shows photos only",
  "VIDEO shows videos only",
  "Modal uses active filtered media set",
  "Photo modal still works",
  "Video modal still works",
  "Previous/Next scoped to active tab",
  "Counter correct for active tab",
  "No primary external video navigation",
  "Autos Privado untouched",
  "Dashboard untouched",
  "Admin untouched",
  "Stripe untouched",
  "Supabase untouched",
  "Build passed",
  "Ready for Chuy QA",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "A5.MEDIA-04 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");
  assert.match(auditText, /A5\.MEDIA-04 supersedes/i, "Must document superseding A5.MEDIA-03 VIEW ALL");

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

  const gallery = read("app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx");

  assert.ok(gallery.includes('activeTab === "photos"'), "PHOTOS tab required");
  assert.ok(gallery.includes('activeTab === "video"'), "VIDEO tab required");
  assert.ok(gallery.includes("photoItems"), "photoItems path required");
  assert.ok(gallery.includes("videoItems"), "videoItems path required");
  assert.ok(gallery.includes("videoItems.map"), "All videos still mapped");
  assert.ok(gallery.includes("activeItems"), "Modal uses active filtered set");

  assert.ok(!gallery.includes("View all"), "VIEW ALL English label must be removed");
  assert.ok(!gallery.includes("Ver todas"), "VIEW ALL Spanish label must be removed");
  assert.ok(!gallery.includes('"all"'), 'No "all" tab type in gallery');
  assert.ok(!gallery.includes("allItems"), "Gallery must not use allItems for visible tab");

  const videoThumbBlock = gallery.slice(gallery.indexOf("function VideoWalkaroundThumb"), gallery.indexOf("function Thumb"));
  assert.ok(!videoThumbBlock.includes("<a"), "Video thumbnail must not use anchor as primary click");
  assert.ok(videoThumbBlock.includes("<button"), "Video thumbnail must use button");

  const privadoPreview = read("app/(site)/clasificados/autos/privado/components/AutoPrivadoPreviewPage.tsx");
  assert.ok(privadoPreview.includes("AutoGallery"), "Privado uses shared gallery only");

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-media-04-negocios-remove-view-all-gallery-tab-audit"), "package.json verifier script required");

  console.log(`A5.MEDIA-04 audit PASS (${recommendation})`);
}

run();
