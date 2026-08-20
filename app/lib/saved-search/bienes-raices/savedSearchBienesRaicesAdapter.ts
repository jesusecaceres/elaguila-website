/**
 * Saved Search 06 — Bienes Raíces adapter. Translates between the live BR public filter contract
 * (`BrResultsParsedState`, `app/(site)/clasificados/bienes-raices/resultados/lib/brResultsUrlState.ts`)
 * and the generic normalized Saved Search contract. Only fields `filterBrListings` (the real public
 * results filter — `app/(site)/clasificados/bienes-raices/resultados/lib/brResultsFilters.ts`)
 * actually uses to decide inclusion are represented here. `filterBrListings` itself derives its
 * `primary` chip set from `operationType`/`propertyType` when they're set (see its own source,
 * lines 159-171) — this adapter never needs to precompute chip ids. The ~18 "deferred" BR URL
 * fields (patio, balcony, view, gated, …) are NOT represented here: `brResultsFilters.ts`'s own
 * header comment documents them as parsed but not yet wired into the filter function — saving one
 * would be saving a fake promise, exactly the same reasoning the Autos adapter already applies to
 * `radiusMiles`.
 */
import type { BrResultsParsedState } from "@/app/clasificados/bienes-raices/resultados/lib/brResultsUrlState";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";

export const SAVED_SEARCH_BIENES_RAICES_CATEGORY = "bienes-raices";

/** Everything besides city/min price/max price — stored in `saved_searches.filter_payload`.
 * Every key here is optional; an absent key means "no filter on this field," matching
 * `BrResultsParsedState`'s own ""-means-unset convention. */
export type BienesRaicesSavedSearchFilterPayload = {
  q?: string;
  state?: string;
  zip?: string;
  country?: string;
  operationType?: "venta" | "renta";
  propertyType?: string;
  sellerType?: "privado" | "negocio";
  beds?: number;
  baths?: number;
  pool?: boolean;
  pets?: boolean;
  furnished?: boolean;
};

function parseIntOrUndefined(raw: string | undefined): number | undefined {
  const t = (raw ?? "").trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

/** Current BR filter state the user is actively browsing with -> the generic normalized Saved
 * Search contract, ready for `canonicalizeSavedSearch`/`buildSavedSearchFingerprint`. */
export function bienesRaicesFilterStateToSavedSearch(filters: BrResultsParsedState): SavedSearchNormalizedInput {
  const payload: BienesRaicesSavedSearchFilterPayload = {};
  if (filters.q.trim()) payload.q = filters.q.trim();
  if (filters.state.trim()) payload.state = filters.state.trim();
  if (filters.zip.trim()) payload.zip = filters.zip.trim();
  if (filters.country.trim()) payload.country = filters.country.trim();
  if (filters.operationType === "venta" || filters.operationType === "renta") payload.operationType = filters.operationType;
  if (filters.propertyType.trim()) payload.propertyType = filters.propertyType.trim();
  if (filters.sellerType === "privado" || filters.sellerType === "negocio") payload.sellerType = filters.sellerType;
  const beds = parseIntOrUndefined(filters.beds);
  if (beds != null) payload.beds = beds;
  const baths = parseIntOrUndefined(filters.baths);
  if (baths != null) payload.baths = baths;
  if (filters.pool === "true") payload.pool = true;
  if (filters.pets === "true") payload.pets = true;
  if (filters.furnished === "true") payload.furnished = true;

  return {
    category: SAVED_SEARCH_BIENES_RAICES_CATEGORY,
    city: filters.city.trim(),
    minPrice: parseIntOrUndefined(filters.priceMin) ?? null,
    maxPrice: parseIntOrUndefined(filters.priceMax) ?? null,
    filterPayload: payload as Record<string, unknown>,
  };
}

/** A saved search row -> a full `BrResultsParsedState` `filterBrListings` can consume. Fields with
 * no real Saved Search equivalent (colonia, primary/secondary chip strings, legacy `precio` band,
 * sort, page, and the 18 deferred characteristic filters) are left at their neutral/empty default
 * — `filterBrListings` treats an empty string as "no filter on this field" for every one of them,
 * and its own logic derives the equivalent `primary` chips from `operationType`/`propertyType`
 * alone, so leaving `primary`/`secondary` empty here does not lose any real matching semantics. */
export function savedSearchToBienesRaicesFilterState(saved: SavedSearchNormalizedInput): BrResultsParsedState {
  const p = (saved.filterPayload ?? {}) as BienesRaicesSavedSearchFilterPayload;
  return {
    lang: "es",
    q: p.q ?? "",
    city: saved.city ?? "",
    colonia: "",
    state: p.state ?? "",
    country: p.country ?? "",
    operationType: p.operationType ?? "",
    propertyType: p.propertyType ?? "",
    sellerType: p.sellerType ?? "",
    priceMin: saved.minPrice != null ? String(saved.minPrice) : "",
    priceMax: saved.maxPrice != null ? String(saved.maxPrice) : "",
    beds: p.beds != null ? String(p.beds) : "",
    baths: p.baths != null ? String(p.baths) : "",
    pets: p.pets ? "true" : "",
    furnished: p.furnished ? "true" : "",
    pool: p.pool ? "true" : "",
    sort: "reciente",
    page: "1",
    zip: p.zip ?? "",
    primary: "",
    secondary: "",
    precio: "",
    patio: "",
    balcony: "",
    view: "",
    gated: "",
    homeOffice: "",
    solar: "",
    fireplace: "",
    laundry: "",
    coveredParking: "",
    accessControl: "",
    elevator: "",
    terrace: "",
    gym: "",
    amenities: "",
    walkInCloset: "",
    highCeilings: "",
    smartHome: "",
  };
}

/**
 * Saved Search 06 — human-readable summary of the major matching facets for the owner dashboard's
 * list of saved searches. Never dumps raw `filter_payload` JSON; only surfaces fields a person
 * would recognize from having set them.
 */
export function describeBienesRaicesSavedSearchFacets(saved: SavedSearchNormalizedInput, lang: "es" | "en"): string[] {
  const p = (saved.filterPayload ?? {}) as BienesRaicesSavedSearchFilterPayload;
  const parts: string[] = [];
  if (p.operationType) parts.push(p.operationType === "renta" ? (lang === "es" ? "Renta" : "For rent") : lang === "es" ? "Venta" : "For sale");
  if (p.propertyType) parts.push(p.propertyType);
  if (p.sellerType) parts.push(p.sellerType === "negocio" ? (lang === "es" ? "Negocio" : "Business") : lang === "es" ? "Particular" : "Private seller");
  if (p.beds != null) parts.push(lang === "es" ? `${p.beds}+ recámaras` : `${p.beds}+ beds`);
  if (p.baths != null) parts.push(lang === "es" ? `${p.baths}+ baños` : `${p.baths}+ baths`);
  if (p.pool) parts.push(lang === "es" ? "Alberca" : "Pool");
  if (p.pets) parts.push(lang === "es" ? "Mascotas" : "Pets allowed");
  if (p.furnished) parts.push(lang === "es" ? "Amueblado" : "Furnished");
  if (p.q) parts.push(`"${p.q}"`);
  return parts;
}
