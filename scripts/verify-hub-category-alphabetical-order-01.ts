/**
 * Verifies the Clasificados and Negocios Locales hub grids render categories/lanes
 * in locale-aware alphabetical order by label (ES and EN), guarding against a
 * regression back to arbitrary/hardcoded array order.
 *
 * Run: npm run verify:hub-category-alphabetical-order
 */
import { sortByLocaleLabel } from "../app/lib/localeAlphabeticalSort";
import { getPublicCategoryCardCopy } from "../app/lib/clasificados/publicCategoryCopyGuard";
import type { HubCategoryKey } from "../app/(site)/clasificados/config/clasificadosHub";
import {
  NEGOCIOS_LANE_COPY,
  NEGOCIOS_SECTOR_GRID_ORDER,
} from "../app/(site)/negocios-locales/_lib/negociosLocalesLanes";

function fail(message: string): never {
  console.error(`verify-hub-category-alphabetical-order: FAIL - ${message}`);
  process.exit(1);
}
function ok(message: string) {
  console.log(`OK: ${message}`);
}

const CLASIFICADOS_KEYS: readonly HubCategoryKey[] = [
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

function assertNaiveCollationOrder(labels: string[], locale: string, context: string) {
  const naiveSorted = [...labels].sort((a, b) => a.localeCompare(b, locale, { sensitivity: "base", numeric: true }));
  if (JSON.stringify(labels) !== JSON.stringify(naiveSorted)) {
    fail(`${context}: rendered order is not alphabetical for locale "${locale}".\n  got:  ${JSON.stringify(labels)}\n  want: ${JSON.stringify(naiveSorted)}`);
  }
}

for (const locale of ["es", "en"] as const) {
  const sortedKeys = sortByLocaleLabel(
    CLASIFICADOS_KEYS,
    (k) => getPublicCategoryCardCopy(k, locale).label,
    locale,
  );
  const sortedLabels = sortedKeys.map((k) => getPublicCategoryCardCopy(k, locale).label);
  assertNaiveCollationOrder(sortedLabels, locale, `Clasificados (${locale})`);

  if (sortedKeys.length !== CLASIFICADOS_KEYS.length) {
    fail(`Clasificados (${locale}): sorted key count mismatch (membership must be preserved, order only derived)`);
  }
  for (const k of CLASIFICADOS_KEYS) {
    if (!sortedKeys.includes(k)) fail(`Clasificados (${locale}): missing category "${k}" after sort`);
  }
  if (sortedKeys.includes("ofertas-locales" as HubCategoryKey) || sortedKeys.includes("dealers-de-autos" as HubCategoryKey)) {
    fail(`Clasificados (${locale}): featured/special lanes must stay structurally separate from the alphabetized grid`);
  }
  ok(`Clasificados hub grid is alphabetical by label for locale "${locale}"`);
}

for (const locale of ["es", "en"] as const) {
  const getLabel = (lane: (typeof NEGOCIOS_SECTOR_GRID_ORDER)[number]) =>
    locale === "es" ? NEGOCIOS_LANE_COPY[lane].labelEs : NEGOCIOS_LANE_COPY[lane].labelEn;

  const sortedLanes = sortByLocaleLabel(NEGOCIOS_SECTOR_GRID_ORDER, getLabel, locale);
  const sortedLabels = sortedLanes.map(getLabel);
  assertNaiveCollationOrder(sortedLabels, locale, `Negocios Locales (${locale})`);

  if (sortedLanes.length !== NEGOCIOS_SECTOR_GRID_ORDER.length) {
    fail(`Negocios Locales (${locale}): sorted lane count mismatch (membership must be preserved, order only derived)`);
  }
  if (sortedLanes.includes("ofertas-locales" as (typeof NEGOCIOS_SECTOR_GRID_ORDER)[number])) {
    fail(`Negocios Locales (${locale}): "ofertas-locales" must stay featured/separate, not part of the alphabetized sector grid`);
  }
  ok(`Negocios Locales sector grid is alphabetical by label for locale "${locale}"`);
}

console.log("verify-hub-category-alphabetical-order: PASS");
