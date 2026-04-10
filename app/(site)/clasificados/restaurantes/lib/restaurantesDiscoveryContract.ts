/**
 * Public discovery URL contract: landing ↔ `/clasificados/restaurantes/resultados`.
 *
 * URL → stored-field intent (blueprint / future DB):
 * - `q` → full-text on name, cuisine line, city (later: indexed search).
 * - `city`, `zip` → `cityCanonical` / `zipCode` on listings.
 * - `cuisine` → primary/secondary cuisine keys.
 * - `svc` → `serviceModes` includes dine_in | takeout | delivery.
 * - `family` → highlight or trait: family-friendly.
 * - `price` → `priceLevel` ($ … $$$$).
 * - `diet` → vegan / gluten-free / halal mapped to cuisine + highlight flags.
 * - `open` → reserved for live hours + “open now” (blueprint: demo `openNowDemo`).
 * - `near` → reserved for geolocation + radius.
 * - `top` → reserved for “best rated” (blueprint: rating ≥ 4.5 + sort).
 * - `sort` → newest | name | rating (rating wired in blueprint shell).
 */

export const RESTAURANTES_RESULTADOS_PATH = "/clasificados/restaurantes/resultados" as const;

export type RestaurantesDiscoveryLang = "es" | "en";

/** Keys mirrored in results UI and future API filters. */
export type RestaurantesResultsUrlKeys =
  | "lang"
  | "q"
  | "city"
  | "zip"
  | "cuisine"
  | "svc"
  | "family"
  | "price"
  | "diet"
  | "sort"
  | "open"
  | "near"
  | "top"
  | "page";

export type RestaurantesResultsSortId = "newest" | "name-asc" | "rating-desc";

export type RestaurantesDiscoveryState = {
  lang: RestaurantesDiscoveryLang;
  q: string;
  city: string;
  zip: string;
  cuisine: string;
  svc: string;
  family: boolean;
  price: string;
  diet: "" | "glutenfree" | "halal" | "vegan";
  sort: RestaurantesResultsSortId;
  /** Reserved until hours + live “open now” can be evaluated server-side. */
  open: boolean;
  /** Reserved until geolocation + radius is wired. */
  near: boolean;
  /** Reserved until external or internal rating sort is wired. */
  top: boolean;
  page: number;
};

export function defaultRestaurantesDiscoveryState(lang: RestaurantesDiscoveryLang = "es"): RestaurantesDiscoveryState {
  return {
    lang,
    q: "",
    city: "",
    zip: "",
    cuisine: "",
    svc: "",
    family: false,
    price: "",
    diet: "",
    sort: "newest",
    open: false,
    near: false,
    top: false,
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

  return {
    lang,
    q: (sp.get("q") ?? "").trim(),
    city: (sp.get("city") ?? "").trim(),
    zip: (sp.get("zip") ?? "").trim(),
    cuisine: (sp.get("cuisine") ?? "").trim(),
    svc: (sp.get("svc") ?? "").trim(),
    family: sp.get("family") === "1",
    price: (sp.get("price") ?? "").trim(),
    diet,
    sort,
    open: sp.get("open") === "1",
    near: sp.get("near") === "1",
    top: sp.get("top") === "1",
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
    svc: s.svc || undefined,
    family: s.family ? "1" : undefined,
    price: s.price || undefined,
    diet: s.diet || undefined,
    sort: s.sort !== "newest" ? s.sort : undefined,
    open: s.open ? "1" : undefined,
    near: s.near ? "1" : undefined,
    top: s.top ? "1" : undefined,
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

/** Single “Ciudad o Código Postal” field → `city` or `zip` for results. */
export function splitLocationInput(raw: string): { city?: string; zip?: string } {
  const t = raw.trim();
  if (/^\d{5}$/.test(t)) return { zip: t };
  if (t) return { city: t };
  return {};
}
