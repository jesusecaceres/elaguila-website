/**
 * Gate COMIDA-LOCAL-2 — the one place the Comida Local results URL contract lives.
 *
 * Before this gate the query string was built inline inside `ComidaLocalResultsFilters` and read
 * back by `parseComidaLocalResultsSearchParams` (server), with nothing tying the two together.
 * Saved Search needs to rebuild that exact URL from a stored search, and Rentas/Servicios had to
 * hand-roll a parallel serializer for precisely that reason — a second query contract that can
 * silently drift from the live parser.
 *
 * This module is deliberately pure and framework-free (NO `server-only`): the live client filter
 * component, the Saved Search results-URL builder and the owner dashboard all import the same
 * keys, so a future URL-key change is picked up by every one of them at once.
 *
 * `lang` is a route/display concern, never a match facet — it is carried on the href but is not
 * part of the filter contract below (see `savedSearchComidaLocalAdapter`).
 */
import type { ComidaLocalResultsFilters } from "./comidaLocalPublicTypes";

/** The live landing/results route — landing and results are the same page for this category. */
export const COMIDA_LOCAL_RESULTS_PATH = "/clasificados/comida-local";

/**
 * The exact URL keys `parseComidaLocalResultsSearchParams` reads. Listed once so the serializer
 * and every consumer share one vocabulary.
 */
export const COMIDA_LOCAL_RESULTS_PARAM_KEYS = [
  "q",
  "city",
  "foodType",
  "service",
  "priceLevel",
] as const satisfies readonly (keyof ComidaLocalResultsFilters)[];

export function emptyComidaLocalResultsFilters(): ComidaLocalResultsFilters {
  return { q: "", city: "", foodType: "", service: "", priceLevel: "" };
}

/** True when any real inclusion filter is set (`lang` deliberately does not count). */
export function hasActiveComidaLocalResultsFilters(filters: ComidaLocalResultsFilters): boolean {
  return COMIDA_LOCAL_RESULTS_PARAM_KEYS.some((key) => Boolean(filters[key]?.trim()));
}

/**
 * Serialize filters into the live results query string. Empty values are omitted entirely, which
 * is what the parser already treats as "no filter on this field" — so a reconstructed URL is
 * byte-identical to one a shopper would produce with the same filters.
 */
export function comidaLocalResultsFiltersToParams(
  filters: ComidaLocalResultsFilters,
  lang: "es" | "en",
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("lang", lang);
  for (const key of COMIDA_LOCAL_RESULTS_PARAM_KEYS) {
    const value = filters[key]?.trim();
    if (value) params.set(key, value);
  }
  return params;
}

export function buildComidaLocalResultsHref(
  filters: ComidaLocalResultsFilters,
  lang: "es" | "en",
): string {
  return `${COMIDA_LOCAL_RESULTS_PATH}?${comidaLocalResultsFiltersToParams(filters, lang).toString()}`;
}
