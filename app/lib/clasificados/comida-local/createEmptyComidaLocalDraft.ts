import type { BusinessWeeklyHours, ComidaLocalDraft } from "./comidaLocalTypes";

/**
 * Default open hours for a brand-new draft (contract shared item 41 — "open-first" default
 * workflow). Mirrors Servicios' default-open pattern (`defaultClasificadosServiciosState.ts`)
 * so a new seller only has to close/adjust the days that differ, instead of un-closing all 7.
 * This only seeds the empty-draft initializer; hydration of a stored draft always overrides
 * `weeklyHours` from persisted data (see `mergeComidaLocalDraftFromStorage`), so this never
 * affects an existing application.
 */
function defaultWeeklyHours(): BusinessWeeklyHours {
  return {
    monday: { closed: false, openTime: "09:00", closeTime: "18:00" },
    tuesday: { closed: false, openTime: "09:00", closeTime: "18:00" },
    wednesday: { closed: false, openTime: "09:00", closeTime: "18:00" },
    thursday: { closed: false, openTime: "09:00", closeTime: "18:00" },
    friday: { closed: false, openTime: "09:00", closeTime: "18:00" },
    saturday: { closed: false, openTime: "10:00", closeTime: "14:00" },
    sunday: { closed: true, openTime: "10:00", closeTime: "14:00" },
  };
}

/** Safe empty draft — no fake URLs, cities, or contact data. */
export function createEmptyComidaLocalDraft(): ComidaLocalDraft {
  return {
    draftListingId: "",
    businessName: "",
    foodType: "",
    foodTypeCustom: "",
    businessType: "",
    businessTypeCustom: "",
    businessTypeCustomValues: [],
    cityCanonical: "",
    cityDisplay: "",
    zoneNote: "",
    primaryContactChoice: "",
    phone: "",
    whatsapp: "",
    email: "",
    queVendes: "",
    instagramUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
    locationNote: "",
    locationUrl: "",
    mobileOrderLinkUrl: "",
    eventScheduleNote: "",
    cateringServiceRadiusNote: "",
    cateringEventInfoNote: "",
    mealPrepScheduleNote: "",
    mealPrepOrderUrl: "",
    availabilityNote: "",
    weeklyHours: defaultWeeklyHours(),
    serviceOptions: [],
    serviceOptionOtherCustom: "",
    serviceOptionOtherCustomValues: [],
    businessAddressLine: "",
    showAddressPublicly: false,
    paymentMethods: [],
    paymentOtherNote: "",
    priceLevel: "",
    languages: [],
    customLanguages: [],
    highlights: [],
    highlightsOtherCustom: "",
    highlightsOtherCustomValues: [],
    additionalWebsites: [],
    mainPhoto: null,
    logoImage: null,
    galleryImages: [],
  };
}
