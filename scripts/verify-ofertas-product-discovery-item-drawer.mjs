/**
 * Verifier — Ofertas Product Discovery + Item Detail Drawer (Gate 2 / 2A).
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
const COPY = "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts";
const VERIFIER = "scripts/verify-ofertas-product-discovery-item-drawer.mjs";

const GATE_ALLOWED = new Set([GRID, DRAWER, COPY, AUDIT, VERIFIER]);

const PROHIBITED = [
  "OfertasLocalesApplicationClient.tsx",
  "OfertasLocalesAiScanPanel.tsx",
  "OfertasLocalesAiScanReviewWorkspace.tsx",
  "OfertasLocalesAiItemReviewPanel.tsx",
  "OfertasLocalesPreviewCard.tsx",
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
  const prohibitedTouched = files.filter(
    (f) =>
      !GATE_ALLOWED.has(f) &&
      (f.startsWith("app/(site)/publicar/ofertas-locales/preview/") ||
        f.includes("ofertas-locales"))
  );
  for (const file of prohibitedTouched) {
    for (const p of PROHIBITED) {
      if (file.includes(p)) {
        assert.fail(`Prohibited Ofertas file changed: ${file}`);
      }
    }
    if (file.includes("OfertasLocalesPreviewCard")) {
      assert.fail(`Locked PreviewCard changed: ${file}`);
    }
  }
  for (const file of gateTouched) {
    for (const p of PROHIBITED) {
      assert.ok(!file.includes(p), `Prohibited file changed: ${file}`);
    }
  }
  return gateTouched;
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, AUDIT)), "Audit file must exist");
  assert.ok(fs.existsSync(path.join(ROOT, DRAWER)), "Drawer component must exist");

  const audit = read(AUDIT);
  const grid = read(GRID);
  const drawer = read(DRAWER);
  const copy = read(COPY);

  assert.ok(audit.includes("SCOPED PRODUCT INTERACTION BUILD"), "Gate 2 classification");
  assert.ok(audit.includes("Gate 2A"), "Gate 2A section");
  assert.ok(audit.includes("Brand mapping"), "Brand mapping");
  assert.ok(audit.includes("no emoji"), "No emoji documented");
  assert.ok(audit.includes("TRUE/FALSE"), "Audit table");
  assert.ok(audit.includes("READY TO COMMIT THIS BUILD ONLY"), "Commit flag");
  assert.ok(audit.includes("Future public URL plan"), "Public route plan");

  assert.ok(grid.includes("OfertasLocalesProductDetailDrawer"), "Grid uses drawer");
  assert.ok(grid.includes("searchQuery"), "Search state");
  assert.ok(grid.includes("loadMoreProducts"), "Load more copy key");
  assert.ok(grid.includes("visibleCount"), "Progressive display");
  assert.ok(grid.includes("viewDetails"), "View details button");
  assert.ok(grid.includes("syncOfertasPreviewItemParam"), "Item URL foundation");
  assert.ok(grid.includes("react-icons/fi"), "Grid uses react-icons for polish");
  assert.ok(grid.includes("FiSearch"), "Search icon");
  assert.ok(grid.includes("FiEye"), "Detail CTA icon");

  assert.ok(drawer.includes('role="dialog"'), "Dialog semantics");
  assert.ok(drawer.includes("aria-modal"), "Aria modal");
  assert.ok(drawer.includes("FUTURE WIRING"), "Future wiring in drawer");
  assert.ok(drawer.includes("disabled"), "Disabled future actions");
  assert.ok(drawer.includes("react-icons/fi"), "Drawer uses react-icons");

  const requiredCopy = [
    "searchProductsEs",
    "searchProductsEn",
    "viewDetailsEs",
    "viewDetailsEn",
    "loadMoreProductsEs",
    "loadMoreProductsEn",
    "shareProductEs",
    "shareProductEn",
    "noFilterMatchesEs",
    "noFilterMatchesEn",
  ];
  for (const snippet of requiredCopy) {
    assert.ok(copy.includes(snippet), `Missing copy: ${snippet}`);
  }

  const sources = [grid, drawer].join("\n").toLowerCase();
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
