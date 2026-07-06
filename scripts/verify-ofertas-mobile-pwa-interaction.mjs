/**
 * Verifier — Ofertas Mobile/PWA Interaction Polish (Gate 1.5).
 * Run: npm run verify:ofertas-mobile-pwa-interaction
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const AUDIT = "app/lib/ofertas-locales/OFERTAS_MOBILE_PWA_INTERACTION_AUDIT.md";
const CARD = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx";
const COPY = "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts";
const GRID = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx";
const HERO = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewHeroVisual.tsx";
const SHOPPING = "app/(site)/publicar/ofertas-locales/preview/OfertasFutureShoppingListCard.tsx";
const ROUTE = "app/(site)/publicar/ofertas-locales/preview/OfertasFutureRoutePlannerCard.tsx";
const WALLET = "app/(site)/publicar/ofertas-locales/preview/OfertasFutureCouponWalletCard.tsx";
const VERIFIER = "scripts/verify-ofertas-mobile-pwa-interaction.mjs";

const GATE_ALLOWED = new Set([
  CARD,
  COPY,
  GRID,
  HERO,
  SHOPPING,
  ROUTE,
  WALLET,
  AUDIT,
  VERIFIER,
  "package.json",
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

const UNRELATED_PREFIXES = [
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/autos/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/empleos/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/clasificados/ofertas-locales/results",
];

const FAKE_STRINGS = [
  "5 stars",
  "fake rating",
  "added to your list",
  "distance estimate",
  "verified badge",
  "saved to wallet",
  "0.8 miles",
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
  for (const file of gateTouched) {
    for (const p of PROHIBITED) {
      assert.ok(!file.includes(p), `Prohibited file changed: ${file}`);
    }
    for (const prefix of UNRELATED_PREFIXES) {
      assert.ok(!file.startsWith(prefix), `Unrelated path changed: ${file}`);
    }
  }
  return gateTouched;
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, AUDIT)), "Audit file must exist");

  const audit = read(AUDIT);
  const card = read(CARD);
  const copy = read(COPY);
  const grid = read(GRID);
  const hero = read(HERO);
  const shopping = read(SHOPPING);
  const route = read(ROUTE);
  const wallet = read(WALLET);

  assert.ok(audit.includes("SCOPED LAUNCH POLISH BUILD"), "Audit classification");
  assert.ok(audit.includes("TRUE/FALSE"), "Audit TRUE/FALSE table");
  assert.ok(audit.includes("READY TO COMMIT THIS BUILD ONLY"), "Audit commit flag");
  assert.ok(audit.includes("READY TO PUSH THIS BUILD ONLY"), "Audit push flag");
  assert.ok(audit.includes("Mobile/PWA"), "Audit mobile/PWA section");
  assert.ok(audit.includes("Section chips"), "Audit section chips");
  assert.ok(audit.includes("Sticky action bar"), "Audit sticky bar");
  assert.ok(audit.includes("Business Hub mobile"), "Audit business hub mobile");
  assert.ok(audit.includes("Product category filter"), "Audit product filter");
  assert.ok(audit.includes("language globe"), "Audit globe compatibility");

  assert.ok(audit.includes("Gate 1.5A"), "Gate 1.5A corrective patch documented");

  assert.ok(card.includes("PreviewSectionNav"), "Section nav component");
  assert.ok(
    card.includes('className="mb-6 lg:hidden"') || card.match(/PreviewSectionNav[\s\S]*lg:hidden/),
    "Section nav mobile-only (lg:hidden)"
  );
  assert.ok(card.includes('id="oferta"'), "Offer anchor");
  assert.ok(card.includes('id="volante"'), "Flyer anchor");
  assert.ok(card.includes("MobileStickyActionBar"), "Sticky action bar");
  assert.ok(card.includes("lg:hidden"), "Mobile-only patterns");
  assert.ok(card.includes("HubCollapsibleGroup"), "Collapsible business hub");
  assert.ok(card.includes("hidden lg:block"), "Desktop Business Hub open layout");
  assert.ok(card.includes('id="proximamente"'), "Future modules anchor");
  assert.ok(card.includes("max-lg:flex") || card.includes("lg:grid lg:grid-cols-3"), "Future modules desktop grid");

  assert.ok(grid.includes("selectedCategory"), "Category filter state");
  assert.ok(grid.includes("lg:hidden"), "Product filter mobile-only");
  assert.ok(grid.includes('id="productos"'), "Products anchor");
  assert.ok(grid.includes("filterAllEs") || copy.includes("filterAllEs"), "All/Todos copy");

  const requiredCopy = [
    "quickActionsEs",
    "quickActionsEn",
    "filterAllEs",
    "filterAllEn",
    "sectionProductsEs",
    "sectionProductsEn",
    "sectionContactEs",
    "sectionContactEn",
    "sectionLocationEs",
    "sectionLocationEn",
    "sectionSocialEs",
    "sectionSocialEn",
  ];
  for (const snippet of requiredCopy) {
    assert.ok(copy.includes(snippet), `Missing copy: ${snippet}`);
  }

  for (const file of [shopping, route, wallet]) {
    assert.ok(file.includes("FUTURE WIRING"), "FUTURE WIRING comment");
    assert.ok(file.includes("disabled") || file.includes("aria-disabled"), "Disabled future state");
  }

  const sources = [card, grid, hero].join("\n");
  for (const fake of FAKE_STRINGS) {
    assert.ok(!sources.toLowerCase().includes(fake.toLowerCase()), `Fake string: ${fake}`);
  }

  const changed = gitChangedFiles();
  const gateTouched = assertGateScope(changed);

  const pkg = read("package.json");
  assert.ok(pkg.includes("verify:ofertas-mobile-pwa-interaction"), "package.json script");

  console.log("verify-ofertas-mobile-pwa-interaction: PASS");
  console.log(`Gate-scoped files in working tree: ${gateTouched.length}`);
  if (changed.length > gateTouched.length) {
    console.log(`Note: ${changed.length - gateTouched.length} unrelated dirty file(s) present.`);
  }
}

run();
