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
 * | `state` | `state` | State code match when set. |
 * | `zip` | `zipCode` | Exact match. |
 * | `country` | (UI/URL only until publish field ships) | Preserved in URL; US default does not filter. |
 * | `cuisine` | `primaryCuisine`, `secondaryCuisine`, `additionalCuisines` | Single taxonomy key. |
 * | `biz` | `businessType` | Taxonomy key (`RESTAURANTE_BUSINESS_TYPES`). |
 * | `svc` | `serviceModes` | Whitelisted modes in `filterRestaurantesBlueprintRows` (incl. catering, events, meal_prep, personal_chef, pop_up, food_truck, other); UI exposes a subset. |
 * | `family` | `highlights` includes family_friendly OR family signal | Blueprint uses `familyFriendly` boolean. |
 * | `price` | `priceLevel` | `$` … `$$$$`. |
 * | `diet` | vegan/gluten/halal signals | Maps to diet flags + cuisine. |
 * | `spoken` | `languagesSpoken` | CSV list; do **not** overload UI `lang`. |
 * | `pay` | `restaurantAmenities.payments` | CSV list (e.g. `cash,credit_cards`). |
 * | `amb` | `restaurantAmenities.atmosphere` | CSV list. |
 * | `amen` | `restaurantAmenities.amenities` | CSV list. |
 * | `acc` | `restaurantAmenities.accessibility` | CSV list. |
 * | `food` | `restaurantAmenities.foodOptions` | CSV list (e.g. `vegan_options`). |
 * | `menu` | menu present | `1` = only listings with menu URL/file. |
 * | `social` | social present | `1` = any IG/FB/TikTok/YouTube present. |
 * | `web` | website present | `1` = has website URL. |
 * | `wa` | WhatsApp present | `1` = has WhatsApp. |
 * | `open` | `weeklyHours` + `temporaryHours*` evaluated server-side | Blueprint: `openNowDemo`. |
 * | `near` | Geolocation + radius (future) | **Without** city/zip: intent-only (no row exclusion). With city/zip: same as location filters. |
 * | `mv` | `movingVendor` | `1` / absent. |
 * | `hb` | `homeBasedBusiness` | `1` / absent. |
 * | `ft` | `foodTruck` | `1` / absent. |
 * | `pu` | `popUp` | `1` / absent. |
 * | `hl` | `highlights` | Single highlight key. |
 * | `saved` | User-saved listing ids (local, first-party) | Requires personalization consent; see `restaurantesFirstPartyPreferences.ts`. |
 * | `sort` | Sort only | `newest` → `publishedAt`/`listedAt`; `name-asc` → `businessName`; `rating-desc` → rating. |
 * | `top` | “Best rated” shortcut | Rating ≥ 4.5 + ties to sort. |
 * | `page` | Pagination | |
 * | `lang` | UI language | Official route lang; UI chrome uses ES or EN via `navCopyLang`. |
 * | `nbh` | `neighborhood` | Substring match on published neighborhood. |
 * | `rsv` | `reservationsAvailable` | `1` = only listings that accept reservations. |
 * | `pre` | `preorderRequired` | `1` = only listings that mark preorder required. |
 * | `pku` | `pickupAvailable` | `1` = pickup offered. |
 * | `feat` | `promoted` | `1` = promoted / destacado rows only. |
 * | `lxv` | `leonix_verified` | `1` = Leonix-verified only. |
 * | `drm` | `deliveryRadiusMiles` | Integer minimum miles (listing must declare radius ≥ value). |
 *
 * ## Landing vs results
 * - **Landing (fast path only):** hero `q`, combined location → `city`/`zip`, quick chips (`open`, `near`, `svc`, `family`, `top`+`sort`, `price`), cuisine chips/tiles → `cuisine`. No exclusive params.
 * - **Results:** full filter set + sort + active chips + reset; same URL contract.
 *
 * @module restaurantesDiscoveryContract
 */

import type { RestauranteBusinessTypeKey } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import {
  LEONIX_LB_DEFAULT_COUNTRY,
  LEONIX_LB_DEFAULT_STATE,
  isLeonixLbUsCountry,
  leonixLbStateMatchesFilter,
  normalizeLeonixLbCountry,
  normalizeLeonixLbStateCode,
  normalizeLeonixLbZip,
} from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessLocationContract";
import {
  CAT_STD_DEFAULT_PER_PAGE,
  catStdPerPageToParam,
  parseCatStdPerPage,
} from "@/app/(site)/clasificados/components/categoryPipeline/catStdPerPage";
import { navCopyLang, normalizeLang, type SupportedLang } from "@/app/lib/language";

export const RESTAURANTES_RESULTADOS_PATH = "/clasificados/restaurantes/results" as const;

export type RestaurantesDiscoveryLang = "es" | "en";

