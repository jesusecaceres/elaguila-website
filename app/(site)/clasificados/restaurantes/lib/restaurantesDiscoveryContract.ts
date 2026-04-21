/**
 * # Restaurantes public discovery contract (source of truth)
 *
 * **Routes:** `/clasificados/restaurantes` ↔ `/clasificados/restaurantes/resultados`
 *
 * **Application model:** Field names below reference `RestauranteListingApplication` in
 * `application/restauranteListingApplication.ts` (business identity, operating model, hours, trust, internal contract).
 *
 * ## URL parameters → stored fields (intent)
 *
 * | Param | Maps to (application / listing) | Notes |
 * | ----- | -------------------------------- | ----- |
 * | `q` | `businessName`, cuisine labels/keys, dish text in indexed blob | Substring match on name, `cuisineLine`, primary/secondary keys, city, zip (see `filterRestaurantesBlueprintRows`). |
 * | `city` | `cityCanonical` | Substring match in demo. |
 * | `zip` | `zipCode` | Exact match. |
 * | `cuisine` | `primaryCuisine`, `secondaryCuisine`, `additionalCuisines` | Single taxonomy key. |
 * | `biz` | `businessType` | Taxonomy key (`RESTAURANTE_BUSINESS_TYPES`). |
 * | `svc` | `serviceModes` | Whitelisted modes in `filterRestaurantesBlueprintRows` (incl. catering, events, meal_prep, personal_chef, pop_up, food_truck, other); UI exposes a subset. |
 * | `family` | `highlights` includes family_friendly OR family signal | Blueprint uses `familyFriendly` boolean. |
 * | `price` | `priceLevel` | `$` … `$$$$`. |
 * | `diet` | vegan/gluten/halal signals | Maps to diet flags + cuisine. |
 * | `open` | `weeklyHours` + `temporaryHours*` evaluated server-side | Blueprint: `openNowDemo`. |
 * | `near` | Geolocation + radius (future) | **Without** city/zip: intent-only (no row exclusion). With city/zip: same as location filters. |
 * | `mv` | `movingVendor` | `1` / absent. |
 * | `hb` | `homeBasedBusiness` | `1` / absent. |
 * | `ft` | `foodTruck` | `1` / absent. |
 * | `pu` | `popUp` | `1` / absent. |
 * | `hl` | `highlights` | Single highlight key. |
 * | `saved` | User-saved listing ids (local, first-party) | Requires personalization consent; see `restaurantesFirstPartyPreferences.ts`. |
 * | `sort` | Sort only | `newest` → `publishedAt`/`listedAt`; `name-asc` → `businessName`; `rating-desc` → rating. |
 * | `top` | Boost “best rated” shortcut | Blueprint: rating ≥ 4.5 + ties to sort. |
 * | `page` | Pagination | |
 * | `lang` | UI language | `es` / `en`. |
 *
 * ## Landing vs results
 * - **Landing (fast path only):** hero `q`, combined location → `city`/`zip`, quick chips (`open`, `near`, `svc`, `family`, `top`+`sort`, `price`), cuisine chips/tiles → `cuisine`. No exclusive params.
 * - **Results:** full filter set + sort + active chips + reset; same URL contract.
 *
 * @module restaurantesDiscoveryContract
 */

import type { RestauranteBusinessTypeKey } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";

export const RESTAURANTES_RESULTADOS_PATH = "/clasificados/restaurantes/resultados" as const;

export type RestaurantesDiscoveryLang = "es" | "en";

/** All keys we serialize to the results URL (single source for parsers/builders). */
export const RESTAURANTES_DISCOVERY_URL_KEYS = [
  "lang",
  "q",
  "city",
  "zip",
  "cuisine",
  "biz",
  "svc",
  "family",
  "price",
  "diet",
  "sort",
  "open",
  "near",
  "top",
  "mv",
  "hb",
  "ft",
  "pu",
  "hl",
  "saved",
  "page",
] as const;

export type RestaurantesResultsUrlKey = (typeof RESTAURANTES_DISCOVERY_URL_KEYS)[number];

export type RestaurantesResultsSortId = "newest" | "name-asc" | "rating-desc";

export type RestaurantesDiscoveryState = {
  lang: RestaurantesDiscoveryLang;
  /** Full-text: name, cuisines, dishes (future indexed). */
  q: string;
  /** `cityCanonical` */
  city: string;
  /** `zipCode` US-style 5 digits when present */
  zip: string;
  /** Primary/secondary/additional cuisine filter (single key). */
  cuisine: string;
  /** `businessType` */
  biz: RestauranteBusinessTypeKey | "";
  svc: string;
  family: boolean;
  price: string;
  diet: "" | "glutenfree" | "halal" | "vegan";
  sort: RestaurantesResultsSortId;
  /** Open now — requires hours evaluation (demo: blueprint flag). */
  open: boolean;
  /**
   * “Near me” intent. Without city/zip: does not exclude rows (honest until geo radius ships).
   * With city/zip: location filters apply as usual.
   */
  near: boolean;
  /** Shortcut: highly rated (aligned with `top` URL param). */
  top: boolean;
  movingVendor: boolean;
  homeBasedBusiness: boolean;
  foodTruck: boolean;
  popUp: boolean;
  /** Single `highlights` key */
  hl: string;
  /** Filter to ids saved locally (first-party; consent-gated read in UI). */
  saved: boolean;
  page: number;
};

