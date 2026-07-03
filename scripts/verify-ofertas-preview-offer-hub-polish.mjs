/**
 * Verifier — Ofertas Preview / Public Offer Hub Polish.
 * Run: npm run verify:ofertas-preview-offer-hub-polish
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const AUDIT = "app/lib/ofertas-locales/OFERTAS_PREVIEW_OFFER_HUB_POLISH_AUDIT.md";
const PREVIEW_CLIENT = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx";
const PREVIEW_CARD = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx";
const PREVIEW_COPY = "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts";
const PREVIEW_HELPERS = "app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts";
const HERO_VISUAL = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewHeroVisual.tsx";
const PRODUCT_GRID = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx";
const SHOPPING_LIST = "app/(site)/publicar/ofertas-locales/preview/OfertasFutureShoppingListCard.tsx";
const ROUTE_PLANNER = "app/(site)/publicar/ofertas-locales/preview/OfertasFutureRoutePlannerCard.tsx";
const COUPON_WALLET = "app/(site)/publicar/ofertas-locales/preview/OfertasFutureCouponWalletCard.tsx";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const SCAN_PANEL = "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx";
const VERIFIER = "scripts/verify-ofertas-preview-offer-hub-polish.mjs";

const GATE_ALLOWED = new Set([
  PREVIEW_CLIENT,
  PREVIEW_CARD,
  PREVIEW_COPY,
  PREVIEW_HELPERS,
  HERO_VISUAL,
  PRODUCT_GRID,
  SHOPPING_LIST,
  ROUTE_PLANNER,
  COUPON_WALLET,
  "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewAssetCards.tsx",
  AUDIT,
  VERIFIER,
  "package.json",
]);

const FORBIDDEN_GATE_TOUCH = [
  APP_CLIENT,
  SCAN_PANEL,
  "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx",
  "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
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
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function assertGateScope(files) {
  const gateTouched = files.filter((f) => GATE_ALLOWED.has(f));
  for (const file of files) {
    if (!gateTouched.includes(file)) continue;
    for (const forbidden of FORBIDDEN_GATE_TOUCH) {
      assert.notEqual(file, forbidden, `Locked file changed by gate: ${file}`);
    }
    for (const prefix of UNRELATED_CATEGORY_PREFIXES) {
      assert.ok(!file.startsWith(prefix), `Unrelated category changed by gate: ${file}`);
    }
    assert.ok(!file.startsWith("app/api/ofertas-locales/scan/"), `Scan API changed: ${file}`);
    assert.ok(!file.startsWith("supabase/migrations/"), `Migration added: ${file}`);
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
  return gateTouched;
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, AUDIT)), "Audit file must exist");

  const audit = read(AUDIT);
  const card = read(PREVIEW_CARD);
  const copy = read(PREVIEW_COPY);
  const shopping = read(SHOPPING_LIST);
  const route = read(ROUTE_PLANNER);
  const wallet = read(COUPON_WALLET);

  assert.ok(audit.includes("SCOPED LAUNCH POLISH BUILD"), "Audit classification");
  assert.ok(audit.includes("TRUE/FALSE/PARTIAL"), "Audit TRUE/FALSE table");

  assert.ok(!card.includes("max-w-lg"), "Preview card must not use max-w-lg as main wrapper");
  assert.ok(card.includes("max-w-[1240px]") || card.includes("max-w-"), "Preview uses wide container");
  assert.ok(card.includes("OfertasLocalesPreviewHeroVisual"), "Hero visual component wired");
  assert.ok(card.includes("OfertasLocalesPreviewProductGrid"), "Product grid wired");
  assert.ok(card.includes("OfertasFutureShoppingListCard"), "Shopping list placeholder wired");
  assert.ok(card.includes("OfertasFutureRoutePlannerCard"), "Route planner placeholder wired");
  assert.ok(card.includes("OfertasFutureCouponWalletCard"), "Coupon wallet placeholder wired");

  assert.ok(shopping.includes("OfertasFutureShoppingListCard"), "Shopping list component name");
  assert.ok(route.includes("OfertasFutureRoutePlannerCard"), "Route planner component name");
  assert.ok(wallet.includes("OfertasFutureCouponWalletCard"), "Coupon wallet component name");
  assert.ok(shopping.includes("FUTURE WIRING"), "Shopping list FUTURE WIRING");
  assert.ok(route.includes("FUTURE WIRING"), "Route planner FUTURE WIRING");
  assert.ok(wallet.includes("FUTURE WIRING"), "Coupon wallet FUTURE WIRING");

  const requiredCopy = [
    "Ofertas Locales en Leonix",
    "Local Deals on Leonix",
    "Vista previa — aún no publicada",
    "Preview — not published yet",
    "Publicado en Leonix",
    "Published on Leonix",
    "Ver volante",
    "View flyer",
    "Ver oferta",
    "View offer",
    "Compartir",
    "Share",
    "Cómo llegar",
    "Directions",
    "Contactar negocio",
    "Contact business",
    "Síguenos",
    "Follow us",
    "Opiniones",
    "Reviews",
    "Productos del volante",
    "Flyer products",
    "Mi lista",
    "My list",
    "Ruta inteligente",
    "Smart route",
    "Próximamente",
    "Coming soon",
  ];
  for (const snippet of requiredCopy) {
    assert.ok(copy.includes(snippet), `Missing copy string: ${snippet}`);
  }

  assert.ok(card.includes("submitForReview") || card.includes("onSubmitForReview"), "Submit control preserved");
  assert.ok(card.includes("backToEdit") || card.includes("Volver a editar") || copy.includes("backToEdit"), "Back to edit preserved");

  const allChanged = gateChangedFiles();
  const gateTouched = assertGateScope(allChanged);

  const pkg = read("package.json");
  assert.ok(pkg.includes("verify:ofertas-preview-offer-hub-polish"), "package.json script");

  console.log("verify-ofertas-preview-offer-hub-polish: PASS");
  console.log(`Gate-scoped files in working tree: ${gateTouched.length}`);
}

run();
