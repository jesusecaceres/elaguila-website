/**
 * Stack FINAL-1D — Ofertas Locales public tab activation audit.
 * Run: npm run ofertas-locales:final-1d-public-tab-activation-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_1D_PUBLIC_TAB_ACTIVATION_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_1D_PUBLIC_TAB_ACTIVATION_AUDIT.md";
const HUB_PAGE = "app/(site)/clasificados/page.tsx";
const FEATURED_MODULE = "app/(site)/clasificados/_components/ClasificadosFeaturedOfertasModule.tsx";
const FEATURED_COPY = "app/(site)/clasificados/_lib/clasificadosLandingHubCopy.ts";
const HUB_CARD = "app/(site)/clasificados/ofertas-locales/OfertasLocalesHubCategoryCard.tsx";
const PUBLIC_CATEGORY_COPY = "app/lib/clasificados/publicCategoryCopyGuard.ts";
const NEGOCIOS = "app/(site)/negocios-locales/page.tsx";
const NEGOCIOS_FEATURED_MODULE = "app/(site)/negocios-locales/_components/NegociosLocalesFeaturedOfertasModule.tsx";
const PUBLICAR = "app/(site)/clasificados/publicar/PublicarPageClient.tsx";
const PUBLIC_PAGE = "app/(site)/clasificados/ofertas-locales/page.tsx";
const PUBLISH_PAGE = "app/(site)/publicar/ofertas-locales/page.tsx";
const PUBLIC_OFFERS = "app/api/ofertas-locales/public-offers/route.ts";
const PUBLIC_SEARCH = "app/api/ofertas-locales/public-search/route.ts";
const PUBLIC_CLIENT = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx";

const ALLOWED = [
  /^app\/lib\/ofertas-locales\//,
  /^app\/\(site\)\/clasificados\/ofertas-locales\//,
  /^app\/\(site\)\/clasificados\/page\.tsx$/,
  /^app\/\(site\)\/clasificados\/publicar\/PublicarPageClient\.tsx$/,
  /^app\/\(site\)\/negocios-locales\/page\.tsx$/,
  /^package\.json$/,
  /^scripts\/ofertas-locales-final-1d-public-tab-activation-audit\.ts$/,
  /^scripts\/ofertas-package-13-/,
  /^scripts\/ofertas-package-11-local-certification-audit\.mjs$/,
  /^scripts\/ofertas-locales-ai-(power|quality)-1-audit\.ts$/,
  /^scripts\/ofertas-locales-final-1-pipeline-audit\.ts$/,
  /^scripts\/ofertas-locales-final-1[bc]/,
  /^scripts\/ofertas-locales-final-4-public-detail-audit\.ts$/,
  /^scripts\/ofertas-locales-gate-1-foundation-audit\.ts$/,
  /^scripts\/ofertas-locales-mobile-public-search-ux-audit\.ts$/,
  /^scripts\/ofertas-locales-ol[37]/,
  /^docs\/OFERTAS_PACKAGE_13_/,
  /^tests\/ofertas-locales\/scenarios\//,
] as const;

const FORBIDDEN = [
  /^app\/admin\//,
  /^app\/\(site\)\/dashboard\//,
  /stripe/i,
  /route.?optim/i,
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
  assert.ok(exists(PLAN), "activation plan must exist");
  assert.ok(exists(AUDIT_DOC), "activation audit doc must exist");
  assert.ok(exists(PUBLIC_PAGE), "public route page must exist");
  assert.ok(exists(PUBLISH_PAGE), "publish route page must exist");
  assert.ok(exists(HUB_CARD), "hub category card must exist");

  const hub = read(HUB_PAGE);
  const featuredModule = read(FEATURED_MODULE);
  const featuredCopy = read(FEATURED_COPY);
  const hubCard = read(HUB_CARD);
  const publicCategoryCopy = read(PUBLIC_CATEGORY_COPY);
  const negocios = read(NEGOCIOS);
  const negociosFeaturedModule = read(NEGOCIOS_FEATURED_MODULE);
  const publicar = read(PUBLICAR);
  const offers = read(PUBLIC_OFFERS);
  const search = read(PUBLIC_SEARCH);
  const client = read(PUBLIC_CLIENT);

  assert.match(hub, /ClasificadosFeaturedOfertasModule/, "hub page must render Ofertas Locales featured module");
  assert.match(featuredModule, /clasificados\/ofertas-locales/, "hub module must link to public route");
  assert.match(featuredModule, /publicar\/ofertas-locales/, "hub module must link to publish route");
  assert.match(featuredCopy, /Ofertas Locales/, "Spanish label on hub");
  assert.match(featuredCopy, /Local Deals/, "English label on hub");

  assert.match(hubCard, /getPublicCategoryCardCopy\("ofertas-locales"/, "hub card must use centralized Ofertas copy");
  assert.match(publicCategoryCopy, /ofertasLocalesBrowse/, "shopper CTA copy");
  assert.match(publicCategoryCopy, /ofertasLocalesPublish/, "owner CTA copy");

  assert.match(negocios, /ofertas-locales/, "negocios locales lane");
  assert.match(negociosFeaturedModule, /clasificados\/ofertas-locales/, "negocios explore link");
  assert.match(negociosFeaturedModule, /publicar\/ofertas-locales/, "negocios publish link");

  assert.match(publicar, /publicar\/ofertas-locales/, "publish chooser tile");

  assert.match(offers, /\.eq\(\s*["']status["']\s*,\s*["']approved["']\s*\)/);
  assert.doesNotMatch(offers, /select\([\s\S]*internal_notes[\s\S]*\)/);

  assert.match(search, /review_status.*approved|\.eq\(\s*["']review_status["']/);
  assert.match(search, /ofertas_locales\.status.*approved|\.eq\(\s*["']ofertas_locales\.status["']/);

  assert.doesNotMatch(client, /fake.*count|demo.*listing|rating.*count/i);

  for (const file of changedFiles()) {
    if (FORBIDDEN.some((re) => re.test(file))) assert.fail(`Forbidden file changed: ${file}`);
    if (!ALLOWED.some((re) => re.test(file))) assert.fail(`Unrelated file changed: ${file}`);
  }

  console.log("Stack FINAL-1D — Ofertas Locales public tab activation audit passed.");
}

run();
