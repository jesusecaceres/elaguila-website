/**
 * Rentas public browse / filter contract — single source of truth for URL params and interpretation.
 *
 * Canonical keys are lowercase `snake_case` in the query string. Legacy aliases are read in
 * `parseRentasBrowseParams` but emitted URLs should prefer canonical keys.
 *
 * Publish alignment (Privado + Negocio `Rentas*FormState`):
 * - titulo → title
 * - rentaMensual → rentMonthly / rentDisplay
 * - categoriaPropiedad → categoriaPropiedad (maps to URL `propiedad` or derived from landing `tipo`)
 * - ciudad → city
 * - ubicacionLinea → addressLine (public); city/ZIP may also be structured when backend exists
 * - amueblado / mascotas → amueblado, mascotasPermitidas
 * - residencial.* (recámaras, baños) → beds, baths strings
 * - estadoAnuncio → drives browse visibility when wired (demo uses browseActive + publishedAt)
 * - media.photoDataUrls → imageUrl / galleryUrls
 *
 * ZIP / state: not first-class in publish JSON today; public model carries optional `postalCode` / `stateRegion`
 * for adapters. Geocoding may populate them later.
 */

import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  parseBrNegocioPropiedadParam,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { normalizeCityForBrowse, normalizeZipForBrowse } from "@/app/clasificados/rentas/shared/rentasLocationNormalize";

// --- Canonical query keys (results + landing handoff) ---

export const RENTAS_QUERY_Q = "q";
/** Landing search: casa | depto | terreno | comercial — mapped to category filter when `propiedad` absent. */
export const RENTAS_QUERY_TIPO = "tipo";
export const RENTAS_QUERY_PRECIO = "precio";
export const RENTAS_QUERY_RECS = "recs";
/** Seller lane: privado | negocio */
export const RENTAS_QUERY_BRANCH = "branch";
/** Same semantic as BR Negocio: residencial | comercial | terreno_lote (preferred for chips / BR parity). */
export const RENTAS_QUERY_PROPIEDAD = BR_NEGOCIO_Q_PROPIEDAD;
export const RENTAS_QUERY_AMUEBLADO = "amueblado";
export const RENTAS_QUERY_MASCOTAS = "mascotas";
export const RENTAS_QUERY_RENT_MIN = "rent_min";
export const RENTAS_QUERY_RENT_MAX = "rent_max";
export const RENTAS_QUERY_DEPOSIT_MIN = "deposit_min";
export const RENTAS_QUERY_DEPOSIT_MAX = "deposit_max";
/** Exact `plazoContrato` code stored as `Leonix:rent:lease_term_code` (e.g. mes-a-mes, 12-meses). */
export const RENTAS_QUERY_LEASE = "lease";
export const RENTAS_QUERY_PARKING_MIN = "parking_min";
export const RENTAS_QUERY_SQFT_MIN = "sqft_min";
export const RENTAS_QUERY_SQFT_MAX = "sqft_max";

export const RENTAS_QUERY_CITY = "city";
/** Postal code (US/MX style); digits normalized in filters. */
export const RENTAS_QUERY_ZIP = "zip";
/** State / entity (e.g. NL, Jal.) — optional until backend normalizes. */
export const RENTAS_QUERY_STATE = "state";
/** Minimum bathrooms (numeric string, demo filters `baths` string). */
export const RENTAS_QUERY_BATHS_MIN = "baths_min";
/** Minimum half-baths from `Leonix:rent:half_baths_count`. */
export const RENTAS_QUERY_HALF_BATHS_MIN = "half_baths_min";

export const RENTAS_QUERY_SORT = "sort";
export const RENTAS_QUERY_PAGE = "page";

/** Results grid: items per page (`page` in the URL is 1-based). */
export const RENTAS_RESULTS_PAGE_SIZE = 6;

/** Scaffold: browser geolocation (only set after explicit user action; not auto-read). */
export const RENTAS_QUERY_LAT = "lat";
export const RENTAS_QUERY_LNG = "lng";
/** Scaffold: radius in km — filtering not live until geo index exists. */
export const RENTAS_QUERY_RADIUS_KM = "radius_km";

export type RentasSellerBranchFilter = "all" | "privado" | "negocio";

export type RentasBrowseParamsParsed = {
  q: string;
  /** Raw landing tipo (casa, depto, …) */
  tipo: string;
  precio: string;
  recs: string;
  branch: RentasSellerBranchFilter;
  propiedad: BrNegocioCategoriaPropiedad | null;
  amueblado: boolean;
  mascotas: boolean;
  rentMin: number | null;
  rentMax: number | null;
  depositMin: number | null;
  depositMax: number | null;
  /** Lease term code or empty */
  lease: string;
  parkingMin: number | null;
  sqftMin: number | null;
  sqftMax: number | null;
  city: string;
  zip: string;
  state: string;
  bathsMin: number | null;
  halfBathsMin: number | null;
  sort: string;
  page: number;
  lat: number | null;
  lng: number | null;
  radiusKm: number | null;
};

const LEGACY_TIPO_ALIASES: Record<string, BrNegocioCategoriaPropiedad> = {
  casa: "residencial",
  depto: "residencial",
  terreno: "terreno_lote",
  comercial: "comercial",
};

/**
 * When `propiedad` is absent, derive category from landing `tipo` dropdown.
 */
export function categoriaFromLandingTipo(tipo: string): BrNegocioCategoriaPropiedad | null {
  const k = tipo.trim().toLowerCase();
  return LEGACY_TIPO_ALIASES[k] ?? null;
}

