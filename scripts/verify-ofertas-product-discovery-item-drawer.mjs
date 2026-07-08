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
const GEMINI_PROMPT = "app/lib/ofertas-locales/ofertasLocalesGeminiPrompt.ts";
const GEMINI_VALIDATOR = "app/lib/ofertas-locales/ofertasLocalesGeminiCandidateValidator.ts";
const GEMINI_NORMALIZER = "app/lib/ofertas-locales/ofertasLocalesGeminiNormalizer.ts";
const TYPES = "app/lib/ofertas-locales/ofertasLocalesTypes.ts";
const ITEM_MAPPER = "app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts";
const PRODUCT_TAXONOMY = "app/lib/ofertas-locales/ofertasLocalesProductTaxonomy.ts";
const REVIEW_PANEL = "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx";
const APP_COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";
const CROP_PREVIEW = "app/(site)/publicar/ofertas-locales/preview/OfertasFlyerCropPreview.tsx";
const PDF_ITEM_CROP = "app/(site)/publicar/ofertas-locales/preview/OfertasPdfItemCropPreview.tsx";
const PDF_RENDER_UTILS = "app/(site)/publicar/ofertas-locales/preview/ofertasPdfRenderUtils.ts";
const MOBILE_RAIL = "app/(site)/components/mobile/LeonixMobileScrollRail.tsx";
const MOBILE_BOTTOM_SHEET = "app/(site)/components/mobile/LeonixMobileBottomSheet.tsx";
const MOBILE_SHELL = "app/(site)/components/mobile/LeonixResponsiveShell.tsx";
const MOBILE_STICKY_BAR = "app/(site)/components/mobile/LeonixStickyActionBar.tsx";

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
  GEMINI_PROMPT,
  GEMINI_VALIDATOR,
  GEMINI_NORMALIZER,
  TYPES,
  ITEM_MAPPER,
  PRODUCT_TAXONOMY,
  REVIEW_PANEL,
  APP_COPY,
  CROP_PREVIEW,
  PDF_ITEM_CROP,
  PDF_RENDER_UTILS,
  MOBILE_RAIL,
  MOBILE_BOTTOM_SHEET,
  MOBILE_SHELL,
  MOBILE_STICKY_BAR,
]);

const PROHIBITED = [
  "OfertasLocalesApplicationClient.tsx",
  "OfertasLocalesAiScanPanel.tsx",
  "OfertasLocalesAiScanReviewWorkspace.tsx",
  "app/api/",
  "supabase/migrations",
  "stripe",
  "revenue-os",
  "/admin/",
  "dashboard",
];

