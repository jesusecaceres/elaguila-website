import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  isLeonixLbUsCountry,
  LEONIX_LB_DEFAULT_COUNTRY,
  LEONIX_LB_DEFAULT_STATE,
} from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessLocationContract";
import {
  sanitizeLocationParamsForUrl,
  type LocationUrlSanitizeOpts,
} from "@/app/(site)/clasificados/components/categoryStandard/lightweightBrowseLocation";
import type { ServiciosResultsFilterQuery } from "./serviciosResultsFilter";

export const SERVICIOS_RESULTS_PATH = "/clasificados/servicios/results";

export type ServiciosBrowseLocation = {
  q: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export const SERVICIOS_DEFAULT_BROWSE_LOCATION: ServiciosBrowseLocation = {
  q: "",
  city: "",
  state: LEONIX_LB_DEFAULT_STATE,
  zip: "",
  country: LEONIX_LB_DEFAULT_COUNTRY,
};

export function emptyServiciosDrawerFilters(): Partial<ServiciosResultsFilterQuery> {
  return {};
}

function flagFromForm(fd: FormData, name: string): "1" | undefined {
  const v = String(fd.get(name) ?? "").trim();
  return v === "1" ? "1" : undefined;
}

/** Parse GET form / FormData into Servicios results filter query (URL keys). */
export function parseServiciosFilterFormData(fd: FormData): ServiciosResultsFilterQuery {
  const sellerRaw = String(fd.get("seller") ?? "all").trim();
  const seller =
    sellerRaw === "business" || sellerRaw === "independent" ? sellerRaw : ("all" as const);
  const sortRaw = String(fd.get("sort") ?? "newest").trim();
  const sort =
    sortRaw === "name" ||
    sortRaw === "rating" ||
    sortRaw === "most_liked" ||
    sortRaw === "most_saved" ||
    sortRaw === "open_now"
      ? sortRaw
      : ("newest" as const);

  return {
    q: String(fd.get("q") ?? "").trim() || undefined,
    city: String(fd.get("city") ?? "").trim() || undefined,
    state: String(fd.get("state") ?? "").trim() || undefined,
    zip: String(fd.get("zip") ?? "").trim() || undefined,
    country: String(fd.get("country") ?? "").trim() || undefined,
    group: String(fd.get("group") ?? "").trim() || undefined,
    sort,
    seller,
    whatsapp: flagFromForm(fd, "whatsapp"),
    promo: flagFromForm(fd, "promo"),
    call: flagFromForm(fd, "call"),
    verified: flagFromForm(fd, "verified"),
    web: flagFromForm(fd, "web"),
    bilingual: flagFromForm(fd, "bilingual"),
    email: flagFromForm(fd, "email"),
    emergency: flagFromForm(fd, "emergency"),
    mobileSvc: flagFromForm(fd, "mobileSvc"),
    msg: flagFromForm(fd, "msg"),
    phys: flagFromForm(fd, "phys"),
    svcMulti: flagFromForm(fd, "svcMulti"),
    offer: flagFromForm(fd, "offer"),
    legal: flagFromForm(fd, "legal"),
    langEs: flagFromForm(fd, "langEs"),
    langEn: flagFromForm(fd, "langEn"),
    langOt: flagFromForm(fd, "langOt"),
    vint: flagFromForm(fd, "vint"),
    wknd: flagFromForm(fd, "wknd"),
    openNow: flagFromForm(fd, "open_now"),
    licensed: flagFromForm(fd, "licensed"),
    insured: flagFromForm(fd, "insured"),
    freeEstimate: flagFromForm(fd, "free_estimate"),
    freeConsultation: flagFromForm(fd, "free_consultation"),
    hasPhotos: flagFromForm(fd, "has_photos"),
    hasVideos: flagFromForm(fd, "has_videos"),
    hasOffers: flagFromForm(fd, "has_offers"),
    sameDay: flagFromForm(fd, "same_day"),
    appointment: flagFromForm(fd, "appointment"),
  };
}

export function serviciosFilterQueryToUrlParams(
  query: ServiciosResultsFilterQuery,
  opts?: LocationUrlSanitizeOpts,
): Record<string, string> {
  const loc = sanitizeLocationParamsForUrl(
    {
      q: query.q,
      city: query.city,
      state: query.state,
      zip: query.zip,
      country: query.country,
    },
    opts,
  );
  const out: Record<string, string> = {};
  if (loc.q) out.q = loc.q;
  if (loc.city) out.city = loc.city;
  if (loc.state) out.state = loc.state;
  if (loc.zip) out.zip = loc.zip;
  if (loc.country) out.country = loc.country;
  if (query.group?.trim()) out.group = query.group.trim();
  if (query.seller && query.seller !== "all") out.seller = query.seller;
  if (query.sort && query.sort !== "newest") out.sort = query.sort;

  const flags: Array<[keyof ServiciosResultsFilterQuery, string]> = [
    ["whatsapp", "whatsapp"],
    ["promo", "promo"],
    ["call", "call"],
    ["verified", "verified"],
    ["web", "web"],
    ["bilingual", "bilingual"],
    ["email", "email"],
    ["emergency", "emergency"],
    ["mobileSvc", "mobileSvc"],
    ["msg", "msg"],
    ["phys", "phys"],
    ["svcMulti", "svcMulti"],
    ["offer", "offer"],
    ["legal", "legal"],
    ["langEs", "langEs"],
    ["langEn", "langEn"],
    ["langOt", "langOt"],
    ["vint", "vint"],
    ["wknd", "wknd"],
    ["openNow", "open_now"],
    ["licensed", "licensed"],
    ["insured", "insured"],
    ["freeEstimate", "free_estimate"],
    ["freeConsultation", "free_consultation"],
    ["hasPhotos", "has_photos"],
    ["hasVideos", "has_videos"],
    ["hasOffers", "has_offers"],
    ["sameDay", "same_day"],
    ["appointment", "appointment"],
  ];
  for (const [key, urlKey] of flags) {
    if (query[key] === "1") out[urlKey] = "1";
  }
  return out;
}

export function buildServiciosResultsBrowseHref(
  lang: Lang,
  loc: Partial<ServiciosBrowseLocation>,
  drawer: Partial<ServiciosResultsFilterQuery> = {},
  sanitizeOpts?: LocationUrlSanitizeOpts,
  extra?: Record<string, string>,
): string {
  const merged: ServiciosResultsFilterQuery = {
    q: loc.q?.trim() || drawer.q,
    city: loc.city?.trim() || drawer.city,
    state: loc.state?.trim() || drawer.state,
    zip: loc.zip?.trim() || drawer.zip,
    country: loc.country?.trim() || drawer.country,
    ...drawer,
  };
  const sp = new URLSearchParams();
  sp.set("lang", lang);
  for (const [k, v] of Object.entries(serviciosFilterQueryToUrlParams(merged, sanitizeOpts))) {
    if (v) sp.set(k, v);
  }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v?.trim()) sp.set(k, v.trim());
    }
  }
  return `${SERVICIOS_RESULTS_PATH}?${sp.toString()}`;
}

