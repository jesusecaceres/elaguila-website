import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import type { RestauranteDaySchedule } from "./restauranteListingApplicationModel";

function closedDay(): RestauranteDaySchedule {
  return { closed: true };
}

/** Client-only id when crypto unavailable */
function newDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createEmptyRestauranteDraft(): RestauranteListingDraft {
  return {
    draftListingId: newDraftId(),
    businessName: "",
    businessType: "",
    businessTypeCustom: undefined,
    primaryCuisine: "",
    primaryCuisineCustom: undefined,
    secondaryCuisine: undefined,
    secondaryCuisineCustom: undefined,
    additionalCuisines: [],
    additionalCuisineOtherCustom: undefined,
    languageOtherCustom: undefined,
    serviceModeOtherCustom: undefined,
    shortSummary: "",
    longDescription: undefined,
    cityCanonical: "",
    neighborhood: undefined,
    zipCode: undefined,
    priceLevel: undefined,
    languagesSpoken: [],
    serviceModes: [],
    dineIn: false,
    takeout: false,
    delivery: false,
    reservationsAvailable: false,
    cateringAvailable: false,
    preorderRequired: false,
    pickupAvailable: false,
    homeBasedBusiness: false,
    movingVendor: false,
    foodTruck: false,
    popUp: false,
    personalChef: false,
    eventFoodService: false,
    monday: closedDay(),
    tuesday: closedDay(),
    wednesday: closedDay(),
    thursday: closedDay(),
    friday: closedDay(),
    saturday: closedDay(),
    sunday: closedDay(),
    specialHoursNote: undefined,
    temporaryHoursActive: false,
    temporaryHoursNote: undefined,
    websiteUrl: undefined,
    phoneNumber: undefined,
    email: undefined,
    whatsAppNumber: undefined,
    instagramUrl: undefined,
    facebookUrl: undefined,
    tiktokUrl: undefined,
    youtubeUrl: undefined,
    reservationUrl: undefined,
    orderUrl: undefined,
    menuUrl: undefined,
    menuFile: undefined,
    brochureFile: undefined,
    verUbicacionUrl: undefined,
    allowMessageCTA: false,
    addressLine1: undefined,
    addressLine2: undefined,
    state: "CA",
    showExactAddress: true,
    serviceAreaText: undefined,
    deliveryRadiusMiles: undefined,
    locationPrivacyMode: undefined,
    heroImage: "",
    galleryImages: [],
    galleryOrder: [],
    galleryMediaSequence: undefined,
    videoFile: undefined,
    videoUrl: undefined,
    foodImages: [],
    interiorImages: [],
    exteriorImages: [],
    featuredDishes: [],
    highlights: [],
    movingVendorStack: undefined,
    homeBasedStack: undefined,
    cateringEventsStack: undefined,
    googleReviewUrl: undefined,
    yelpReviewUrl: undefined,
    externalRatingValue: undefined,
    externalReviewCount: undefined,
    testimonialSnippet: undefined,
    aiSummaryEnabled: false,
  };
}

/** Merge loaded JSON with defaults so new fields never undefined-break the form */
export function mergeRestauranteDraft(loaded: unknown): RestauranteListingDraft {
  const base = createEmptyRestauranteDraft();
  if (!loaded || typeof loaded !== "object") return base;
  const o = loaded as Record<string, unknown>;
  const draft = o.draft && typeof o.draft === "object" ? (o.draft as Record<string, unknown>) : o;
  const merged = { ...base, ...draft } as RestauranteListingDraft;
  if (!merged.draftListingId) merged.draftListingId = base.draftListingId;
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
  for (const d of days) {
    const cur = merged[d];
    if (!cur || typeof cur !== "object") merged[d] = closedDay();
    else {
      const prev = cur as RestauranteDaySchedule;
      merged[d] = { ...prev, closed: Boolean(prev.closed) } as RestauranteDaySchedule;
    }
  }
  merged.serviceModes = Array.isArray(merged.serviceModes) ? merged.serviceModes : [];
  merged.additionalCuisines = Array.isArray(merged.additionalCuisines) ? merged.additionalCuisines : [];
  merged.languagesSpoken = Array.isArray(merged.languagesSpoken) ? merged.languagesSpoken : [];
  merged.highlights = Array.isArray(merged.highlights) ? merged.highlights : [];
  merged.galleryImages = Array.isArray(merged.galleryImages) ? merged.galleryImages : [];
  merged.galleryOrder = Array.isArray(merged.galleryOrder) ? merged.galleryOrder : [];
  merged.movingVendor = merged.movingVendor === true;
  merged.galleryMediaSequence = Array.isArray(merged.galleryMediaSequence)
    ? merged.galleryMediaSequence
        .map((x: unknown) => {
          if (x === "v" || x === "video") return "v" as const;
          const n = typeof x === "number" ? x : Number(x);
          if (Number.isFinite(n)) return n as number;
          return null;
        })
        .filter((x): x is number | "v" => x !== null)
    : undefined;
  merged.foodImages = Array.isArray(merged.foodImages) ? merged.foodImages : [];
  merged.interiorImages = Array.isArray(merged.interiorImages) ? merged.interiorImages : [];
  merged.exteriorImages = Array.isArray(merged.exteriorImages) ? merged.exteriorImages : [];
  merged.featuredDishes = Array.isArray(merged.featuredDishes) ? merged.featuredDishes : [];
  return merged;
}
