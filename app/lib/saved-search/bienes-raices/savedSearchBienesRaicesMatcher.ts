/**
 * Saved Search 06 — pure Bienes Raíces matcher.
 *
 * Answers exactly one question: "would this published, publicly-visible BR listing belong in the
 * results this saved search represents?" Reuses `filterBrListings` verbatim (the exact function
 * driving the live public BR results page —
 * `app/(site)/clasificados/bienes-raices/resultados/lib/brResultsFilters.ts`) so match semantics
 * can never drift from what a shopper actually sees running this search themselves. This file must
 * never grow its own parallel notion of what a BR filter means.
 *
 * `propiedadFilter` is always passed `null` here, mirroring the real live caller
 * (`BienesRaicesResultsClient.tsx` — confirmed always passes `null`, the `categoriaPropiedad` gate
 * is not currently wired to a real URL control, so this adapter doesn't need to represent it).
 *
 * Visibility is a TYPE-enforced precondition: this function only accepts
 * `BienesRaicesPublicEligibleListing`, a branded type only `certifyBienesRaicesPublicEligibleListing`
 * can produce.
 */
import { filterBrListings } from "@/app/clasificados/bienes-raices/resultados/lib/brResultsFilters";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";
import { savedSearchToBienesRaicesFilterState } from "./savedSearchBienesRaicesAdapter";
import type { BienesRaicesPublicEligibleListing } from "./bienesRaicesPublicEligibleListing";

export function matchesBienesRaicesSavedSearch(
  listing: BienesRaicesPublicEligibleListing,
  savedSearch: SavedSearchNormalizedInput,
): boolean {
  const state = savedSearchToBienesRaicesFilterState(savedSearch);
  return filterBrListings([listing], state, null).length > 0;
}
