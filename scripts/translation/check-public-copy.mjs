#!/usr/bin/env node
/**
 * GLOBAL-PUBLIC-COPY-REGISTRY-GUARD1 — lightweight public category copy guard.
 * Run: node scripts/translation/check-public-copy.mjs
 * Or:  npm run translation:check
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const HUB_CATEGORY_KEYS = [
  "en-venta",
  "rentas",
  "empleos",
  "bienes-raices",
  "servicios",
  "autos",
  "restaurantes",
  "travel",
  "comunidad",
  "clases",
  "busco",
  "mascotas-y-perdidos",
];

const VISIBLE_HUB_KEYS = ["ofertas-locales", ...HUB_CATEGORY_KEYS, "dealers-de-autos"];

const VI_FORBIDDEN_POST_FRAGMENTS = [
  "Post in",
  "Dealership",
  "Dealers de Autos",
  "Restaurants",
  "Travel",
  "Community & Events",
  "Wanted / Looking for",
  "Miscellaneous",
  "Real Estate",
  "Pets & Lost",
  "Classes",
  "Jobs",
  "Rentals",
  "Autos",
  "Services",
];

const VI_FORBIDDEN_TITLE_FRAGMENTS = [
  "Dealers de Autos",
  "Dealership and auto business inventory",
  "Restaurants",
  "Travel",
  "Community & Events",
  "Wanted / Looking for",
];

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

const failures = [];

function fail(message) {
  failures.push(message);
  console.error(`✗ ${message}`);
}

function pass(message) {
  console.log(`✓ ${message}`);
}

const hubCopyPath = "app/lib/clasificados/clasificadosHubPageCopy/index.ts";
const guardPath = "app/lib/clasificados/publicCategoryCopyGuard.ts";
const hubCopy = read(hubCopyPath);
const guardCopy = read(guardPath);

function extractLabelDesc(section, key) {
  let idx = section.indexOf(`"${key}"`);
  if (idx === -1) {
    const re = new RegExp(String.raw`(?:^|\n)\s*${key.replace(/-/g, "\\-")}:\s*\{`, "m");
    const match = re.exec(section);
    idx = match?.index ?? -1;
  }
  if (idx === -1) return { label: "", desc: "" };
  const chunk = section.slice(idx, idx + 500);
  const labelMatch = chunk.match(/label:\s*"([^"]+)"/);
  const descMatch = chunk.match(/desc:\s*"([^"]+)"/);
  return { label: labelMatch?.[1]?.trim() ?? "", desc: descMatch?.[1]?.trim() ?? "" };
}

console.log("# Public category copy guard\n");

// ES base
const esSection = hubCopy.slice(hubCopy.indexOf("const CATEGORIES_ES"), hubCopy.indexOf("const CATEGORIES_EN"));
let esOk = true;
for (const key of HUB_CATEGORY_KEYS) {
  const { label, desc } = extractLabelDesc(esSection, key);
  if (!label || !desc) {
    esOk = false;
    fail(`ES missing label/desc for hub category "${key}"`);
  }
}
if (esOk) pass(`ES base category copy complete (${HUB_CATEGORY_KEYS.length} keys)`);

// EN base
const enSection = hubCopy.slice(hubCopy.indexOf("const CATEGORIES_EN"), hubCopy.indexOf("function hubPage"));
let enOk = true;
for (const key of HUB_CATEGORY_KEYS) {
  const { label, desc } = extractLabelDesc(enSection, key);
  if (!label || !desc) {
    enOk = false;
    fail(`EN missing label/desc for hub category "${key}"`);
  }
}
if (enOk) pass(`EN base category copy complete (${HUB_CATEGORY_KEYS.length} keys)`);

// VI hub categories
const viSection = hubCopy.slice(hubCopy.indexOf("vi: fromEnHub"), hubCopy.indexOf("pt: fromEnHub"));
let viHubOk = true;
for (const key of HUB_CATEGORY_KEYS) {
  const { label, desc } = extractLabelDesc(viSection, key);
  if (!label || !desc) {
    viHubOk = false;
    fail(`VI missing native label/desc for hub category "${key}"`);
  } else {
    for (const forbidden of VI_FORBIDDEN_TITLE_FRAGMENTS) {
      if (label === forbidden || label.includes(forbidden)) {
        viHubOk = false;
        fail(`VI hub category "${key}" title still English: "${label}"`);
      }
    }
  }
}
if (viHubOk) pass(`VI visible hub category labels/descriptions present (${HUB_CATEGORY_KEYS.length} keys)`);

if (!viSection.includes('explore: "KHÁM PHÁ"')) {
  fail('VI hub explore CTA must be "KHÁM PHÁ"');
} else {
  pass("VI hub explore CTA is KHÁM PHÁ");
}

if (!viSection.includes("(label) => `Đăng trong ${label}`")) {
  fail("VI hub postInCategory pattern must use Đăng trong template");
} else {
  pass("VI hub postInCategory uses Đăng trong template");
}

const requiredDealersVi = [
  'label: "Đại lý ô tô"',
  'desc: "Kho xe của đại lý và doanh nghiệp ô tô."',
  'explore: "KHÁM PHÁ"',
  'post: "Đăng trong Đại lý ô tô"',
];
const dealersViOk = requiredDealersVi.every((s) => guardCopy.includes(s));
for (const snippet of requiredDealersVi) {
  if (!guardCopy.includes(snippet)) {
    fail(`Dealers de Autos VI registry missing: ${snippet}`);
  }
}
if (dealersViOk) pass("Dealers de Autos VI card copy complete in publicCategoryCopyGuard");

const viPostSamples = [];
const viLabelMatches = [...viSection.matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]);
for (const label of viLabelMatches) {
  viPostSamples.push(`Đăng trong ${label}`);
}
viPostSamples.push("Đăng trong Đại lý ô tô");

let viPostOk = true;
for (const post of viPostSamples) {
  for (const forbidden of VI_FORBIDDEN_POST_FRAGMENTS) {
    if (post.includes(forbidden)) {
      viPostOk = false;
      fail(`VI post CTA leakage: "${post}" contains "${forbidden}"`);
    }
  }
}
if (viPostOk) pass("VI post CTAs have no known English leakage fragments");

const requiredExports = [
  "getPublicCategoryLabel",
  "getPublicCategoryDescription",
  "getPublicCategoryExploreLabel",
  "getPublicCategoryPostCta",
  "getPublicCategoryCopyStatus",
  "CLASIFICADOS_HUB_VISIBLE_CATEGORY_KEYS",
];
const exportsOk = requiredExports.every(
  (n) => guardCopy.includes(`export function ${n}`) || guardCopy.includes(`export const ${n}`),
);
for (const name of requiredExports) {
  if (!guardCopy.includes(`export function ${name}`) && !guardCopy.includes(`export const ${name}`)) {
    fail(`publicCategoryCopyGuard missing export: ${name}`);
  }
}
if (exportsOk) pass("publicCategoryCopyGuard exports required helpers");

let visibleKeysOk = true;
for (const key of VISIBLE_HUB_KEYS) {
  if (!guardCopy.includes(`"${key}"`)) {
    visibleKeysOk = false;
    fail(`CLASIFICADOS_HUB_VISIBLE_CATEGORY_KEYS missing "${key}"`);
  }
}
if (visibleKeysOk) pass("Visible hub category key list includes ofertas-locales + dealers-de-autos");

console.log("\n---\n");
if (failures.length) {
  console.error(`FAIL (${failures.length} issue(s))`);
  process.exit(1);
}

console.log("PASS — public category copy guard checks OK");
process.exit(0);
