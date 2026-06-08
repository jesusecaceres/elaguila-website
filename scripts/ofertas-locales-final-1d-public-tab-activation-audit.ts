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
const HUB_CARD = "app/(site)/clasificados/ofertas-locales/OfertasLocalesHubCategoryCard.tsx";
const NEGOCIOS = "app/(site)/negocios-locales/page.tsx";
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
  const hubCard = read(HUB_CARD);
  const negocios = read(NEGOCIOS);
  const publicar = read(PUBLICAR);
  const offers = read(PUBLIC_OFFERS);
  const search = read(PUBLIC_SEARCH);
  const client = read(PUBLIC_CLIENT);

  assert.match(hub, /OfertasLocalesHubCategoryCard/, "hub page must render Ofertas Locales card");
  assert.match(hub, /clasificados\/ofertas-locales/, "hub must link to public route");
  assert.match(hub, /publicar\/ofertas-locales/, "hub must link to publish route");
  assert.match(hub, /Ofertas Locales/, "Spanish label on hub");
  assert.match(hub, /Local Deals/, "English label on hub");

  assert.match(hubCard, /Ver ofertas/, "Spanish shopper CTA");
  assert.match(hubCard, /View deals/, "English shopper CTA");
  assert.match(hubCard, /Publica tus ofertas locales/, "Spanish business CTA");
  assert.match(hubCard, /Publish your local deals/, "English business CTA");

  assert.match(negocios, /ofertas-locales/, "negocios locales lane");
  assert.match(negocios, /clasificados\/ofertas-locales/, "negocios explore link");
  assert.match(negocios, /publicar\/ofertas-locales/, "negocios publish link");

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
