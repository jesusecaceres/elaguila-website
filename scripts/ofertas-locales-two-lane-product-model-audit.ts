/**
 * Ofertas Locales two-lane product model audit.
 * Run: npm run ofertas-locales:two-lane-product-model-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_TWO_LANE_PRODUCT_MODEL_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_TWO_LANE_PRODUCT_MODEL_AUDIT.md";
const TWO_LANE = "app/lib/ofertas-locales/ofertasLocalesTwoLaneProductModel.ts";
const APP = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";
const ASSET_SECTION = "app/(site)/publicar/ofertas-locales/OfertasLocalesDraftAssetSection.tsx";
const AI_READINESS = "app/lib/ofertas-locales/ofertasLocalesAiScanReadiness.ts";
const PUBLISH = "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts";
const TYPES = "app/lib/ofertas-locales/ofertasLocalesTypes.ts";
const PUBLIC_OFFERS = "app/api/ofertas-locales/public-offers/route.ts";

const FORBIDDEN = [
  /^app\/admin\//,
  /^app\/\(site\)\/dashboard\//,
  /stripe/i,
  /^supabase\/migrations\//,
] as const;

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
      .filter(Boolean);
  } catch {
    tracked = [];
  }
  try {
    untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    untracked = [];
  }
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function run() {
  assert.ok(exists(PLAN), "two-lane plan must exist");
  assert.ok(exists(AUDIT_DOC), "two-lane audit doc must exist");

  const twoLane = read(TWO_LANE);
  const app = read(APP);
  const copy = read(COPY);
  const assetSection = read(ASSET_SECTION);
  const aiReadiness = read(AI_READINESS);
  const publish = read(PUBLISH);
  const types = read(TYPES);
  const offersApi = read(PUBLIC_OFFERS);

  assert.match(twoLane, /shopping_specials/, "shopping_specials lane");
  assert.match(twoLane, /local_coupons/, "local_coupons lane");
  assert.match(types, /primaryAdFormat/, "draft primaryAdFormat field");

  assert.match(copy, /¿Qué quieres publicar principalmente/, "Spanish Step 1 question");
  assert.match(copy, /What do you mainly want to publish/, "English Step 1 question");
  assert.match(twoLane, /Especiales de compra/, "Spanish shopping lane title");
  assert.match(twoLane, /Shopping Specials/, "English shopping lane title");
  assert.match(twoLane, /Cupones y promociones locales/, "Spanish coupon lane title");
  assert.match(twoLane, /Local Coupons/, "English coupon lane title");

  assert.match(copy, /revisión antes de mostrarlos públicamente/, "Spanish AI review before public");
  assert.match(copy, /review before they appear publicly/, "English AI review before public");
  assert.ok(!copy.match(/perfect clipping/i), "no perfect clipping promise");
  assert.match(copy, /no se escanean en esta versión/, "Spanish URLs not scanned");
  assert.match(copy, /not scanned in this version/, "English URLs not scanned");

  assert.match(app, /step1PrimaryFormatQuestion/, "Step 1 primary format question in UI");
  assert.match(app, /laneShoppingMainFlyerAsset/, "shopping main flyer section");
  assert.match(app, /laneCouponMainAsset/, "coupon main asset section");
  assert.match(app, /membershipSectionPurpose/, "membership purpose copy");
  assert.match(app, /membershipTrafficCopy/, "membership traffic copy");

  assert.ok(!assetSection.includes("assetsNote"), "vague Nota field removed");
  assert.match(assetSection, /externalUrlReference/, "external URL reference copy");
  assert.match(assetSection, /pageSectionLabel/, "page/section label");

  assert.match(aiReadiness, /external_url/, "external URL excluded from AI scan");
  assert.match(aiReadiness, /AI_SCAN_READY_MIMES/, "AI scan mime allowlist");

  assert.match(publish, /primaryAdFormat/, "publish preserves primaryAdFormat in metadata");

  assert.match(offersApi, /\.eq\("status", "approved"\)/, "public offers safety intact");

  for (const file of changedFiles()) {
    if (file.startsWith(".next/")) continue;
    if (!exists(file)) continue;
    if (FORBIDDEN.some((re) => re.test(file))) {
      throw new Error(`Forbidden file changed: ${file}`);
    }
  }

  console.log("ofertas-locales two-lane product model audit passed");
}

run();
