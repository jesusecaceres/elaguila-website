import type { Lang } from "@/app/clasificados/config/clasificadosHub";
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
  allParams: ResultsFilterParams,
): ActiveFilterChip[] {
  const L = lang === "es";
  const chips: ActiveFilterChip[] = [];
  if (allParams.q?.trim()) {
    chips.push({
      key: "q",
      label: `${L ? "Palabra" : "Keyword"}: ${allParams.q.trim()}`,
      href: buildResultsFilterChipHref(slug, lang, allParams, "q"),
    });
  }
  if (allParams.city?.trim()) {
    chips.push({
      key: "city",
      label: `${L ? "Ciudad" : "City"}: ${allParams.city.trim()}`,
      href: buildResultsFilterChipHref(slug, lang, allParams, "city"),
    });
  }
  if (allParams.state?.trim()) {
    chips.push({
      key: "state",
      label: `${L ? "Estado" : "State"}: ${allParams.state.trim()}`,
      href: buildResultsFilterChipHref(slug, lang, allParams, "state"),
    });
  }
  if (allParams.zip?.trim()) {
    chips.push({
      key: "zip",
      label: `ZIP: ${allParams.zip.trim()}`,
      href: buildResultsFilterChipHref(slug, lang, allParams, "zip"),
    });
  }
  if (allParams.country?.trim()) {
    chips.push({
      key: "country",
      label: allParams.country.trim(),
      href: buildResultsFilterChipHref(slug, lang, allParams, "country"),
    });
  }
  return chips;
}