export function parseRentasBrowseParams(sp: URLSearchParams | null | undefined): RentasBrowseParamsParsed {
  const g = (k: string) => sp?.get(k) ?? "";

  const branchRaw = g(RENTAS_QUERY_BRANCH);
  const branch: RentasSellerBranchFilter =
    branchRaw === "privado" || branchRaw === "negocio" ? branchRaw : "all";

  const propFromUrl = parseBrNegocioPropiedadParam(sp?.get(BR_NEGOCIO_Q_PROPIEDAD) ?? null);
  const prop = propFromUrl ?? categoriaFromLandingTipo(g(RENTAS_QUERY_TIPO));

  const rentMinRaw = g(RENTAS_QUERY_RENT_MIN);
  const rentMaxRaw = g(RENTAS_QUERY_RENT_MAX);
  const depMinRaw = g(RENTAS_QUERY_DEPOSIT_MIN);
  const depMaxRaw = g(RENTAS_QUERY_DEPOSIT_MAX);
  const leaseRaw = g(RENTAS_QUERY_LEASE).trim();
  const parkMinRaw = g(RENTAS_QUERY_PARKING_MIN);
  const sqMinRaw = g(RENTAS_QUERY_SQFT_MIN);
  const sqMaxRaw = g(RENTAS_QUERY_SQFT_MAX);
  const bathsRaw = g(RENTAS_QUERY_BATHS_MIN);
  const halfBathsRaw = g(RENTAS_QUERY_HALF_BATHS_MIN);

  const latRaw = g(RENTAS_QUERY_LAT);
  const lngRaw = g(RENTAS_QUERY_LNG);
  const rRaw = g(RENTAS_QUERY_RADIUS_KM);
  const pageRaw = g(RENTAS_QUERY_PAGE);

  return {
    q: g(RENTAS_QUERY_Q),
    tipo: g(RENTAS_QUERY_TIPO),
    precio: g(RENTAS_QUERY_PRECIO),
    recs: g(RENTAS_QUERY_RECS),
    branch,
    propiedad: prop,
    amueblado: g(RENTAS_QUERY_AMUEBLADO) === "1",
    mascotas: g(RENTAS_QUERY_MASCOTAS) === "1",
    rentMin: rentMinRaw !== "" && Number.isFinite(Number(rentMinRaw)) ? Number(rentMinRaw) : null,
    rentMax: rentMaxRaw !== "" && Number.isFinite(Number(rentMaxRaw)) ? Number(rentMaxRaw) : null,
    depositMin: depMinRaw !== "" && Number.isFinite(Number(depMinRaw)) ? Number(depMinRaw) : null,
    depositMax: depMaxRaw !== "" && Number.isFinite(Number(depMaxRaw)) ? Number(depMaxRaw) : null,
    lease: leaseRaw,
    parkingMin: parkMinRaw !== "" && Number.isFinite(Number(parkMinRaw)) ? Number(parkMinRaw) : null,
    sqftMin: sqMinRaw !== "" && Number.isFinite(Number(sqMinRaw)) ? Number(sqMinRaw) : null,
    sqftMax: sqMaxRaw !== "" && Number.isFinite(Number(sqMaxRaw)) ? Number(sqMaxRaw) : null,
    city: normalizeCityForBrowse(g(RENTAS_QUERY_CITY)),
    zip: normalizeZipForBrowse(g(RENTAS_QUERY_ZIP)),
    state: g(RENTAS_QUERY_STATE).trim(),
    bathsMin: bathsRaw !== "" && Number.isFinite(Number(bathsRaw)) ? Number(bathsRaw) : null,
    halfBathsMin: halfBathsRaw !== "" && Number.isFinite(Number(halfBathsRaw)) ? Number(halfBathsRaw) : null,
    sort: g(RENTAS_QUERY_SORT) || "reciente",
    page: Math.max(1, parseInt(pageRaw, 10) || 1),
    lat: latRaw !== "" && Number.isFinite(Number(latRaw)) ? Number(latRaw) : null,
    lng: lngRaw !== "" && Number.isFinite(Number(lngRaw)) ? Number(lngRaw) : null,
    radiusKm: rRaw !== "" && Number.isFinite(Number(rRaw)) ? Number(rRaw) : null,
  };
}

/**
 * Split a single user "location" string into city vs postal for URL (best-effort; no geocoding).
 */
export function splitLocationIntent(raw: string): { city?: string; zip?: string } {
  const t = raw.trim();
  if (!t) return {};
  if (/^\d{4,6}(-?\d{4})?$/.test(t.replace(/\s/g, ""))) {
    return { zip: normalizeZipForBrowse(t) };
  }
  return { city: normalizeCityForBrowse(t) };
}

/** True when URL carries any browse narrowing beyond defaults (for demo total vs live count). */
export function rentasBrowseHasActiveFilters(p: RentasBrowseParamsParsed): boolean {
  const sortNonDefault = p.sort.trim() !== "" && p.sort !== "reciente";
  const pageNonDefault = p.page > 1;
  return !!(
    p.q.trim() ||
    p.tipo.trim() ||
    p.precio ||
    p.recs ||
    p.branch !== "all" ||
    p.propiedad ||
    p.amueblado ||
    p.mascotas ||
    p.rentMin != null ||
    p.rentMax != null ||
    p.depositMin != null ||
    p.depositMax != null ||
    p.lease ||
    p.parkingMin != null ||
    p.sqftMin != null ||
    p.sqftMax != null ||
    p.city ||
    p.zip ||
    p.state ||
    p.bathsMin != null ||
    p.halfBathsMin != null ||
    p.lat != null ||
    p.lng != null ||
    sortNonDefault ||
    pageNonDefault
  );
}
