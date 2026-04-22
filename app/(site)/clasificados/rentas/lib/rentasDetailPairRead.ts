/**
 * Reads Rentas-specific machine keys from `listings.detail_pairs` (see `rentasMachineDetailPairs.ts`).
 */

import { readLeonixDetailPairValue } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import {
  RENTAS_DP_AVAILABILITY,
  RENTAS_DP_BUSINESS_LICENSE,
  RENTAS_DP_BUSINESS_SOCIAL,
  RENTAS_DP_BUSINESS_WEBSITE,
  RENTAS_DP_DEPOSIT_USD,
  RENTAS_DP_FURNISHED_CODE,
  RENTAS_DP_HALF_BATHS_COUNT,
  RENTAS_DP_LEASE_TERM,
  RENTAS_DP_LISTING_STATUS,
  RENTAS_DP_MAP_URL,
  RENTAS_DP_PETS_CODE,
  RENTAS_DP_REQUIREMENTS,
  RENTAS_DP_SERVICES_INCLUDED,
  RENTAS_DP_VIDEO_URL,
} from "@/app/clasificados/rentas/lib/rentasMachineDetailPairs";

export type RentasDetailMachineRead = {
  depositUsdDigits: string | null;
  leaseTermCode: string | null;
  availabilityNote: string | null;
  servicesIncluded: string | null;
  requirements: string | null;
  furnishedCode: string | null;
  petsCode: string | null;
  businessLicense: string | null;
  businessWebsite: string | null;
  businessSocial: string | null;
  /** `disponible` | `pendiente` | `bajo_contrato` | `rentado` */
  listingStatus: string | null;
  mapUrl: string | null;
  videoUrl: string | null;
  halfBathsDigits: string | null;
};

export function parseRentasDetailMachineRead(detailPairs: unknown): RentasDetailMachineRead {
  return {
    depositUsdDigits: readLeonixDetailPairValue(detailPairs, RENTAS_DP_DEPOSIT_USD),
    leaseTermCode: readLeonixDetailPairValue(detailPairs, RENTAS_DP_LEASE_TERM),
    availabilityNote: readLeonixDetailPairValue(detailPairs, RENTAS_DP_AVAILABILITY),
    servicesIncluded: readLeonixDetailPairValue(detailPairs, RENTAS_DP_SERVICES_INCLUDED),
    requirements: readLeonixDetailPairValue(detailPairs, RENTAS_DP_REQUIREMENTS),
    furnishedCode: readLeonixDetailPairValue(detailPairs, RENTAS_DP_FURNISHED_CODE),
    petsCode: readLeonixDetailPairValue(detailPairs, RENTAS_DP_PETS_CODE),
    businessLicense: readLeonixDetailPairValue(detailPairs, RENTAS_DP_BUSINESS_LICENSE),
    businessWebsite: readLeonixDetailPairValue(detailPairs, RENTAS_DP_BUSINESS_WEBSITE),
    businessSocial: readLeonixDetailPairValue(detailPairs, RENTAS_DP_BUSINESS_SOCIAL),
    listingStatus: readLeonixDetailPairValue(detailPairs, RENTAS_DP_LISTING_STATUS),
    mapUrl: readLeonixDetailPairValue(detailPairs, RENTAS_DP_MAP_URL),
    videoUrl: readLeonixDetailPairValue(detailPairs, RENTAS_DP_VIDEO_URL),
    halfBathsDigits: readLeonixDetailPairValue(detailPairs, RENTAS_DP_HALF_BATHS_COUNT),
  };
}
