import type { AutosPublicListing } from "../../data/autosPublicSampleTypes";
import { parseAutosBrowseUrl } from "../../filters/autosBrowseFilterContract";
import type { AutosPublicFilterState, AutosPublicSortKey } from "../../filters/autosPublicFilterTypes";
import { listingMatchesAutosCityFilter, listingMatchesAutosZipFilter } from "../../filters/autosPublicLocationMatch";
import { compareAutosListingFairTieBreak } from "../../lib/autosPublicListingScore";

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
  return listings.filter((row) => {
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      const hay =
        `${row.make} ${row.model} ${row.year} ${row.trim ?? ""} ${row.vehicleTitle}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    const cityActive = Boolean(f.city.trim());
    const cityOk = listingMatchesAutosCityFilter(row.city, f.city);
    if (cityActive && !cityOk) return false;
    if (
      !listingMatchesAutosZipFilter(row.zip, f.zip, cityActive, cityOk)
    ) {
      return false;
    }
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
    if (f.mileageMin.trim()) {
      const n = Number(f.mileageMin);
      if (Number.isFinite(n) && row.mileage < n) return false;
    }
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
  const tie = (a: AutosPublicListing, b: AutosPublicListing) => compareAutosListingFairTieBreak(a, b);
  switch (sort) {
    case "priceAsc":
      return out.sort((a, b) => (a.price !== b.price ? a.price - b.price : tie(a, b)));
    case "priceDesc":
      return out.sort((a, b) => (a.price !== b.price ? b.price - a.price : tie(a, b)));
    case "mileage":
      return out.sort((a, b) => (a.mileage !== b.mileage ? a.mileage - b.mileage : tie(a, b)));
    case "newest":
    default:
      return out.sort((a, b) =>
        b.year !== a.year ? b.year - a.year : b.price !== a.price ? b.price - a.price : tie(a, b),
      );
  }
}
