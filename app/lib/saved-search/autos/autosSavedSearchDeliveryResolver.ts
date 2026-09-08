/**
 * Saved Search 06 — Autos category resolver for the shared delivery engine
 * (`app/lib/saved-search/delivery/savedSearchEmailDelivery.ts`). Extracted from the inline Autos
 * logic Saved Search 05 originally wrote directly into the delivery engine, so BR/Rentas resolvers
 * can sit alongside it without cloning the engine itself (Gate 14). Behavior unchanged — reuses
 * the exact same eligibility gate, parent-lookup helper, and canonical URL contract as before.
 */
import "server-only";
import { getAutosClassifiedsListingById } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { certifyAutosPublicEligibleListing } from "./autosPublicEligibleListing";
import { loadParentsById } from "./autosSavedSearchEligibilitySupport";
import { getAutosSiteOrigin } from "@/app/lib/clasificados/autos/autosSiteOrigin";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import type { SavedSearchDeliveryCategoryResolver } from "../delivery/savedSearchDeliveryCategoryResolver";

export const autosSavedSearchDeliveryResolver: SavedSearchDeliveryCategoryResolver = {
  async revalidateListingStillEligible(listingId: string): Promise<boolean> {
    const row = await getAutosClassifiedsListingById(listingId);
    if (!row) return false;
    const parentsById = await loadParentsById(row);
    return certifyAutosPublicEligibleListing(row, parentsById) !== null;
  },
  buildDetailUrl(listingId: string): string {
    return `${getAutosSiteOrigin()}${autosLiveVehiclePath(listingId)}?lang=es`;
  },
};
