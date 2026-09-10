/**
 * Gate COMIDA-LOCAL-2 — Comida Local adapter for the shared Saved Search system.
 *
 * Translates between the live Comida Local results filter contract (`ComidaLocalResultsFilters`,
 * the exact shape `parseComidaLocalResultsSearchParams` produces and `applyFilters` consumes) and
 * the generic normalized Saved Search contract. Same shape and doctrine as the proven Autos /
 * Bienes Raíces / Rentas / Servicios / Restaurantes adapters — this file contains no engine of its
 * own, only the field translation only Comida Local can know.
 *
 * The whole live filter contract is five fields: `q`, `city`, `foodType`, `service`, `priceLevel`.
 * All five are real inclusion filters and all five are represented. This category has no `sort`,
 * `page`, `perPage`, `saved` or `near` state to exclude — its results page has none of them — so
 * unlike the larger categories there is nothing here that needed a judgement call about
 * presentation-vs-inclusion. The only excluded key is:
 *   - `lang` — route/display language, not match semantics (same call every other adapter made).
 *
 * FIND ME TODAY IS DELIBERATELY ABSENT. `locationNote` / `locationUrl` / `locationUpdatedAt` (the
 * Gate COMIDA-LOCAL-1 temporary-location payload) are NOT part of this payload and must never be:
 * the live results filter has no freshness or current-location facet, so there is no durable
 * filter to fingerprint. Fingerprinting a 24-hour-scoped value would also make an otherwise
 * identical saved search change identity every time a vendor moved, and would let a stored search
 * outlive the freshness window it was fingerprinted against. See §11.5 of the wiring map.
 *
 * PRICE: `priceLevel` is a price LEVEL token ("1" | "2" | "3", rendered "$"/"$$"/"$$$"), not a
 * numeric band, so the generic `minPrice`/`maxPrice` columns are truthfully `null` and the level
 * lives in `filterPayload`. Inventing a numeric range here would be a fabricated filter — the same
 * call the Restaurantes adapter made about its own level token.
 *
 * CITY: stored in the generic `city` column verbatim, because the live filter matches it as a
 * case-insensitive SUBSTRING over `city_display + city_canonical`. Normalizing or canonicalizing it
 * here would make a saved search match a different set of rows than the shopper saw.
 */
import type { ComidaLocalResultsFilters } from "@/app/lib/clasificados/comida-local/comidaLocalPublicTypes";
import { emptyComidaLocalResultsFilters } from "@/app/lib/clasificados/comida-local/comidaLocalResultsUrl";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";

export const SAVED_SEARCH_COMIDA_LOCAL_CATEGORY = "comida-local";

/** Every key optional; an absent key means "no filter on this field", matching the live filter's
 * own empty-string convention. Stored in `saved_searches.filter_payload`. */
export type ComidaLocalSavedSearchFilterPayload = {
  q?: string;
  /** `food_type` token (URL `foodType`). */
  foodType?: string;
  /** One service option (URL `service`) — the live filter matches a single value, not a set. */
  service?: string;
  /** Price LEVEL token ("1" | "2" | "3"), not an amount. */
  priceLevel?: string;
};

/** The filters the shopper is actively browsing with -> the generic normalized contract. */
export function comidaLocalFiltersToSavedSearch(
  filters: ComidaLocalResultsFilters,
): SavedSearchNormalizedInput {
  const payload: ComidaLocalSavedSearchFilterPayload = {};

  const q = filters.q?.trim();
  if (q) payload.q = q;
  const foodType = filters.foodType?.trim();
  if (foodType) payload.foodType = foodType;
  const service = filters.service?.trim();
  if (service) payload.service = service;
  const priceLevel = filters.priceLevel?.trim();
  if (priceLevel) payload.priceLevel = priceLevel;

  return {
    category: SAVED_SEARCH_COMIDA_LOCAL_CATEGORY,
    city: filters.city?.trim() ?? "",
    // Comida Local filters on a price LEVEL token, never a numeric band — see the header.
    minPrice: null,
    maxPrice: null,
    filterPayload: payload as Record<string, unknown>,
  };
}

/** A saved search row -> the exact `ComidaLocalResultsFilters` the real filter expects. Starts
 * from the category's own empty filters so every unsaved field carries its real default. */
export function savedSearchToComidaLocalFilters(
  saved: SavedSearchNormalizedInput,
): ComidaLocalResultsFilters {
  const p = (saved.filterPayload ?? {}) as ComidaLocalSavedSearchFilterPayload;
  return {
    ...emptyComidaLocalResultsFilters(),
    city: saved.city ?? "",
    q: p.q ?? "",
    foodType: p.foodType ?? "",
    service: p.service ?? "",
    priceLevel: p.priceLevel ?? "",
  };
}

/**
 * Human-readable summary of the matching facets for the owner dashboard's saved-search list.
 * Never dumps raw `filter_payload` JSON; only surfaces facets a person would recognize.
 */
export function describeComidaLocalSavedSearchFacets(
  saved: SavedSearchNormalizedInput,
  lang: "es" | "en",
): string[] {
  const p = (saved.filterPayload ?? {}) as ComidaLocalSavedSearchFilterPayload;
  const parts: string[] = [];

  if (p.foodType) parts.push(p.foodType);
  if (p.service) {
    parts.push(
      p.service === "delivery"
        ? lang === "es"
          ? "Entrega"
          : "Delivery"
        : p.service === "pickup"
          ? lang === "es"
            ? "Para recoger"
            : "Pickup"
          : p.service === "in_person"
            ? lang === "es"
              ? "En persona"
              : "In person"
            : p.service,
    );
  }
  if (p.priceLevel) {
    // The category's own visible price token, not a fabricated amount.
    parts.push("$".repeat(Math.min(3, Math.max(1, Number(p.priceLevel) || 1))));
  }
  if (p.q) parts.push(`"${p.q}"`);

  return parts;
}
