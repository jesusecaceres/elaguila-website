/**
 * Gate 1 / Gate 1A — Ofertas Locales product foundation static audit.
 * Run: npm run ofertas-locales:gate-1-foundation-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_GATE_1_FOUNDATION_AUDIT.md";

const LIB_FILES = [
  "app/lib/ofertas-locales/ofertasLocalesTypes.ts",
  "app/lib/ofertas-locales/ofertasLocalesConstants.ts",
  "app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts",
  "app/lib/ofertas-locales/ofertasLocalesValidation.ts",
  "app/lib/ofertas-locales/ofertasLocalesFormatting.ts",
  "app/lib/ofertas-locales/ofertasLocalesAnalyticsEvents.ts",
] as const;

const REQUIRED_EXPORTS: ReadonlyArray<{ file: string; patterns: string[] }> = [
  {
    file: "app/lib/ofertas-locales/ofertasLocalesTypes.ts",
    patterns: [
      "OfertaLocalOfferType",
      "OfertaLocalBusinessCategory",
      "OfertaLocalMarketType",
      "OfertaLocalDraft",
      "OfertaLocalSearchableItemDraft",
      "OfertaLocalScanJobStatus",
      "OfertaLocalMagazineDistributionStatus",
      "OfertaLocalPartnerType",
      "OfertaLocalPartnerDiscountReason",
      "OfertaLocalPricingPackage",
      "membershipUrl",
      "digitalCouponUrl",
      "isMagazinePickupPartner",
      "magazineDistributionStatus",
      "magazine_pickup_partner",
      "pickup_partner_discount",
      "weekly_flyer",
      "coupon",
      "featured_deal",
    ],
  },
  {
    file: "app/lib/ofertas-locales/ofertasLocalesConstants.ts",
    patterns: [
      "OFERTAS_LOCALES_PRODUCT_NAME",
      "OFERTAS_LOCALES_NAV_LABEL",
      "OFERTAS_LOCALES_ROUTES",
      "OFERTAS_LOCALES_OFFER_TYPE_OPTIONS",
      "OFERTAS_LOCALES_BUSINESS_CATEGORY_OPTIONS",
      "OFERTAS_LOCALES_MARKET_TYPE_OPTIONS",
      "OFERTAS_LOCALES_PRICING",
      "OFERTAS_LOCALES_VERSION_1_FEATURES",
      "OFERTAS_LOCALES_VERSION_2_FEATURES",
      "OFERTAS_LOCALES_DEFAULT_FILTERS",
      "OFERTAS_LOCALES_VALIDATION_LIMITS",
      "OFERTAS_LOCALES_DIGITAL_FIRST_VALUE_PROPS",
      "OFERTAS_LOCALES_FLIPP_VS_LEONIX_POSITIONING",
      "OFERTAS_LOCALES_PARTNER_TYPE",
      "OFERTAS_LOCALES_PARTNER_DISCOUNT_REASON",
      "OFERTAS_LOCALES_PICKUP_PARTNER_PRICING_NOTE",
      "OFERTAS_LOCALES_MAGAZINE_DISTRIBUTION_STRATEGIC_NOTE",
      "OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS",
      "OFERTAS_LOCALES_MAGAZINE_DISTRIBUTION_STATUS_OPTIONS",
      "digitalCouponListing",
      "digitalWeeklySpecials",
      "specialPlacementCampaign",
      "aiSearchableSpecialsAddOn",
      "couponBoostAddOn",
      "regularPriceMonthly",
      "pickupPartnerPriceMonthly",
      "Join Rewards",
      "Unirme a recompensas",
      "not_offered",
    ],
  },
  {
    file: "app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts",
    patterns: [
      "export function createEmptyOfertaLocalDraft",
      "membershipUrl",
      "digitalCouponUrl",
      "isMagazinePickupPartner",
      'magazineDistributionStatus: "not_offered"',
    ],
  },
  {
    file: "app/lib/ofertas-locales/ofertasLocalesValidation.ts",
    patterns: [
      "export function validateOfertaLocalDraftForPreview",
      "export function validateOfertaLocalDraftForFuturePublish",
      "membershipUrl",
      "digitalCouponUrl",
    ],
  },
  {
    file: "app/lib/ofertas-locales/ofertasLocalesFormatting.ts",
    patterns: [
      "export function normalizeOfertaLocalPhoneInput",
      "export function normalizeOfertaLocalZipInput",
      "export function normalizeOfertaLocalUrlInput",
      "export function normalizeOfertaLocalSearchText",
      "export function formatOfertaLocalPriceText",
      "export function isOfertaLocalExpired",
      "export function isOfertaLocalActiveByDates",
    ],
  },
  {
    file: "app/lib/ofertas-locales/ofertasLocalesAnalyticsEvents.ts",
    patterns: [
      "OFERTAS_LOCALES_ANALYTICS_VERSION_1_EVENTS",
      "OFERTAS_LOCALES_ANALYTICS_VERSION_2_EVENTS",
      "offer_view",
      "item_search",
      "scan_started",
      "approved_item_published",
      "membership_signup_click",
      "digital_coupon_activation_click",
      "magazine_pickup_info_click",
    ],
  },
];

/** Final CFO pricing values (Gate 1A). */
const CFO_PRICING_CHECKS: ReadonlyArray<{ key: string; regular: number; pickup: number }> = [
  { key: "digitalCouponListing", regular: 199, pickup: 149 },
  { key: "digitalWeeklySpecials", regular: 399, pickup: 299 },
  { key: "quarterLocalDeals", regular: 799, pickup: 599 },
  { key: "halfGrowth", regular: 1199, pickup: 899 },
  { key: "fullAuthority", regular: 1799, pickup: 1399 },
  { key: "specialPlacementCampaign", regular: 2750, pickup: 2250 },
  { key: "aiSearchableSpecialsAddOn", regular: 249, pickup: 199 },
  { key: "couponBoostAddOn", regular: 149, pickup: 99 },
];

