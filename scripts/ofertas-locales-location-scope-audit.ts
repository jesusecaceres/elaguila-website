/**
 * Ofertas Locales location scope audit.
 * Run: npm run ofertas-locales:location-scope-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_LOCATION_SCOPE_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_LOCATION_SCOPE_AUDIT.md";
const APP = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";
const VALIDATION = "app/lib/ofertas-locales/ofertasLocalesValidation.ts";
const PUBLISH = "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts";
const FORMATTING = "app/lib/ofertas-locales/ofertasLocalesFormatting.ts";
const PUBLIC_OFFERS_API = "app/api/ofertas-locales/public-offers/route.ts";
const PUBLIC_SEARCH_API = "app/api/ofertas-locales/public-search/route.ts";
const PUBLIC_SEARCH_CLIENT = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx";
const PUBLIC_SEARCH_HELPERS = "app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts";
const PUBLIC_OFFER_HELPERS = "app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts";

const FORBIDDEN_PATHS = [
  /^app\/admin\//,
  /^app\/\(site\)\/dashboard\//,
  /stripe/i,
  /^supabase\/migrations\//,
] as const;

const NORCAL_COPY_PATTERNS = [
  /NorCal/i,
  /Northern California/i,
  /solo California/i,
  /only California/i,
  /Bay Area only/i,
];

const HARDCODED_CITY_EXAMPLES = [
  "New York",
  "Dallas",
  "San Jose",
  "San Francisco",
  "Los Angeles",
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
  assert.ok(exists(PLAN), "location scope plan must exist");
  assert.ok(exists(AUDIT_DOC), "location scope audit doc must exist");

  const copy = read(COPY);
  const app = read(APP);
  const validation = read(VALIDATION);
  const publish = read(PUBLISH);
  const formatting = read(FORMATTING);
  const offersApi = read(PUBLIC_OFFERS_API);
  const searchApi = read(PUBLIC_SEARCH_API);
  const searchClient = read(PUBLIC_SEARCH_CLIENT);
  const searchHelpers = read(PUBLIC_SEARCH_HELPERS);
  const offerHelpers = read(PUBLIC_OFFER_HELPERS);

  for (const pattern of NORCAL_COPY_PATTERNS) {
    assert.ok(!copy.match(pattern), `Step 4 copy should not match NorCal pattern: ${pattern}`);
    assert.ok(!app.match(pattern), `Application client should not match NorCal pattern: ${pattern}`);
  }

  for (const city of HARDCODED_CITY_EXAMPLES) {
    assert.ok(!copy.includes(city), `hardcoded city example in copy: ${city}`);
    assert.ok(!app.includes(city), `hardcoded city example in app: ${city}`);
  }

  assert.match(copy, /Usaremos la ciudad para filtros y búsquedas locales/, "Spanish city helper");
  assert.match(copy, /We'll use the city for local filters and search/, "English city helper");
  assert.match(copy, /Agrega el ZIP donde los clientes encontrarán esta oferta/, "Spanish ZIP helper");
  assert.match(copy, /Add the ZIP where customers can find this offer/, "English ZIP helper");
  assert.match(copy, /Agrega la dirección si quieres mostrar ubicación/, "Spanish address helper");
  assert.match(copy, /Add the address if you want to show a location/, "English address helper");
  assert.match(copy, /Google Maps/, "directions helper mentions Google Maps");

  assert.match(formatting, /normalizeOfertaLocalStateInput/, "state normalization helper");
  assert.ok(!validation.includes("California"), "validation must not restrict to California");
  assert.ok(!validation.includes("NorCal"), "validation must not restrict to NorCal");
  assert.match(validation, /La ciudad es obligatoria/, "city required validation");
  assert.match(validation, /ZIP\) de 5 dígitos/, "ZIP 5-digit validation");

  assert.match(publish, /city:/, "publish mapper city");
  assert.match(publish, /state:/, "publish mapper state");
  assert.match(publish, /zip_code:/, "publish mapper zip");
  assert.match(publish, /address:/, "publish mapper address");
  assert.match(publish, /directions_url:/, "publish mapper directions");

  assert.match(offersApi, /city/, "public offers API city");
  assert.match(offersApi, /zip_code/, "public offers API zip");
  assert.match(offersApi, /address/, "public offers API address");
  assert.match(offersApi, /directions_url/, "public offers API directions");
  assert.match(offersApi, /\.eq\("status", "approved"\)/, "offers approved filter");

  assert.match(searchApi, /city/, "public search API city");
  assert.match(searchApi, /zip_code/, "public search API zip");
  assert.match(searchApi, /directions_url/, "public search API directions");
  assert.match(searchApi, /\.eq\("review_status", "approved"\)/, "item approved filter");
  assert.match(searchApi, /\.eq\("ofertas_locales.status", "approved"\)/, "parent approved filter");

  assert.match(searchClient, /cityLabel/, "public search city filter");
  assert.match(searchClient, /zipLabel/, "public search zip filter");

  assert.match(searchHelpers, /matchesCity/, "city filter helper");
  assert.match(searchHelpers, /matchesZip/, "zip filter helper");
  assert.match(searchHelpers, /directionsDirect/, "directions URL first");
  assert.match(searchHelpers, /google\.com\/maps/, "maps fallback");

  assert.match(offerHelpers, /directions_url/, "offer helpers directions");
  assert.match(offerHelpers, /google\.com\/maps/, "offer helpers maps fallback");

  assert.ok(!app.includes("OFERTAS_LOCALES_MARKET_TYPE"), "location stack unrelated check");

  for (const file of changedFiles()) {
    if (file.startsWith(".next/")) continue;
    if (!exists(file)) continue;
    if (FORBIDDEN_PATHS.some((re) => re.test(file))) {
      throw new Error(`Forbidden file changed: ${file}`);
    }
  }

  console.log("ofertas-locales location scope audit passed");
}

run();
