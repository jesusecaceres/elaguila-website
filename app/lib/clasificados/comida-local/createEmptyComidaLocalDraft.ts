import type { BusinessWeeklyHours, ComidaLocalDraft } from "./comidaLocalTypes";

/**
 * Default hours for a brand-new draft: every day present as a real, editable row (`closed:
 * false`) but with no time entered yet. Comida Local sellers include food trucks, pop-ups,
 * event/market vendors, and other mobile/irregular schedules — the form explicitly tells owners
 * they may leave this section blank if their schedule varies too much to state, so a fresh draft
 * must not put words (or hours) in their mouth with a fabricated Mon–Sat 9–6 schedule.
 * `buildHoursLines`/`isOpenNow` (mapComidaLocalDraftToPreviewVm.ts) already treat a day with no
 * openTime/closeTime as having nothing to report — an untouched new listing therefore renders no
 * hours lines and no fabricated "Open now"/"Closed now" badge, until the owner actually enters a
 * real schedule. This only seeds the empty-draft initializer; hydration of a stored draft always
 * overrides `weeklyHours` from persisted data (see `mergeComidaLocalDraftFromStorage`), so this
 * never touches an existing application's saved hours.
 */
function defaultWeeklyHours(): BusinessWeeklyHours {
  const unset = { closed: false, openTime: "", closeTime: "" };
  return {
    monday: { ...unset },
    tuesday: { ...unset },
    wednesday: { ...unset },
    thursday: { ...unset },
    friday: { ...unset },
    saturday: { ...unset },
    sunday: { ...unset },
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
    googleReviewsUrl: "",
    yelpReviewsUrl: "",
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
