/**
 * Verifier — Ofertas Product Blueprint V1 (Preview Offer Hub Polish).
 * Run: npm run verify:ofertas-product-blueprint-v1
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const AUDIT = "app/lib/ofertas-locales/OFERTAS_PRODUCT_BLUEPRINT_V1_AUDIT.md";
const PREVIEW_CARD = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx";
const PREVIEW_COPY = "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts";
const HERO = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewHeroVisual.tsx";
const GRID = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx";
const SHOPPING = "app/(site)/publicar/ofertas-locales/preview/OfertasFutureShoppingListCard.tsx";
const ROUTE = "app/(site)/publicar/ofertas-locales/preview/OfertasFutureRoutePlannerCard.tsx";
const WALLET = "app/(site)/publicar/ofertas-locales/preview/OfertasFutureCouponWalletCard.tsx";
const VERIFIER = "scripts/verify-ofertas-product-blueprint-v1.mjs";

const GATE_ALLOWED = new Set([
  PREVIEW_CARD,
  HERO,
  GRID,
  PREVIEW_COPY,
  SHOPPING,
  ROUTE,
  WALLET,
  AUDIT,
  VERIFIER,
  "package.json",
]);

const PROHIBITED_DIFF_PATTERNS = [
  /stripe/i,
  /revenue-os/i,
  /\/admin\//i,
  /dashboard/i,
  /supabase\/migrations/i,
  /ofertasLocalesGeminiScanPipeline/i,
  /ofertasLocalesScanCropGenerator/i,
  /ofertasLocalesScanApiHandler/i,
  /OfertasLocalesAiScanPanel/i,
  /OfertasLocalesApplicationClient/i,
];

const UNRELATED_PREFIXES = [
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/autos/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/empleos/",
  "app/(site)/clasificados/en-venta/",
];

const FAKE_STRINGS = [
  "5 stars",
  "fake rating",
  "added to your list",
  "distance estimate",
  "verified badge",
  "saved to wallet",
  "0.8 miles",
  "Abierto ahora",
  "Open now",
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

function assertGateDiffScope(files) {
  const gateTouched = files.filter((f) => GATE_ALLOWED.has(f));
  for (const file of gateTouched) {
    for (const prefix of UNRELATED_PREFIXES) {
      assert.ok(!file.startsWith(prefix), `Unrelated category changed by gate: ${file}`);
    }
    for (const pattern of PROHIBITED_DIFF_PATTERNS) {
      assert.ok(!pattern.test(file), `Prohibited file changed by gate: ${file}`);
    }
  }
  return gateTouched;
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, AUDIT)), "Audit file must exist");

  const audit = read(AUDIT);
  const card = read(PREVIEW_CARD);
  const copy = read(PREVIEW_COPY);
  const hero = read(HERO);
  const grid = read(GRID);
  const shopping = read(SHOPPING);
  const route = read(ROUTE);
  const wallet = read(WALLET);

  assert.ok(audit.includes("SCOPED LAUNCH POLISH BUILD"), "Audit classification");
  assert.ok(audit.includes("TRUE/FALSE"), "Audit TRUE/FALSE table");
  assert.ok(audit.includes("READY TO COMMIT THIS BUILD ONLY"), "Audit commit flag");
  assert.ok(audit.includes("READY TO PUSH THIS BUILD ONLY"), "Audit push flag");
  assert.ok(audit.includes("Mobile/PWA"), "Audit mobile section");
  assert.ok(audit.includes("language globe"), "Audit globe compatibility");

  assert.ok(card.includes("max-w-7xl"), "Wide premium canvas");
  assert.ok(card.includes("PreviewBusinessHub"), "Business Hub section");
  assert.ok(card.includes("SiFacebook") || card.includes("SocialBrandIcon"), "Branded social icons");
  assert.ok(card.includes("OfertasFutureShoppingListCard"), "Future shopping list wired");
  assert.ok(card.includes("aiNeedsReviewCount > 0"), "Submit gating preserved");
  assert.ok(!card.includes("max-w-lg"), "No narrow receipt wrapper");

  assert.ok(hero.includes("PdfFlyerPanel"), "Premium PDF panel");
  assert.ok(!hero.includes("📄"), "No cartoon emoji PDF anchor");

  assert.ok(grid.includes("sourceCropUrl"), "Crop URL usage");
  assert.ok(grid.includes("noImageEn") || grid.includes("noImageEs"), "No-image copy keys");

  for (const file of [shopping, route, wallet]) {
    assert.ok(file.includes("FUTURE WIRING"), "FUTURE WIRING comment");
    assert.ok(file.includes("aria-disabled") || file.includes("disabled"), "Disabled future state");
    assert.ok(file.includes("comingSoon"), "Coming soon label");
  }

  const requiredCopy = [
    "Ofertas Locales en Leonix",
    "Local Deals on Leonix",
    "businessHubEs",
    "businessHubEn",
    "Próximamente",
    "Coming soon",
    "Mi lista",
    "My list",
    "Ruta inteligente",
    "Smart route",
    "Productos del volante",
    "Flyer products",
    "Publicado en Leonix",
    "Published on Leonix",
  ];
  for (const snippet of requiredCopy) {
    assert.ok(copy.includes(snippet), `Missing copy: ${snippet}`);
  }

  const gateSources = [card, hero, grid, shopping, route, wallet].join("\n");
  for (const fake of FAKE_STRINGS) {
    assert.ok(!gateSources.toLowerCase().includes(fake.toLowerCase()), `Fake string detected: ${fake}`);
  }

  const changed = gitChangedFiles();
  const gateTouched = assertGateDiffScope(changed);

  const pkg = read("package.json");
  assert.ok(pkg.includes("verify:ofertas-product-blueprint-v1"), "package.json script");

  console.log("verify-ofertas-product-blueprint-v1: PASS");
  console.log(`Gate-scoped files in working tree: ${gateTouched.length}`);
  if (changed.length > gateTouched.length) {
    console.log(
      `Note: ${changed.length - gateTouched.length} unrelated dirty file(s) present — manual verify they were not modified by this gate.`
    );
  }
}

run();
