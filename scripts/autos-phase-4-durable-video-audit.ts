/**
 * Autos Phase 4 — durable video audit gate (no DB / no Stripe).
 * Run: npm run autos:phase4-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const TABLE_ROWS = [
  "Autos preview can still use local video before publish",
  "Final publish payload avoids videoFileDataUrl",
  "Final publish payload avoids giant base64/blob video",
  "Published public listing does not depend on local/blob video",
  "Durable video fields are used publicly if available",
  "Mux/upload infrastructure was reused if available",
  "Video failure does not block publish unless video is required",
  "Video failure is surfaced as warning/diagnostic if applicable",
  "Listing still publishes without optional video",
  "No fake video playback was added",
  "No unrelated categories were touched",
  "npm run build passed",
] as const;

const DISALLOW_STRIPE_PATH_SUBSTR = ["app/api/stripe/", "app/lib/stripe", "middleware/stripe"];
const DISALLOW_I18N_PATH_SUBSTR = ["next-intl", "app/i18n", "messages/", "locales/"];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function assertScopedGitDiffCleanForPhase4() {
  const pathspecs = [
    "app/(site)/clasificados/autos",
    "app/(site)/publicar/autos",
    "app/lib/clasificados/autos",
    "app/api/clasificados/autos",
    "app/admin/(dashboard)/workspace/clasificados/autos",
    "e2e/autos",
    "playwright.autos-runtime.config.mjs",
    "scripts/autos",
    "package.json",
  ];
  const gr = spawnSync("git", ["diff", "--name-only", "HEAD", "--", ...pathspecs], { encoding: "utf8", cwd: ROOT });
  if (gr.status !== 0 || !gr.stdout?.trim()) return;
  const files = gr.stdout
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowRe =
    /^(app\/\(site\)\/(clasificados\/autos|publicar\/autos)\/|app\/lib\/clasificados\/autos\/|app\/api\/clasificados\/autos\/|app\/admin\/\(dashboard\)\/workspace\/clasificados\/autos\/|e2e\/autos\/|playwright\.autos-runtime\.config\.mjs|scripts\/autos-|package\.json$)/;
  for (const f of files) {
    const rel = f.replace(/\\/g, "/");
    assert.ok(allowRe.test(rel), `Unexpected modified file in scoped Phase 4 git diff: ${rel}`);
    for (const d of DISALLOW_STRIPE_PATH_SUBSTR) assert.ok(!rel.includes(d), `Stripe-global path must not change: ${rel}`);
    for (const d of DISALLOW_I18N_PATH_SUBSTR) assert.ok(!rel.includes(d), `Global i18n path must not change: ${rel}`);
  }
}

function run() {
  const mdPath = "app/lib/clasificados/autos/AUTOS_PHASE_4_DURABLE_VIDEO_AUDIT.md";
  assert.ok(fs.existsSync(path.join(ROOT, mdPath.replace(/\//g, path.sep))), "Phase 4 audit markdown must exist");
  const md = read(mdPath);
  assert.ok(md.includes("| Requirement | TRUE/FALSE | Evidence |"), "Phase 4 audit must include TRUE/FALSE table header");
  for (const row of TABLE_ROWS) {
    assert.ok(md.includes(row), `TRUE/FALSE table must include row: ${row}`);
  }

  assert.ok(
    fs.existsSync(path.join(ROOT, "app", "lib", "clasificados", "autos", "AUTOS_PHASE_3_PUBLISH_RECOVERY_AUDIT.md")),
    "Phase 3 publish recovery audit must remain present",
  );

  const persist = read("app/lib/clasificados/autos/autosListingPayloadPersistence.ts");
  assert.ok(
    persist.includes("video_file_data_url_stripped_for_persistence") && persist.includes("videoFileDataUrl"),
    "Persistence helper must document stripping videoFileDataUrl",
  );

  const gallery = read("app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx");
  assert.ok(gallery.includes("publicPlaybackOnly"), "AutoGallery must support publicPlaybackOnly");
  assert.ok(
    gallery.includes("resolvePublishedAutosVideoPlayback") && gallery.includes("StreamableAutosVideo"),
    "Public gallery must resolve durable playback + stream HLS/progressive",
  );
  const idxPublished = gallery.indexOf("function PublishedVideoTile");
  assert.ok(idxPublished >= 0, "PublishedVideoTile must exist in AutoGallery");
  assert.ok(
    !gallery.slice(idxPublished).includes("videoFileDataUrl"),
    "Published video tile implementation must not reference videoFileDataUrl",
  );

  const videoHelpers = read("app/(site)/clasificados/autos/negocios/lib/autoDealerVideo.ts");
  assert.ok(
    videoHelpers.includes("resolvePublishedAutosVideoPlayback") && videoHelpers.includes('startsWith("blob:")'),
    "Published resolver must reject blob/data video URLs",
  );

  const svc = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  assert.ok(!svc.includes("stripDraftMuxFields"), "Listing service must persist mux fields (no stripDraftMuxFields)");

  assertScopedGitDiffCleanForPhase4();

  console.log("autos-phase-4-durable-video-audit: OK");
}

run();
