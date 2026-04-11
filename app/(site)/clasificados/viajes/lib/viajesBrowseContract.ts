/**
 * Single public browse contract for Viajes landing + `/clasificados/viajes/resultados`.
 *
 * URL keys (stable):
 * - `lang` — es | en (also accepted from site helpers)
 * - `dest` — canonical destination slug when known (matches destination index / autocomplete canonical)
 * - `q` — free-text destination when user did not pick a canonical value (search-only; combined with dest matching in UI)
 * - `from` — departure origin bucket id (`san-jose` | `san-francisco` | `oakland` | … see `viajesOrigins`)
 * - `t` — trip type param (see `viajesTripTypes`)
 * - `budget` — economico | moderado | premium
 * - `audience` — familias | parejas | grupos | …
 * - `season` — spring | summer | fall | winter | holidays
 * - `duration` — short | week | long
 * - `sort` — featured | newest | priceAsc | priceDesc
 * - `page` — 1-based page index for future pagination
 *
 * Reserved / documented for future live/geo (parsed but not used for filtering until backend exists):
 * - `zip` — reserved
 * - `radiusMiles` — reserved
 * - `nearMe` — reserved (1 = intent flag)
 * - `originByGeo` — set to `1` when departure was chosen via browser geolocation on user action (informational; not tracking)
 */

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

/** Mirrors URL + form state; empty string means “not set”. */
export type ViajesSortKey = "featured" | "newest" | "priceAsc" | "priceDesc";

export type ViajesBrowseState = {
  lang: Lang;
  /** Canonical destination slug */
  dest: string;
  /** Free-text destination (display / fuzzy) */
  q: string;
  /** Origin bucket id */
  from: string;
  /** Trip type URL value */
  t: string;
  budget: string;
  audience: string;
  season: string;
  duration: string;
  sort: ViajesSortKey;
  page: number;
  /** `1` if user set departure via geolocation button on landing/results */
  originByGeo: "" | "1";
  /** Reserved */
  zip: string;
  /** Reserved */
  radiusMiles: string;
  /** Reserved intent flag */
  nearMe: "" | "1";
};

/** Public results route — single source for links and `next/router` base. */
export const VIAJES_PUBLIC_RESULTS_PATH = "/clasificados/viajes/resultados";

const DEFAULT_BASE = VIAJES_PUBLIC_RESULTS_PATH;

export function defaultViajesBrowseState(lang: Lang): ViajesBrowseState {
  return {
    lang,
    dest: "",
    q: "",
    from: "",
    t: "",
    budget: "",
    audience: "",
    season: "",
    duration: "",
    sort: "featured",
    page: 1,
    originByGeo: "",
    zip: "",
    radiusMiles: "",
    nearMe: "",
  };
}

const SORT_SET = new Set<ViajesSortKey>(["featured", "newest", "priceAsc", "priceDesc"]);

function parseSort(raw: string | null): ViajesSortKey {
  const s = (raw ?? "").trim();
  if (SORT_SET.has(s as ViajesSortKey)) return s as ViajesSortKey;
  return "featured";
}

function parsePage(raw: string | null): number {
  const n = parseInt((raw ?? "1").trim(), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 10_000);
}

/** Read browse state from `URLSearchParams` (browser or `new URL()`). */
export function parseViajesBrowseFromSearchParams(sp: URLSearchParams | null, fallbackLang: Lang): ViajesBrowseState {
  if (!sp) return defaultViajesBrowseState(fallbackLang);
  const lang = (sp.get("lang") === "en" ? "en" : "es") as Lang;
  return {
    lang,
    dest: (sp.get("dest") ?? "").trim(),
    q: (sp.get("q") ?? "").trim(),
    from: (sp.get("from") ?? "").trim(),
    t: (sp.get("t") ?? "").trim(),
    budget: (sp.get("budget") ?? "").trim(),
    audience: (sp.get("audience") ?? "").trim(),
    season: (sp.get("season") ?? "").trim(),
    duration: (sp.get("duration") ?? "").trim(),
    sort: parseSort(sp.get("sort")),
    page: parsePage(sp.get("page")),
    originByGeo: sp.get("originByGeo") === "1" ? "1" : "",
    zip: (sp.get("zip") ?? "").trim(),
    radiusMiles: (sp.get("radiusMiles") ?? "").trim(),
    nearMe: sp.get("nearMe") === "1" ? "1" : "",
  };
}