/** Omit one URL param for chip-remove links. */
export function buildServiciosResultsChipRemoveHref(
  lang: Lang,
  query: ServiciosResultsFilterQuery,
  omitUrlKey: string,
  perPage?: number,
): string {
  const params = serviciosFilterQueryToUrlParams(query);
  delete params[omitUrlKey];
  if (omitUrlKey === "seller") delete params.seller;
  const sp = new URLSearchParams();
  sp.set("lang", lang);
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  if (perPage && perPage !== 12) sp.set("perPage", String(perPage));
  return `${SERVICIOS_RESULTS_PATH}?${sp.toString()}`;
}

/** Active chip keys → URL param names for remove links. */
export const SERVICIOS_CHIP_URL_KEY: Record<string, string> = {
  q: "q",
  city: "city",
  state: "state",
  zip: "zip",
  country: "country",
  group: "group",
  seller: "seller",
  sort: "sort",
  wa: "whatsapp",
  promo: "promo",
  call: "call",
  verified: "verified",
  licensed: "licensed",
  insured: "insured",
  freeEstimate: "free_estimate",
  freeConsultation: "free_consultation",
  hasPhotos: "has_photos",
  hasVideos: "has_videos",
  hasOffers: "has_offers",
  web: "web",
  bilingual: "bilingual",
  email: "email",
  emergency: "emergency",
  mobileSvc: "mobileSvc",
  msg: "msg",
  phys: "phys",
  svcMulti: "svcMulti",
  offer: "offer",
  legal: "legal",
  langEs: "langEs",
  langEn: "langEn",
  langOt: "langOt",
  vint: "vint",
  wknd: "wknd",
  openNow: "open_now",
  sameDay: "same_day",
  appointment: "appointment",
};

export function serviciosLocationChipVisible(query: ServiciosResultsFilterQuery): {
  showState: boolean;
  showCountry: boolean;
} {
  return {
    showState: Boolean(query.state?.trim()),
    showCountry: Boolean(query.country?.trim() && !isLeonixLbUsCountry(query.country)),
  };
}
