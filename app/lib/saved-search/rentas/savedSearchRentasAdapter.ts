/**
 * Saved Search 06 — Rentas adapter. Translates between the live Rentas public filter contract
 * (`RentasBrowseParamsParsed`, `app/(site)/clasificados/rentas/shared/rentasBrowseContract.ts`)
 * and the generic normalized Saved Search contract. Only fields `filterRentasPublicListings` (the
 * real public results filter —
 * `app/(site)/clasificados/rentas/shared/rentasBrowseFilters.ts`) actually uses to decide
 * inclusion are represented here. `lat`/`lng`/`radiusKm` are deliberately excluded — the contract's
 * own header comment documents them as a "scaffold... not exposed in UI"; `tipo` (the raw landing
 * dropdown) is excluded too since `propiedad` is its already-derived, canonical equivalent
 * (`categoriaFromLandingTipo`) and saving both would be redundant, never differently-matching.
 */
import type { RentasBrowseParamsParsed } from "@/app/clasificados/rentas/shared/rentasBrowseContract";
import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type { BrResultsPropertyKind } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";

export const SAVED_SEARCH_RENTAS_CATEGORY = "rentas";

/** Everything besides city/min price/max price — stored in `saved_searches.filter_payload`. */
export type RentasSavedSearchFilterPayload = {
  q?: string;
  branch?: "privado" | "negocio";
  propiedad?: BrNegocioCategoriaPropiedad;
  amueblado?: boolean;
  mascotas?: boolean;
  depositMin?: number;
  depositMax?: number;
  lease?: string;
  parkingMin?: number;
  sqftMin?: number;
  sqftMax?: number;
  zip?: string;
  state?: string;
  country?: string;
  bathsMin?: number;
  halfBathsMin?: number;
  highlightsAll?: string[];
  wantsPool?: boolean;
  subtype?: string;
  kind?: BrResultsPropertyKind;
  estado?: string;
  roomBath?: string;
  roomKitchen?: string;
};

/** Current Rentas filter state the user is actively browsing with -> the generic normalized Saved
 * Search contract. */
export function rentasFilterStateToSavedSearch(filters: RentasBrowseParamsParsed): SavedSearchNormalizedInput {
  const payload: RentasSavedSearchFilterPayload = {};
  if (filters.q.trim()) payload.q = filters.q.trim();
  if (filters.branch === "privado" || filters.branch === "negocio") payload.branch = filters.branch;
  if (filters.propiedad) payload.propiedad = filters.propiedad;
  if (filters.amueblado) payload.amueblado = true;
  if (filters.mascotas) payload.mascotas = true;
  if (filters.depositMin != null) payload.depositMin = filters.depositMin;
  if (filters.depositMax != null) payload.depositMax = filters.depositMax;
  if (filters.lease.trim()) payload.lease = filters.lease.trim();
  if (filters.parkingMin != null) payload.parkingMin = filters.parkingMin;
  if (filters.sqftMin != null) payload.sqftMin = filters.sqftMin;
  if (filters.sqftMax != null) payload.sqftMax = filters.sqftMax;
  if (filters.zip.trim()) payload.zip = filters.zip.trim();
  if (filters.state.trim()) payload.state = filters.state.trim();
  if (filters.country.trim()) payload.country = filters.country.trim();
  if (filters.bathsMin != null) payload.bathsMin = filters.bathsMin;
  if (filters.halfBathsMin != null) payload.halfBathsMin = filters.halfBathsMin;
  if (filters.highlightsAll.length) payload.highlightsAll = [...filters.highlightsAll];
  if (filters.wantsPool) payload.wantsPool = true;
  if (filters.subtype.trim()) payload.subtype = filters.subtype.trim();
  if (filters.kind) payload.kind = filters.kind;
  if (filters.estado.trim()) payload.estado = filters.estado.trim();
  if (filters.roomBath.trim()) payload.roomBath = filters.roomBath.trim();
  if (filters.roomKitchen.trim()) payload.roomKitchen = filters.roomKitchen.trim();

  return {
    category: SAVED_SEARCH_RENTAS_CATEGORY,
    city: filters.city.trim(),
    minPrice: filters.rentMin,
    maxPrice: filters.rentMax,
    filterPayload: payload as Record<string, unknown>,
  };
}

/** A saved search row -> a full `RentasBrowseParamsParsed` `filterRentasPublicListings` can
 * consume. `tipo`/`lat`/`lng`/`radiusKm`/`precio` have no real Saved Search equivalent (see file
 * header) and are left at their neutral default — `filterRentasPublicListings` treats each as
 * "no filter" when absent/default. */
export function savedSearchToRentasFilterState(saved: SavedSearchNormalizedInput): RentasBrowseParamsParsed {
  const p = (saved.filterPayload ?? {}) as RentasSavedSearchFilterPayload;
  return {
    q: p.q ?? "",
    tipo: "",
    precio: "",
    recs: "",
    branch: p.branch ?? "all",
    propiedad: p.propiedad ?? null,
    amueblado: p.amueblado === true,
    mascotas: p.mascotas === true,
    rentMin: saved.minPrice,
    rentMax: saved.maxPrice,
    depositMin: p.depositMin ?? null,
    depositMax: p.depositMax ?? null,
    lease: p.lease ?? "",
    parkingMin: p.parkingMin ?? null,
    sqftMin: p.sqftMin ?? null,
    sqftMax: p.sqftMax ?? null,
    city: saved.city ?? "",
    zip: p.zip ?? "",
    state: p.state ?? "",
    country: p.country ?? "",
    bathsMin: p.bathsMin ?? null,
    halfBathsMin: p.halfBathsMin ?? null,
    sort: "reciente",
    page: 1,
    lat: null,
    lng: null,
    radiusKm: null,
    highlightsAll: p.highlightsAll ? [...p.highlightsAll] : [],
    wantsPool: p.wantsPool === true,
    subtype: p.subtype ?? "",
    kind: p.kind ?? null,
    estado: p.estado ?? "",
    roomBath: p.roomBath ?? "",
    roomKitchen: p.roomKitchen ?? "",
  };
}

/** Human-readable summary of the major matching facets for the owner dashboard's list of saved
 * searches. Never dumps raw `filter_payload` JSON. */
export function describeRentasSavedSearchFacets(saved: SavedSearchNormalizedInput, lang: "es" | "en"): string[] {
  const p = (saved.filterPayload ?? {}) as RentasSavedSearchFilterPayload;
  const parts: string[] = [];
  if (p.propiedad) parts.push(p.propiedad);
  if (p.branch) parts.push(p.branch === "negocio" ? (lang === "es" ? "Negocio" : "Business") : lang === "es" ? "Particular" : "Private seller");
  if (p.bathsMin != null) parts.push(lang === "es" ? `${p.bathsMin}+ baños` : `${p.bathsMin}+ baths`);
  if (p.amueblado) parts.push(lang === "es" ? "Amueblado" : "Furnished");
  if (p.mascotas) parts.push(lang === "es" ? "Mascotas permitidas" : "Pets allowed");
  if (p.wantsPool) parts.push(lang === "es" ? "Alberca" : "Pool");
  if (p.lease) parts.push(p.lease);
  if (p.q) parts.push(`"${p.q}"`);
  return parts;
}
