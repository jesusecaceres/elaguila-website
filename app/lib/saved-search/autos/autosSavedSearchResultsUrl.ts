/**
 * Saved Search 03 — reconstructs a real Autos results URL from a normalized saved search.
 * Reuses the canonical Autos browse/query contract (`serializeAutosBrowseUrl`) verbatim — this is
 * not a second URL-building contract. Sort/page are never persisted as Saved Search match
 * semantics (see `savedSearchAutosAdapter.ts`), so the reconstructed URL always opens on page 1,
 * default "newest" sort — a genuinely different concern (display order) from what was saved.
 */
import { serializeAutosBrowseUrl, type AutosBrowseUrlBundle } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { autosMarketResultsPath, type AutosPublicMarket } from "@/app/lib/clasificados/autos/autosPublicMarket";
import type { SupportedLang } from "@/app/lib/language";
import { savedSearchToAutosFilterState } from "./savedSearchAutosAdapter";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";

/** `sellerType` in the saved filter payload determines which market path (private vs dealer
 * results) the search reopens on — the two lanes are genuinely different routes, not just a
 * query param, per `autosMarketResultsPath`. A search with no sellerType facet (either lane)
 * defaults to the private results path, matching this app's default market. */
function marketForSavedSearch(saved: SavedSearchNormalizedInput): AutosPublicMarket {
  const p = saved.filterPayload as { sellerType?: string };
  return p.sellerType === "dealer" ? "dealer" : "private";
}

export function buildAutosSavedSearchResultsUrl(saved: SavedSearchNormalizedInput, routeLang: SupportedLang): string {
  const { filters, searchQ } = savedSearchToAutosFilterState(saved);
  const market = marketForSavedSearch(saved);
  const bundle: AutosBrowseUrlBundle = {
    filters,
    q: searchQ,
    sort: "newest",
    page: 1,
    lang: routeLang === "en" ? "en" : "es",
    routeLang,
  };
  return `${autosMarketResultsPath(market)}?${serializeAutosBrowseUrl(bundle)}`;
}
