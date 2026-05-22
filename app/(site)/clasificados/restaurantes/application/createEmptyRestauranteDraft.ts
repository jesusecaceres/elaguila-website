import { sanitizeRestauranteAmenities, hasAnyRestauranteAmenities } from "@/app/clasificados/restaurantes/lib/restauranteAmenitiesCatalog";
import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import type { RestauranteDaySchedule } from "./restauranteListingApplicationModel";

/**
 * Browser/API may send `{ url }` / `{ src }` shapes; canonical draft + validators use flat strings.
 */
export function coerceRestauranteImageRefToString(x: unknown): string | undefined {
  if (typeof x === "string") {
    const t = x.trim();
    return t || undefined;
  }
  if (x && typeof x === "object") {
    const o = x as Record<string, unknown>;
    for (const k of ["url", "src", "image", "publicUrl", "signedUrl"]) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return undefined;
}

function coerceImageUrlList(a: unknown): string[] {
  if (!Array.isArray(a)) return [];
  const out: string[] = [];
  for (const x of a) {
    const s = coerceRestauranteImageRefToString(x);
    if (s) out.push(s);
  }
  return out;
}

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
    restaurantAmenities: undefined,
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
  merged.heroImage = coerceRestauranteImageRefToString(merged.heroImage) ?? "";
  merged.businessLogo = coerceRestauranteImageRefToString(merged.businessLogo);
  merged.galleryImages = coerceImageUrlList(merged.galleryImages);
  merged.interiorImages = coerceImageUrlList(merged.interiorImages);
  merged.foodImages = coerceImageUrlList(merged.foodImages);
  merged.exteriorImages = coerceImageUrlList(merged.exteriorImages);
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
  if (
    Array.isArray(merged.galleryMediaSequence) &&
    merged.galleryMediaSequence.length === 0 &&
    merged.galleryImages.some((x) => typeof x === "string" && x.trim().length > 0)
  ) {
    merged.galleryMediaSequence = undefined;
  }
  merged.featuredDishes = Array.isArray(merged.featuredDishes)
    ? merged.featuredDishes.map((row) => {
        if (!row || typeof row !== "object") return { title: "", image: "", shortNote: "" };
        const r = row as { title?: unknown; image?: unknown; shortNote?: unknown; menuLink?: unknown; priceLabel?: unknown };
        const img = coerceRestauranteImageRefToString(r.image) ?? "";
        return {
          title: typeof r.title === "string" ? r.title : "",
          image: img,
          shortNote: typeof r.shortNote === "string" ? r.shortNote : "",
          menuLink: typeof r.menuLink === "string" ? r.menuLink : undefined,
          priceLabel: typeof r.priceLabel === "string" ? r.priceLabel : undefined,
        };
      })
    : [];
  const rawAmenities = (draft as Record<string, unknown>).restaurantAmenities;
  merged.restaurantAmenities = sanitizeRestauranteAmenities(rawAmenities);
  if (!hasAnyRestauranteAmenities(merged.restaurantAmenities)) merged.restaurantAmenities = undefined;

  if (draft.movingVendorStack && typeof draft.movingVendorStack === "object") {
    merged.movingVendorStack = { ...(base.movingVendorStack ?? {}), ...(draft.movingVendorStack as object) };
  }
  if (draft.homeBasedStack && typeof draft.homeBasedStack === "object") {
    merged.homeBasedStack = { ...(base.homeBasedStack ?? {}), ...(draft.homeBasedStack as object) };
  }
  if (draft.cateringEventsStack && typeof draft.cateringEventsStack === "object") {
    merged.cateringEventsStack = { ...(base.cateringEventsStack ?? {}), ...(draft.cateringEventsStack as object) };
  }

  return merged;
}
