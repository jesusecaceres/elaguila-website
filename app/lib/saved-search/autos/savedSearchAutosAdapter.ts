/**
 * Saved Search 02 — Autos adapter. Translates between the live Autos public filter contract
 * (`AutosPublicFilterState`, `app/(site)/clasificados/autos/filters/autosPublicFilterTypes.ts`)
 * and the generic normalized Saved Search contract. Only fields `applyAutosPublicFilters` (the
 * real public results filter — `app/(site)/clasificados/autos/components/public/autosPublicFilters.ts`)
 * actually uses to decide inclusion are represented here. `radiusMiles` is deliberately excluded:
 * it is reserved in the URL contract but not applied by the filter until geo is wired
 * (`autosPublicFilterTypes.ts:32-36`) — saving it would be saving a fake promise.
 */
import type { AutosPublicFilterState } from "@/app/clasificados/autos/filters/autosPublicFilterTypes";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";

export const SAVED_SEARCH_AUTOS_CATEGORY = "autos";

/** Everything besides city/min price/max price — stored in `saved_searches.filter_payload`.
 * Every key here is optional; an absent key means "no filter on this field," matching
 * `AutosPublicFilterState`'s own "" = no filter convention. */
export type AutosSavedSearchFilterPayload = {
  /** Free-text `q=` haystack search — a real 3rd argument to `applyAutosPublicFilters`, not part
   * of `AutosPublicFilterState` itself, but it does affect result inclusion (autosPublicFilters.ts:26-57). */
  q?: string;
  state?: string;
  zip?: string;
  country?: string;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  condition?: "new" | "used" | "certified";
  sellerType?: "dealer" | "private";
  bodyStyle?: string;
  transmission?: string;
  drivetrain?: string;
  fuelType?: string;
  exteriorColor?: string;
  interiorColor?: string;
  mileageMin?: number;
  mileageMax?: number;
  titleStatus?: string;
  hasPhotos?: boolean;
  hasVideo?: boolean;
};

function parseIntOrNull(raw: string | undefined): number | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/** Current Autos filter state (+ free-text query) the user is actively browsing with -> the
 * generic normalized Saved Search contract, ready for `canonicalizeSavedSearch`/`buildSavedSearchFingerprint`. */
export function autosFilterStateToSavedSearch(
  filters: AutosPublicFilterState,
  searchQ = "",
): SavedSearchNormalizedInput {
  const payload: AutosSavedSearchFilterPayload = {};
  if (searchQ.trim()) payload.q = searchQ.trim();
  if (filters.state.trim()) payload.state = filters.state.trim();
  if (filters.zip.trim()) payload.zip = filters.zip.trim();
  if (filters.country.trim()) payload.country = filters.country.trim();
  if (filters.make.trim()) payload.make = filters.make.trim();
  if (filters.model.trim()) payload.model = filters.model.trim();
  const yearMin = parseIntOrNull(filters.yearMin);
  if (yearMin != null) payload.yearMin = yearMin;
  const yearMax = parseIntOrNull(filters.yearMax);
  if (yearMax != null) payload.yearMax = yearMax;
  if (filters.condition) payload.condition = filters.condition;
  if (filters.sellerType) payload.sellerType = filters.sellerType;
  if (filters.bodyStyle) payload.bodyStyle = filters.bodyStyle;
  if (filters.transmission) payload.transmission = filters.transmission;
  if (filters.drivetrain) payload.drivetrain = filters.drivetrain;
  if (filters.fuelType) payload.fuelType = filters.fuelType;
  if (filters.exteriorColor) payload.exteriorColor = filters.exteriorColor;
  if (filters.interiorColor) payload.interiorColor = filters.interiorColor;
  const mileageMin = parseIntOrNull(filters.mileageMin);
  if (mileageMin != null) payload.mileageMin = mileageMin;
  const mileageMax = parseIntOrNull(filters.mileageMax);
  if (mileageMax != null) payload.mileageMax = mileageMax;
  if (filters.titleStatus.trim()) payload.titleStatus = filters.titleStatus.trim();
  if (filters.hasPhotos === "yes") payload.hasPhotos = true;
  if (filters.hasVideo === "yes") payload.hasVideo = true;

  return {
    category: SAVED_SEARCH_AUTOS_CATEGORY,
    city: filters.city.trim(),
    minPrice: parseIntOrNull(filters.priceMin),
    maxPrice: parseIntOrNull(filters.priceMax),
    filterPayload: payload as Record<string, unknown>,
  };
}

