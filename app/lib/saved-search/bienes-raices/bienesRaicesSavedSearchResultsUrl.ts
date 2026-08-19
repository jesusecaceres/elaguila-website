/**
 * Saved Search 06 — reconstructs a real BR results URL from a normalized saved search. Reuses the
 * canonical BR results query contract (`mergeBrResultsHref`) verbatim. Sort/page are never
 * persisted as Saved Search match semantics, so the reconstructed URL always opens on the default
 * "reciente" sort, page 1 — mirroring `buildAutosSavedSearchResultsUrl`'s exact same reasoning.
 */
import { mergeBrResultsHref } from "@/app/clasificados/bienes-raices/resultados/lib/brResultsUrlState";
import type { SupportedLang } from "@/app/lib/language";
import { savedSearchToBienesRaicesFilterState } from "./savedSearchBienesRaicesAdapter";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";

export function buildBienesRaicesSavedSearchResultsUrl(saved: SavedSearchNormalizedInput, routeLang: SupportedLang): string {
  const state = savedSearchToBienesRaicesFilterState(saved);
  const lang = routeLang === "en" ? "en" : "es";
  return mergeBrResultsHref(
    new URLSearchParams(),
    {
      q: state.q || null,
      city: state.city || null,
      state: state.state || null,
      country: state.country || null,
      operationType: state.operationType || null,
      propertyType: state.propertyType || null,
      sellerType: state.sellerType || null,
      priceMin: state.priceMin || null,
      priceMax: state.priceMax || null,
      beds: state.beds || null,
      baths: state.baths || null,
      pets: state.pets || null,
      furnished: state.furnished || null,
      pool: state.pool || null,
      zip: state.zip || null,
    },
    lang,
  );
}
