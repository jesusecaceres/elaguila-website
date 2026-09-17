/**
 * Gate COMIDA-LOCAL-2 — reconstructs a real Comida Local results URL from a normalized saved
 * search.
 *
 * Composes the category's own `buildComidaLocalResultsHref` (extracted in this gate into
 * `comidaLocalResultsUrl.ts` and now used by the LIVE filter component too) rather than
 * hand-rolling a second serializer the way the Rentas and Servicios builders had to. Because the
 * live filter form and this builder emit through the same function, and
 * `parseComidaLocalResultsSearchParams` reads those same keys back, a reconstructed URL cannot
 * drift from what a shopper would produce running the search themselves.
 *
 * Comida Local's results page has no sort or pagination state, so there is nothing to reset here.
 */
import { buildComidaLocalResultsHref } from "@/app/lib/clasificados/comida-local/comidaLocalResultsUrl";
import type { SupportedLang } from "@/app/lib/language";
import { savedSearchToComidaLocalFilters } from "./savedSearchComidaLocalAdapter";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";

export function buildComidaLocalSavedSearchResultsUrl(
  saved: SavedSearchNormalizedInput,
  routeLang: SupportedLang,
): string {
  const lang = routeLang === "en" ? "en" : "es";
  return buildComidaLocalResultsHref(savedSearchToComidaLocalFilters(saved), lang);
}