const FAKE_STRINGS = [
  "buy now",
  "in stock",
  "added to your list",
  "added to list",
  "saved coupon",
  "5 stars",
  "verified badge",
  "distance estimate",
  "order online",
  "open now",
  "best route",
  "agregar a mi lista",
  "guardar cupón",
  "guardar cupon",
  "mi lista",
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
  assert.ok(audit.includes("Gate 4B"), "Gate 4B section");
  assert.ok(audit.includes("extracted_json.commerceMetadata"), "Commerce metadata storage documented");
  assert.ok(audit.includes("Gate 4C"), "Gate 4C section");
  assert.ok(audit.includes("Gate 4C Repair"), "Gate 4C Repair section");
  assert.ok(
    audit.includes("Global Mobile/PWA Foundation V1"),
    "Global Mobile/PWA Foundation V1 section"
  );
  assert.ok(audit.includes("Ofertas Mobile Density V1"), "Ofertas Mobile Density V1 section");
  assert.ok(audit.includes("TRUE/FALSE"), "Audit table");
  assert.ok(audit.includes("READY TO COMMIT THIS BUILD ONLY"), "Commit flag");

  const cropPreview = read(CROP_PREVIEW);
  const itemMapper = read(ITEM_MAPPER);

  assert.ok(
    itemMapper.includes("getOfertaLocalCssCropStyle"),
    "CSS crop style helper"
  );
  assert.ok(
    itemMapper.includes("resolveOfertaLocalInstantCropImageSource"),
    "Instant crop image source helper"
  );
  assert.ok(itemMapper.includes("clamp01"), "bbox clamp helper");
  assert.ok(itemMapper.includes(".pdf"), "PDF asset rejection guard");
  assert.ok(
    cropPreview.includes("getOfertaLocalCssCropStyle"),
    "Crop preview uses CSS crop helper"
  );
  assert.ok(!cropPreview.includes("toDataURL"), "No canvas dataURL in crop preview");
  assert.ok(!cropPreview.includes("base64"), "No base64 in crop preview");

  // Gate 4C Repair — PDF item crop renderer
  assert.ok(fs.existsSync(path.join(ROOT, PDF_ITEM_CROP)), "PDF item crop component must exist");
  const pdfItemCrop = read(PDF_ITEM_CROP);
  assert.ok(pdfItemCrop.includes("pdfjs-dist/legacy/build/pdf.mjs"), "PDF item crop uses pdfjs-dist");
  assert.ok(pdfItemCrop.includes('"use client"'), "PDF item crop is a client component");
  assert.ok(
    pdfItemCrop.includes("getOfertaLocalPaddedNormalizedCrop"),
    "PDF item crop clamps/pads bbox via helper"
  );
  assert.ok(pdfItemCrop.includes("renderTaskRef"), "PDF item crop cancels render task");
  assert.ok(!pdfItemCrop.includes("toDataURL"), "No canvas dataURL in PDF item crop");
  assert.ok(!pdfItemCrop.includes("base64"), "No base64 in PDF item crop");
  assert.ok(
    itemMapper.includes("canRenderOfertaLocalPdfCrop"),
    "Mapper PDF crop capability helper"
  );
  assert.ok(
    itemMapper.includes("resolveOfertaLocalInstantCropPdfSource"),
    "Mapper PDF crop source resolver"
  );
  assert.ok(
    itemMapper.includes("getOfertaLocalPaddedNormalizedCrop"),
    "Mapper padded normalized crop helper"
  );
  assert.ok(
    grid.includes("OfertasPdfItemCropPreview") && grid.includes("canRenderOfertaLocalPdfCrop"),
    "Grid uses PDF crop fallback"
  );
  assert.ok(
    drawer.includes("OfertasPdfItemCropPreview") && drawer.includes("canRenderOfertaLocalPdfCrop"),
    "Drawer uses PDF crop fallback"
  );
  assert.ok(grid.includes("heroPdfHref"), "Grid passes PDF source fallback");
  assert.ok(drawer.includes("heroPdfHref"), "Drawer receives PDF source fallback");
  assert.ok(
    grid.includes("canRenderOfertaLocalInstantCrop"),
    "Grid uses instant crop check"
  );
  assert.ok(
    grid.includes("resolveOfertaLocalItemCropDisplayUrl"),
    "Grid still uses source_crop_url first"
  );
  assert.ok(grid.includes("heroImageHref"), "Grid passes image source fallback");
  assert.ok(
    drawer.includes("canRenderOfertaLocalInstantCrop") || drawer.includes("OfertasFlyerCropPreview"),
    "Drawer uses instant crop fallback"
  );

  const geminiPrompt = read(GEMINI_PROMPT);
  const geminiValidator = read(GEMINI_VALIDATOR);
  const geminiNormalizer = read(GEMINI_NORMALIZER);
  const reviewPanel = read(REVIEW_PANEL);
  const appCopy = read(APP_COPY);

  for (const field of [
    "item_number",
    "sku",
    "model_number",
    "upc",
    "coupon_code",
    "item_url",
    "online_availability",
  ]) {
    assert.ok(geminiPrompt.includes(field), `Prompt missing ${field}`);
  }
  assert.ok(geminiPrompt.includes("Do not hallucinate"), "Prompt anti-hallucination rule");
  assert.ok(geminiValidator.includes("commerceMetadata"), "Validator commerce metadata");
  assert.ok(geminiNormalizer.includes("commerceMetadata"), "Normalizer commerce metadata");
  assert.ok(itemMapper.includes("mergeCommerceMetadataIntoExtractedJson"), "PATCH merge helper");
  assert.ok(itemMapper.includes("invalid_item_url"), "HTTPS item URL validation");
  assert.ok(reviewPanel.includes("aiReviewCommerceSectionTitle"), "Review commerce section");
  assert.ok(appCopy.includes("aiReviewCommerceSectionTitle"), "Review commerce copy");

  assert.ok(hero.includes("OfertasLocalesPdfFlyerPreview"), "Hero uses PDF preview component");
  assert.ok(pdfPreview.includes("pdfjs-dist/legacy/build/pdf.mjs"), "PDF preview uses pdfjs-dist");

  assert.ok(card.includes("OwnerPreviewControls"), "Owner top controls");
  assert.ok(card.includes("BTN_WHATSAPP"), "WhatsApp green CTA");
  assert.ok(card.includes("OfertasLocalesMiniMapPreview"), "Map preview in hub");
  assert.ok(mapPreview.includes("buildOfertaLocalPreviewMapEmbedUrl"), "Map embed helper used");
  assert.ok(mapPreview.includes("<iframe"), "Map iframe embed");

  assert.ok(grid.includes("OfertasLocalesProductDetailDrawer"), "Grid uses drawer");
  assert.ok(grid.includes("searchQuery"), "Search state");
  assert.ok(
    grid.includes("cropPreparingEn") || grid.includes("noClipYetEn"),
    "Crop fallback label"
  );
  assert.ok(grid.includes("syncOfertasPreviewItemParam"), "Item URL foundation");

  assert.ok(drawer.includes("viewFullFlyerEn") || drawer.includes("viewSourceOnFlyerEn"), "Flyer link copy");
  assert.ok(drawer.includes("productDataEn") || drawer.includes("commerceMetadata"), "Drawer product data");

  // Gate — Global Mobile/PWA Foundation V1 (shared primitives + safety)
  assert.ok(fs.existsSync(path.join(ROOT, MOBILE_RAIL)), "Shared mobile scroll rail exists");
  assert.ok(fs.existsSync(path.join(ROOT, MOBILE_BOTTOM_SHEET)), "Shared mobile bottom sheet exists");
  assert.ok(fs.existsSync(path.join(ROOT, MOBILE_SHELL)), "Shared responsive shell exists");
  const bottomSheet = read(MOBILE_BOTTOM_SHEET);
  const rail = read(MOBILE_RAIL);
  assert.ok(bottomSheet.includes('role="dialog"'), "Bottom sheet dialog semantics");
  assert.ok(bottomSheet.includes("aria-modal"), "Bottom sheet aria-modal");
  assert.ok(bottomSheet.includes("createPortal"), "Bottom sheet portals to body");
  assert.ok(bottomSheet.includes("safe-area-inset-bottom"), "Bottom sheet safe bottom padding");
  assert.ok(bottomSheet.includes("max-w-[100vw]"), "Bottom sheet clamps width to viewport");
  assert.ok(bottomSheet.includes("overflow-x-hidden"), "Bottom sheet no horizontal overflow");
  assert.ok(rail.includes("snap-x"), "Rail uses snap-x scroll");
  assert.ok(read(MOBILE_SHELL).includes("overflow-x-hidden"), "Shell prevents horizontal overflow");
  // Ofertas consumes at least one shared mobile primitive
  const previewCard = read(CARD);
  assert.ok(
    previewCard.includes("LeonixResponsiveShell") ||
      previewCard.includes("LeonixMobileScrollRail") ||
      grid.includes("LeonixMobileScrollRail") ||
      drawer.includes("LeonixMobileBottomSheet"),
    "Ofertas uses at least one shared mobile primitive"
  );
  assert.ok(drawer.includes("LeonixMobileBottomSheet"), "Drawer uses shared bottom sheet");
  assert.ok(grid.includes("LeonixMobileScrollRail"), "Grid uses shared rail for filters");
  // Neutralized (non-live) future roadmap
  assert.ok(
    drawer.includes("comingSoonListsRoutes"),
    "Drawer future roadmap neutralized to info copy"
  );
  assert.ok(
    previewCard.includes("comingSoonListsRoutes"),
    "Preview card future roadmap neutralized to info copy"
  );
  assert.ok(!drawer.includes("BTN_DISABLED"), "No disabled future CTA buttons in drawer");

  // Gate — Ofertas Mobile Density V1 (390px polish)
  assert.ok(
    pdfPreview.includes("compactMobile") || hero.includes("compactMobile"),
    "Mobile compact flyer mode referenced"
  );
  assert.ok(
    previewCard.includes('safeBottom="compact"') || previewCard.includes("safeBottom={'compact'}"),
    "Compact safe-bottom shell for shorter sticky bar"
  );
  assert.ok(
    previewCard.includes("LeonixMobileScrollRail") && grid.includes("LeonixMobileScrollRail"),
    "Section nav + product filters still use shared rail"
  );
  assert.ok(
    grid.includes("OfertasPdfItemCropPreview") || grid.includes("resolveOfertaLocalItemCropDisplayUrl"),
    "Product grid still references crop rendering"
  );
  assert.ok(
    drawer.includes("OfertasPdfItemCropPreview") || drawer.includes("resolveOfertaLocalItemCropDisplayUrl"),
    "Drawer still references crop rendering"
  );
  assert.ok(
    previewCard.includes("env(safe-area-inset-bottom)") || read(MOBILE_SHELL).includes("safe-area-inset-bottom"),
    "Sticky/shell safe-area handling"
  );
  assert.ok(!previewCard.includes("OfertasFutureShoppingListCard"), "No live shopping list card in preview");
  assert.ok(!drawer.includes("addToListEn") && !drawer.includes("saveCouponEn"), "No fake list/coupon CTAs in drawer");

  assertRectangularMainCtas("grid", grid);
  assertRectangularMainCtas("drawer", drawer);
  assertRectangularMainCtas("hero", hero);

  // Gate — Ofertas Preview Architecture Clean-up (flyer-first + CTA consolidation)
  assert.ok(audit.includes("Preview Architecture Clean-up"), "Preview Architecture Clean-up section");
  // Title / info section present and flyer promoted to its own hero section.
  assert.ok(card.includes("Title / info section"), "Title/info section introduced");
  assert.ok(card.includes("Flyer hero"), "Flyer promoted to hero section");
  // Upper summary no longer carries the duplicated desktop contact/action stack.
  assert.ok(!card.includes("Desktop live action stack"), "Duplicated desktop action stack removed");
  assert.ok(!card.includes('lg:col-span-3'), "Old 3-col summary CTA stack removed");
  // Rewards/membership moved into the info section (FiAward marker), not a floating box.
  assert.ok(card.includes("FiAward"), "Rewards/membership regrouped into info section");
  // Flyer download action replaces "Abrir archivo".
  assert.ok(hero.includes("handleDownload"), "Hero has working download handler");
  assert.ok(hero.includes("downloadFlyer") || hero.includes("downloadCoupon"), "Hero uses download label");
  assert.ok(hero.includes('link.download'), "Download triggers a real file download");
  assert.ok(hero.includes("window.open"), "Download has a safe open fallback");
  for (const snippet of ["downloadFlyerEs", "downloadFlyerEn", "downloadingFlyerEs"]) {
    assert.ok(copy.includes(snippet), `Missing download copy: ${snippet}`);
  }
  // Localized, curated product filter taxonomy.
  assert.ok(fs.existsSync(path.join(ROOT, PRODUCT_TAXONOMY)), "Product taxonomy module exists");
  const taxonomy = read(PRODUCT_TAXONOMY);
  assert.ok(taxonomy.includes("normalizeOfertaProductCategory"), "Taxonomy normalizer");
  assert.ok(taxonomy.includes("getOfertaProductFilterLabel"), "Taxonomy localized label helper");
  assert.ok(taxonomy.includes('"other"') && taxonomy.includes("Otros"), "Taxonomy has Other/Otros fallback");
  assert.ok(taxonomy.includes("🍎") && taxonomy.includes("📦"), "Taxonomy uses emoji cues");
  assert.ok(grid.includes("getOfertaProductFilterLabel"), "Grid renders localized filter labels");
  assert.ok(grid.includes("normalizeOfertaProductCategory"), "Grid filters via normalized category");
  assert.ok(grid.includes("categoryKeys"), "Grid derives curated taxonomy keys");
  // Chips must be rectangular pills (not fully circular).
  assert.ok(!/setSelectedCategory\("all"\)[\s\S]{0,220}rounded-full/.test(grid), "Filter chips use rectangular pills");

  // Gate — Ofertas Preview V2.1 (compact business strip + flyer ratio repair)
  assert.ok(audit.includes("Ofertas Preview V2.1"), "V2.1 audit section");
  // Business strip compacted: oversized business name + heavy padding removed.
  assert.ok(!card.includes("lg:text-[2.5rem]"), "Business name no longer uses oversized lg:text-[2.5rem]");
  assert.ok(card.includes('CARD, "p-3 lg:p-4"'), "Business strip uses compact padding");
  // Rewards/membership converted to a slim mini notice (no full-width grid CTA card).
  assert.ok(card.includes("mini notice"), "Rewards/membership is a compact mini notice");
  // Flyer starts closer to the strip.
  assert.ok(card.includes('"mt-3 sm:mt-4"'), "Flyer hero uses tightened top margin");
  // Preserved V2 wins.
  assert.ok(hero.includes("downloadFlyer") || hero.includes("downloadCoupon"), "Descargar volante preserved");
  assert.ok(grid.includes("getOfertaProductFilterLabel"), "Localized emoji filter labels preserved");
  assert.ok(grid.includes("normalizeOfertaProductCategory"), "Normalized filtering preserved");
  assert.ok(
    grid.includes("OfertasPdfItemCropPreview") || grid.includes("resolveOfertaLocalItemCropDisplayUrl"),
    "Product crops preserved"
  );

  const requiredCopy = [
    "flyerPreviewEs",
    "flyerRenderingEs",
    "flyerRenderFailedEs",
    "viewSourceOnFlyerEs",
    "quickMapViewEs",
    "previewControlsEs",
    "noClipYetEs",
    "renderingCropEs",
    "cropRenderFailedEs",
    "swipeEs",
    "comingSoonListsRoutesEs",
    "mobileOptimizedEs",
  ];
  for (const snippet of requiredCopy) {
    assert.ok(copy.includes(snippet), `Missing copy: ${snippet}`);
  }

  assert.ok(helpers.includes("buildOfertaLocalPreviewMapEmbedUrl"), "Map embed helper");

  const sources = [grid, drawer, card, reviewPanel, cropPreview, pdfItemCrop].join("\n").toLowerCase();
  for (const fake of FAKE_STRINGS) {
    assert.ok(!sources.includes(fake.toLowerCase()), `Fake string: ${fake}`);
  }

  const changed = gitChangedFiles();
  const gateTouched = assertGateScope(changed);

  // No service worker / PWA manifest / offline caching introduced.
  for (const file of changed) {
    assert.ok(
      !/(^|\/)(sw|service-worker)\.[jt]s$|service-worker|(^|\/)manifest\.(json|webmanifest)$|workbox/i.test(file),
      `Service worker / manifest file must not be touched: ${file}`
    );
  }

  const pkg = read("package.json");
  assert.ok(pkg.includes("verify:ofertas-product-discovery-item-drawer"), "package.json script");

  console.log("verify-ofertas-product-discovery-item-drawer: PASS");
  console.log(`Gate-scoped files in working tree: ${gateTouched.length}`);
}

run();
