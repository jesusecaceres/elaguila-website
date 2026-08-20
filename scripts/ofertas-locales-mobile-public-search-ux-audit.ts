/**
 * Ofertas Locales mobile public search UX audit.
 * Run: npm run ofertas-locales:mobile-public-search-ux-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_MOBILE_PUBLIC_SEARCH_UX_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_MOBILE_PUBLIC_SEARCH_UX_AUDIT.md";
const SEARCH_CLIENT = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx";
const COPY = "app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts";
const PUBLIC_SEARCH_API = "app/api/ofertas-locales/public-search/route.ts";
const PUBLIC_OFFERS_API = "app/api/ofertas-locales/public-offers/route.ts";

const ALLOWED = [
  /^app\/\(site\)\/clasificados\/ofertas-locales\//,
  /^app\/lib\/ofertas-locales\/OFERTAS_LOCALES_MOBILE/,
  /^package\.json$/,
  /^scripts\/ofertas-locales-mobile-public-search-ux-audit\.ts$/,
  /^scripts\/ofertas-package-13-/,
  /^scripts\/ofertas-package-11-local-certification-audit\.mjs$/,
  /^scripts\/ofertas-locales-ai-(power|quality)-1-audit\.ts$/,
  /^scripts\/ofertas-locales-final-1[bcd]/,
  /^scripts\/ofertas-locales-final-1-pipeline-audit\.ts$/,
  /^scripts\/ofertas-locales-final-4-public-detail-audit\.ts$/,
  /^scripts\/ofertas-locales-gate-1-foundation-audit\.ts$/,
  /^scripts\/ofertas-locales-ol[37]/,
  /^docs\/OFERTAS_PACKAGE_13_/,
  /^tests\/ofertas-locales\/scenarios\//,
] as const;

const FORBIDDEN_PATHS = [
  /^app\/admin\//,
  /^app\/\(site\)\/dashboard\//,
  /stripe/i,
  /^app\/components\/Navbar/,
  /^app\/components\/AdvertiseDropdown/,
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

function isAllowed(file: string): boolean {
  return ALLOWED.some((re) => re.test(file));
}

function run() {
  assert.ok(exists(PLAN), "mobile UX plan must exist");
  assert.ok(exists(AUDIT_DOC), "mobile UX audit doc must exist");
  assert.ok(exists(SEARCH_CLIENT), "public search client must exist");

  const client = read(SEARCH_CLIENT);
  const copy = read(COPY);
  const searchApi = read(PUBLIC_SEARCH_API);
  const offersApi = read(PUBLIC_OFFERS_API);

  assert.match(copy, /Mostrar filtros/, "Spanish filter toggle show");
  assert.match(copy, /Ocultar filtros/, "Spanish filter toggle hide");
  assert.match(copy, /Show filters/, "English filter toggle show");
  assert.match(copy, /Hide filters/, "English filter toggle hide");
  assert.match(copy, /Aún no hay ofertas aprobadas publicadas/, "Spanish pipeline empty title");
  assert.match(copy, /No approved deals published yet/, "English pipeline empty title");

  assert.match(client, /OfertasLocalesFiltersDrawer/, "filter drawer is wired");
  assert.match(client, /filtersOpen/, "filter drawer open state");
  assert.match(client, /open=\{filtersOpen\}/, "filter drawer receives open state");
  assert.match(client, /OfertasFloatingShoppingListCart/, "floating shopping list cart remains");
  assert.match(client, /OfertasLocalesShoppingListPanel/, "shopping list panel remains");

  assert.match(searchApi, /\.eq\("review_status", "approved"\)/, "item API approved filter");
  assert.match(searchApi, /\.eq\("is_active", true\)/, "item API active filter");
  assert.match(searchApi, /\.eq\("ofertas_locales.status", "approved"\)/, "parent approved filter");
  assert.match(offersApi, /approved/, "offers API approved filter");

  for (const file of changedFiles()) {
    if (file.startsWith(".next/")) continue;
    if (!exists(file)) continue;
    if (FORBIDDEN_PATHS.some((re) => re.test(file))) {
      throw new Error(`Forbidden file changed: ${file}`);
    }
    if (!isAllowed(file)) {
      throw new Error(`Changed file outside mobile UX allowlist: ${file}`);
    }
  }

  const offersDiff = execSync(`git diff ${PUBLIC_OFFERS_API}`, { cwd: ROOT, encoding: "utf8" });
  const searchDiff = execSync(`git diff ${PUBLIC_SEARCH_API}`, { cwd: ROOT, encoding: "utf8" });
  assert.equal(offersDiff.trim(), "", "public-offers API must not be modified");
  assert.equal(searchDiff.trim(), "", "public-search API must not be modified");

  console.log("ofertas-locales-mobile-public-search-ux-audit: OK");
}

run();
