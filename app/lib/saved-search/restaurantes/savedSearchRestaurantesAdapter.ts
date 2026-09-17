/**
 * Gate RESTAURANTES-2 — Restaurantes adapter for the shared Saved Search system.
 *
 * Translates between the live Restaurantes discovery contract (`RestaurantesDiscoveryState`,
 * `app/(site)/clasificados/restaurantes/lib/restaurantesDiscoveryContract.ts`) and the generic
 * normalized Saved Search contract. Same shape and doctrine as the proven Autos / Bienes Raíces /
 * Rentas / Servicios adapters — this file contains no engine of its own, only the field
 * translation only Restaurantes can know.
 *
 * Only fields the REAL results filter (`filterRestaurantesBlueprintRows`) uses to decide inclusion
 * are represented. Deliberately excluded, each for a stated reason:
 *   - `sort` / `page` / `perPage` — presentation and pagination, never inclusion. Persisting them
 *     would make two identical searches fingerprint differently.
 *   - `saved` — filters to ids saved locally on THIS device (first-party, consent-gated). It is
 *     not a shareable or matchable facet; a saved search carrying it would match nothing on the
 *     server and would mean something different on every device.
 *   - `near` — intent only. The filter itself documents that without city/zip it deliberately does
 *     not exclude any row ("honest until geo radius ships"), so saving it would save a promise the
 *     engine does not keep. Same call the Autos adapter made about `radiusMiles`.
 *   - `lang` — route/display language, not match semantics.
 *
 * PRICE: Restaurantes' `price` is a price LEVEL token ("$", "$$", "$$$", "$$$$"), not a numeric
 * band, so the generic `minPrice`/`maxPrice` columns are truthfully `null` and the level lives in
 * `filterPayload`. Inventing a numeric range here would be a fabricated filter.
 */
import type {
  RestaurantesDiscoveryState,
  RestaurantesDiscoveryLang,
} from "@/app/(site)/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import { defaultRestaurantesDiscoveryState } from "@/app/(site)/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";

export const SAVED_SEARCH_RESTAURANTES_CATEGORY = "restaurantes";

/** Every key optional; an absent key means "no filter on this field", matching the discovery
 * state's own ""/false/empty-array conventions. Stored in `saved_searches.filter_payload`. */
export type RestaurantesSavedSearchFilterPayload = {
  q?: string;
  state?: string;
  zip?: string;
  country?: string;
  /** Substring match on `neighborhood` (URL `nbh`). */
  nbh?: string;
  cuisine?: string;
  /** `businessType` (URL `biz`). */
  biz?: string;
  /** Service mode (URL `svc`). */
  svc?: string;
  /** Price LEVEL token, not an amount. */
  price?: string;
  diet?: "glutenfree" | "halal" | "vegan";
  /** Single highlight key (URL `hl`). */
  hl?: string;
  /** Minimum declared delivery radius in miles (URL `drm`). */
  deliveryRadiusMin?: number;

  family?: boolean;
  open?: boolean;
  top?: boolean;
  reservationsOnly?: boolean;
  preorderOnly?: boolean;
  pickupOnly?: boolean;
  promotedOnly?: boolean;
  verifiedOnly?: boolean;
  movingVendor?: boolean;
  homeBasedBusiness?: boolean;
  foodTruck?: boolean;
  popUp?: boolean;
  menuOnly?: boolean;
  socialOnly?: boolean;
  websiteOnly?: boolean;
  whatsappOnly?: boolean;

  /** Multi-select key sets — always stored SORTED (see `sortedKeys`). */
  spoken?: string[];
  pay?: string[];
  amb?: string[];
  amen?: string[];
  acc?: string[];
  food?: string[];
};

/** Boolean facets that are real inclusion filters, listed once so both directions cannot drift. */
const BOOLEAN_KEYS = [
  "family",
  "open",
  "top",
  "reservationsOnly",
  "preorderOnly",
  "pickupOnly",
  "promotedOnly",
  "verifiedOnly",
  "movingVendor",
  "homeBasedBusiness",
  "foodTruck",
  "popUp",
  "menuOnly",
  "socialOnly",
  "websiteOnly",
  "whatsappOnly",
] as const satisfies readonly (keyof RestaurantesSavedSearchFilterPayload)[];

/** Multi-select key sets, listed once for the same reason. */
const KEY_SET_KEYS = ["spoken", "pay", "amb", "amen", "acc", "food"] as const satisfies readonly (keyof RestaurantesSavedSearchFilterPayload)[];

type RestaurantesBooleanKey = (typeof BOOLEAN_KEYS)[number];
type RestaurantesKeySetKey = (typeof KEY_SET_KEYS)[number];

/**
 * `canonicalizeSavedSearch` canonicalizes array ELEMENTS but deliberately never reorders an array
 * — order can be semantically meaningful, and only the category adapter knows whether a given
 * field is an unordered set. These six are unordered sets (`intersectsAny` in the real filter), so
 * the adapter sorts them itself, exactly as that contract instructs.
 */
function sortedKeys(raw: string[] | undefined): string[] | undefined {
  const cleaned = (raw ?? []).map((k) => k.trim()).filter(Boolean);
  if (cleaned.length === 0) return undefined;
  return [...new Set(cleaned)].sort();
}