/** All keys we serialize to the results URL (single source for parsers/builders). */
export const RESTAURANTES_DISCOVERY_URL_KEYS = [
  "lang",
  "q",
  "city",
  "state",
  "zip",
  "country",
  "cuisine",
  "biz",
  "svc",
  "family",
  "price",
  "diet",
  "spoken",
  "pay",
  "amb",
  "amen",
  "acc",
  "food",
  "menu",
  "social",
  "web",
  "wa",
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
  "perPage",
  "nbh",
  "rsv",
  "pre",
  "pku",
  "feat",
  "lxv",
  "drm",
] as const;

export type RestaurantesResultsUrlKey = (typeof RESTAURANTES_DISCOVERY_URL_KEYS)[number];

export type RestaurantesResultsSortId = "newest" | "name-asc" | "rating-desc";

export type RestaurantesDiscoveryState = {
  lang: RestaurantesDiscoveryLang;
  /** Full-text: name, cuisines, dishes (future indexed). */
  q: string;
  /** `cityCanonical` */
  city: string;
  /** US state code from application `state` */
  state: string;
  /** `zipCode` US-style 5 digits when present */
  zip: string;
  /** Country (URL preserved; filtering when non-US and stored on listing) */
  country: string;
  /** Primary/secondary/additional cuisine filter (single key). */
  cuisine: string;
  /** `businessType` */
  biz: RestauranteBusinessTypeKey | "";
  svc: string;
  family: boolean;
  price: string;
  diet: "" | "glutenfree" | "halal" | "vegan";
  /** Spoken language keys (from `languagesSpoken` on the listing). Comma-separated in URL. */
  spoken: string[];
  /** Payment method keys (from `restaurantAmenities.payments`). Comma-separated in URL. */
  pay: string[];
  /** Ambience keys (from `restaurantAmenities.atmosphere`). Comma-separated in URL. */
  amb: string[];
  /** Amenity keys (from `restaurantAmenities.amenities`). Comma-separated in URL. */
  amen: string[];
  /** Accessibility keys (from `restaurantAmenities.accessibility`). Comma-separated in URL. */
  acc: string[];
  /** Food option keys (from `restaurantAmenities.foodOptions`). Comma-separated in URL. */
  food: string[];
  /** Listing has menu (URL `menu=1`). */
  menuOnly: boolean;
  /** Listing has any social platform (URL `social=1`). */
  socialOnly: boolean;
  /** Listing has website (URL `web=1`). */
  websiteOnly: boolean;
  /** Listing has WhatsApp (URL `wa=1`). */
  whatsappOnly: boolean;
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
  perPage: number;
  /** Substring on `neighborhood` (URL `nbh`). */
  neighborhoodQuery: string;
  reservationsOnly: boolean;
  preorderOnly: boolean;
  pickupOnly: boolean;
  promotedOnly: boolean;
  verifiedOnly: boolean;
  /** Minimum declared delivery radius in miles (URL `drm`). */
  deliveryRadiusMin?: number;
};

export function defaultRestaurantesDiscoveryState(lang: RestaurantesDiscoveryLang = "es"): RestaurantesDiscoveryState {
  return {
    lang,
    q: "",
    city: "",
    state: LEONIX_LB_DEFAULT_STATE,
    zip: "",
    country: LEONIX_LB_DEFAULT_COUNTRY,
    cuisine: "",
    biz: "",
    svc: "",
    family: false,
    price: "",
    diet: "",
    spoken: [],
    pay: [],
    amb: [],
    amen: [],
    acc: [],
    food: [],
    menuOnly: false,
    socialOnly: false,
    websiteOnly: false,
    whatsappOnly: false,
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
    perPage: CAT_STD_DEFAULT_PER_PAGE,
    neighborhoodQuery: "",
    reservationsOnly: false,
    preorderOnly: false,
    pickupOnly: false,
    promotedOnly: false,
    verifiedOnly: false,
    deliveryRadiusMin: undefined,
  };
}

function parseCsvList(raw: string | null | undefined): string[] {
  const t = (raw ?? "").trim();
  if (!t) return [];
  const parts = t
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => /^[a-z0-9_]+$/i.test(x));
  return Array.from(new Set(parts));
}

export function parseRestaurantesRouteLang(
  sp: URLSearchParams,
  fallbackRouteLang: SupportedLang = "es",
): SupportedLang {
  const raw = sp.get("lang");
  return raw ? normalizeLang(raw) : fallbackRouteLang;
}

