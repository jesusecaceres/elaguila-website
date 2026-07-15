/**
 * A5.MEDIA-03 — Autos Negocios gallery tabs show all videos verifier.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_MEDIA_03_NEGOCIOS_GALLERY_TABS_ALL_VIDEOS_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos gallery file found",
  "All video URLs mapped",
  "VIDEO tab shows all videos",
  "PHOTOS tab shows only photos",
  "VIEW ALL shows photos and videos",
  "Modal uses active filtered media set",
  "Video #1 opens modal",
  "Video #4 opens modal",
  "Previous/Next works in VIDEO tab",
  "Counter correct for VIDEO tab",
  "YouTube Shorts embed",
  "No primary external navigation",
  "Photos still work",
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
  assert.ok(fs.existsSync(AUDIT_MD), "A5.MEDIA-03 audit markdown must exist");
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

  const gallery = read("app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx");
  const lightbox = read("app/lib/clasificados/autos/autosGalleryLightbox.ts");
  const youtube = read("app/lib/clasificados/autos/autosYoutubeEmbed.ts");

  assert.ok(gallery.includes("buildAutosGalleryMediaSets"), "Media sets builder required");
  assert.ok(gallery.includes("photoItems"), "photoItems array required");
  assert.ok(gallery.includes("videoItems"), "videoItems array required");
  assert.ok(gallery.includes("allItems"), "allItems array required");
  assert.ok(gallery.includes('activeTab === "photos"'), "PHOTOS tab filter required");
  assert.ok(gallery.includes('activeTab === "video"'), "VIDEO tab filter required");
  assert.ok(gallery.includes("activeItems"), "Modal uses active filtered set");
  assert.ok(gallery.includes("videoItems.map"), "VIDEO tab maps all videos");

  assert.ok(lightbox.includes("buildAutosGalleryMediaSets"), "Media sets in lightbox helper");
  assert.ok(lightbox.includes("getListingVideoUrls"), "All listing video URLs source required");
  assert.ok(!lightbox.includes("getListingVideoUrls(data)[0]"), "Must not use only first video URL");
  assert.ok(lightbox.includes("forEach") || lightbox.includes(".map"), "Must map all video URLs");
  assert.ok(lightbox.includes("AUTOS_MAX_EXTERNAL_VIDEO_URLS"), "Up to 4 videos cap required");
  assert.ok(lightbox.includes("Video 1"), "Per-video labels required");

  const videoThumbBlock = gallery.slice(gallery.indexOf("function VideoWalkaroundThumb"), gallery.indexOf("function Thumb"));
  assert.ok(!videoThumbBlock.includes("<a"), "Video thumbnail must not use anchor as primary click");
  assert.ok(videoThumbBlock.includes("<button"), "Video thumbnail must use button");

  assert.ok(youtube.includes('"shorts"') || youtube.includes("'shorts'"), "YouTube Shorts embed helper required");

  const privadoPreview = read("app/(site)/clasificados/autos/privado/components/AutoPrivadoPreviewPage.tsx");
  assert.ok(privadoPreview.includes("AutoGallery"), "Privado uses shared gallery only");
  assert.ok(!privadoPreview.includes("activeTab"), "Privado-specific file unchanged");

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-media-03-negocios-gallery-tabs-all-videos-audit"), "package.json verifier script required");

  console.log(`A5.MEDIA-03 audit PASS (${recommendation})`);
}

run();
