/**
 * Single URL + semantics contract for Autos landing, results, and future publish/live APIs.
 * Query keys match fields collected in Negocios/Privado applications (city, ZIP, specs, seller lane).
 *
 * ## Implemented
 * All keys below are parsed/serialized for shareable URLs and client-side filtering.
 *
 * ## Scaffolded (parsed only; not applied in `applyAutosPublicFilters` yet)
 * - `radiusMiles` — reserved for geo radius once centroids/API exist.
 */

import type { AutosPublicFilterState, AutosPublicSortKey } from "./autosPublicFilterTypes";
import { emptyAutosPublicFilters } from "./autosPublicFilterTypes";

export const AUTOS_BROWSE_URL_KEYS = {
  lang: "lang",
  q: "q",
  city: "city",
  zip: "zip",
  radiusMiles: "radiusMiles",
  priceMin: "priceMin",
  priceMax: "priceMax",
  make: "make",
  model: "model",
  yearMin: "yearMin",
  yearMax: "yearMax",
  condition: "condition",
  /** Values: `dealer` | `private` — maps to listing `sellerType` and live `autosLane`. */
  seller: "seller",
  bodyStyle: "bodyStyle",
  transmission: "transmission",
  drivetrain: "drivetrain",
  fuelType: "fuelType",
  mileageMax: "mileageMax",
  titleStatus: "titleStatus",
  sort: "sort",
  page: "page",
} as const;

/** Paid shell lane — aligns with `AutoDealerListing["autosLane"]`. */
export type AutosBrowseAutosLane = "negocios" | "privado";

export function autosLaneFromSellerQuery(seller: string | undefined | null): AutosBrowseAutosLane | undefined {
  const s = (seller ?? "").trim().toLowerCase();
  if (s === "dealer") return "negocios";
  if (s === "private") return "privado";
  return undefined;
}

export function sellerQueryFromAutosLane(lane: AutosBrowseAutosLane): "dealer" | "private" {
  return lane === "negocios" ? "dealer" : "private";
}

const SORT_VALUES: AutosPublicSortKey[] = ["newest", "priceAsc", "priceDesc", "mileage"];

function parseSort(raw: string | null): AutosPublicSortKey {
  return SORT_VALUES.includes(raw as AutosPublicSortKey) ? (raw as AutosPublicSortKey) : "newest";
}

function parsePage(raw: string | null): number {
  const n = parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

const K = AUTOS_BROWSE_URL_KEYS;

export type AutosBrowseUrlBundle = {
  filters: AutosPublicFilterState;
  q: string;
  sort: AutosPublicSortKey;
  page: number;
  lang: "es" | "en";
};

/** Read full browse state from URL (results + landing seeds). */
export function parseAutosBrowseUrl(sp: URLSearchParams): AutosBrowseUrlBundle {
  const filters = emptyAutosPublicFilters();
  filters.city = sp.get(K.city) ?? "";
  filters.zip = sp.get(K.zip) ?? "";
  filters.radiusMiles = sp.get(K.radiusMiles) ?? "";
  filters.priceMin = sp.get(K.priceMin) ?? "";
  filters.priceMax = sp.get(K.priceMax) ?? "";
  filters.make = sp.get(K.make) ?? "";
  filters.model = sp.get(K.model) ?? "";
  filters.yearMin = sp.get(K.yearMin) ?? "";
  filters.yearMax = sp.get(K.yearMax) ?? "";
  const cond = sp.get(K.condition);
  if (cond === "new" || cond === "used" || cond === "certified") filters.condition = cond;
  const seller = sp.get(K.seller);
  if (seller === "dealer" || seller === "private") filters.sellerType = seller;
  filters.bodyStyle = sp.get(K.bodyStyle) ?? "";
  filters.transmission = sp.get(K.transmission) ?? "";
  filters.drivetrain = sp.get(K.drivetrain) ?? "";
  filters.fuelType = sp.get(K.fuelType) ?? "";
  filters.mileageMax = sp.get(K.mileageMax) ?? "";
  filters.titleStatus = sp.get(K.titleStatus) ?? "";

  const lang = sp.get(K.lang) === "en" ? "en" : "es";
  const q = sp.get(K.q) ?? "";
  const sort = parseSort(sp.get(K.sort));
  const page = parsePage(sp.get(K.page));

  return { filters, q, sort, page, lang };
}

function setIfNonEmpty(params: URLSearchParams, key: string, value: string | undefined | null) {
  const t = (value ?? "").trim();
  if (t) params.set(key, t);
}

/** Serialize browse state for `/clasificados/autos/resultados` (and landing handoff). */
export function serializeAutosBrowseUrl(bundle: AutosBrowseUrlBundle): string {
  const params = new URLSearchParams();
  params.set(K.lang, bundle.lang);
  setIfNonEmpty(params, K.q, bundle.q);
  setIfNonEmpty(params, K.city, bundle.filters.city);
  setIfNonEmpty(params, K.zip, bundle.filters.zip);
  setIfNonEmpty(params, K.radiusMiles, bundle.filters.radiusMiles);
  setIfNonEmpty(params, K.priceMin, bundle.filters.priceMin);
  setIfNonEmpty(params, K.priceMax, bundle.filters.priceMax);
  setIfNonEmpty(params, K.make, bundle.filters.make);
  setIfNonEmpty(params, K.model, bundle.filters.model);
  setIfNonEmpty(params, K.yearMin, bundle.filters.yearMin);
  setIfNonEmpty(params, K.yearMax, bundle.filters.yearMax);
  if (bundle.filters.condition) params.set(K.condition, bundle.filters.condition);
  if (bundle.filters.sellerType) params.set(K.seller, bundle.filters.sellerType);
  setIfNonEmpty(params, K.bodyStyle, bundle.filters.bodyStyle);
  setIfNonEmpty(params, K.transmission, bundle.filters.transmission);
  setIfNonEmpty(params, K.drivetrain, bundle.filters.drivetrain);
  setIfNonEmpty(params, K.fuelType, bundle.filters.fuelType);
  setIfNonEmpty(params, K.mileageMax, bundle.filters.mileageMax);
  setIfNonEmpty(params, K.titleStatus, bundle.filters.titleStatus);
  if (bundle.sort !== "newest") params.set(K.sort, bundle.sort);
  if (bundle.page > 1) params.set(K.page, String(bundle.page));
  return params.toString();
}

/** Live detail path for sample/API inventory ids (explicit Autos namespace). */
export function autosLiveVehiclePath(listingId: string): string {
  return `/clasificados/autos/vehiculo/${encodeURIComponent(listingId)}`;
}