function appendIf(qs: URLSearchParams, key: string, value: string | number | undefined | null, skipEmpty = true) {
  const v = value === undefined || value === null ? "" : String(value).trim();
  if (!v && skipEmpty) return;
  if (!v && !skipEmpty) return;
  qs.set(key, v);
}

/** Serialize to query string object (stable order). */
export function serializeViajesBrowseToSearchParams(state: ViajesBrowseState): URLSearchParams {
  const qs = new URLSearchParams();
  qs.set("lang", state.lang);
  appendIf(qs, "dest", state.dest);
  appendIf(qs, "q", state.q);
  appendIf(qs, "from", state.from);
  appendIf(qs, "t", state.t);
  appendIf(qs, "budget", state.budget);
  appendIf(qs, "audience", state.audience);
  appendIf(qs, "season", state.season);
  appendIf(qs, "duration", state.duration);
  if (state.sort !== "featured") qs.set("sort", state.sort);
  if (state.page > 1) qs.set("page", String(state.page));
  if (state.originByGeo === "1") qs.set("originByGeo", "1");
  appendIf(qs, "zip", state.zip);
  appendIf(qs, "radiusMiles", state.radiusMiles);
  if (state.nearMe === "1") qs.set("nearMe", "1");
  return qs;
}

export function buildViajesBrowseUrl(state: ViajesBrowseState, basePath: string = DEFAULT_BASE): string {
  const qs = serializeViajesBrowseToSearchParams(state);
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

/**
 * Narrow patch for landing chips/cards — only keys that are safe to set from curated modules.
 * (ZIP/radius/nearMe are intentionally omitted here; add manually if a module goes live.)
 */
export type ViajesResultsLinkPatch = Partial<
  Pick<
    ViajesBrowseState,
    "dest" | "q" | "from" | "t" | "budget" | "audience" | "season" | "duration" | "sort" | "page"
  >
>;

/** Merge patch onto defaults for `lang` — use for all landing → results handoffs. */
export function viajesMergeBrowseState(lang: Lang, patch: ViajesResultsLinkPatch & { lang?: Lang } = {}): ViajesBrowseState {
  const { lang: patchLang, ...rest } = patch;
  return { ...defaultViajesBrowseState(patchLang ?? lang), ...rest, lang: patchLang ?? lang };
}

/** Contract-built results URL (landing sections, chips, discovery). */
export function viajesResultsBrowseUrl(lang: Lang, patch: ViajesResultsLinkPatch = {}, basePath: string = DEFAULT_BASE): string {
  return buildViajesBrowseUrl(viajesMergeBrowseState(lang, patch), basePath);
}

/** Legacy search bar shape → browse state patch (merges with defaults). */
export type ViajesLegacyResultsQuery = {
  destination?: string;
  /** Free-text when no canonical slug */
  destinationQuery?: string;
  departure?: string;
  tripType?: string;
  budget?: string;
  audience?: string;
  lang?: Lang;
  sort?: ViajesSortKey;
  originByGeo?: boolean;
};

export function legacyQueryToBrowseState(q: ViajesLegacyResultsQuery, base: ViajesBrowseState): ViajesBrowseState {
  const lang = q.lang ?? base.lang;
  return {
    ...base,
    lang,
    dest: (q.destination ?? "").trim(),
    q: (q.destinationQuery ?? "").trim(),
    from: (q.departure ?? "").trim(),
    t: (q.tripType ?? "").trim(),
    budget: (q.budget ?? "").trim(),
    audience: (q.audience ?? "").trim(),
    sort: q.sort ?? base.sort,
    originByGeo: q.originByGeo ? "1" : "",
  };
}

/**
 * @deprecated Prefer `buildViajesBrowseUrl(legacyQueryToBrowseState(...))` — kept for incremental migration.
 * Maps old field names to the shared contract.
 */
export function buildViajesResultsUrlCompat(
  query: {
    destination?: string;
    destinationQuery?: string;
    departure?: string;
    tripType?: string;
    budget?: string;
    audience?: string;
    lang?: Lang;
    sort?: ViajesSortKey;
    originByGeo?: boolean;
  },
  basePath: string = DEFAULT_BASE
): string {
  const lang = query.lang ?? "es";
  const state = legacyQueryToBrowseState(query, defaultViajesBrowseState(lang));
  return buildViajesBrowseUrl(state, basePath);
}
