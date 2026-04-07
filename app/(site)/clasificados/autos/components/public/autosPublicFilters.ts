import type { AutosPublicListing } from "../../data/autosPublicSampleTypes";

export type AutosPublicFilterState = {
  city: string;
  zip: string;
  priceMin: string;
  priceMax: string;
  make: string;
  model: string;
  yearMin: string;
  yearMax: string;
  condition: "" | "new" | "used" | "certified";
  sellerType: "" | "dealer" | "private";
  bodyStyle: string;
  transmission: string;
  drivetrain: string;
  fuelType: string;
  mileageMax: string;
  titleStatus: string;
};

/** Optional URL seeds (`?bodyStyle=SUV&q=honda` …) for shareable blueprint links. */
export function seedFiltersFromSearchParams(sp: URLSearchParams): AutosPublicFilterState {
  const f = emptyAutosPublicFilters();
  f.city = sp.get("city") ?? "";
  f.zip = sp.get("zip") ?? "";
  f.priceMin = sp.get("priceMin") ?? "";
  f.priceMax = sp.get("priceMax") ?? "";
  f.make = sp.get("make") ?? "";
  f.model = sp.get("model") ?? "";
  f.yearMin = sp.get("yearMin") ?? "";
  f.yearMax = sp.get("yearMax") ?? "";
  const cond = sp.get("condition");
  if (cond === "new" || cond === "used" || cond === "certified") f.condition = cond;
  const seller = sp.get("seller");
  if (seller === "dealer" || seller === "private") f.sellerType = seller;
  f.bodyStyle = sp.get("bodyStyle") ?? "";
  f.transmission = sp.get("transmission") ?? "";
  f.drivetrain = sp.get("drivetrain") ?? "";
  f.fuelType = sp.get("fuelType") ?? "";
  f.mileageMax = sp.get("mileageMax") ?? "";
  f.titleStatus = sp.get("titleStatus") ?? "";
  return f;
}

export const emptyAutosPublicFilters = (): AutosPublicFilterState => ({
  city: "",
  zip: "",
  priceMin: "",
  priceMax: "",
  make: "",
  model: "",
  yearMin: "",
  yearMax: "",
  condition: "",
  sellerType: "",
  bodyStyle: "",
  transmission: "",
  drivetrain: "",
  fuelType: "",
  mileageMax: "",
  titleStatus: "",
});

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

export type AutosPublicSortKey = "newest" | "priceAsc" | "priceDesc" | "mileage";

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