export function defaultRestaurantesDiscoveryState(lang: RestaurantesDiscoveryLang = "es"): RestaurantesDiscoveryState {
  return {
    lang,
    q: "",
    city: "",
    zip: "",
    cuisine: "",
    biz: "",
    svc: "",
    family: false,
    price: "",
    diet: "",
    sort: "newest",
    open: false,
    near: false,
    top: false,
    movingVendor: false,
    homeBasedBusiness: false,
    foodTruck: false,
    popUp: false,
    hl: "",
    saved: false,
    page: 1,
  };
}

export function parseRestaurantesResultsSearchParams(
  sp: URLSearchParams,
  fallbackLang: RestaurantesDiscoveryLang = "es",
): RestaurantesDiscoveryState {
  const lang = sp.get("lang") === "en" ? "en" : fallbackLang;
  const dietRaw = (sp.get("diet") ?? "").trim();
  const diet =
    dietRaw === "glutenfree" || dietRaw === "halal" || dietRaw === "vegan"
      ? dietRaw
      : "";
  const sortRaw = (sp.get("sort") ?? "newest").trim();
  const sort: RestaurantesResultsSortId =
    sortRaw === "name-asc" || sortRaw === "rating-desc" || sortRaw === "newest" ? sortRaw : "newest";

  const flag = (k: string) => sp.get(k) === "1";

  return {
    lang,
    q: (sp.get("q") ?? "").trim(),
    city: (sp.get("city") ?? "").trim(),
    zip: (sp.get("zip") ?? "").trim(),
    cuisine: (sp.get("cuisine") ?? "").trim(),
    biz: (sp.get("biz") ?? "").trim() as RestaurantesDiscoveryState["biz"],
    svc: (sp.get("svc") ?? "").trim(),
    family: flag("family"),
    price: (sp.get("price") ?? "").trim(),
    diet,
    sort,
    open: flag("open"),
    near: flag("near"),
    top: flag("top"),
    movingVendor: flag("mv"),
    homeBasedBusiness: flag("hb"),
    foodTruck: flag("ft"),
    popUp: flag("pu"),
    hl: (sp.get("hl") ?? "").trim(),
    saved: flag("saved"),
    page: Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1),
  };
}

export function restaurantesDiscoveryStateToParams(
  s: RestaurantesDiscoveryState,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {
    lang: s.lang,
    q: s.q || undefined,
    city: s.city || undefined,
    zip: s.zip || undefined,
    cuisine: s.cuisine || undefined,
    biz: s.biz || undefined,
    svc: s.svc || undefined,
    family: s.family ? "1" : undefined,
    price: s.price || undefined,
    diet: s.diet || undefined,
    sort: s.sort !== "newest" ? s.sort : undefined,
    open: s.open ? "1" : undefined,
    near: s.near ? "1" : undefined,
    top: s.top ? "1" : undefined,
    mv: s.movingVendor ? "1" : undefined,
    hb: s.homeBasedBusiness ? "1" : undefined,
    ft: s.foodTruck ? "1" : undefined,
    pu: s.popUp ? "1" : undefined,
    hl: s.hl || undefined,
    saved: s.saved ? "1" : undefined,
    page: s.page > 1 ? String(s.page) : undefined,
  };
  return out;
}

export function buildRestaurantesResultsHref(
  lang: RestaurantesDiscoveryLang,
  params: Record<string, string | undefined | null>,
): string {
  const sp = new URLSearchParams();
  sp.set("lang", lang);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, v);
  }
  return `${RESTAURANTES_RESULTADOS_PATH}?${sp.toString()}`;
}

/** Trim and collapse inner spaces before splitting city vs ZIP (matches `cityCanonical` hygiene at publish). */
export function normalizeDiscoveryLocationText(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/**
 * Params to reopen results focused on one listing (name + location + primary cuisine).
 * Demo: narrows blueprint rows; live: same query against indexed listings.
 */
export function restaurantesDiscoveryParamsForRowDeepLink(row: {
  name: string;
  city: string;
  zip?: string;
  primaryCuisineKey: string;
}): Record<string, string | undefined> {
  return {
    q: row.name,
    city: row.city,
    zip: row.zip?.trim() || undefined,
    cuisine: row.primaryCuisineKey || undefined,
  };
}

/**
 * Single “ciudad o código postal” field → `city` or `zip` URL params.
 * - Exactly five digits → `zip` (`zipCode` on the listing).
 * - Any other non-empty text → `city` (substring match to display/canonical city in demo; server will normalize to `cityCanonical` when wired).
 */
export function splitLocationInput(raw: string): { city?: string; zip?: string } {
  const t = normalizeDiscoveryLocationText(raw);
  if (/^\d{5}$/.test(t)) return { zip: t };
  if (t) return { city: t };
  return {};
}

/** Reset to defaults while preserving language. */
export function clearRestaurantesDiscoveryFilters(
  lang: RestaurantesDiscoveryLang,
): RestaurantesDiscoveryState {
  return { ...defaultRestaurantesDiscoveryState(lang), lang };
}
