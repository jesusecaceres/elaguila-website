import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  LEONIX_LB_DEFAULT_COUNTRY,
  LEONIX_LB_DEFAULT_STATE,
} from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessLocationContract";
import { buildCategoryResultsUrl, type CatStdAllSlug } from "./categoryStandardRoutes";
import { cleanResultsFilterParams, type ResultsFilterParams } from "./categoryStandardResultsFilterChips";
import {
  type LocationUrlSanitizeOpts,
  sanitizeLocationParamsForUrl,
} from "./lightweightBrowseLocation";

export type CommunitySimpleSlug = "busco" | "mascotas-y-perdidos" | "clases" | "comunidad";

export type BrowseLocationValues = {
  q: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export const DEFAULT_BROWSE_LOCATION: BrowseLocationValues = {
  q: "",
  city: "",
  state: LEONIX_LB_DEFAULT_STATE,
  zip: "",
  country: LEONIX_LB_DEFAULT_COUNTRY,
};

export function defaultBuscoDrawer(): Record<string, string> {
  return { tipo: "all", zone: "", budget: "", contact: "all" };
}

export function defaultMascotasDrawer(): Record<string, string> {
  return { tipo: "all", lastSeenArea: "", hasPhoto: "" };
}

export function defaultClasesDrawer(): Record<string, string> {
  return {
    classType: "",
    cost: "all",
    mode: "all",
    level: "all",
    audience: "all",
    registration: "all",
  };
}

export function defaultComunidadDrawer(): Record<string, string> {
  return {
    eventType: "",
    eventCost: "all",
    dateFrom: "",
    dateTo: "",
    audience: "all",
    registration: "all",
    accessibility: "all",
  };
}

export function defaultDrawerForCategory(category: CommunitySimpleSlug): Record<string, string> {
  switch (category) {
    case "busco":
      return defaultBuscoDrawer();
    case "mascotas-y-perdidos":
      return defaultMascotasDrawer();
    case "clases":
      return defaultClasesDrawer();
    case "comunidad":
      return defaultComunidadDrawer();
  }
}

export function mergeLocationAndDrawerParams(
  loc: BrowseLocationValues,
  drawer: Record<string, string>,
  sanitizeOpts?: LocationUrlSanitizeOpts,
): ResultsFilterParams {
  const sanitized = sanitizeLocationParamsForUrl(loc, sanitizeOpts);
  const params: ResultsFilterParams = {
    q: sanitized.q,
    city: sanitized.city,
    state: sanitized.state,
    zip: sanitized.zip,
    country: sanitized.country,
  };
  for (const [k, v] of Object.entries(drawer)) {
    if (!v || v === "all") continue;
    params[k] = v;
  }
  return params;
}

export function buildCommunitySimpleResultsHref(
  category: CommunitySimpleSlug,
  lang: Lang,
  loc: BrowseLocationValues,
  drawer: Record<string, string>,
  sanitizeOpts?: LocationUrlSanitizeOpts,
): string {
  return buildCategoryResultsUrl(
    category,
    lang,
    cleanResultsFilterParams(mergeLocationAndDrawerParams(loc, drawer, sanitizeOpts)),
  );
}

export function activeFilterParamsFromUrl(sp: URLSearchParams, drawer: Record<string, string>): ResultsFilterParams {
  const params: ResultsFilterParams = {};
  const q = (sp.get("q") ?? "").trim();
  if (q) params.q = q;
  const city = (sp.get("city") ?? "").trim();
  if (city) params.city = city;
  if (sp.has("state")) {
    const state = (sp.get("state") ?? "").trim();
    if (state) params.state = state;
  }
  const zip = (sp.get("zip") ?? "").trim();
  if (zip) params.zip = zip;
  if (sp.has("country")) {
    const country = (sp.get("country") ?? "").trim();
    if (country) params.country = country;
  }
  for (const [k, v] of Object.entries(drawer)) {
    if (v && v !== "all") params[k] = v;
  }
  return params;
}

export function readBuscoDrawerFromParams(sp: URLSearchParams): Record<string, string> {
  return {
    tipo: (sp.get("tipo") ?? "all").trim(),
    zone: (sp.get("zone") ?? "").trim(),
    budget: (sp.get("budget") ?? "").trim(),
    contact: (sp.get("contact") ?? "all").trim(),
  };
}

export function readMascotasDrawerFromParams(sp: URLSearchParams): Record<string, string> {
  return {
    tipo: (sp.get("tipo") ?? "all").trim(),
    lastSeenArea: (sp.get("lastSeenArea") ?? "").trim(),
    hasPhoto: (sp.get("hasPhoto") ?? "").trim(),
  };
}

export function readCommunityDrawerFromParams(
  category: "clases" | "comunidad",
  sp: URLSearchParams,
): Record<string, string> {
  if (category === "clases") {
    return {
      classType: (sp.get("classType") ?? "").trim(),
      cost: (sp.get("cost") ?? "all").trim(),
      mode: (sp.get("mode") ?? "all").trim(),
      level: (sp.get("level") ?? "all").trim(),
      audience: (sp.get("audience") ?? "all").trim(),
      registration: (sp.get("registration") ?? "all").trim(),
    };
  }
  return {
    eventType: (sp.get("eventType") ?? "").trim(),
    eventCost: (sp.get("eventCost") ?? "all").trim(),
    dateFrom: (sp.get("dateFrom") ?? "").trim(),
    dateTo: (sp.get("dateTo") ?? "").trim(),
    audience: (sp.get("audience") ?? "all").trim(),
    registration: (sp.get("registration") ?? "all").trim(),
    accessibility: (sp.get("accessibility") ?? "all").trim(),
  };
}

export function communitySimpleSlug(category: CommunitySimpleSlug): CatStdAllSlug {
  return category;
}
