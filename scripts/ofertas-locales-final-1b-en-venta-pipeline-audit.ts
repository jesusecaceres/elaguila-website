/**
 * Stack FINAL-1B+ — Ofertas Locales En Venta pattern pipeline audit.
 * Run: npm run ofertas-locales:final-1b-en-venta-pipeline-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const EN_VENTA_AUDIT = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_1B_EN_VENTA_PATTERN_AUDIT.md";
const GAP_AUDIT = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_1B_PIPELINE_GAP_AUDIT.md";
const PUBLISH_ROUTE = "app/api/ofertas-locales/publish/route.ts";
const PUBLIC_OFFERS_ROUTE = "app/api/ofertas-locales/public-offers/route.ts";
const PUBLISH_MAPPER = "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts";
const DRAFT_PERSISTENCE = "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const PUBLIC_CLIENT = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx";
const DRAFT_TYPES = "app/lib/ofertas-locales/ofertasLocalesTypes.ts";

const ALLOWED_PATTERNS = [
  /^app\/lib\/ofertas-locales\//,
  /^app\/api\/ofertas-locales\//,
  /^app\/\(site\)\/publicar\/ofertas-locales\//,
  /^app\/\(site\)\/clasificados\/ofertas-locales\//,
  /^package\.json$/,
  /^scripts\/ofertas-locales-final-1b-en-venta-pipeline-audit\.ts$/,
] as const;

const FORBIDDEN_PATTERNS = [
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
  assert.ok(exists(EN_VENTA_AUDIT), "En Venta pattern audit doc must exist");
  assert.ok(exists(GAP_AUDIT), "Pipeline gap audit doc must exist");
  assert.ok(exists(PUBLISH_ROUTE), "publish API must exist");
  assert.ok(exists(PUBLIC_OFFERS_ROUTE), "public offers API must exist");
  assert.ok(exists(PUBLISH_MAPPER), "publish mapper must exist");
  assert.ok(exists(DRAFT_PERSISTENCE), "draft persistence must exist");

  const publish = read(PUBLISH_ROUTE);
  const offersRoute = read(PUBLIC_OFFERS_ROUTE);
  const mapper = read(PUBLISH_MAPPER);
  const persistence = read(DRAFT_PERSISTENCE);
  const app = read(APP_CLIENT);
  const types = read(DRAFT_TYPES);
  const publicClient = read(PUBLIC_CLIENT);

  assert.match(publish, /getBearerUserId|unauthorized/i, "publish API must require auth");
  assert.match(mapper, /status:\s*["']pending_review["']/, "publish must insert pending_review only");
  assert.doesNotMatch(
    mapper,
    /status:\s*["'](?:approved|published|live)["']/,
    "publish must not auto-approve"
  );

  assert.match(offersRoute, /\.eq\(\s*["']status["']\s*,\s*["']approved["']\s*\)/, "public offers approved only");
  assert.match(offersRoute, /Never returns owner private metadata|internal_notes/i);
  assert.doesNotMatch(
    offersRoute,
    /select\([\s\S]*internal_notes[\s\S]*\)/,
    "public offers must not select internal_notes"
  );

  assert.match(persistence, /sessionStorage/, "draft must use sessionStorage (per-tab, En Venta-aligned)");
  assert.doesNotMatch(
    persistence,
    /localStorage\.(get|set|remove)Item\(\s*OFERTAS_LOCALES_DRAFT_STORAGE_KEY/,
    "draft must not use localStorage for cross-tab stale data"
  );

  assert.match(mapper, /flyer_assets|mapAssets/, "asset metadata mapped to submit payload");
  assert.match(mapper, /directions_url|city|zip_code|address/, "location fields mapped");
  assert.match(mapper, /facebookUrl|instagramUrl|googleBusinessUrl/, "social links in metadata");
  assert.match(mapper, /googleReviewUrl|yelpUrl/, "review links in metadata");

  assert.match(types, /googleReviewUrl/, "googleReviewUrl in draft types");
  assert.match(types, /yelpUrl/, "yelpUrl in draft types");
  assert.match(app, /googleReviewUrl/, "googleReviewUrl in application UI");
  assert.match(app, /yelpUrl/, "yelpUrl in application UI");

  assert.doesNotMatch(publicClient, /fake.*rating|rating.*count|reviewCount/i, "no fake ratings");

  for (const file of changedFiles()) {
    if (FORBIDDEN_PATTERNS.some((re) => re.test(file))) {
      assert.fail(`Forbidden file changed: ${file}`);
    }
    if (!ALLOWED_PATTERNS.some((re) => re.test(file))) {
      assert.fail(`Unrelated file changed: ${file}`);
    }
  }

  console.log("Stack FINAL-1B+ — Ofertas Locales En Venta pipeline audit passed.");
}

run();
