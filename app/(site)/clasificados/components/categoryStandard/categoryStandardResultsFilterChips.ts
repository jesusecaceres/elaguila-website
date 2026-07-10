import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  LEONIX_LB_DEFAULT_COUNTRY,
  LEONIX_LB_DEFAULT_STATE,
} from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessLocationContract";
import {
  buildCategoryResultsUrl,
  type CatStdAllSlug,
} from "./categoryStandardRoutes";
import type { ActiveFilterChip } from "./CategoryStandardActiveFilterChips";

export type ResultsFilterParams = Record<string, string | undefined>;

export function cleanResultsFilterParams(params: ResultsFilterParams): ResultsFilterParams {
  const out: ResultsFilterParams = {};
  for (const [k, v] of Object.entries(params)) {
    const t = String(v ?? "").trim();
    if (!t || t === "all") continue;
    out[k] = t;
  }
  return out;
}

export function buildResultsFilterChipHref(
  slug: CatStdAllSlug,
  lang: Lang,
  params: ResultsFilterParams,
  omitKey: string,
): string {
  const next = { ...params };
  delete next[omitKey];
  return buildCategoryResultsUrl(slug, lang, cleanResultsFilterParams(next));
}

export function buildLocationFilterChips(
  slug: CatStdAllSlug,
  lang: Lang,
  loc: { q: string; city: string; state: string; zip: string; country: string },
  allParams: ResultsFilterParams,
): ActiveFilterChip[] {
  const L = lang === "es";
  const chips: ActiveFilterChip[] = [];
  if (loc.q.trim()) {
    chips.push({
      key: "q",
      label: `${L ? "Palabra" : "Keyword"}: ${loc.q.trim()}`,
      href: buildResultsFilterChipHref(slug, lang, allParams, "q"),
    });
  }
  if (loc.city.trim()) {
    chips.push({
      key: "city",
      label: `${L ? "Ciudad" : "City"}: ${loc.city.trim()}`,
      href: buildResultsFilterChipHref(slug, lang, allParams, "city"),
    });
  }
  if (loc.state.trim() && loc.state.trim() !== LEONIX_LB_DEFAULT_STATE) {
    chips.push({
      key: "state",
      label: `${L ? "Estado" : "State"}: ${loc.state.trim()}`,
      href: buildResultsFilterChipHref(slug, lang, allParams, "state"),
    });
  }
  if (loc.zip.trim()) {
    chips.push({
      key: "zip",
      label: `ZIP: ${loc.zip.trim()}`,
      href: buildResultsFilterChipHref(slug, lang, allParams, "zip"),
    });
  }
  if (loc.country.trim() && loc.country.trim() !== LEONIX_LB_DEFAULT_COUNTRY) {
    chips.push({
      key: "country",
      label: loc.country.trim(),
      href: buildResultsFilterChipHref(slug, lang, allParams, "country"),
    });
  }
  return chips;
}