/** The discovery state the shopper is actively browsing with -> the generic normalized contract. */
export function restaurantesDiscoveryStateToSavedSearch(
  state: RestaurantesDiscoveryState,
): SavedSearchNormalizedInput {
  const payload: RestaurantesSavedSearchFilterPayload = {};

  const q = state.q?.trim();
  if (q) payload.q = q;
  const stateCode = state.state?.trim();
  if (stateCode) payload.state = stateCode;
  const zip = state.zip?.trim();
  if (zip) payload.zip = zip;
  const country = state.country?.trim();
  if (country) payload.country = country;
  const nbh = state.neighborhoodQuery?.trim();
  if (nbh) payload.nbh = nbh;
  const cuisine = state.cuisine?.trim();
  if (cuisine) payload.cuisine = cuisine;
  const biz = state.biz?.trim();
  if (biz) payload.biz = biz;
  const svc = state.svc?.trim();
  if (svc) payload.svc = svc;
  const price = state.price?.trim();
  if (price) payload.price = price;
  if (state.diet) payload.diet = state.diet;
  const hl = state.hl?.trim();
  if (hl) payload.hl = hl;
  if (
    typeof state.deliveryRadiusMin === "number" &&
    Number.isFinite(state.deliveryRadiusMin) &&
    state.deliveryRadiusMin > 0
  ) {
    payload.deliveryRadiusMin = Math.trunc(state.deliveryRadiusMin);
  }

  for (const key of BOOLEAN_KEYS) {
    if (state[key as RestaurantesBooleanKey] === true) payload[key] = true;
  }
  for (const key of KEY_SET_KEYS) {
    const keys = sortedKeys(state[key as RestaurantesKeySetKey]);
    if (keys) payload[key] = keys;
  }

  return {
    category: SAVED_SEARCH_RESTAURANTES_CATEGORY,
    city: state.city?.trim() ?? "",
    // Restaurantes filters on a price LEVEL token, never a numeric band — see the header.
    minPrice: null,
    maxPrice: null,
    filterPayload: payload as Record<string, unknown>,
  };
}

/** A saved search row -> the exact `RestaurantesDiscoveryState` the real filter expects. Starts
 * from the category's own default state so every unsaved field carries its real default. */
export function savedSearchToRestaurantesDiscoveryState(
  saved: SavedSearchNormalizedInput,
  lang: RestaurantesDiscoveryLang = "es",
): RestaurantesDiscoveryState {
  const p = (saved.filterPayload ?? {}) as RestaurantesSavedSearchFilterPayload;
  const next: RestaurantesDiscoveryState = {
    ...defaultRestaurantesDiscoveryState(lang),
    city: saved.city ?? "",
    q: p.q ?? "",
    state: p.state ?? "",
    zip: p.zip ?? "",
    country: p.country ?? "",
    neighborhoodQuery: p.nbh ?? "",
    cuisine: p.cuisine ?? "",
    biz: (p.biz ?? "") as RestaurantesDiscoveryState["biz"],
    svc: p.svc ?? "",
    price: p.price ?? "",
    diet: p.diet ?? "",
    hl: p.hl ?? "",
  };
  if (p.deliveryRadiusMin != null) next.deliveryRadiusMin = p.deliveryRadiusMin;
  for (const key of BOOLEAN_KEYS) {
    next[key as RestaurantesBooleanKey] = p[key] === true;
  }
  for (const key of KEY_SET_KEYS) {
    next[key as RestaurantesKeySetKey] = p[key] ?? [];
  }
  return next;
}

/**
 * Human-readable summary of the major matching facets for the owner dashboard's saved-search list.
 * Never dumps raw `filter_payload` JSON; only surfaces facets a person would recognize.
 */
export function describeRestaurantesSavedSearchFacets(
  saved: SavedSearchNormalizedInput,
  lang: "es" | "en",
): string[] {
  const p = (saved.filterPayload ?? {}) as RestaurantesSavedSearchFilterPayload;
  const parts: string[] = [];

  if (p.cuisine) parts.push(p.cuisine);
  if (p.biz) parts.push(p.biz);
  if (p.price) parts.push(p.price);
  if (p.diet) {
    parts.push(
      p.diet === "vegan"
        ? lang === "es"
          ? "Vegano"
          : "Vegan"
        : p.diet === "halal"
          ? "Halal"
          : lang === "es"
            ? "Sin gluten"
            : "Gluten-free",
    );
  }
  if (p.open) parts.push(lang === "es" ? "Abierto ahora" : "Open now");
  if (p.top) parts.push(lang === "es" ? "Mejor calificados" : "Top rated");
  if (p.verifiedOnly) parts.push(lang === "es" ? "Verificado por Leonix" : "Leonix verified");
  if (p.family) parts.push(lang === "es" ? "Familiar" : "Family friendly");
  if (p.reservationsOnly) parts.push(lang === "es" ? "Con reservación" : "Reservations");
  if (p.pickupOnly) parts.push(lang === "es" ? "Para recoger" : "Pickup");
  if (p.foodTruck) parts.push("Food truck");
  if (p.popUp) parts.push("Pop-up");
  if (p.menuOnly) parts.push(lang === "es" ? "Con menú" : "Has menu");
  if (p.nbh) parts.push(p.nbh);
  if (p.q) parts.push(`"${p.q}"`);

  return parts;
}
