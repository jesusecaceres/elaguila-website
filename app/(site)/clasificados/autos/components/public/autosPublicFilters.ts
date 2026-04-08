import type { AutosPublicListing } from "../../data/autosPublicSampleTypes";
import { parseAutosBrowseUrl } from "../../filters/autosBrowseFilterContract";
import type { AutosPublicFilterState, AutosPublicSortKey } from "../../filters/autosPublicFilterTypes";

export type { AutosPublicFilterState, AutosPublicSortKey } from "../../filters/autosPublicFilterTypes";
export { emptyAutosPublicFilters } from "../../filters/autosPublicFilterTypes";

/** @deprecated Prefer `parseAutosBrowseUrl` when you need q/sort/page/lang too. */
export function seedFiltersFromSearchParams(sp: URLSearchParams): AutosPublicFilterState {
  return parseAutosBrowseUrl(sp).filters;
}

/**
 * Filter listings using the same fields as Negocios/Privado applications.
 * Note: `radiusMiles` is reserved in the URL contract but not applied here until geo is wired.
 */
export function applyAutosPublicFilters(
  listings: AutosPublicListing[],
  f: AutosPublicFilterState,
  searchQ = "",
): AutosPublicListing[] {
  const zipNorm = f.zip.replace(/\D/g, "").slice(0, 5);
  return listings.filter((row) => {
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      const hay = `${row.make} ${row.model} ${row.year} ${row.vehicleTitle}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.city.trim() && !row.city.toLowerCase().includes(f.city.trim().toLowerCase())) return false;
    if (zipNorm.length === 5 && row.zip !== zipNorm) return false;
    if (f.priceMin.trim()) {
      const n = Number(f.priceMin);
      if (Number.isFinite(n) && row.price < n) return false;
    }
    if (f.priceMax.trim()) {
      const n = Number(f.priceMax);
      if (Number.isFinite(n) && row.price > n) return false;
    }
    if (f.make && row.make !== f.make) return false;
    if (f.model.trim() && !row.model.toLowerCase().includes(f.model.trim().toLowerCase())) return false;
    if (f.yearMin.trim()) {
      const n = Number(f.yearMin);
      if (Number.isFinite(n) && row.year < n) return false;
    }
    if (f.yearMax.trim()) {
      const n = Number(f.yearMax);
      if (Number.isFinite(n) && row.year > n) return false;
    }
    if (f.condition && row.condition !== f.condition) return false;
    if (f.sellerType && row.sellerType !== f.sellerType) return false;
    if (f.bodyStyle && row.bodyStyle !== f.bodyStyle) return false;
    if (f.transmission && row.transmission !== f.transmission) return false;
    if (f.drivetrain && row.drivetrain !== f.drivetrain) return false;
    if (f.fuelType && row.fuelType !== f.fuelType) return false;
    if (f.mileageMax.trim()) {
      const n = Number(f.mileageMax);
      if (Number.isFinite(n) && row.mileage > n) return false;
    }
    if (f.titleStatus.trim() && row.titleStatus !== f.titleStatus) return false;
    return true;
  });
}

export function sortAutosPublicListings(listings: AutosPublicListing[], sort: AutosPublicSortKey): AutosPublicListing[] {
  const out = [...listings];
  switch (sort) {
    case "priceAsc":
      return out.sort((a, b) => a.price - b.price);
    case "priceDesc":
      return out.sort((a, b) => b.price - a.price);
    case "mileage":
      return out.sort((a, b) => a.mileage - b.mileage);
    case "newest":
    default:
      return out.sort((a, b) => b.year - a.year || b.price - a.price);
  }
}
