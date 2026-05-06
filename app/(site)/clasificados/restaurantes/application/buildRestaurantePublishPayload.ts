import { hasAnyRestauranteAmenities, sanitizeRestauranteAmenities } from "@/app/clasificados/restaurantes/lib/restauranteAmenitiesCatalog";
import type { RestauranteListingDraft } from "./restauranteDraftTypes";

/**
 * Canonical publish body for `POST /api/clasificados/restaurantes/publish`.
 * Must be built from **`mergeRestauranteDraft(...)` / full application draft**, never from
 * `RestaurantDetailShellData` (results card / shell view model).
 *
 * Strips `data:` / `blob:` and caps string length; remote `http(s)` image refs up to 2048 chars
 * (aligned with API heavy-string guard).
 */
export function buildRestaurantePublishPayload(
  canonicalDraft: RestauranteListingDraft,
  ownerUserId?: string,
  plan?: string,
  lang = "es",
): Record<string, unknown> {
  const blockHeavyMedia = (value: unknown, path = ""): unknown => {
    if (value instanceof File || value instanceof Blob) {
      console.warn(`🚫 BLOCKED heavy media at ${path}: File/Blob object`);
      return undefined;
    }

    if (typeof value === "string") {
      if (value.startsWith("data:image/") || value.startsWith("data:video/") || value.startsWith("blob:")) {
        console.warn(`🚫 BLOCKED heavy media at ${path}: data/blob URL`);
        return undefined;
      }
      const isRemoteRef = /^https?:\/\//i.test(value.trim());
      const maxLen = isRemoteRef ? 2048 : 1024;
      if (value.length > maxLen) {
        console.warn(`🚫 BLOCKED oversized string at ${path}: ${value.length} chars`);
        return undefined;
      }
      return value;
    }

    if (Array.isArray(value)) {
      const filtered = value
        .map((item, index) => blockHeavyMedia(item, `${path}[${index}]`))
        .filter((item) => item !== undefined)
        .slice(0, 20);
      return filtered.length > 0 ? filtered : undefined;
    }

    if (typeof value === "object" && value !== null) {
      const cleaned: Record<string, unknown> = {};
      let hasValidFields = false;
      const safeMediaFields = [
        "path",
        "storagePath",
        "url",
        "publicUrl",
        "signedUrl",
        "muxUploadId",
        "muxAssetId",
        "playbackId",
        "thumbnailUrl",
        "filename",
        "mimeType",
        "size",
        "sortOrder",
        "category",
        "label",
        "alt",
      ];

      Object.keys(value).forEach((key) => {
        const fieldValue = (value as Record<string, unknown>)[key];
        if (safeMediaFields.includes(key)) {
          const blocked = blockHeavyMedia(fieldValue, `${path}.${key}`);
          if (blocked !== undefined) {
            cleaned[key] = blocked;
            hasValidFields = true;
          }
        } else {
          const blocked = blockHeavyMedia(fieldValue, `${path}.${key}`);
          if (blocked !== undefined) {
            cleaned[key] = blocked;
            hasValidFields = true;
          }
        }
      });

      return hasValidFields ? cleaned : undefined;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return value;
    }

    return undefined;
  };

  const draft = canonicalDraft;
  const amenitiesSanitized = sanitizeRestauranteAmenities(draft.restaurantAmenities);

  const payload: Record<string, unknown> = {
    draftListingId: blockHeavyMedia(draft.draftListingId, "draftListingId"),
    businessName: blockHeavyMedia(draft.businessName, "businessName"),
    shortSummary: blockHeavyMedia(draft.shortSummary, "shortSummary"),
    longDescription: blockHeavyMedia(draft.longDescription, "longDescription"),
    primaryCuisine: blockHeavyMedia(draft.primaryCuisine, "primaryCuisine"),
    primaryCuisineCustom: blockHeavyMedia(draft.primaryCuisineCustom, "primaryCuisineCustom"),
    secondaryCuisine: blockHeavyMedia(draft.secondaryCuisine, "secondaryCuisine"),
    secondaryCuisineCustom: blockHeavyMedia(draft.secondaryCuisineCustom, "secondaryCuisineCustom"),
    additionalCuisines: blockHeavyMedia((draft.additionalCuisines || []).slice(0, 10), "additionalCuisines"),
    additionalCuisineOtherCustom: blockHeavyMedia(draft.additionalCuisineOtherCustom, "additionalCuisineOtherCustom"),
    businessType: blockHeavyMedia(draft.businessType, "businessType"),
    businessTypeCustom: blockHeavyMedia(draft.businessTypeCustom, "businessTypeCustom"),
    addressLine1: blockHeavyMedia(draft.addressLine1, "addressLine1"),
    addressLine2: blockHeavyMedia(draft.addressLine2, "addressLine2"),
    cityCanonical: blockHeavyMedia(draft.cityCanonical, "cityCanonical"),
    state: blockHeavyMedia(draft.state, "state"),
    zipCode: blockHeavyMedia(draft.zipCode, "zipCode"),
    neighborhood: blockHeavyMedia(draft.neighborhood, "neighborhood"),
    phoneNumber: blockHeavyMedia(draft.phoneNumber, "phoneNumber"),
    email: blockHeavyMedia(draft.email, "email"),
    websiteUrl: blockHeavyMedia(draft.websiteUrl, "websiteUrl"),
    instagramUrl: blockHeavyMedia(draft.instagramUrl, "instagramUrl"),
    facebookUrl: blockHeavyMedia(draft.facebookUrl, "facebookUrl"),
    tiktokUrl: blockHeavyMedia(draft.tiktokUrl, "tiktokUrl"),
    youtubeUrl: blockHeavyMedia(draft.youtubeUrl, "youtubeUrl"),
    whatsAppNumber: blockHeavyMedia(draft.whatsAppNumber, "whatsAppNumber"),
    serviceModes: blockHeavyMedia((draft.serviceModes || []).slice(0, 10), "serviceModes"),
    serviceModeOtherCustom: blockHeavyMedia(draft.serviceModeOtherCustom, "serviceModeOtherCustom"),
    languagesSpoken: blockHeavyMedia((draft.languagesSpoken || []).slice(0, 10), "languagesSpoken"),
    languageOtherCustom: blockHeavyMedia(draft.languageOtherCustom, "languageOtherCustom"),
    highlights: blockHeavyMedia((draft.highlights || []).slice(0, 20), "highlights"),
    priceLevel: blockHeavyMedia(draft.priceLevel, "priceLevel"),
    movingVendor: blockHeavyMedia(draft.movingVendor, "movingVendor"),
    homeBasedBusiness: blockHeavyMedia(draft.homeBasedBusiness, "homeBasedBusiness"),
    foodTruck: blockHeavyMedia(draft.foodTruck, "foodTruck"),
    popUp: blockHeavyMedia(draft.popUp, "popUp"),
    monday: blockHeavyMedia(draft.monday, "monday"),
    tuesday: blockHeavyMedia(draft.tuesday, "tuesday"),
    wednesday: blockHeavyMedia(draft.wednesday, "wednesday"),
    thursday: blockHeavyMedia(draft.thursday, "thursday"),
    friday: blockHeavyMedia(draft.friday, "friday"),
    saturday: blockHeavyMedia(draft.saturday, "saturday"),
    sunday: blockHeavyMedia(draft.sunday, "sunday"),
    specialHoursNote: blockHeavyMedia(draft.specialHoursNote, "specialHoursNote"),
    heroImage: blockHeavyMedia(draft.heroImage, "heroImage"),
    businessLogo: blockHeavyMedia(draft.businessLogo, "businessLogo"),
    menuFile: blockHeavyMedia(draft.menuFile, "menuFile"),
    menuUrl: blockHeavyMedia(draft.menuUrl, "menuUrl"),
    orderUrl: blockHeavyMedia(draft.orderUrl, "orderUrl"),
    reservationUrl: blockHeavyMedia(draft.reservationUrl, "reservationUrl"),
    galleryImages: blockHeavyMedia(draft.galleryImages, "galleryImages"),
    interiorImages: blockHeavyMedia(draft.interiorImages, "interiorImages"),
    foodImages: blockHeavyMedia(draft.foodImages, "foodImages"),
    exteriorImages: blockHeavyMedia(draft.exteriorImages, "exteriorImages"),
    videoFile: blockHeavyMedia(draft.videoFile, "videoFile"),
    videoUrl: blockHeavyMedia(draft.videoUrl, "videoUrl"),
    featuredDishes: blockHeavyMedia((draft.featuredDishes || []).slice(0, 10), "featuredDishes"),
    cateringAvailable: blockHeavyMedia(draft.cateringAvailable, "cateringAvailable"),
    eventFoodService: blockHeavyMedia(draft.eventFoodService, "eventFoodService"),
    movingVendorStack: blockHeavyMedia(draft.movingVendorStack, "movingVendorStack"),
    homeBasedStack: blockHeavyMedia(draft.homeBasedStack, "homeBasedStack"),
    cateringEventsStack: blockHeavyMedia(draft.cateringEventsStack, "cateringEventsStack"),
    externalRatingValue: blockHeavyMedia(draft.externalRatingValue, "externalRatingValue"),
    externalReviewCount: blockHeavyMedia(draft.externalReviewCount, "externalReviewCount"),
    googleReviewUrl: blockHeavyMedia(draft.googleReviewUrl, "googleReviewUrl"),
    yelpReviewUrl: blockHeavyMedia(draft.yelpReviewUrl, "yelpReviewUrl"),
    testimonialSnippet: blockHeavyMedia(draft.testimonialSnippet, "testimonialSnippet"),
    aiSummaryEnabled: blockHeavyMedia(draft.aiSummaryEnabled, "aiSummaryEnabled"),
    restaurantAmenities: blockHeavyMedia(
      hasAnyRestauranteAmenities(amenitiesSanitized) ? amenitiesSanitized : undefined,
      "restaurantAmenities",
    ),
    reservationsAvailable: blockHeavyMedia(draft.reservationsAvailable, "reservationsAvailable"),
    preorderRequired: blockHeavyMedia(draft.preorderRequired, "preorderRequired"),
    pickupAvailable: blockHeavyMedia(draft.pickupAvailable, "pickupAvailable"),
    deliveryRadiusMiles: blockHeavyMedia(draft.deliveryRadiusMiles, "deliveryRadiusMiles"),
    serviceAreaText: blockHeavyMedia(draft.serviceAreaText, "serviceAreaText"),
    lang,
    plan,
    ...(ownerUserId ? { owner_user_id: ownerUserId } : {}),
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === null) {
      delete payload[key];
    }
  });

  return payload;
}
