import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  EN_VENTA_DEFAULT_COUNTRY,
  EN_VENTA_DEFAULT_STATE,
} from "./constants/enVentaLocationContract";
import { buildEnVentaResultsUrl } from "./constants/enVentaResultsRoutes";

export type EnVentaBrowseLocation = {
  q: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export const EN_VENTA_DEFAULT_BROWSE_LOCATION: EnVentaBrowseLocation = {
  q: "",
  city: "",
  state: EN_VENTA_DEFAULT_STATE,
  zip: "",
  country: EN_VENTA_DEFAULT_COUNTRY,
};

export type EnVentaDrawerFilterState = {
  evDept: string;
  evSub: string;
  itemType: string;
  cond: string;
  priceMin: string;
  priceMax: string;
  pickup: boolean;
  ship: boolean;
  delivery: boolean;
  free: boolean;
  nego: boolean;
  meetup: boolean;
  seller: string;
  hasPhoto: boolean;
  hasVideo: boolean;
  featured: boolean;
};

export function defaultEnVentaDrawerFilters(): EnVentaDrawerFilterState {
  return {
    evDept: "",
    evSub: "",
    itemType: "",
    cond: "",
    priceMin: "",
    priceMax: "",
    pickup: false,
    ship: false,
    delivery: false,
    free: false,
    nego: false,
    meetup: false,
    seller: "",
    hasPhoto: false,
    hasVideo: false,
    featured: false,
  };
}

export type EnVentaLocationSanitizeOpts = {
  urlHadState?: boolean;
  urlHadCountry?: boolean;
  stateTouched?: boolean;
  countryTouched?: boolean;
};

/** Omit display-only defaults (CA / United States) unless explicitly in URL or user-touched. */
export function sanitizeEnVentaLocationForUrl(
  loc: Partial<EnVentaBrowseLocation>,
  opts: EnVentaLocationSanitizeOpts = {},
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  const q = (loc.q ?? "").trim();
  if (q) out.q = q;
  const city = (loc.city ?? "").trim();
  if (city) out.city = city;
  const zip = (loc.zip ?? "").trim();
  if (zip) out.zip = zip;

  const state = (loc.state ?? "").trim();
  if (state) {
    const emit = Boolean(opts.stateTouched || opts.urlHadState || state !== EN_VENTA_DEFAULT_STATE);
    if (emit) out.state = state;
  }

  const country = (loc.country ?? "").trim();
  if (country) {
    const emit = Boolean(opts.countryTouched || opts.urlHadCountry || country !== EN_VENTA_DEFAULT_COUNTRY);
    if (emit) out.country = country;
  }

  return out;
}

export function enVentaDrawerFiltersToParams(drawer: EnVentaDrawerFilterState): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  if (drawer.evDept.trim()) out.evDept = drawer.evDept.trim();
  if (drawer.evSub.trim()) out.evSub = drawer.evSub.trim();
  if (drawer.itemType.trim()) out.itemType = drawer.itemType.trim();
  if (drawer.cond.trim()) out.cond = drawer.cond.trim();
  if (drawer.priceMin.trim()) out.priceMin = drawer.priceMin.trim();
  if (drawer.priceMax.trim()) out.priceMax = drawer.priceMax.trim();
  if (drawer.seller.trim()) out.seller = drawer.seller.trim();
  if (drawer.pickup) out.pickup = "1";
  if (drawer.ship) out.ship = "1";
  if (drawer.delivery) out.delivery = "1";
  if (drawer.free) out.free = "1";
  if (drawer.nego) out.nego = "1";
  if (drawer.meetup) out.meetup = "1";
  if (drawer.hasPhoto) out.hasPhoto = "1";
  if (drawer.hasVideo) out.hasVideo = "1";
  if (drawer.featured) out.featured = "1";
  return out;
}

export function buildEnVentaBrowseHref(
  lang: Lang,
  loc: Partial<EnVentaBrowseLocation>,
  drawer: Partial<EnVentaDrawerFilterState> = {},
  sanitizeOpts: EnVentaLocationSanitizeOpts = {},
): string {
  const drawerFull = { ...defaultEnVentaDrawerFilters(), ...drawer };
  return buildEnVentaResultsUrl(lang, {
    ...sanitizeEnVentaLocationForUrl(loc, sanitizeOpts),
    ...enVentaDrawerFiltersToParams(drawerFull),
  });
}
