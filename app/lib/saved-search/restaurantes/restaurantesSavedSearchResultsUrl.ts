/**
 * Gate RESTAURANTES-2 — reconstructs a real Restaurantes results URL from a normalized saved search.
 *
 * Unlike Rentas and Servicios (whose results pages build their query strings ad hoc, forcing their
 * adapters to hand-roll a parallel serializer), Restaurantes already owns a canonical pair:
 * `restaurantesDiscoveryStateToParams` + `buildRestaurantesResultsHref`, and
 * `parseRestaurantesResultsSearchParams` reads them back. This builder therefore composes those
 * existing functions rather than introducing a second query contract — so it cannot drift from the
 * live parser, and every future URL-key change is picked up for free.
 *
 * Sort and page are never persisted as match semantics (see the adapter), and the reverse mapper
 * restores the category's own defaults for them, so a reconstructed URL always opens on the default
 * sort, page 1.
 */
import {
  buildRestaurantesResultsHref,
  restaurantesDiscoveryStateToParams,
  type RestaurantesDiscoveryLang,
} from "@/app/(site)/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import type { SupportedLang } from "@/app/lib/language";
import { savedSearchToRestaurantesDiscoveryState } from "./savedSearchRestaurantesAdapter";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";

export function buildRestaurantesSavedSearchResultsUrl(
  saved: SavedSearchNormalizedInput,
  routeLang: SupportedLang,
): string {
  const lang: RestaurantesDiscoveryLang = routeLang === "en" ? "en" : "es";
  const state = savedSearchToRestaurantesDiscoveryState(saved, lang);
  return buildRestaurantesResultsHref(lang, restaurantesDiscoveryStateToParams(state));
}
