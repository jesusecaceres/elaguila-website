/**
 * Reads Rentas-specific machine keys from `listings.detail_pairs` (see `rentasMachineDetailPairs.ts`).
 */

import { readLeonixDetailPairValue } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import {
  RENTAS_DP_AVAILABILITY,
  RENTAS_DP_BUSINESS_LICENSE,
  RENTAS_DP_BUSINESS_WEBSITE,
  RENTAS_DP_DEPOSIT_USD,
  RENTAS_DP_FURNISHED_CODE,
  RENTAS_DP_LEASE_TERM,
  RENTAS_DP_PETS_CODE,
  RENTAS_DP_REQUIREMENTS,
  RENTAS_DP_SERVICES_INCLUDED,
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
  };
}
