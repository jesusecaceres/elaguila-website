import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { mockAutoDealerListing } from "@/app/clasificados/autos/negocios/mock/mockAutoDealerListing";
import { AUTOS_LISTING_ANALYTICS_DRAFT_DEMO } from "@/app/clasificados/autos/shared/types/autosListingAnalytics";

/** Demo payload for `?demo=1` — private seller, no dealer stack or related inventory. */
export const mockAutosPrivadoListing: AutoDealerListing = {
  ...mockAutoDealerListing,
  autosLane: "privado",
  badges: [],
  listingAnalytics: AUTOS_LISTING_ANALYTICS_DRAFT_DEMO,
  dealerName: "Alex Martínez",
  dealerPhoneOffice: "(408) 555-0142",
  dealerWhatsapp: "+1 408 555 0199",
  dealerEmail: "alex.martinez@example.com",
  dealerLogo: undefined,
  dealerPhoneMobile: undefined,
  dealerBookingUrl: undefined,
  dealerAddress: undefined,
  dealerHours: undefined,
  dealerWebsite: undefined,
  dealerSocials: undefined,
  relatedDealerListings: undefined,
  stockNumber: undefined,
  monthlyEstimate: undefined,
};
