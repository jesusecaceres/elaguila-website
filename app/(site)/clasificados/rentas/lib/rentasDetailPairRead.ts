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
  RENTAS_DP_CONTACT_SMS_DIGITS,
  RENTAS_DP_CONTACT_WHATSAPP_DIGITS,
  RENTAS_DP_LEASE_TERM,
  RENTAS_DP_LISTING_STATUS,
  RENTAS_DP_MAP_URL,
  RENTAS_DP_PETS_CODE,
  RENTAS_DP_REQUIREMENTS,
  RENTAS_DP_SERVICES_INCLUDED,
  RENTAS_DP_VIDEO_URL,
  RENTAS_DP_RENTAL_TYPE_CODE,
  RENTAS_DP_RENTAL_TYPE_CUSTOM,
  RENTAS_DP_LEASE_CONDITIONS,
  RENTAS_DP_ROOM_BATH_KIND,
  RENTAS_DP_ROOM_KITCHEN_KIND,
  RENTAS_DP_ROOM_MAX_OCC,
  RENTAS_DP_STORAGE_ACCESS_24H,
  RENTAS_DP_STORAGE_SECURITY,
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
  contactSmsDigits: string | null;
  contactWhatsappDigits: string | null;
  rentalTypeCode: string | null;
  rentalTypeCustom: string | null;
  leaseConditions: string | null;
  roomBathKind: string | null;
  roomKitchenKind: string | null;
  roomMaxOccupants: string | null;
  storageAccess24h: string | null;
  storageSecurity: string | null;
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
    contactSmsDigits: readLeonixDetailPairValue(detailPairs, RENTAS_DP_CONTACT_SMS_DIGITS),
    contactWhatsappDigits: readLeonixDetailPairValue(detailPairs, RENTAS_DP_CONTACT_WHATSAPP_DIGITS),
    rentalTypeCode: readLeonixDetailPairValue(detailPairs, RENTAS_DP_RENTAL_TYPE_CODE),
    rentalTypeCustom: readLeonixDetailPairValue(detailPairs, RENTAS_DP_RENTAL_TYPE_CUSTOM),
    leaseConditions: readLeonixDetailPairValue(detailPairs, RENTAS_DP_LEASE_CONDITIONS),
    roomBathKind: readLeonixDetailPairValue(detailPairs, RENTAS_DP_ROOM_BATH_KIND),
    roomKitchenKind: readLeonixDetailPairValue(detailPairs, RENTAS_DP_ROOM_KITCHEN_KIND),
    roomMaxOccupants: readLeonixDetailPairValue(detailPairs, RENTAS_DP_ROOM_MAX_OCC),
    storageAccess24h: readLeonixDetailPairValue(detailPairs, RENTAS_DP_STORAGE_ACCESS_24H),
    storageSecurity: readLeonixDetailPairValue(detailPairs, RENTAS_DP_STORAGE_SECURITY),
  };
}
