import type { AutosPublicListing } from "../../data/autosPublicSampleTypes";
import { parseAutosBrowseUrl } from "../../filters/autosBrowseFilterContract";
import type { AutosPublicFilterState, AutosPublicSortKey } from "../../filters/autosPublicFilterTypes";
import { listingMatchesAutosCityFilter, listingMatchesAutosCountryFilter, listingMatchesAutosStateFilter, listingMatchesAutosZipFilter } from "../../filters/autosPublicLocationMatch";
import { compareNewestAutosPublic } from "@/app/lib/clasificados/autos/autosPublicRanking";
import { autosKeywordMatcher } from "@/app/lib/clasificados/discovery/adapters/autosDiscoveryAdapter";
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
  // WAVE 4 — bilingual keyword (body style / condition / seller / fuel / transmission concepts + the previous
  // literal haystack as fallback), compiled once per call. Language-neutral; makes / models stay literal.
  const keywordMatches = searchQ.trim() ? autosKeywordMatcher(searchQ) : null;
  return listings.filter((row) => {
    if (keywordMatches && !keywordMatches(row)) return false;
    const cityActive = Boolean(f.city.trim());
    const cityOk = listingMatchesAutosCityFilter(row.city, f.city);
    if (cityActive && !cityOk) return false;
    if (!listingMatchesAutosStateFilter(row.state, f.state)) return false;
    if (!listingMatchesAutosCountryFilter(row.country, f.country)) return false;
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
    if (f.make.trim() && row.make.trim().toLowerCase() !== f.make.trim().toLowerCase()) return false;
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
    if (f.exteriorColor && row.exteriorColor !== f.exteriorColor) return false;
    if (f.interiorColor && row.interiorColor !== f.interiorColor) return false;
    if (f.mileageMin.trim()) {
      const n = Number(f.mileageMin);
      if (Number.isFinite(n) && row.mileage < n) return false;
    }
    if (f.mileageMax.trim()) {
      const n = Number(f.mileageMax);
      if (Number.isFinite(n) && row.mileage > n) return false;
    }
    if (f.titleStatus.trim() && row.titleStatus !== f.titleStatus) return false;
    if (f.hasPhotos === "yes" && !(row.hasPhotos ?? row.primaryImageUrl)) return false;
    if (f.hasVideo === "yes" && !row.hasVideo) return false;
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
    case "yearDesc":
      return out.sort((a, b) => (a.year !== b.year ? b.year - a.year : tie(a, b)));
    case "yearAsc":
      return out.sort((a, b) => (a.year !== b.year ? a.year - b.year : tie(a, b)));
    case "newest":
    default:
      return out.sort(compareNewestAutosPublic);
  }
}
