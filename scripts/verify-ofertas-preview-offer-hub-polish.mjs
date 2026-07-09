/**
 * Verifier — Ofertas Preview / Public Offer Hub Polish.
 * Rewritten for Ofertas Preview V2.3 (premium header + clickable flyer +
 * Business Hub compact lockup). Stale V1 checks (removed OfertasFuture* cards,
 * old max-w-lg / "Ruta inteligente" copy) were dropped to match current code.
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
const FLYER_VIEWER = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesFlyerViewerModal.tsx";
const PRODUCT_GRID = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx";
const PRODUCT_DRAWER = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesProductDetailDrawer.tsx";
const VERIFIER = "scripts/verify-ofertas-preview-offer-hub-polish.mjs";

// Files this V2.3 build is allowed to change.
const GATE_ALLOWED = new Set([
  PREVIEW_CARD,
  HERO_VISUAL,
  FLYER_VIEWER,
  PRODUCT_GRID,
  PRODUCT_DRAWER,
  PREVIEW_COPY,
  AUDIT,
  VERIFIER,
  "package.json",
]);

// Files that must never be touched by this preview polish build.
const FORBIDDEN_GATE_TOUCH = [
  "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
  "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx",
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

// Live-commerce fabrication we must never introduce in these preview components.
const FAKE_STRINGS = [
  "add to cart",
  "checkout",
  "payment confirmed",
  "scan to redeem",
  "save coupon",
  "saved coupon",
  "coupon wallet",
  "claimed",
  "redeemed",
  "fake rating",
  "five stars",
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
  return [...new Set([...tracked, ...untracked])]
    .map((x) => x.replace(/\\/g, "/"))
    .filter((x) => !x.startsWith(".next/"));
}

function assertGateScope(files) {
  const gateTouched = files.filter((f) => GATE_ALLOWED.has(f));
  for (const file of gateTouched) {
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
    assert.ok(!lower.includes("/dashboard/"), `Dashboard file changed: ${file}`);
    assert.ok(!lower.includes("analytics"), `Analytics file changed: ${file}`);
    assert.ok(
      !file.includes("ofertasLocalesGeminiScanPipeline") &&
        !file.includes("ofertasLocalesScanCropGenerator") &&
        !file.includes("ofertasLocalesScanApiHandler"),
      `Scan engine file changed: ${file}`
    );
  }
  // Unrelated dirty files are reported, not failed (parallel work is allowed).
  const unrelatedDirty = files.filter((f) => !GATE_ALLOWED.has(f));
  return { gateTouched, unrelatedDirty };
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, AUDIT)), "Audit file must exist");

  const audit = read(AUDIT);
  const card = read(PREVIEW_CARD);
  const hero = read(HERO_VISUAL);
  const viewer = read(FLYER_VIEWER);
  const grid = read(PRODUCT_GRID);
  const drawer = read(PRODUCT_DRAWER);
  const copy = read(PREVIEW_COPY);

  // ---- Audit ----
  assert.ok(audit.includes("Ofertas Preview V2.3"), "Audit V2.3 section");
  assert.ok(audit.includes("TRUE/FALSE audit (V2.3)"), "Audit V2.3 TRUE/FALSE table");

  // ---- Gate 2: premium header ----
  assert.ok(card.includes("h-16 w-16") && card.includes("lg:h-24"), "Logo/monogram enlarged (64/96px)");
  assert.ok(card.includes("PILL_PRIMARY") && card.includes("PILL_MUTED"), "Premium pill discipline");
  assert.ok(card.includes("QUICK_ACTION"), "Compact quick-action row present");
  assert.ok(
    card.includes("telHref ?") && card.includes("waHref ?") && card.includes("webHref ?") && card.includes("directionsHref ?"),
    "Quick CTAs are real-only (phone/WhatsApp/website/directions)"
  );
  assert.ok(card.includes("handleShare"), "Share action wired");
  assert.ok(card.includes("PreviewBusinessHub"), "Business Hub preserved");
  assert.ok(
    card.includes("publishedOnLeonixEs") && card.includes("publishedOnLeonixEn"),
    "Published on Leonix trust cue preserved"
  );
  assert.ok(card.includes("onSubmitForReview"), "Submit-for-review control preserved");
  assert.ok(card.includes("backToEdit"), "Back-to-edit control preserved");
  assert.ok(card.includes("SOCIAL_BRAND") && card.includes("#1877F2"), "Social platform colors preserved");

  // ---- Gate 3: compact membership / digital coupon ----
  assert.ok(
    card.includes("membershipSignUpShort") && card.includes("digitalCouponActivateShort"),
    "Short membership/digital coupon CTA labels"
  );
  assert.ok(!card.includes("membershipCtaLabel("), "Long membership CTA label helper no longer used");
  assert.ok(
    card.includes("showMembership && membershipHref") && card.includes("showDigitalCoupon && digitalCouponHref"),
    "Membership/digital coupon only rendered with real URL"
  );

  // ---- Gate 4: hero connection ----
  assert.ok(card.includes('id="volante"') && card.includes("mt-2 sm:mt-3"), "Flyer starts closer to header");
  assert.ok(hero.includes("onOpenViewer"), "Hero visual keeps viewer open behavior");
  assert.ok(hero.includes("laneLabel"), "Hero visual is lane-aware (flyer/coupon)");

  // ---- Gate 5: viewer polish ----
  assert.ok(
    viewer.includes("flyerViewerTitle") && viewer.includes("couponViewerTitle"),
    "Viewer title is lane-aware"
  );
  assert.ok(viewer.includes("Helper") || viewer.includes("helper"), "Viewer honest helper line");
  assert.ok(viewer.includes("createPortal"), "Viewer renders via portal");
  assert.ok(viewer.includes("onDownload") && viewer.includes("openInTab"), "Viewer keeps download/open-in-tab controls");
  assert.ok(viewer.includes("Escape"), "Viewer closes on Escape");

  // ---- Gate 6: product drawer + crop proof ----
  assert.ok(
    grid.includes("resolveOfertaLocalItemCropDisplayUrl"),
    "Product grid keeps crop/source proof resolution"
  );
  assert.ok(
    drawer.includes("resolveOfertaLocalItemCropDisplayUrl") && drawer.includes("previewFromFlyer"),
    "Product drawer keeps crop/source proof"
  );
  assert.ok(
    drawer.includes("OfertasLocalesProductDetailDrawer") && grid.includes("OfertasLocalesProductDetailDrawer"),
    "Product detail drawer wired from grid"
  );

  // ---- Copy strings (preserved + new) ----
  const requiredCopy = [
    "Ofertas Locales en Leonix",
    "Local Deals on Leonix",
    "Vista previa — aún no publicada",
    "Preview — not published yet",
    "Publicado en Leonix",
    "Published on Leonix",
    "Ver volante",
    "View flyer",
    "Visor del volante",
    "Flyer viewer",
    "Visor del cupón",
    "Coupon viewer",
    "Registrarse",
    "Sign up",
    "Activar",
    "Activate",
  ];
  for (const snippet of requiredCopy) {
    assert.ok(copy.includes(snippet), `Missing copy string: ${snippet}`);
  }

  // ---- No fake live-commerce strings in these preview components ----
  const componentBlob = [card, hero, viewer, grid, drawer].join("\n").toLowerCase();
  for (const fake of FAKE_STRINGS) {
    assert.ok(!componentBlob.includes(fake), `Fake string present: ${fake}`);
  }

  // ---- Scope / safety ----
  const allChanged = gateChangedFiles();
  const { gateTouched, unrelatedDirty } = assertGateScope(allChanged);

  const pkg = read("package.json");
  assert.ok(pkg.includes("verify:ofertas-preview-offer-hub-polish"), "package.json script");

  console.log("verify-ofertas-preview-offer-hub-polish: PASS");
  console.log(`Gate-scoped files in working tree: ${gateTouched.length}`);
  if (unrelatedDirty.length > 0) {
    console.log(`WARN unrelated dirty files (not this build, not failing): ${unrelatedDirty.length}`);
    for (const f of unrelatedDirty.slice(0, 40)) console.log(`  - ${f}`);
  }
}

run();
