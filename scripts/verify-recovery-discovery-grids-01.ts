/**
 * RECOVERY — discovery grids 01 (semantic port of 5c63e05ea
 * "fix(classifieds): stabilize image grids and complete local discovery landings").
 *
 * Source-pin verifier (no build, no network): pins the canonical
 * LEONIX_IMAGE_DISCOVERY_GRID constant + its consumers, the min-w-0 grid/card
 * sites on the Clasificados hub and Negocios Locales, the Ofertas Locales
 * switch to the image discovery grid, the bilingual ComidaLocalDiscoverySection
 * mount, and that every image src referenced by these grids exists in public/.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-recovery-discovery-grids-01.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel: string): string => readFileSync(path.join(ROOT, rel), "utf8");

let failures = 0;
let passes = 0;
function check(label: string, fn: () => void): void {
  try {
    fn();
    passes += 1;
    console.log(`PASS  ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`FAIL  ${label}\n      ${(err as Error).message.split("\n")[0]}`);
  }
}

const V2 = "app/(site)/clasificados/components/categoryStandardV2";
const GRID_VALUE = "mt-4 grid min-w-0 grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4";

const F = {
  constants: `${V2}/constants.ts`,
  index: `${V2}/index.ts`,
  imageGrid: `${V2}/LeonixCategoryImageDiscoveryGrid.tsx`,
  brTiles: "app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingIntentTiles.tsx",
  rentasTiles: "app/(site)/clasificados/rentas/landing/RentasLandingIntentTiles.tsx",
  hub: "app/(site)/clasificados/ClasificadosHubClient.tsx",
  hubCard: "app/(site)/clasificados/_components/ClasificadosHubCategoryCard.tsx",
  negocios: "app/(site)/negocios-locales/NegociosLocalesClient.tsx",
  ofertas: "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx",
  comidaSection: "app/(site)/clasificados/comida-local/components/ComidaLocalDiscoverySection.tsx",
  comidaPage: "app/(site)/clasificados/comida-local/page.tsx",
  comidaConstants: "app/lib/clasificados/comida-local/comidaLocalConstants.ts",
} as const;

// ── 1. Canonical constant ────────────────────────────────────────────────────
check("constants.ts exports LEONIX_IMAGE_DISCOVERY_GRID with min-w-0 grid value", () => {
  const s = src(F.constants);
  const m = s.match(/export const LEONIX_IMAGE_DISCOVERY_GRID\s*=\s*"([^"]+)"/);
  assert.ok(m, "constant not found");
  assert.equal(m[1], GRID_VALUE);
});
check("categoryStandardV2/index.ts re-exports LEONIX_IMAGE_DISCOVERY_GRID", () => {
  assert.match(src(F.index), /^\s*LEONIX_IMAGE_DISCOVERY_GRID,\s*$/m);
});

// ── 2. Consumers use the constant (no forked grid string) ────────────────────
for (const [label, rel] of [
  ["LeonixCategoryImageDiscoveryGrid", F.imageGrid],
  ["BienesRaicesLandingIntentTiles", F.brTiles],
  ["RentasLandingIntentTiles", F.rentasTiles],
  ["ComidaLocalDiscoverySection", F.comidaSection],
] as const) {
  check(`${label} renders <div className={LEONIX_IMAGE_DISCOVERY_GRID}> and imports it`, () => {
    const s = src(rel);
    assert.ok(s.includes("<div className={LEONIX_IMAGE_DISCOVERY_GRID}>"), "grid div not using constant");
    assert.match(s, /import\s*\{[^}]*\bLEONIX_IMAGE_DISCOVERY_GRID\b[^}]*\}\s*from/, "constant not imported");
    assert.ok(!s.includes('"mt-4 grid grid-cols-2 gap-2.5'), "legacy non-min-w-0 grid string still present");
  });
}

// ── 3. min-w-0 at hub / negocios / hub card ──────────────────────────────────
check("ClasificadosHubClient <ul> grid has min-w-0", () => {
  assert.ok(
    src(F.hub).includes(
      '<ul className="mt-8 grid min-w-0 grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">',
    ),
  );
});
check("ClasificadosHubClient every category <li> has min-w-0", () => {
  const s = src(F.hub);
  const withMin = s.match(/<li key=\{k\} className="flex h-full min-w-0">/g) ?? [];
  const without = s.match(/<li key=\{k\} className="flex h-full">/g) ?? [];
  assert.ok(withMin.length >= 1, "no min-w-0 <li>");
  assert.equal(without.length, 0, "a category <li> still lacks min-w-0");
});
check("NegociosLocalesClient <ul> + <li> have min-w-0", () => {
  const s = src(F.negocios);
  assert.ok(
    s.includes('<ul className="mt-8 grid min-w-0 grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">'),
    "<ul> missing min-w-0",
  );
  assert.ok(s.includes('<li key={lane} className="flex h-full min-w-0">'), "<li> missing min-w-0");
  assert.ok(!s.includes('<li key={lane} className="flex h-full">'), "legacy <li> still present");
});
check("ClasificadosHubCategoryCard <article> has min-w-0", () => {
  assert.ok(src(F.hubCard).includes("group flex h-full w-full min-w-0 flex-col overflow-hidden"));
});

// ── 4. Ofertas uses the image grid ───────────────────────────────────────────
check("Ofertas uses LeonixCategoryImageDiscoveryGrid (icon grid no longer referenced)", () => {
  const s = src(F.ofertas);
  assert.ok(s.includes("<LeonixCategoryImageDiscoveryGrid"), "image grid not rendered");
  assert.match(s, /^\s*LeonixCategoryImageDiscoveryGrid,\s*$/m, "image grid not imported");
  assert.ok(!/\bLeonixCategoryDiscoveryGrid\b/.test(s), "icon grid still referenced");
});
check("Ofertas: every discovery item carries a bilingual imageAlt (10 items)", () => {
  const alts = src(F.ofertas).match(/imageAlt: lang === "es" \? "[^"]+" : "[^"]+",/g) ?? [];
  assert.equal(alts.length, 10);
});
check("Ofertas: store/service/food items carry their photo", () => {
  const s = src(F.ofertas);
  for (const img of [
    "/selector-cards/varios-resale-comunitario.jpg",
    "/selector-cards/servicios-locales.jpg",
    "/selector-cards/comida-local-vendedor-movil.jpg",
  ]) {
    assert.ok(s.includes(`imageSrc: "${img}",`), `missing ${img}`);
  }
});

// ── 5. Comida Local discovery section: mounted, bilingual, real foodType ─────
check("comida-local page imports and mounts <ComidaLocalDiscoverySection lang={lang} />", () => {
  const s = src(F.comidaPage);
  assert.ok(
    s.includes('import { ComidaLocalDiscoverySection } from "./components/ComidaLocalDiscoverySection";'),
    "import missing",
  );
  assert.ok(s.includes("<ComidaLocalDiscoverySection lang={lang} />"), "mount missing / lang not threaded");
});
check("ComidaLocalDiscoverySection has ES + EN heading/subtitle copy", () => {
  const s = src(F.comidaSection);
  assert.ok(s.includes('heading: "Explora por tipo de comida"'), "ES heading");
  assert.ok(s.includes('heading: "Explore by food type"'), "EN heading");
  assert.ok(/es:\s*\{[\s\S]*?subtitle:/.test(s) && /en:\s*\{[\s\S]*?subtitle:/.test(s), "subtitles");
  assert.ok(s.includes("lang }: { lang: \"es\" | \"en\" }"), "lang prop");
});
check("ComidaLocalDiscoverySection hrefs are lang-carrying (buildComidaLocalResultsHref)", () => {
  const s = src(F.comidaSection);
  assert.match(s, /href: buildComidaLocalResultsHref\(\s*\{ \.\.\.emptyComidaLocalResultsFilters\(\), foodType: def\.foodType \},\s*lang,\s*\)/);
  assert.ok(!s.includes('"/clasificados/comida-local?foodType='), "hard-coded non-localized href");
});
check("ComidaLocalDiscoverySection foodType values exist in COMIDA_LOCAL_FOOD_TYPE_OPTIONS", () => {
  const section = src(F.comidaSection);
  const consts = src(F.comidaConstants);
  const optBlock = consts.slice(consts.indexOf("COMIDA_LOCAL_FOOD_TYPE_OPTIONS"));
  const valid = new Set(
    [...optBlock.slice(0, optBlock.indexOf("];")).matchAll(/value: "([^"]+)"/g)].map((m) => m[1]),
  );
  const used = [...section.matchAll(/foodType: "([^"]+)"/g)].map((m) => m[1]);
  assert.equal(used.length, 6, `expected 6 items, got ${used.length}`);
  for (const v of used) assert.ok(valid.has(v), `foodType "${v}" not in COMIDA_LOCAL_FOOD_TYPE_OPTIONS`);
  assert.equal(
    [...section.matchAll(/labelEs: "[^"]+",\s*labelEn: "[^"]+",\s*hintEs: "[^"]+",\s*hintEn: "[^"]+"/g)].length,
    6,
    "every item needs labelEs/labelEn/hintEs/hintEn",
  );
});

// ── 6. Every image src referenced by these grids exists in public/ ───────────
check("every imageSrc referenced in Ofertas + Comida Local exists under public/", () => {
  const refs = new Set<string>();
  for (const rel of [F.ofertas, F.comidaSection]) {
    for (const m of src(rel).matchAll(/imageSrc: "(\/[^"]+)"/g)) refs.add(m[1]);
  }
  assert.ok(refs.size >= 6, `expected >= 6 image refs, found ${refs.size}`);
  const missing = [...refs].filter((p) => !existsSync(path.join(ROOT, "public", p)));
  assert.deepEqual(missing, [], `missing in public/: ${missing.join(", ")}`);
});

console.log(`\n${passes} passed, ${failures} failed`);
if (failures > 0) process.exit(1);
