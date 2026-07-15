/**
 * A5.MEDIA-02 — Autos Negocios preview video lightbox micro patch verifier.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_MEDIA_02_NEGOCIOS_VIDEO_LIGHTBOX_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos Negocios video thumbnail found",
  "Photo lightbox found",
  "Video thumbnail no longer navigates away",
  "Video opens modal/lightbox",
  "YouTube Shorts embeds in modal",
  "Photos still open modal",
  "Close works",
  "Mobile safe",
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
  assert.ok(fs.existsSync(AUDIT_MD), "A5.MEDIA-02 audit markdown must exist");
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
  const youtube = read("app/lib/clasificados/autos/autosYoutubeEmbed.ts");
  const lightbox = read("app/lib/clasificados/autos/autosGalleryLightbox.ts");

  assert.ok(gallery.includes("VideoWalkaroundThumb"), "Video walkaround thumbnail component required");
  assert.ok(gallery.includes("openVideoLightbox"), "Video opens local lightbox handler required");
  assert.ok(gallery.includes("buildAutosGalleryLightboxItems"), "Unified gallery media items required");
  assert.ok(gallery.includes("<iframe"), "Modal video iframe required");
  assert.ok(gallery.includes("setLightboxIndex"), "Lightbox state required");
  assert.ok(gallery.includes("MediaImage"), "Photo modal image path preserved");

  assert.ok(!gallery.includes('target="_blank"') || gallery.includes("Abrir en sitio externo"), "External link only as secondary fallback");
  const videoThumbBlock = gallery.slice(gallery.indexOf("function VideoWalkaroundThumb"), gallery.indexOf("function Thumb"));
  assert.ok(!videoThumbBlock.includes("<a"), "Video thumbnail must not use anchor as primary click");
  assert.ok(videoThumbBlock.includes("<button"), "Video thumbnail must use button");

  assert.ok(youtube.includes('"shorts"') || youtube.includes("'shorts'"), "YouTube Shorts embed conversion required");
  assert.ok(youtube.includes("youtu.be"), "youtu.be embed conversion required");
  assert.ok(lightbox.includes("kind: \"youtube\""), "YouTube lightbox item kind required");

  const privadoPreview = read("app/(site)/clasificados/autos/privado/components/AutoPrivadoPreviewPage.tsx");
  assert.ok(privadoPreview.includes("AutoGallery"), "Privado uses shared gallery only");
  assert.ok(!privadoPreview.includes("openVideoLightbox"), "Privado-specific file unchanged");

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-media-02-negocios-video-lightbox-audit"), "package.json verifier script required");

  console.log(`A5.MEDIA-02 audit PASS (${recommendation})`);
}

run();
