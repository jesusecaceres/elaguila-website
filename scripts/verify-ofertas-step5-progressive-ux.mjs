/**
 * Verifier — Ofertas Step 5 progressive upload / scan / review UX.
 * Run: npm run verify:ofertas-step5-progressive-ux
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const AUDIT = "app/lib/ofertas-locales/OFERTAS_STEP5_PROGRESSIVE_UX_AUDIT.md";
const APP = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const SCAN_PANEL = "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx";
const COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/ofertas-locales/preview/",
  "app/api/ofertas-locales/scan/",
  "app/api/ofertas-locales/items/",
  "supabase/migrations/",
];

const UNRELATED_CATEGORY_PREFIXES = [
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/autos/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/empleos/",
  "app/(site)/clasificados/en-venta/",
];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function gateChangedFiles() {
  let tracked = [];
  let untracked = [];
  try {
    tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    tracked = [];
  }
  try {
    untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    untracked = [];
  }
  const allowed = new Set([
    APP,
    SCAN_PANEL,
    COPY,
    AUDIT,
    "scripts/verify-ofertas-step5-progressive-ux.mjs",
    "package.json",
  ]);
  return [...new Set([...tracked, ...untracked])]
    .map((x) => x.replace(/\\/g, "/"))
    .filter((file) => allowed.has(file) || file.startsWith("app/(site)/publicar/ofertas-locales/"));
}

function assertGateScope(files) {
  for (const file of files) {
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!file.startsWith(prefix), `Forbidden path changed by gate: ${file}`);
    }
    for (const prefix of UNRELATED_CATEGORY_PREFIXES) {
      assert.ok(!file.startsWith(prefix), `Unrelated category changed by gate: ${file}`);
    }
    const lower = file.toLowerCase();
    assert.ok(!lower.includes("stripe"), `Stripe file changed: ${file}`);
    assert.ok(!lower.includes("/admin/"), `Admin file changed: ${file}`);
    assert.ok(!lower.includes("analytics"), `Analytics file changed: ${file}`);
    assert.ok(
      !file.includes("ofertasLocalesGeminiScanPipeline") &&
        !file.includes("ofertasLocalesScanCropGenerator") &&
        !file.includes("ofertasLocalesScanApiHandler"),
      `Scan engine file changed: ${file}`
    );
  }
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, AUDIT)), "Audit file must exist");

  const audit = read(AUDIT);
  const app = read(APP);
  const scan = read(SCAN_PANEL);
  const copy = read(COPY);

  assert.ok(audit.includes("SCOPED UX POLISH BUILD"), "Audit classification");
  assert.ok(audit.includes("Step 5 has upload checkpoint"), "Audit TRUE/FALSE rows");

  assert.ok(app.includes("Step5CheckpointCard"), "Application: checkpoint card component");
  assert.ok(app.includes("step5UploadComplete"), "Application: upload complete state");
  assert.ok(app.includes("step5ScanComplete"), "Application: scan complete state");
  assert.ok(app.includes("step5ReviewComplete"), "Application: review complete state");
  assert.ok(app.includes("step5ActiveCheckpoint"), "Application: active checkpoint");
  assert.ok(app.includes("scrollToReviewWorkbench"), "Application: workbench scroll");
  assert.ok(app.includes("reviewWorkbenchRef"), "Application: workbench ref");
  assert.ok(app.includes("step5CheckpointUploadTitle") || app.includes("step5CheckpointScanTitle"), "Application: copy keys");

  assert.ok(scan.includes("compactMode"), "Scan panel: compactMode prop");
  assert.ok(scan.includes("scanComplete"), "Scan panel: scanComplete prop");
  assert.ok(scan.includes("singleAssetMode"), "Scan panel: single asset handling");
  assert.ok(
    scan.includes("sortedAssets.length > 0 && !singleAssetMode"),
    "Scan panel: hides per-file list for single compact asset"
  );
  assert.ok(
    scan.includes("sortedAssets.length === 1 && !scanComplete"),
    "Scan panel: single bottom primary CTA"
  );

  assert.ok(copy.includes("step5CheckpointUploadTitle"), "Copy ES/EN: upload checkpoint");
  assert.ok(copy.includes("1. Upload flyer"), "Copy EN: upload title");
  assert.ok(copy.includes("1. Subir volante"), "Copy ES: upload title");
  assert.ok(copy.includes("Review products"), "Copy EN: review CTA");
  assert.ok(copy.includes("Revisar productos"), "Copy ES: review CTA");

  const gateFiles = gateChangedFiles();
  const gateTouched = gateFiles.filter((f) =>
    [APP, SCAN_PANEL, COPY, AUDIT, "scripts/verify-ofertas-step5-progressive-ux.mjs", "package.json"].includes(f)
  );
  assertGateScope(gateTouched);

  const pkg = read("package.json");
  assert.ok(pkg.includes("verify:ofertas-step5-progressive-ux"), "package.json script");

  console.log("verify-ofertas-step5-progressive-ux: PASS");
  console.log(`Gate-scoped files checked: ${gateTouched.length}`);
}

run();
