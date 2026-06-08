/**
 * Stack FINAL-1C — Ofertas Locales full pipeline smoke audit.
 * Run: npm run ofertas-locales:final-1c-full-pipeline-smoke-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const GOLD = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_1C_GOLD_STANDARD_AUDIT.md";
const FULL = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_1C_FULL_PIPELINE_AUDIT.md";
const ADMIN = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_1C_ADMIN_DASHBOARD_READINESS.md";
const PUBLISH_ROUTE = "app/api/ofertas-locales/publish/route.ts";
const PUBLIC_OFFERS = "app/api/ofertas-locales/public-offers/route.ts";
const PUBLIC_SEARCH = "app/api/ofertas-locales/public-search/route.ts";
const PUBLIC_PAGE = "app/(site)/clasificados/ofertas-locales/page.tsx";
const MAPPER = "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts";
const DRAFT = "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts";
const PUBLIC_HELPERS = "app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts";
const PUBLIC_CLIENT = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx";
const SHOPPING = "app/lib/ofertas-locales/ofertasLocalesShoppingList.ts";

const ALLOWED = [
  /^app\/lib\/ofertas-locales\//,
  /^app\/api\/ofertas-locales\//,
  /^app\/\(site\)\/publicar\/ofertas-locales\//,
  /^app\/\(site\)\/clasificados\/ofertas-locales\//,
  /^package\.json$/,
  /^scripts\/ofertas-locales-final-1c-full-pipeline-smoke-audit\.ts$/,
] as const;

const FORBIDDEN = [
  /^app\/admin\//,
  /^app\/\(site\)\/dashboard\//,
  /stripe/i,
  /route.?optim/i,
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
  assert.ok(exists(GOLD), "gold standard audit doc must exist");
  assert.ok(exists(FULL), "full pipeline audit doc must exist");
  assert.ok(exists(ADMIN), "admin/dashboard readiness doc must exist");
  assert.ok(exists(PUBLISH_ROUTE), "publish API must exist");
  assert.ok(exists(PUBLIC_PAGE), "public route must exist");

  const publish = read(PUBLISH_ROUTE);
  const offers = read(PUBLIC_OFFERS);
  const search = read(PUBLIC_SEARCH);
  const mapper = read(MAPPER);
  const draft = read(DRAFT);
  const helpers = read(PUBLIC_HELPERS);
  const client = read(PUBLIC_CLIENT);
  const shopping = read(SHOPPING);

  assert.match(publish, /getBearerUserId|unauthorized/i);
  assert.match(mapper, /status:\s*["']pending_review["']/);
  assert.doesNotMatch(mapper, /status:\s*["'](?:approved|published|live)["']/);

  assert.match(offers, /\.eq\(\s*["']status["']\s*,\s*["']approved["']\s*\)/);
  assert.match(search, /review_status.*approved|\.eq\(\s*["']review_status["']/);
  assert.match(search, /ofertas_locales\.status.*approved|\.eq\(\s*["']ofertas_locales\.status["']/);

  assert.doesNotMatch(
    offers,
    /select\([\s\S]*internal_notes[\s\S]*\)/,
    "public offers must not select internal_notes"
  );

  assert.match(draft, /sessionStorage/);
  assert.doesNotMatch(
    draft,
    /localStorage\.(get|set|remove)Item\(\s*OFERTAS_LOCALES_DRAFT_STORAGE_KEY/,
    "draft must not use localStorage for application state"
  );

  assert.match(mapper, /flyer_assets|mapAssets/);
  assert.match(mapper, /coupon_assets/);
  assert.match(mapper, /directions_url|city|zip_code|address/);
  assert.match(mapper, /facebookUrl|googleBusinessUrl/);
  assert.match(mapper, /googleReviewUrl|yelpUrl/);
  assert.match(mapper, /wantsAiSearchableSpecials|wantsFeaturedPlacement|featuredPlacementScope/);

  assert.match(helpers, /googleReviewUrl|yelpUrl/, "public social parse includes review links");

  assert.doesNotMatch(client, /fake.*rating|reviewCount|rating.*count/i);
  assert.doesNotMatch(shopping, /route.?optim|fastest.?route/i, "no route optimizer in shopping list");

  assert.match(shopping, /SHOPPING_LIST_STORAGE_KEY/, "shopping list exists");

  for (const file of changedFiles()) {
    if (FORBIDDEN.some((re) => re.test(file))) assert.fail(`Forbidden file changed: ${file}`);
    if (!ALLOWED.some((re) => re.test(file))) assert.fail(`Unrelated file changed: ${file}`);
  }

  console.log("Stack FINAL-1C — Ofertas Locales full pipeline smoke audit passed.");
}

run();
