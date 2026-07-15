/**
 * A5.POLISH-01 — Autos Negocios final layout rearrangement + WhatsApp new tab verifier.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_POLISH_01_NEGOCIOS_FINAL_LAYOUT_REARRANGEMENT_WHATSAPP_NEW_TAB_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Main listing card file found",
  "Gallery file preserved",
  "Like/Share file found",
  "WhatsApp link file found",
  "Large badges removed from title area",
  "Compact highlights moved below gallery",
  "Like/Share moved out of floating gap",
  "Like/Share not inside contact block",
  "Like remains count + heart",
  "Share behavior preserved",
  "PHOTOS tab preserved",
  "VIDEO tab preserved",
  "VIEW ALL not reintroduced",
  "Photo modal preserved",
  "Video modal preserved",
  "WhatsApp opens new tab/window",
  "WhatsApp uses wa.me",
  "Website/reviews/maps external behavior preserved",
  "Call/SMS remain direct",
  "Top results card safe",
  "Mobile safe",
  "Autos Privado untouched",
  "Dashboard untouched",
  "Admin untouched",
  "Stripe untouched",
  "Supabase untouched",
  "Media upload untouched",
  "Unrelated categories untouched",
  "Build passed",
  "Ready for Chuy QA",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "A5.POLISH-01 audit markdown must exist");
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

  const previewPage = read("app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx");
  const engagement = read("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewEngagementStrip.tsx");
  const directLink = read("app/(site)/clasificados/autos/shared/components/AutosDirectContactLink.tsx");
  const gallery = read("app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx");

  assert.ok(previewPage.includes("data-autos-post-gallery-utility"), "Post-gallery utility area required");
  assert.ok(previewPage.includes("COMPACT_BADGE_CLASS"), "Compact badge styling required");
  assert.ok(previewPage.includes("Destacados") || previewPage.includes("Highlights"), "Highlights label required");
  assert.ok(!previewPage.includes("autosPreviewRectBadgeClass"), "Large title-area badges removed");
  assert.ok(!previewPage.includes("AutosEngagementRow"), "Like/Share removed from contact aside");
  assert.ok(previewPage.includes("data-autos-gallery-utility-row") || previewPage.includes("AutosNegociosPreviewEngagementStrip"), "Gallery utility row required");

  const heroBlock = previewPage.slice(previewPage.indexOf("id={AUTOS_PREVIEW_SECTION_IDS.hero}"), previewPage.indexOf("{showGallery"));
  assert.ok(!heroBlock.includes("badges.map"), "Badges must not render in hero/title block");

  assert.ok(!previewPage.match(/AutosNegociosPreviewEngagementStrip[\s\S]{0,80}mb-2[\s\S]{0,80}AutoGallery/), "Engagement strip must not float above gallery");

  assert.ok(engagement.includes("data-autos-gallery-utility-row"), "Gallery utility row marker required");
  assert.ok(engagement.includes('countDisplay="numeric"'), "Compact like display required");
  assert.ok(engagement.includes("directNativeShare"), "Share native path preserved");

  assert.ok(directLink.includes("wa.me"), "WhatsApp wa.me path required");
  assert.ok(directLink.includes('target="_blank"'), "WhatsApp new tab required");
  assert.ok(directLink.includes('rel="noopener noreferrer"'), "WhatsApp rel required");

  assert.ok(gallery.includes('activeTab === "photos"'), "PHOTOS tab preserved");
  assert.ok(gallery.includes('activeTab === "video"'), "VIDEO tab preserved");
  assert.ok(!gallery.includes("View all") && !gallery.includes("Ver todas"), "VIEW ALL not reintroduced");

  const pkg = read("package.json");
  assert.ok(
    pkg.includes("autos:a5-polish-01-negocios-final-layout-rearrangement-whatsapp-new-tab-audit"),
    "package.json verifier script required",
  );

  console.log(`A5.POLISH-01 audit PASS (${recommendation})`);
}

run();
