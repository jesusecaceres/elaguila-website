import { BR_NEGOCIO_Q_PROPIEDAD } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type { RentasResultsDemoListing } from "@/app/clasificados/rentas/results/rentasResultsDemoData";
import { buildRentasResultsUrl } from "@/app/clasificados/rentas/shared/utils/rentasResultsRoutes";

/** Hand off to the results grid with enough context to surface this row in demo data (no live detail route in Phase 1). */
export function rentasListingResultsHandoff(listing: RentasResultsDemoListing): string {
  return buildRentasResultsUrl({
    q: listing.title,
    branch: listing.branch,
    [BR_NEGOCIO_Q_PROPIEDAD]: listing.categoriaPropiedad,
  });
}