export function parseRestaurantesResultsSearchParams(
  sp: URLSearchParams,
  fallbackRouteLang: SupportedLang = "es",
): RestaurantesDiscoveryState {
  const routeLang = parseRestaurantesRouteLang(sp, fallbackRouteLang);
  const lang = navCopyLang(routeLang);
  const dietRaw = (sp.get("diet") ?? "").trim();
  const diet =
    dietRaw === "glutenfree" || dietRaw === "halal" || dietRaw === "vegan"
      ? dietRaw
      : "";
  const sortRaw = (sp.get("sort") ?? "newest").trim();
  const sort: RestaurantesResultsSortId =
    sortRaw === "name-asc" || sortRaw === "rating-desc" || sortRaw === "newest" ? sortRaw : "newest";

  const flag = (k: string) => sp.get(k) === "1";

  const drmRaw = (sp.get("drm") ?? "").trim();
  let deliveryRadiusMin: number | undefined;
  if (drmRaw) {
    const n = parseInt(drmRaw, 10);
    if (Number.isFinite(n) && n > 0) deliveryRadiusMin = n;
  }

  return {
    lang,
    q: (sp.get("q") ?? "").trim(),
    city: (sp.get("city") ?? "").trim(),
    state: normalizeLeonixLbStateCode(sp.get("state")),
    zip: normalizeLeonixLbZip(sp.get("zip")),
    country: normalizeLeonixLbCountry(sp.get("country")),
    cuisine: (sp.get("cuisine") ?? "").trim(),
    biz: (sp.get("biz") ?? "").trim() as RestaurantesDiscoveryState["biz"],
    svc: (sp.get("svc") ?? "").trim(),
    family: flag("family"),
    price: (sp.get("price") ?? "").trim(),
    diet,
    spoken: parseCsvList(sp.get("spoken")),
    pay: parseCsvList(sp.get("pay")),
    amb: parseCsvList(sp.get("amb")),
    amen: parseCsvList(sp.get("amen")),
    acc: parseCsvList(sp.get("acc")),
    food: parseCsvList(sp.get("food")),
    menuOnly: flag("menu"),
    socialOnly: flag("social"),
    websiteOnly: flag("web"),
    whatsappOnly: flag("wa"),
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
    perPage: parseCatStdPerPage(sp.get("perPage")),
    neighborhoodQuery: (sp.get("nbh") ?? "").trim(),
    reservationsOnly: flag("rsv"),
    preorderOnly: flag("pre"),
    pickupOnly: flag("pku"),
    promotedOnly: flag("feat"),
    verifiedOnly: flag("lxv"),
    deliveryRadiusMin,
  };
}

export function restaurantesDiscoveryStateToParams(
  s: RestaurantesDiscoveryState,
): Record<string, string | undefined> {
  const join = (arr: string[]) => (arr?.length ? arr.join(",") : undefined);
  const out: Record<string, string | undefined> = {
    q: s.q || undefined,
    city: s.city || undefined,
    state: s.state?.trim() || undefined,
    zip: s.zip || undefined,
    country:
      s.country && !isLeonixLbUsCountry(s.country) ? s.country : s.country !== LEONIX_LB_DEFAULT_COUNTRY ? s.country : undefined,
    cuisine: s.cuisine || undefined,
    biz: s.biz || undefined,
    svc: s.svc || undefined,
    family: s.family ? "1" : undefined,
    price: s.price || undefined,
    diet: s.diet || undefined,
    spoken: join(s.spoken),
    pay: join(s.pay),
    amb: join(s.amb),
    amen: join(s.amen),
    acc: join(s.acc),
    food: join(s.food),
    menu: s.menuOnly ? "1" : undefined,
    social: s.socialOnly ? "1" : undefined,
    web: s.websiteOnly ? "1" : undefined,
    wa: s.whatsappOnly ? "1" : undefined,
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
    perPage: catStdPerPageToParam(s.perPage),
    nbh: s.neighborhoodQuery.trim() || undefined,
    rsv: s.reservationsOnly ? "1" : undefined,
    pre: s.preorderOnly ? "1" : undefined,
    pku: s.pickupOnly ? "1" : undefined,
    feat: s.promotedOnly ? "1" : undefined,
    lxv: s.verifiedOnly ? "1" : undefined,
    drm:
      s.deliveryRadiusMin != null && Number.isFinite(s.deliveryRadiusMin) && s.deliveryRadiusMin > 0
        ? String(Math.floor(s.deliveryRadiusMin))
        : undefined,
  };
  return out;
}

export function buildRestaurantesResultsHref(
  routeLang: SupportedLang,
  params: Record<string, string | undefined | null>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || k === "lang") continue;
    sp.set(k, v);
  }
  sp.set("lang", routeLang);
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
  state?: string;
  zip?: string;
  primaryCuisineKey: string;
  neighborhood?: string;
}): Record<string, string | undefined> {
  return {
    q: row.name,
    city: row.city,
    state: row.state?.trim() || undefined,
    zip: row.zip?.trim() || undefined,
    cuisine: row.primaryCuisineKey || undefined,
    nbh: row.neighborhood?.trim() || undefined,
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
