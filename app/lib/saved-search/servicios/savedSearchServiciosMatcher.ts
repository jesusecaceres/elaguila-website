/**
 * Gate SERVICIOS-2 — pure Servicios matcher.
 *
 * Reuses the exact three functions the live public results page runs, in the same order
 * (`app/(site)/clasificados/servicios/resultados/page.tsx`):
 *   filterServiciosPublicListingRows -> filterServiciosRowsByKeyword -> filterServiciosRowsBySeller
 * so match semantics can never drift from what a shopper actually sees running this search
 * themselves. No filter logic is reimplemented here.
 *
 * The entitlement overlay and visibility ranking the results page applies AFTER these three are
 * deliberately not run: they affect ordering and paid presentation, never inclusion.
 *
 * Visibility is a TYPE-enforced precondition: this function only accepts
 * `ServiciosPublicEligibleListing`, a branded type only `certifyServiciosPublicEligibleListing`
 * can produce.
 */
import {
  filterServiciosPublicListingRows,
  filterServiciosRowsByKeyword,
  filterServiciosRowsBySeller,
  type ServiciosResultsFilterOptions,
} from "@/app/(site)/clasificados/servicios/lib/serviciosResultsFilter";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";
import { savedSearchToServiciosFilterQuery } from "./savedSearchServiciosAdapter";
import type { ServiciosPublicEligibleListing } from "./serviciosPublicEligibleListing";

export function matchesServiciosSavedSearch(
  listing: ServiciosPublicEligibleListing,
  savedSearch: SavedSearchNormalizedInput,
  lang: ServiciosLang = "es",
  /** The same read-time truth the results page passes (e.g. the current `coupons_offers` capability). */
  options: ServiciosResultsFilterOptions = {},
): boolean {
  const query = savedSearchToServiciosFilterQuery(savedSearch);
  let rows = filterServiciosPublicListingRows([listing], lang, query, options);
  rows = filterServiciosRowsByKeyword(rows, lang, query.q);
  rows = filterServiciosRowsBySeller(rows, lang, query.seller);
  return rows.length > 0;
}