/** A saved search row -> the exact `AutosPublicFilterState` + query text shape
 * `applyAutosPublicFilters` expects. Used by the matcher and by "reactivate this saved search in
 * the results UI" — never a second reimplementation of what each field means. */
export function savedSearchToAutosFilterState(
  saved: SavedSearchNormalizedInput,
): { filters: AutosPublicFilterState; searchQ: string } {
  const p = (saved.filterPayload ?? {}) as AutosSavedSearchFilterPayload;
  const filters: AutosPublicFilterState = {
    city: saved.city ?? "",
    state: p.state ?? "",
    zip: p.zip ?? "",
    country: p.country ?? "",
    priceMin: saved.minPrice != null ? String(saved.minPrice) : "",
    priceMax: saved.maxPrice != null ? String(saved.maxPrice) : "",
    make: p.make ?? "",
    model: p.model ?? "",
    yearMin: p.yearMin != null ? String(p.yearMin) : "",
    yearMax: p.yearMax != null ? String(p.yearMax) : "",
    condition: p.condition ?? "",
    sellerType: p.sellerType ?? "",
    bodyStyle: p.bodyStyle ?? "",
    transmission: p.transmission ?? "",
    drivetrain: p.drivetrain ?? "",
    fuelType: p.fuelType ?? "",
    exteriorColor: p.exteriorColor ?? "",
    interiorColor: p.interiorColor ?? "",
    mileageMin: p.mileageMin != null ? String(p.mileageMin) : "",
    mileageMax: p.mileageMax != null ? String(p.mileageMax) : "",
    titleStatus: p.titleStatus ?? "",
    hasPhotos: p.hasPhotos ? "yes" : "",
    hasVideo: p.hasVideo ? "yes" : "",
    radiusMiles: "",
  };
  return { filters, searchQ: p.q ?? "" };
}

/**
 * Saved Search 03 — human-readable summary of the major matching facets for the owner
 * dashboard's list of saved searches. Never dumps raw `filter_payload` JSON; only surfaces the
 * fields a person would recognize from having set them (make/model/year/mileage/transmission/
 * drivetrain/bodyStyle/sellerType/condition), each already a plain display string.
 */
export function describeAutosSavedSearchFacets(saved: SavedSearchNormalizedInput, lang: "es" | "en"): string[] {
  const p = (saved.filterPayload ?? {}) as AutosSavedSearchFilterPayload;
  const parts: string[] = [];
  const vehicle = [p.make, p.model].filter(Boolean).join(" ");
  if (vehicle) parts.push(vehicle);
  if (p.yearMin != null || p.yearMax != null) {
    parts.push(p.yearMin != null && p.yearMax != null ? `${p.yearMin}–${p.yearMax}` : `${p.yearMin ?? p.yearMax}`);
  }
  if (p.sellerType) parts.push(p.sellerType === "dealer" ? (lang === "es" ? "Concesionario" : "Dealer") : lang === "es" ? "Particular" : "Private seller");
  if (p.condition) {
    const conditionLabel =
      p.condition === "new" ? (lang === "es" ? "Nuevo" : "New") : p.condition === "certified" ? (lang === "es" ? "Certificado" : "Certified") : lang === "es" ? "Usado" : "Used";
    parts.push(conditionLabel);
  }
  if (p.bodyStyle) parts.push(p.bodyStyle);
  if (p.transmission) parts.push(p.transmission);
  if (p.drivetrain) parts.push(p.drivetrain.toUpperCase());
  if (p.mileageMax != null) parts.push(lang === "es" ? `Máx. ${p.mileageMax.toLocaleString()} mi` : `Max ${p.mileageMax.toLocaleString()} mi`);
  if (p.q) parts.push(`"${p.q}"`);
  return parts;
}