const FORBIDDEN_PATHS = [
  "app/(site)/ofertas-locales",
  "app/api/ofertas-locales",
] as const;

const ALLOWED_PREFIXES = [
  "app/lib/ofertas-locales/",
  "scripts/ofertas-locales-gate-1-foundation-audit.ts",
  "package.json",
];

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

function isAllowedPath(p: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix));
}

function assertNoOfertasLocalesMigration() {
  const migrationsDir = path.join(ROOT, "supabase", "migrations");
  if (!fs.existsSync(migrationsDir)) return;
  const files = fs.readdirSync(migrationsDir);
  for (const f of files) {
    const content = fs.readFileSync(path.join(migrationsDir, f), "utf8");
    assert.ok(
      !content.toLowerCase().includes("ofertas_locales"),
      `Migration ${f} must not reference ofertas_locales`
    );
  }
}

function assertCfoPricing(constantsSource: string) {
  for (const { key, regular, pickup } of CFO_PRICING_CHECKS) {
    assert.ok(constantsSource.includes(`${key}:`), `Pricing package missing: ${key}`);
    const blockMatch = constantsSource.match(new RegExp(`${key}:\\s*\\{[^}]+\\}`, "s"));
    assert.ok(blockMatch, `Pricing block missing for ${key}`);
    const block = blockMatch![0];
    assert.ok(
      block.includes(`regularPriceMonthly: ${regular}`),
      `${key} regularPriceMonthly must be ${regular}`
    );
    assert.ok(
      block.includes(`pickupPartnerPriceMonthly: ${pickup}`),
      `${key} pickupPartnerPriceMonthly must be ${pickup}`
    );
  }
}

function run() {
  assert.ok(exists(AUDIT_DOC), `${AUDIT_DOC} must exist`);

  const audit = read(AUDIT_DOC);
  assert.ok(audit.includes("Gate 1"), "Audit doc must reference Gate 1");
  assert.ok(audit.includes("Gate 1A"), "Audit doc must reference Gate 1A");
  assert.ok(audit.includes("TRUE/FALSE"), "Audit doc must include TRUE/FALSE checklist");
  assert.ok(audit.includes("Recommended next gate"), "Audit doc must include next gate");
  assert.ok(
    audit.includes("Flipp is a flyer platform"),
    "Audit doc must include Flipp vs Leonix positioning"
  );

  for (const f of LIB_FILES) {
    assert.ok(exists(f), `Missing lib file: ${f}`);
  }

  for (const { file, patterns } of REQUIRED_EXPORTS) {
    const content = read(file);
    for (const pattern of patterns) {
      assert.ok(content.includes(pattern), `${file} must include: ${pattern}`);
    }
  }

  const constants = read("app/lib/ofertas-locales/ofertasLocalesConstants.ts");
  assertCfoPricing(constants);

  for (const forbidden of FORBIDDEN_PATHS) {
    assert.ok(!exists(forbidden), `Forbidden path must not exist: ${forbidden}`);
  }

  assertNoOfertasLocalesMigration();

  const pkg = read("package.json");
  assert.ok(
    pkg.includes('"ofertas-locales:gate-1-foundation-audit"'),
    "package.json must include ofertas-locales:gate-1-foundation-audit script"
  );

  const changed = changedFiles();
  const disallowed = changed.filter((p) => !isAllowedPath(p));
  if (disallowed.length > 0) {
    console.warn(
      "Warning: changed files outside Gate 1/1A allowlist (may be pre-existing dirty work):",
      disallowed
    );
  }

  console.log("Gate 1 / Gate 1A — Ofertas Locales foundation audit passed.");
  console.log(`  Lib files: ${LIB_FILES.length}`);
  console.log(`  Audit doc: ${AUDIT_DOC}`);
  console.log(`  CFO pricing packages verified: ${CFO_PRICING_CHECKS.length}`);
  console.log("  No public/API routes or migrations detected.");
}

run();
