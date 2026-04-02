import type { AutoDealerListing, DealerHoursEntry } from "../types/autoDealerListing";
import { deriveHeroImageUrls, migrateHeroImagesToMediaImages } from "./autoDealerHeroImages";

/** Optional starting point for the hours editor (form button). */
export const WEEKDAY_HOURS_TEMPLATE: DealerHoursEntry[] = [
  { day: "Lunes", open: "09:00", close: "18:00", closed: false },
  { day: "Martes", open: "09:00", close: "18:00", closed: false },
  { day: "Miércoles", open: "09:00", close: "18:00", closed: false },
  { day: "Jueves", open: "09:00", close: "18:00", closed: false },
  { day: "Viernes", open: "09:00", close: "18:00", closed: false },
  { day: "Sábado", open: "10:00", close: "16:00", closed: false },
  { day: "Domingo", open: "", close: "", closed: true },
];

export function createEmptyListing(): AutoDealerListing {
  return {
    vehicleTitle: undefined,
    year: undefined,
    make: undefined,
    model: undefined,
    trim: undefined,
    condition: undefined,
    price: undefined,
    monthlyEstimate: undefined,
    mileage: undefined,
    city: undefined,
    state: undefined,
    vin: undefined,
    stockNumber: undefined,
    exteriorColor: undefined,
    exteriorColorCustom: undefined,
    interiorColor: undefined,
    interiorColorCustom: undefined,
    bodyStyle: undefined,
    bodyStyleCustom: undefined,
    drivetrain: undefined,
    drivetrainCustom: undefined,
    transmission: undefined,
    transmissionCustom: undefined,
    engine: undefined,
    fuelType: undefined,
    fuelTypeCustom: undefined,
    mpgCity: undefined,
    mpgHighway: undefined,
    doors: undefined,
    seats: undefined,
    titleStatus: undefined,
    titleStatusCustom: undefined,
    badges: [],
    features: [],
    description: undefined,
    mediaImages: [],
    heroImages: [],
    videoSourceType: null,
    videoUrl: undefined,
    videoFileDataUrl: undefined,
    videoFileName: undefined,
    videoUploadStatus: null,
    muxAssetId: undefined,
    muxPlaybackId: undefined,
    dealerName: undefined,
    dealerLogo: undefined,
    dealerPhone: undefined,
    dealerAddress: undefined,
    dealerHours: [],
    dealerWebsite: undefined,
    dealerSocials: {},
    dealerRating: undefined,
    dealerReviewCount: undefined,
    relatedDealerListings: [],
  };
}

function migrateLegacyVideo(raw: Partial<AutoDealerListing>): Partial<AutoDealerListing> {
  if (raw.videoSourceType === "url" || raw.videoSourceType === "file") return {};
  const v = raw.videoUrl?.trim();
  if (!v) return {};
  if (v.startsWith("data:")) {
    return {
      videoSourceType: "file",
      videoFileDataUrl: v,
      videoUrl: undefined,
      videoUploadStatus: "local_preview",
    };
  }
  return {
    videoSourceType: "url",
    videoUrl: v,
    videoUploadStatus: "local_preview",
  };
}

export function normalizeLoadedListing(raw: Partial<AutoDealerListing> | undefined): AutoDealerListing {
  const base = createEmptyListing();
  if (!raw) {
    return { ...base, heroImages: deriveHeroImageUrls(base) };
  }

  const legacyVideo = migrateLegacyVideo(raw);

  let mediaImages = Array.isArray(raw.mediaImages) ? raw.mediaImages : base.mediaImages;
  const legacyHero = Array.isArray(raw.heroImages) ? raw.heroImages : [];
  if ((!mediaImages || mediaImages.length === 0) && legacyHero.length > 0) {
    mediaImages = migrateHeroImagesToMediaImages(legacyHero);
  }

  const merged: AutoDealerListing = {
    ...base,
    ...raw,
    ...legacyVideo,
    badges: Array.isArray(raw.badges) ? raw.badges : base.badges,
    features: Array.isArray(raw.features) ? raw.features : base.features,
    mediaImages: mediaImages ?? [],
    dealerHours: Array.isArray(raw.dealerHours) ? raw.dealerHours : base.dealerHours,
    dealerSocials: raw.dealerSocials && typeof raw.dealerSocials === "object" ? raw.dealerSocials : base.dealerSocials,
    relatedDealerListings: Array.isArray(raw.relatedDealerListings) ? raw.relatedDealerListings : base.relatedDealerListings,
  };

  merged.heroImages = deriveHeroImageUrls(merged);
  return merged;
}
