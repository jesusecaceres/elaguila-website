/**
 * Saved Search 06 — Bienes Raíces category resolver for the shared delivery engine (Gate 14).
 * Reuses the exact same eligibility gate, parent-lookup helper, and canonical URL contract as the
 * BR match orchestrator — no parallel eligibility/URL logic.
 */
import "server-only";
import { getBienesRaicesListingById, loadBienesRaicesParentsById } from "./bienesRaicesSavedSearchEligibilitySupport";
import { certifyBienesRaicesPublicEligibleListing } from "./bienesRaicesPublicEligibleListing";
import { getBrSiteOrigin } from "@/app/lib/clasificados/bienes-raices/stripeBrConfig";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import type { SavedSearchDeliveryCategoryResolver } from "../delivery/savedSearchDeliveryCategoryResolver";

export const bienesRaicesSavedSearchDeliveryResolver: SavedSearchDeliveryCategoryResolver = {
  async revalidateListingStillEligible(listingId: string): Promise<boolean> {
    const row = await getBienesRaicesListingById(listingId);
    if (!row) return false;
    const parentsById = await loadBienesRaicesParentsById(row);
    return certifyBienesRaicesPublicEligibleListing(row, parentsById) !== null;
  },
  buildDetailUrl(listingId: string): string {
    return `${getBrSiteOrigin()}${leonixLiveAnuncioPath(listingId)}?lang=es`;
  },
};
