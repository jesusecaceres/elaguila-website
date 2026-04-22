import "server-only";

import type { ClasificadosServiciosApplicationState } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import type { ServiciosBusinessProfile, ServiciosDiscoveryFacet } from "@/app/servicios/types/serviciosBusinessProfile";

/**
 * Machine-readable discovery facet persisted on `profile_json.opsMeta.discovery` at publish time.
 * Used for results filters and ranking; never rendered on the public profile shell.
 */
export function buildServiciosDiscoveryFacet(
  state: ClasificadosServiciosApplicationState,
  wire: ServiciosBusinessProfile,
): ServiciosDiscoveryFacet {
  const area = state.serviceAreaNotes.trim();
  const tokens = area.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  return {
    languageChipIds: [...state.languageIds],
    hasPhysicalAddress: [state.physicalStreet, state.physicalAddressCity, state.physicalPostalCode].some((s) => s.trim().length > 0),
    hasServiceAreaMultiLine: tokens.length > 1 || area.includes("\n"),
    hasPromoHeadline: Boolean(wire.promo?.headline?.trim()),
    listerAttestationsComplete:
      state.confirmListingAccurate === true &&
      state.confirmPhotosRepresentBusiness === true &&
      state.confirmCommunityRules === true,
  };
}
