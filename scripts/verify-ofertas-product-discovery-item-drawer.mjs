/**
 * Verifier — Ofertas Product Discovery + Item Drawer (Gate 2 / 2A / 2B-3).
 * Run: npm run verify:ofertas-product-discovery-item-drawer
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const AUDIT = "app/lib/ofertas-locales/OFERTAS_PRODUCT_DISCOVERY_ITEM_DRAWER_AUDIT.md";
const GRID = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx";
const DRAWER = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesProductDetailDrawer.tsx";
const CARD = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx";
const HERO = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewHeroVisual.tsx";
const PDF_PREVIEW = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPdfFlyerPreview.tsx";
const MAP_PREVIEW = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesMiniMapPreview.tsx";
const COPY = "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts";
const HELPERS = "app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts";
const VERIFIER = "scripts/verify-ofertas-product-discovery-item-drawer.mjs";

const GATE_ALLOWED = new Set([
  GRID,
  DRAWER,
  CARD,
  HERO,
  PDF_PREVIEW,
  MAP_PREVIEW,
  COPY,
  HELPERS,
  AUDIT,
  VERIFIER,
]);

const PROHIBITED = [
  "OfertasLocalesApplicationClient.tsx",
  "OfertasLocalesAiScanPanel.tsx",
  "OfertasLocalesAiScanReviewWorkspace.tsx",
  "OfertasLocalesAiItemReviewPanel.tsx",
  "app/api/",
  "supabase/migrations",
  "stripe",
  "revenue-os",
  "/admin/",
  "dashboard",
];

const FAKE_STRINGS = [
  "in stock",
  "added to your list",
  "added to list",
  "saved coupon",
  "5 stars",
  "verified badge",
  "distance estimate",
  "order online",
  "open now",
];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function gitChangedFiles() {
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
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function assertGateScope(files) {
  const gateTouched = files.filter((f) => GATE_ALLOWED.has(f));
  const ofertasOutsideGate = files.filter(
    (f) =>
      !GATE_ALLOWED.has(f) &&
      (f.startsWith("app/(site)/publicar/ofertas-locales/") || f.includes("ofertas-locales"))
  );
  for (const file of ofertasOutsideGate) {
    for (const p of PROHIBITED) {
      if (file.includes(p)) {
        assert.fail(`Prohibited Ofertas file changed: ${file}`);
      }
    }
  }
  for (const file of gateTouched) {
    for (const p of PROHIBITED) {
      assert.ok(!file.includes(p), `Prohibited file changed: ${file}`);
    }
    if (file.startsWith("app/(site)/clasificados/")) {
      assert.fail(`Unrelated category changed: ${file}`);
    }
  }
  return gateTouched;
}

function assertRectangularMainCtas(label, content) {
  const patterns = ["BTN_PRIMARY", "BTN_OUTLINE", "BTN_DETAIL", "BTN_SECONDARY", "BTN_WHATSAPP"];
  for (const name of patterns) {
    const re = new RegExp(`${name}\\s*=\\s*"([^"]+)"`);
    const match = content.match(re);
    if (!match) continue;
    assert.ok(!match[1].includes("rounded-full"), `${label} ${name} must not use rounded-full`);
    assert.ok(match[1].includes("rounded-lg"), `${label} ${name} should use rounded-lg`);
  }
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, AUDIT)), "Audit file must exist");
  assert.ok(fs.existsSync(path.join(ROOT, DRAWER)), "Drawer component must exist");
  assert.ok(fs.existsSync(path.join(ROOT, PDF_PREVIEW)), "PdfFlyerPreview must exist");

  const audit = read(AUDIT);
  const grid = read(GRID);
  const drawer = read(DRAWER);
  const card = read(CARD);
  const hero = read(HERO);
  const pdfPreview = read(PDF_PREVIEW);
  const mapPreview = read(MAP_PREVIEW);
  const copy = read(COPY);
  const helpers = read(HELPERS);

  assert.ok(audit.includes("SCOPED PRODUCT INTERACTION BUILD"), "Gate 2 classification");
  assert.ok(audit.includes("Gate 2B/3"), "Gate 2B/3 section");
  assert.ok(audit.includes("Actual flyer rendering"), "Real flyer documented");
  assert.ok(audit.includes("CTA design system correction"), "CTA correction documented");
  assert.ok(audit.includes("Location / map preview"), "Map documented");
  assert.ok(audit.includes("Owner controls near top"), "Owner top controls documented");
  assert.ok(audit.includes("sourceCropUrl"), "Source crop truth documented");
  assert.ok(audit.includes("no fake"), "No fake crop documented");
  assert.ok(audit.includes("TRUE/FALSE"), "Audit table");
  assert.ok(audit.includes("READY TO COMMIT THIS BUILD ONLY"), "Commit flag");

  assert.ok(hero.includes("OfertasLocalesPdfFlyerPreview"), "Hero uses PDF preview component");
  assert.ok(pdfPreview.includes("pdfjs-dist/legacy/build/pdf.mjs"), "PDF preview uses pdfjs-dist");

  assert.ok(card.includes("OwnerPreviewControls"), "Owner top controls");
  assert.ok(card.includes("BTN_WHATSAPP"), "WhatsApp green CTA");
  assert.ok(card.includes("OfertasLocalesMiniMapPreview"), "Map preview in hub");
  assert.ok(mapPreview.includes("buildOfertaLocalPreviewMapEmbedUrl"), "Map embed helper used");
  assert.ok(mapPreview.includes("<iframe"), "Map iframe embed");

  assert.ok(grid.includes("OfertasLocalesProductDetailDrawer"), "Grid uses drawer");
  assert.ok(grid.includes("searchQuery"), "Search state");
  assert.ok(grid.includes("noClipYetEn"), "No clip yet label");
  assert.ok(grid.includes("syncOfertasPreviewItemParam"), "Item URL foundation");

  assert.ok(drawer.includes('role="dialog"'), "Dialog semantics");
  assert.ok(drawer.includes("aria-modal"), "Aria modal");
  assert.ok(drawer.includes("FUTURE WIRING"), "Future wiring in drawer");
  assert.ok(drawer.includes("viewSourceOnFlyerEn"), "Source on flyer link");
  assert.ok(drawer.includes("disabled"), "Disabled future actions");

  assertRectangularMainCtas("grid", grid);
  assertRectangularMainCtas("drawer", drawer);
  assertRectangularMainCtas("hero", hero);

  const requiredCopy = [
    "flyerPreviewEs",
    "flyerRenderingEs",
    "flyerRenderFailedEs",
    "viewSourceOnFlyerEs",
    "quickMapViewEs",
    "previewControlsEs",
    "noClipYetEs",
  ];
  for (const snippet of requiredCopy) {
    assert.ok(copy.includes(snippet), `Missing copy: ${snippet}`);
  }

  assert.ok(helpers.includes("buildOfertaLocalPreviewMapEmbedUrl"), "Map embed helper");

  const sources = [grid, drawer, card].join("\n").toLowerCase();
  for (const fake of FAKE_STRINGS) {
    assert.ok(!sources.includes(fake.toLowerCase()), `Fake string: ${fake}`);
  }

  const changed = gitChangedFiles();
  const gateTouched = assertGateScope(changed);

  const pkg = read("package.json");
  assert.ok(pkg.includes("verify:ofertas-product-discovery-item-drawer"), "package.json script");

  console.log("verify-ofertas-product-discovery-item-drawer: PASS");
  console.log(`Gate-scoped files in working tree: ${gateTouched.length}`);
}

run();
