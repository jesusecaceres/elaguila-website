import type { AutoDealerListing, DealerHoursEntry } from "../types/autoDealerListing";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { deriveHeroImageUrls, migrateHeroImagesToMediaImages, normalizeMediaImagesOrder } from "./autoDealerHeroImages";
import { applyAutosVehicleMediaDraftFields } from "@/app/lib/clasificados/autos/autosVehicleMediaDraft";
import { coerceVehicleIdentityFromTaxonomy } from "@/app/lib/clasificados/autos/autosVehicleTaxonomy";
import { syncDealerAddressFromStructured } from "@/app/lib/clasificados/autos/autosDealerStructuredAddress";
import { coerceEngineFromCatalog } from "@/app/lib/clasificados/autos/autosVehicleEngineOptions";
import { normalizeDealerCustomLinks } from "@/app/lib/clasificados/autos/autosDealerCustomLinks";
import { normalizeDealerLanguages } from "@/app/lib/clasificados/autos/autosDealerLanguages";

/**
 * NorCal canonical city when possible; preserves in-progress typing.
 * Do not `.trim()` the full string: autosave runs on every keystroke and would
 * swallow the trailing space in "San " before the user types "Jose".
 */
function normalizeCityField(raw: string | undefined): string | undefined {
  if (raw === undefined || raw === "") return undefined;
  const leadingTrimmed = raw.replace(/^\s+/, "");
  if (!leadingTrimmed) return undefined;
  const canon = getCanonicalCityName(leadingTrimmed);
  if (canon) return canon;
  return leadingTrimmed;
}

/** Digits only, max 5 — partial OK in draft; treat full 5 as structured ZIP. */
function normalizeZipField(raw: unknown): string | undefined {
  const d = String(raw ?? "")
    .replace(/\D/g, "")
    .slice(0, 5);
  return d.length > 0 ? d : undefined;
}

/** Optional starting point for the hours editor (form button). */
export const WEEKDAY_HOURS_TEMPLATE: DealerHoursEntry[] = [
  { rowId: "weekday-0", day: "Lunes", open: "09:00", close: "18:00", closed: false },
  { rowId: "weekday-1", day: "Martes", open: "09:00", close: "18:00", closed: false },
  { rowId: "weekday-2", day: "Miércoles", open: "09:00", close: "18:00", closed: false },
  { rowId: "weekday-3", day: "Jueves", open: "09:00", close: "18:00", closed: false },
  { rowId: "weekday-4", day: "Viernes", open: "09:00", close: "18:00", closed: false },
  { rowId: "weekday-5", day: "Sábado", open: "10:00", close: "16:00", closed: false },
  { rowId: "weekday-6", day: "Domingo", open: "", close: "", closed: true },
];

export function createEmptyListing(): AutoDealerListing {
  return {
    autosLane: undefined,
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
    zip: undefined,
    vin: undefined,
    stockNumber: undefined,
    version: undefined,
    motor: undefined,
    engineCylinders: undefined,
    displacementL: undefined,
    vehicleType: undefined,
    manufacturer: undefined,
    plantCountry: undefined,
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
    otherEquipmentDetails: undefined,
    mediaImages: [],
    heroImages: [],
    videoUrls: [],
    videoSourceType: null,
    videoUrl: undefined,
    videoFileDataUrl: undefined,
    videoFileName: undefined,
    videoUploadStatus: null,
    muxAssetId: undefined,
    muxPlaybackId: undefined,
    muxThumbnailUrl: undefined,
    muxPlaybackUrl: undefined,
    autosVideoPublishDiagnostics: undefined,
    dealerName: undefined,
    dealerLogo: undefined,
    dealerPhoneOffice: undefined,
    dealerPhone: undefined,
    dealerPhoneMobile: undefined,
    dealerSmsPhone: undefined,
    dealerWhatsapp: undefined,
    dealerEmail: undefined,
    privadoSiteMessageEnabled: undefined,
    dealerAddress: undefined,
    dealerStreetNumber: undefined,
    dealerStreetName: undefined,
    dealerUnitOrSuite: undefined,
    dealerAddressCity: undefined,
    dealerAddressState: undefined,
    dealerAddressZip: undefined,
    engineNormalized: undefined,
    dealerHours: [],
    dealerWebsite: undefined,
    dealerBookingUrl: undefined,
    dealerSocials: {},
    googleReviewsUrl: undefined,
    yelpReviewsUrl: undefined,
    dealerCustomLinks: [],
    listingAnalytics: undefined,
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

export function normalizeLoadedListing(
  raw: Partial<AutoDealerListing> | undefined,
  opts?: { liveDraft?: boolean },
): AutoDealerListing {
  const liveDraft = opts?.liveDraft ?? false;
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

  const dealerHoursRaw = Array.isArray(raw.dealerHours) ? raw.dealerHours : base.dealerHours;
  const dealerHours = (dealerHoursRaw ?? []).map((row, i) => ({
    ...row,
    rowId: row.rowId ?? `legacy-hour-${i}`,
  }));

  const merged: AutoDealerListing = {
    ...base,
    ...raw,
    ...legacyVideo,
    badges: Array.isArray(raw.badges) ? raw.badges : base.badges,
    features: Array.isArray(raw.features) ? raw.features : base.features,
    mediaImages: mediaImages ?? [],
    dealerHours,
    dealerSocials: raw.dealerSocials && typeof raw.dealerSocials === "object" ? raw.dealerSocials : base.dealerSocials,
    googleReviewsUrl: liveDraft ? raw.googleReviewsUrl || undefined : raw.googleReviewsUrl?.trim() || undefined,
    yelpReviewsUrl: liveDraft ? raw.yelpReviewsUrl || undefined : raw.yelpReviewsUrl?.trim() || undefined,
    dealerCustomLinks: normalizeDealerCustomLinks(raw.dealerCustomLinks, { liveDraft }),
    dealerLanguages: normalizeDealerLanguages(raw.dealerLanguages, { liveDraft }),
    relatedDealerListings: Array.isArray(raw.relatedDealerListings) ? raw.relatedDealerListings : base.relatedDealerListings,
  };

  merged.city = normalizeCityField(merged.city);
  merged.zip = normalizeZipField(merged.zip);

  // Drop legacy self-entered reputation keys from older drafts (not in product).
  delete (merged as Record<string, unknown>).dealerRating;
  delete (merged as Record<string, unknown>).dealerReviewCount;

  const officeTrim = merged.dealerPhoneOffice?.trim();
  const legacyPhoneTrim = merged.dealerPhone?.trim();
  if (!officeTrim && legacyPhoneTrim) {
    merged.dealerPhoneOffice = legacyPhoneTrim;
    merged.dealerPhone = undefined;
  }

  const coerced = coerceVehicleIdentityFromTaxonomy(merged, { liveDraft });
  merged.make = coerced.make;
  merged.model = coerced.model;
  merged.trim = coerced.trim;

  const engineCoerced = coerceEngineFromCatalog(merged, { liveDraft });
  merged.engine = engineCoerced.engine;
  merged.engineNormalized = engineCoerced.engineNormalized;

  merged.mediaImages = normalizeMediaImagesOrder(merged.mediaImages);

  applyAutosVehicleMediaDraftFields(merged, raw);

  const withAddress = syncDealerAddressFromStructured(merged);
  return withAddress;
}
