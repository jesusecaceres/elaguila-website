/**
 * Saved Search 06 — reconstructs a real Rentas results URL from a normalized saved search. No
 * single `serializeRentasBrowseUrl` function exists in the repo (confirmed by direct search) — the
 * live results page builds its query string ad hoc inline. This uses the same canonical
 * `RENTAS_QUERY_*` key constants `parseRentasBrowseParams` reads, so it stays byte-compatible with
 * the real parser without inventing a second query contract. Sort/page are never persisted as
 * Saved Search match semantics — the reconstructed URL always opens on the default sort, page 1.
 */
import {
  RENTAS_QUERY_Q,
  RENTAS_QUERY_BRANCH,
  RENTAS_QUERY_PROPIEDAD,
  RENTAS_QUERY_AMUEBLADO,
  RENTAS_QUERY_MASCOTAS,
  RENTAS_QUERY_RENT_MIN,
  RENTAS_QUERY_RENT_MAX,
  RENTAS_QUERY_DEPOSIT_MIN,
  RENTAS_QUERY_DEPOSIT_MAX,
  RENTAS_QUERY_LEASE,
  RENTAS_QUERY_PARKING_MIN,
  RENTAS_QUERY_SQFT_MIN,
  RENTAS_QUERY_SQFT_MAX,
  RENTAS_QUERY_CITY,
  RENTAS_QUERY_ZIP,
  RENTAS_QUERY_STATE,
  RENTAS_QUERY_COUNTRY,
  RENTAS_QUERY_BATHS_MIN,
  RENTAS_QUERY_HALF_BATHS_MIN,
  RENTAS_QUERY_HIGHLIGHTS,
  RENTAS_QUERY_POOL,
  RENTAS_QUERY_SUBTYPE,
  RENTAS_QUERY_KIND,
  RENTAS_QUERY_ESTADO,
  RENTAS_QUERY_ROOM_BATH,
  RENTAS_QUERY_ROOM_KITCHEN,
} from "@/app/clasificados/rentas/shared/rentasBrowseContract";
import { RENTAS_RESULTS } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import type { SupportedLang } from "@/app/lib/language";
import { savedSearchToRentasFilterState } from "./savedSearchRentasAdapter";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";

export function buildRentasSavedSearchResultsUrl(saved: SavedSearchNormalizedInput, routeLang: SupportedLang): string {
  const p = savedSearchToRentasFilterState(saved);
  const lang = routeLang === "en" ? "en" : "es";
  const qs = new URLSearchParams();
  qs.set("lang", lang);
  if (p.q) qs.set(RENTAS_QUERY_Q, p.q);
  if (p.branch !== "all") qs.set(RENTAS_QUERY_BRANCH, p.branch);
  if (p.propiedad) qs.set(RENTAS_QUERY_PROPIEDAD, p.propiedad);
  if (p.amueblado) qs.set(RENTAS_QUERY_AMUEBLADO, "1");
  if (p.mascotas) qs.set(RENTAS_QUERY_MASCOTAS, "1");
  if (p.rentMin != null) qs.set(RENTAS_QUERY_RENT_MIN, String(p.rentMin));
  if (p.rentMax != null) qs.set(RENTAS_QUERY_RENT_MAX, String(p.rentMax));
  if (p.depositMin != null) qs.set(RENTAS_QUERY_DEPOSIT_MIN, String(p.depositMin));
  if (p.depositMax != null) qs.set(RENTAS_QUERY_DEPOSIT_MAX, String(p.depositMax));
  if (p.lease) qs.set(RENTAS_QUERY_LEASE, p.lease);
  if (p.parkingMin != null) qs.set(RENTAS_QUERY_PARKING_MIN, String(p.parkingMin));
  if (p.sqftMin != null) qs.set(RENTAS_QUERY_SQFT_MIN, String(p.sqftMin));
  if (p.sqftMax != null) qs.set(RENTAS_QUERY_SQFT_MAX, String(p.sqftMax));
  if (p.city) qs.set(RENTAS_QUERY_CITY, p.city);
  if (p.zip) qs.set(RENTAS_QUERY_ZIP, p.zip);
  if (p.state) qs.set(RENTAS_QUERY_STATE, p.state);
  if (p.country) qs.set(RENTAS_QUERY_COUNTRY, p.country);
  if (p.bathsMin != null) qs.set(RENTAS_QUERY_BATHS_MIN, String(p.bathsMin));
  if (p.halfBathsMin != null) qs.set(RENTAS_QUERY_HALF_BATHS_MIN, String(p.halfBathsMin));
  if (p.highlightsAll.length) qs.set(RENTAS_QUERY_HIGHLIGHTS, p.highlightsAll.join(","));
  if (p.wantsPool) qs.set(RENTAS_QUERY_POOL, "1");
  if (p.subtype) qs.set(RENTAS_QUERY_SUBTYPE, p.subtype);
  if (p.kind) qs.set(RENTAS_QUERY_KIND, p.kind);
  if (p.estado) qs.set(RENTAS_QUERY_ESTADO, p.estado);
  if (p.roomBath) qs.set(RENTAS_QUERY_ROOM_BATH, p.roomBath);
  if (p.roomKitchen) qs.set(RENTAS_QUERY_ROOM_KITCHEN, p.roomKitchen);
  return `${RENTAS_RESULTS}?${qs.toString()}`;
}
