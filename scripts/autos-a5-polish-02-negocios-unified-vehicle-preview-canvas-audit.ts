/**
 * A5.POLISH-02 — Autos Negocios unified vehicle preview canvas verifier.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_POLISH_02_NEGOCIOS_UNIFIED_VEHICLE_PREVIEW_CANVAS_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Main preview component found",
  "Unified outer canvas created",
  "Header inside unified canvas",
  "Specs strip inside unified canvas",
  "Gallery inside unified canvas",
  "Utility row inside unified canvas",
  "Large badges removed from title area",
  "Compact highlights moved below gallery",
  "Like/Share inside unified canvas",
  "Like/Share not floating",
  "Like/Share not in contact block",
  "PHOTOS tab preserved",
  "VIDEO tab preserved",
  "VIEW ALL not reintroduced",
  "Photo modal preserved",
  "Video modal preserved",
  "WhatsApp opens new tab/window",
  "Contact card not redesigned",
  "Top results card safe",
  "Mobile safe",
  "Autos Privado untouched",
  "Media upload untouched",
  "Dashboard untouched",
  "Admin untouched",
  "Stripe untouched",
  "Supabase untouched",
  "Unrelated categories untouched",
  "Build passed",
  "Ready for Chuy QA",
];

const LOCKED_PATH_PATTERNS = [
  /clasificados\/autos\/privado/i,
  /publicar\/autos/i,
  /dashboard/i,
  /admin/i,
  /stripe/i,
  /supabase\/migrations/i,
  /media-upload|MediaUpload|autosMedia/i,
  /bienes-raices/i,
  /rentas/i,
  /servicios/i,
  /restaurantes/i,
  /en-venta/i,
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function gitDiffNames(): string[] {
  try {
    const out = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).trim();
    return out ? out.split(/\r?\n/) : [];
  } catch {
    return [];
  }
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "A5.POLISH-02 audit markdown must exist");
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
  const specsGrid = read("app/(site)/clasificados/autos/negocios/components/VehicleSpecsGrid.tsx");
  const engagement = read("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewEngagementStrip.tsx");
  const gallery = read("app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx");
  const directLink = read("app/(site)/clasificados/autos/shared/components/AutosDirectContactLink.tsx");

  assert.ok(previewPage.includes('data-autos-unified-vehicle-canvas="1"'), "Unified vehicle canvas wrapper required");
  assert.ok(previewPage.includes('data-autos-unified-canvas-header="1"'), "Header inside unified canvas required");
  assert.ok(previewPage.includes('data-autos-unified-canvas-gallery="1"'), "Gallery block inside unified canvas required");
  assert.ok(previewPage.includes('data-autos-unified-canvas-utility="1"'), "Utility row inside unified canvas required");
  assert.ok(previewPage.includes('variant="canvasStrip"'), "Canvas specs strip variant required");
  assert.ok(previewPage.includes("embeddedInCanvas"), "Embedded gallery in canvas required");
  assert.ok(specsGrid.includes('data-autos-canvas-specs-strip="1"'), "Canvas specs strip marker required");
  assert.ok(specsGrid.includes('variant?: "full" | "canvasStrip"'), "VehicleSpecsGrid canvasStrip variant required");

  const canvasStart = previewPage.indexOf('data-autos-unified-vehicle-canvas="1"');
  const canvasEnd = previewPage.indexOf("{showAnalyticsStrip", canvasStart);
  assert.ok(canvasStart >= 0 && canvasEnd > canvasStart, "Unified canvas block required");
  const canvasBlock = previewPage.slice(canvasStart, canvasEnd);
  assert.ok(canvasBlock.includes("AutosNegociosPreviewEngagementStrip"), "Engagement strip inside canvas");
  assert.ok(canvasBlock.includes("AutoGallery"), "Gallery inside canvas");
  assert.ok(canvasBlock.includes("VehicleSpecsGrid") || canvasBlock.includes("canvasStrip"), "Specs inside canvas");
  assert.ok(!canvasBlock.match(/<h1[\s\S]{0,400}badges\.map/), "No badges under title in canvas header");

  assert.ok(!previewPage.includes("data-autos-post-gallery-utility"), "Old floating post-gallery utility removed");
  assert.ok(!previewPage.includes("AutosEngagementRow"), "Like/Share not in contact aside");
  assert.ok(previewPage.includes("COMPACT_BADGE_CLASS"), "Compact highlights styling preserved");
  assert.ok(previewPage.includes("Destacados") || previewPage.includes("Highlights"), "Highlights label required");

  assert.ok(engagement.includes("data-autos-gallery-utility-row"), "Gallery utility row marker required");
  assert.ok(engagement.includes("alignStart"), "Utility row left alignment support required");

  assert.ok(gallery.includes("embeddedInCanvas"), "Gallery embeddedInCanvas prop required");
  assert.ok(gallery.includes('activeTab === "photos"'), "PHOTOS tab preserved");
  assert.ok(gallery.includes('activeTab === "video"'), "VIDEO tab preserved");
  assert.ok(!gallery.includes("View all") && !gallery.includes("Ver todas"), "VIEW ALL not reintroduced");
  assert.ok(gallery.includes("lightboxIndex"), "Photo modal preserved");
  assert.ok(gallery.includes("video") && gallery.includes("modal"), "Video modal preserved");

  assert.ok(directLink.includes("wa.me"), "WhatsApp wa.me path required");
  assert.ok(directLink.includes('target="_blank"'), "WhatsApp new tab required");
  assert.ok(directLink.includes('rel="noopener noreferrer"'), "WhatsApp rel required");

  const changed = gitDiffNames();
  for (const file of changed) {
    for (const pattern of LOCKED_PATH_PATTERNS) {
      assert.ok(!pattern.test(file), `Locked path must not be modified: ${file}`);
    }
  }

  const pkg = read("package.json");
  assert.ok(
    pkg.includes("autos:a5-polish-02-negocios-unified-vehicle-preview-canvas-audit"),
    "package.json verifier script required",
  );

  console.log(`A5.POLISH-02 audit PASS (${recommendation})`);
}

run();
