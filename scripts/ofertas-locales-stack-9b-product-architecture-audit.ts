/**
 * Stack 9B — Ofertas Locales product architecture audit.
 * Run: npm run ofertas-locales:stack-9b-product-architecture-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_9B_PRODUCT_ARCHITECTURE_PLAN.md";
const VISION = "app/lib/ofertas-locales/OFERTAS_LOCALES_VISION_PIPELINE.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_9B_PRODUCT_ARCHITECTURE_AUDIT.md";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const HELPERS = "app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts";
const CONSTANTS = "app/lib/ofertas-locales/ofertasLocalesConstants.ts";
const COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";

const NAV_FILES = ["app/components/Navbar.tsx", "app/components/AdvertiseDropdown.tsx"] as const;

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function changedFiles(): string[] {
  let tracked: string[] = [];
  let untracked: string[] = [];
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

function run() {
  assert.ok(exists(PLAN), "Stack 9B plan must exist");
  assert.ok(exists(VISION), "Vision pipeline doc must exist");
  assert.ok(exists(AUDIT_DOC), "Stack 9B audit doc must exist");

  const app = read(APP_CLIENT);
  const helpers = read(HELPERS);
  const constants = read(CONSTANTS);
  const copy = read(COPY);
  const vision = read(VISION);
  const bundle = `${app}\n${copy}\n${helpers}`;

  assert.ok(constants.includes("OFERTAS_LOCALES_STEP1_BASE_PRODUCTS"), "step1 base products");
  assert.ok(app.includes("OFERTAS_LOCALES_STEP1_BASE_PRODUCTS"), "app uses step1 products");
  assert.ok(
    app.includes("weekly_flyer") || constants.includes("Weekly Flyer"),
    "weekly flyer card"
  );
  assert.ok(
    app.includes("coupon_promotion") || constants.includes("Coupon / Promotion"),
    "coupon promotion card"
  );

  assert.ok(!app.includes("OFERTAS_LOCALES_OFFER_TYPE_OPTIONS.map"), "no six-offer-type step1 grid");

  assert.ok(
    !bundle.includes("Especial de temporada") ||
      (bundle.includes("promotionSubtype") || bundle.includes("promotionSubtypeLabel")),
    "seasonal not main step1 card"
  );
  assert.ok(
    !app.includes('labelEn: "Bundle"') && !app.includes("Paquete / combo") ||
      app.includes("OFERTAS_LOCALES_COUPON_PROMOTION_SUBTYPE_OPTIONS"),
    "bundle not main step1"
  );
  assert.ok(!app.includes("Oferta destacada") || app.includes("COUPON_PROMOTION_SUBTYPE"), "featured deal not main product");

  assert.ok(app.includes("aiProductSearchTitle"), "AI upgrade card");
  assert.ok(app.includes("+$199/mo") || app.includes("OFERTAS_LOCALES_AI_PRODUCT_SEARCH_ADDON_DISPLAY_MONTHLY"), "AI +$199");
  assert.ok(
    copy.includes("review and approve") || copy.includes("revisas y apruebas"),
    "AI approval language"
  );

  assert.ok(copy.includes("Flat monthly pricing") || copy.includes("Precio mensual fijo"), "flat pricing copy");
  assert.ok(copy.includes("step1MoreExposureTitle"), "more exposure copy");
  assert.ok(copy.includes("step1LeonixPartnerBody") || copy.includes("invitation"), "leonix partner invite copy");

  assert.ok(!app.includes("partnerRateLabel"), "no public partner rate in app UI");
  assert.ok(!app.includes("pickupPartnerPriceMonthly"), "no partner discount display");
  assert.ok(!app.includes("OFERTAS_LOCALES_APPLICATION_DIGITAL_PRICING_KEYS.map"), "no full pricing table loop");

  assert.ok(helpers.includes("isOfertaLocalCouponPromotionFlow"), "coupon promotion flow helper");
  assert.ok(helpers.includes("getOfertaLocalProductDisplayLabel"), "product display label helper");

  assert.ok(vision.includes("oferta_local_items"), "future items table");
  assert.ok(vision.includes("oferta_local_scan_jobs"), "future scan jobs");
  assert.ok(vision.includes("oferta_local_shopping_lists"), "future shopping lists");
  assert.ok(vision.includes("oferta_local_route_events"), "future route events");
  assert.ok(vision.includes("5 store stops") || vision.includes("max 5"), "maps route max 5");

  assert.ok(!exists("app/api/ofertas-locales/ai-extract"), "no AI extraction API");
  assert.ok(!bundle.includes("shoppingList"), "no shopping list impl");
  assert.ok(!bundle.includes("google.com/maps/dir"), "no maps route impl in app");

  const changed = changedFiles();
  for (const nav of NAV_FILES) {
    assert.ok(!changed.includes(nav), `Nav untouched: ${nav}`);
  }
  assert.ok(!changed.some((f) => f.startsWith("app/admin/")), "admin untouched");
  assert.ok(!changed.some((f) => f.startsWith("supabase/migrations/")), "no new migration in diff");

  const pkg = read("package.json");
  assert.ok(pkg.includes('"ofertas-locales:stack-9b-product-architecture-audit"'), "package script");

  console.log("Stack 9B — Ofertas Locales product architecture audit passed.");
}

run();
