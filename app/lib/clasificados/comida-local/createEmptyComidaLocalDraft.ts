import type { ComidaLocalDraft } from "./comidaLocalTypes";

/** Safe empty draft — no fake URLs, cities, or contact data. */
export function createEmptyComidaLocalDraft(): ComidaLocalDraft {
  return {
    draftListingId: "",
    businessName: "",
    foodType: "",
    foodTypeCustom: "",
    cityCanonical: "",
    cityDisplay: "",
    zoneNote: "",
    primaryContactChoice: "",
    phone: "",
    whatsapp: "",
    queVendes: "",
    instagramUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
    locationNote: "",
    locationUrl: "",
    availabilityNote: "",
    serviceOptions: [],
    paymentMethods: [],
    paymentOtherNote: "",
    priceLevel: "",
    languages: [],
    mainPhoto: null,
    logoImage: null,
    galleryImages: [],
  };
}
