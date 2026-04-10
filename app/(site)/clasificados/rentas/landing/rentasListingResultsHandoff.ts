import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import type { RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { rentasListingPublicPath } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

/** Public listing detail shell (sample data); preserves `lang` when provided. */
export function rentasListingResultsHandoff(listing: RentasPublicListing, lang?: RentasLandingLang): string {
  const path = rentasListingPublicPath(listing.id);
  return lang ? withRentasLandingLang(path, lang) : path;
}
