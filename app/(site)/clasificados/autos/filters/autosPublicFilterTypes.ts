/**
 * Shared filter + sort types for Autos public browse (landing, results, URL contract).
 * Field names align with Negocios/Privado listing payloads.
 */

export type AutosPublicSortKey = "newest" | "priceAsc" | "priceDesc" | "mileage";

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
  /** Scaffold: reserved for radius filter (see `autosBrowseFilterContract`). */
  radiusMiles: string;
};

export function emptyAutosPublicFilters(): AutosPublicFilterState {
  return {
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
    radiusMiles: "",
  };
}
