/**
 * Leonix Clasificados — Restaurantes
 * Strict application data model: fields needed for shell output, filters, trust, CTAs,
 * stacked modules (moving / home-based / catering), and admin/dashboard control.
 *
 * @see `getCanonicalCityName` — `cityCanonical` must match NorCal pipeline output where applicable.
 */

import type { RestauranteAmenitiesSelection } from "@/app/clasificados/restaurantes/lib/restauranteAmenitiesCatalog";
import { isRestauranteIdbRef } from "./restauranteDraftMedia";
import { computePublishGallerySequence } from "./restauranteGalleryMediaSequence";
import {
  firstRestauranteBucketImageRef,
  firstRestauranteBucketImageRefForMode,
  isRestauranteDraftStagedImageRef,
  isRestaurantePublishableRemoteImageRef,
  type RestaurantePublishImageGateMode,
} from "./restauranteMediaDisplay";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Storage key: Blob path, upload id, or CDN URL after processing */
export type RestauranteFileRef = string;

/** External or uploaded media reference */
export type RestauranteMediaRef = string;

export type RestaurantePriceLevel = "$" | "$$" | "$$$" | "$$$$";

/** Catalog keys (dropdowns); expand via taxonomy tables — keep as string for forward compatibility */
export type RestauranteBusinessTypeKey = string;
export type RestauranteCuisineKey = string;
export type RestauranteHighlightKey = string;

/**
 * Service modes surfaced in filters + shell (multi-select, min 1 at publish).
 * Distinct from boolean flags (dineIn, takeout…) which drive detail copy + CTAs.
 */
export type RestauranteServiceMode =
  | "dine_in"
  | "takeout"
  | "delivery"
  | "catering"
  | "events"
  | "pop_up"
  | "food_truck"
  | "personal_chef"
  | "meal_prep"
  | "other";

export type RestauranteLocationPrivacyMode =
  | "exact_when_allowed"
  | "approximate_map"
  | "city_only"
  | "hidden_address_text_only";

export type RestauranteListingStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "paused"
  | "rejected"
  | "archived";

export type RestaurantePlanTier = "free" | "standard" | "featured" | "supporter";

// ---------------------------------------------------------------------------
// C. Hours
// ---------------------------------------------------------------------------

export type RestauranteDaySchedule = {
  /** When true, `openTime` / `closeTime` are ignored for that weekday */
  closed: boolean;
  /** Local time 24h `HH:mm` */
  openTime?: string;
  closeTime?: string;
};

export type RestauranteWeeklyHours = {
  monday: RestauranteDaySchedule;
  tuesday: RestauranteDaySchedule;
  wednesday: RestauranteDaySchedule;
  thursday: RestauranteDaySchedule;
  friday: RestauranteDaySchedule;
  saturday: RestauranteDaySchedule;
  sunday: RestauranteDaySchedule;
  specialHoursNote?: string;
  temporaryHoursActive?: boolean;
  temporaryHoursNote?: string;
};

// ---------------------------------------------------------------------------
// F. Featured dishes (max 4 in UI; type allows array, enforce length at validation)
// ---------------------------------------------------------------------------

export type RestauranteFeaturedDish = {
  title: string;
  image: RestauranteFileRef;
  shortNote: string;
  menuLink?: string;
  priceLabel?: string;
};

// ---------------------------------------------------------------------------
// G. Coupons/offers (optional, max 4 with upgrade)
// ---------------------------------------------------------------------------

export type RestauranteCoupon = {
  title: string;
  description: string;
  couponCode?: string;
  expirationDate?: string;
  redemptionNote?: string;
  /** Optional flyer/image for coupon display */
  imageUrl?: string;
  /** External coupon/menu/order URL */
  url?: string;
  /** Custom CTA label (defaults to "Ver cupón" / "View coupon") */
  ctaLabel?: string;
  /** Default true for first 4 coupons */
  isFeatured?: boolean;
};

/** Section-level flyer image for additional promotions */
export type RestauranteCouponFlyer = {
  /** Flyer image URL showing multiple coupons/promotions */
  imageUrl?: string;
};

/** Section-level "more offers" external link */
export type RestauranteCouponMoreOffers = {
  /** External URL to view more coupons/offers */
  url?: string;
  /** Custom button text (defaults to "Ver más cupones") */
  buttonLabel?: string;
};

// ---------------------------------------------------------------------------
// H. Gallery / media
// ---------------------------------------------------------------------------

export type RestauranteGalleryMedia = {
  heroImage: RestauranteFileRef;
  businessLogo?: RestauranteFileRef;
  galleryImages?: RestauranteFileRef[];
  /** Display order: indices or media ids — implementation-specific */
  galleryOrder?: string[];
  /** Mixed gallery + video order for preview/editor (Leonix-style strip). */
  galleryMediaSequence?: Array<number | "v">;
  /** External video URLs only (max 4). Replaces direct file upload for new listings. */
  videoUrls?: string[];
  videoFile?: RestauranteFileRef;
  videoUrl?: string;
  foodImages?: RestauranteFileRef[];
  interiorImages?: RestauranteFileRef[];
  exteriorImages?: RestauranteFileRef[];
};

// ---------------------------------------------------------------------------
// I. Moving vendor stack (`movingVendor === true`)
// ---------------------------------------------------------------------------

export type RestauranteMovingVendorStack = {
  currentLocationText: string;
  currentLocationUrl?: string;
  activeNow?: boolean;
  todayHoursText?: string;
  nextStopText?: string;
  nextStopTime?: string;
  weeklyRouteText?: string;
  allowFollowNotify?: boolean;
  notifyCopy?: string;
};

// ---------------------------------------------------------------------------
// J. Home-based stack (`homeBasedBusiness === true`)
// ---------------------------------------------------------------------------

export type RestauranteHomeBasedStack = {
  pickupInstructions?: string;
  pickupDays?: string[];
  pickupWindowText?: string;
  /** Duplicate semantic with location block — single field in composed model */
  deliveryRadiusMiles?: number;
  preorderLeadTimeText?: string;
  homeBusinessNotice?: string;
};

// ---------------------------------------------------------------------------
// K. Catering / events stack (`cateringAvailable || eventFoodService`)
// ---------------------------------------------------------------------------

export type RestauranteCateringEventsStack = {
  eventSizesSupported?: string[];
  bookingLeadTimeText?: string;
  serviceRadiusMiles?: number;
  cateringInquiryUrl?: string;
  cateringNote?: string;
};

// ---------------------------------------------------------------------------
// L. Trust / external proof
// ---------------------------------------------------------------------------

export type RestauranteTrustFields = {
  googleReviewUrl?: string;
  yelpReviewUrl?: string;
  externalRatingValue?: number;
  externalReviewCount?: number;
  testimonialSnippet?: string;
  aiSummaryEnabled?: boolean;
};

// ---------------------------------------------------------------------------
// M. Internal contract (admin / dashboard / API)
// ---------------------------------------------------------------------------

export type RestauranteInternalContract = {
  listingId: string;
  ownerId: string;
  category: "restaurantes";
  subcategory?: string;
  branchCheckpoint?: string;
  slug: string;
  status: RestauranteListingStatus;
  planTier: RestaurantePlanTier;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Legacy / editorial — not mapped to paid `promoted` placement (renew uses `updated_at` / listing refresh). */
  boosted?: boolean;
  featured?: boolean;
};

// ---------------------------------------------------------------------------
// A. Business identity (cityCanonical + zip live once on composed listing — see below)
// ---------------------------------------------------------------------------

/**
 * Optional text when the user picks taxonomy value `other` / `other_lang`.
 * Keeps controlled keys in draft while surfacing a short custom label in UI/preview.
 */
export type RestauranteTaxonomyOtherSupplements = {
  businessTypeCustom?: string;
  primaryCuisineCustom?: string;
  secondaryCuisineCustom?: string;
  /** When "other" is checked under cocinas adicionales */
  additionalCuisineOtherCustom?: string;
  /** Multiple custom language labels when Otro is selected (max 3). */
  customLanguages?: string[];
  languageOtherCustom?: string;
  serviceModeOtherCustom?: string;
};

export type RestauranteBusinessIdentity = {
  businessName: string;
  businessType: RestauranteBusinessTypeKey;
  primaryCuisine: RestauranteCuisineKey;
  secondaryCuisine?: RestauranteCuisineKey;
  additionalCuisines?: RestauranteCuisineKey[];
  /** Legacy optional field — hidden from UI (Gate R-C2); tolerated in old drafts only. */
  shortSummary?: string;
  longDescription?: string;
  /**
   * Canonical NorCal city string — single source of truth for discovery, results, and cards.
   * Prefer `CityAutocomplete` / shared catalog; avoid parallel free-text “city” fields.
   */
  cityCanonical: string;
  neighborhood?: string;
  /**
   * Optional US ZIP (e.g. 5 digits). Used with `cityCanonical` for results-driving filters; not a second “city”.
   */
  zipCode?: string;
  priceLevel?: RestaurantePriceLevel;
  languagesSpoken?: string[];
};

// ---------------------------------------------------------------------------
// B. Operating model
// ---------------------------------------------------------------------------

export type RestauranteOperatingModel = {
  serviceModes: RestauranteServiceMode[];
  dineIn?: boolean;
  takeout?: boolean;
  delivery?: boolean;
  reservationsAvailable?: boolean;
  cateringAvailable?: boolean;
  preorderRequired?: boolean;
  pickupAvailable?: boolean;
  homeBasedBusiness?: boolean;
  movingVendor?: boolean;
  foodTruck?: boolean;
  popUp?: boolean;
  personalChef?: boolean;
  eventFoodService?: boolean;
};

// ---------------------------------------------------------------------------
// D. Contact + CTA
// ---------------------------------------------------------------------------

export type RestauranteContactCta = {
  websiteUrl?: string;
  phoneNumber?: string;
  email?: string;
  whatsAppNumber?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  snapchatUrl?: string;
  xTwitterUrl?: string;
  reservationUrl?: string;
  orderUrl?: string;
  menuUrl?: string;
  menuFile?: RestauranteFileRef;
  brochureFile?: RestauranteFileRef;
  /** Maps or “Ver ubicación” handoff when not using auto-generated search */
  verUbicacionUrl?: string;
  allowMessageCTA?: boolean;
};

// ---------------------------------------------------------------------------
// E. Location (address; shares cityCanonical + zipCode with A — not duplicated in type)
// ---------------------------------------------------------------------------

export type RestauranteLocationDetails = {
  addressLine1?: string;
  addressLine2?: string;
  /** Defaulted e.g. CA for NorCal catalog */
  state?: string;
  /** Optional country for international restaurants */
  country?: string;
  showExactAddress?: boolean;
  serviceAreaText?: string;
  deliveryRadiusMiles?: number;
  locationPrivacyMode?: RestauranteLocationPrivacyMode;
};

// ---------------------------------------------------------------------------
// Composed listing (single source of truth)
// ---------------------------------------------------------------------------

export type RestauranteListingApplication = RestauranteBusinessIdentity &
  RestauranteOperatingModel &
  RestauranteWeeklyHours &
  RestauranteContactCta &
  RestauranteLocationDetails &
  RestauranteGalleryMedia &
  RestauranteTrustFields &
  RestauranteTaxonomyOtherSupplements &
  RestauranteInternalContract & {
    featuredDishes?: RestauranteFeaturedDish[];
    highlights?: RestauranteHighlightKey[];
    /** Optional coupons/offers */
    coupons?: RestauranteCoupon[];
    /** Coupon upgrade enabled (+$99/month) */
    couponUpgradeEnabled?: boolean;
    /** Section-level flyer for additional promotions */
    couponFlyer?: RestauranteCouponFlyer;
    /** Section-level "more offers" external link */
    couponMoreOffers?: RestauranteCouponMoreOffers;
    /** Drafts may omit keys until the conditional stack is filled */
    movingVendorStack?: Partial<RestauranteMovingVendorStack>;
    homeBasedStack?: Partial<RestauranteHomeBasedStack>;
    cateringEventsStack?: Partial<RestauranteCateringEventsStack>;
    /** Optional structured amenities (payments, accessibility, etc.) */
    restaurantAmenities?: RestauranteAmenitiesSelection;
  };

// ---------------------------------------------------------------------------
// Minimum valid preview (publish gate / empty-state shell)
// ---------------------------------------------------------------------------

export type RestauranteMinimumValidPreview = Pick<
  RestauranteListingApplication,
  | "businessName"
  | "businessType"
  | "primaryCuisine"
  | "cityCanonical"
  | "heroImage"
> & {
  /** At least one primary contact path — satisfied when any contact channel is non-empty */
  contactSatisfied: true;
  /** Hours or explicit “operating signal” — satisfied when weekly hours present and parsable, or a temp note explains closure */
  hoursOrOperatingSignalSatisfied: true;
};

/** Keys that drive search results, filters, and lista cards (documentation + analytics) */
export const RESTAURANTE_RESULTS_DRIVING_KEYS = [
  "businessName",
  "businessType",
  "primaryCuisine",
  "secondaryCuisine",
  "additionalCuisines",
  "cityCanonical",
  "neighborhood",
  "zipCode",
  "priceLevel",
  "serviceModes",
  "highlights",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "temporaryHoursActive",
  "temporaryHoursNote",
  "heroImage",
  "externalRatingValue",
  "externalReviewCount",
  "movingVendor",
  "homeBasedBusiness",
  "foodTruck",
  "popUp",
] as const satisfies readonly (keyof RestauranteListingApplication | keyof RestauranteWeeklyHours)[];

type ContactChannel = keyof Pick<
  RestauranteContactCta,
  | "websiteUrl"
  | "phoneNumber"
  | "email"
  | "whatsAppNumber"
  | "instagramUrl"
  | "facebookUrl"
  | "tiktokUrl"
  | "youtubeUrl"
  | "reservationUrl"
  | "orderUrl"
  | "menuUrl"
  | "menuFile"
  | "brochureFile"
  | "verUbicacionUrl"
>;

function nonEmpty(s: string | undefined): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

/** Exported for preview gating + draft mapper (at least one contact channel). */
export function hasPrimaryContactPath(cta: RestauranteContactCta): boolean {
  const keys: ContactChannel[] = [
    "websiteUrl",
    "phoneNumber",
    "email",
    "whatsAppNumber",
    "instagramUrl",
    "facebookUrl",
    "tiktokUrl",
    "youtubeUrl",
    "reservationUrl",
    "orderUrl",
    "menuUrl",
    "menuFile",
    "brochureFile",
    "verUbicacionUrl",
  ];
  return keys.some((k) => nonEmpty(cta[k] as string | undefined));
}

function dayHasSignal(d: RestauranteDaySchedule): boolean {
  if (d.closed) return true;
  return nonEmpty(d.openTime) && nonEmpty(d.closeTime);
}

function hasWeeklyHoursSignal(h: RestauranteWeeklyHours): boolean {
  const days: (keyof RestauranteWeeklyHours)[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  return days.every((k) => {
    const sched = h[k];
    if (!sched || typeof sched !== "object") return false;
    return dayHasSignal(sched as RestauranteDaySchedule);
  });
}

export function hasOperatingSignal(h: RestauranteWeeklyHours): boolean {
  if (hasWeeklyHoursSignal(h)) return true;
  if (nonEmpty(h.specialHoursNote)) return true;
  return false;
}

/** Input shape for minimum preview/publish readiness (same fields as the shell + publish gate). */
export type RestauranteMinimumValidPreviewInput = Pick<
  RestauranteListingApplication,
  | "businessName"
  | "businessType"
  | "primaryCuisine"
  | "shortSummary"
  | "cityCanonical"
  | "heroImage"
  | "galleryImages"
  | "galleryMediaSequence"
  | "galleryOrder"
  | "videoFile"
  | "videoUrl"
  | "foodImages"
  | "interiorImages"
  | "exteriorImages"
> &
  RestauranteContactCta &
  RestauranteWeeklyHours;

function imageSlotSatisfiesMode(
  s: string | undefined,
  mode: RestaurantePublishImageGateMode,
): boolean {
  if (!nonEmpty(s)) return false;
  return mode === "transport" ? isRestaurantePublishableRemoteImageRef(s) : isRestauranteDraftStagedImageRef(s);
}

/**
 * Minimum image readiness: hero, first image in publish gallery sequence, or venue buckets.
 * - `draft`: counts data URLs, https, and `__LX_RT_IDB__` refs (in-browser / preview staging).
 * - `transport`: only refs allowed in `POST .../publish` after sanitization (remote http(s), length limits).
 */
export function hasRestauranteMinimumPublishImage(
  row: RestauranteMinimumValidPreviewInput,
  mode: RestaurantePublishImageGateMode = "transport",
): boolean {
  if (imageSlotSatisfiesMode(row.heroImage, mode)) return true;
  const seq = computePublishGallerySequence(row);
  const imgs = row.galleryImages ?? [];
  const firstIdx = seq.find(
    (x): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0 && x < imgs.length,
  );
  const firstGal = firstIdx != null ? imgs[firstIdx] : undefined;
  if (imageSlotSatisfiesMode(firstGal, mode)) return true;
  return Boolean(firstRestauranteBucketImageRefForMode(row, mode));
}

export function classifyPublishImageRefShape(
  s: string | undefined,
): "empty" | "https" | "http" | "data" | "blob" | "relative" | "idb" | "other" {
  const t = (s ?? "").trim();
  if (!t) return "empty";
  if (isRestauranteIdbRef(t)) return "idb";
  if (/^https:\/\//i.test(t)) return "https";
  if (/^http:\/\//i.test(t)) return "http";
  if (/^data:image\//i.test(t)) return "data";
  if (t.startsWith("blob:")) return "blob";
  if (t.startsWith("/")) return "relative";
  return "other";
}

/** Safe classification for arbitrary JSON slot (gallery may be object-shaped before merge). */
export function classifyRestauranteGallerySlotUnknown(x: unknown): "empty" | "http" | "https" | "data" | "blob" | "object" | "other" {
  if (x == null) return "empty";
  if (typeof x === "object") return "object";
  if (typeof x !== "string") return "other";
  const k = classifyPublishImageRefShape(x);
  if (k === "https") return "https";
  if (k === "http") return "http";
  if (k === "data") return "data";
  if (k === "blob") return "blob";
  if (k === "idb") return "other";
  return "other";
}

/** Safe diagnostics for media readiness (no URLs / no payloads). */
export type RestaurantePublishMediaReadinessDebug = {
  hasHeroImage: boolean;
  heroImageValueShape: ReturnType<typeof classifyPublishImageRefShape>;
  galleryImagesCount: number;
  firstGalleryRawShape: ReturnType<typeof classifyPublishImageRefShape>;
  firstResolvedGalleryImagePresent: boolean;
  hasBucketPublishImage: boolean;
  foodImagesCount: number;
  interiorImagesCount: number;
  exteriorImagesCount: number;
  /** @deprecated use hasAnyPublishImageTransport; kept = transport for API alignment */
  hasAnyPublishImage: boolean;
  hasAnyPublishImageDraft: boolean;
  hasAnyPublishImageTransport: boolean;
};

export function auditRestaurantePublishMediaReadinessSafe(row: RestauranteMinimumValidPreviewInput): RestaurantePublishMediaReadinessDebug {
  const imgs = row.galleryImages ?? [];
  const seq = computePublishGallerySequence(row);
  const firstIdx = seq.find(
    (x): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0 && x < imgs.length,
  );
  const firstGal = firstIdx != null ? imgs[firstIdx] : undefined;
  const hasDraft = hasRestauranteMinimumPublishImage(row, "draft");
  const hasTransport = hasRestauranteMinimumPublishImage(row, "transport");
  const bucket = firstRestauranteBucketImageRef(row);
  return {
    hasHeroImage: nonEmpty(row.heroImage),
    heroImageValueShape: classifyPublishImageRefShape(row.heroImage),
    galleryImagesCount: imgs.length,
    firstGalleryRawShape: imgs.length > 0 ? classifyPublishImageRefShape(imgs[0] as string | undefined) : "empty",
    firstResolvedGalleryImagePresent: nonEmpty(firstGal),
    hasBucketPublishImage: Boolean(bucket),
    foodImagesCount: row.foodImages?.length ?? 0,
    interiorImagesCount: row.interiorImages?.length ?? 0,
    exteriorImagesCount: row.exteriorImages?.length ?? 0,
    hasAnyPublishImage: hasTransport,
    hasAnyPublishImageDraft: hasDraft,
    hasAnyPublishImageTransport: hasTransport,
  };
}

export type RestaurantePublishReadinessAudit = {
  hasBusinessName: boolean;
  hasBusinessType: boolean;
  hasPrimaryCuisine: boolean;
  hasSummary: boolean;
  hasCity: boolean;
  hasHeroImage: boolean;
  hasFirstGalleryImage: boolean;
  hasAnyPublishImage: boolean;
  hasContactPath: boolean;
  hasHoursSignal: boolean;
  readyToPublish: boolean;
  /** Spanish labels aligned with preview copy / API not_ready detail */
  missingFields: string[];
};

/**
 * Diagnostic mirror of the minimum publish gate.
 * @param imageMode `draft` = UI / local media OK (data URL, IDB ref); `transport` = same checks as `POST .../publish`.
 */
export function auditRestaurantePublishReadiness(
  row: RestauranteMinimumValidPreviewInput,
  imageMode: RestaurantePublishImageGateMode = "draft",
): RestaurantePublishReadinessAudit {
  const hasBusinessName = nonEmpty(row.businessName);
  const hasBusinessType = nonEmpty(row.businessType);
  const hasPrimaryCuisine = nonEmpty(row.primaryCuisine);
  const hasCity = nonEmpty(row.cityCanonical);
  const hasHeroImage = nonEmpty(row.heroImage);
  const seq = computePublishGallerySequence(row);
  const imgs = row.galleryImages ?? [];
  const firstIdx = seq.find(
    (x): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0 && x < imgs.length,
  );
  const firstGal = firstIdx != null ? imgs[firstIdx] : undefined;
  const hasFirstGalleryImage = nonEmpty(firstGal);
  const hasAnyPublishImage = hasRestauranteMinimumPublishImage(row, imageMode);
  const hasContactPath = hasPrimaryContactPath(row);
  const hasHoursSignal = hasOperatingSignal(row);

  const missingFields: string[] = [];
  if (!hasBusinessName) missingFields.push("nombre");
  if (!hasBusinessType) missingFields.push("tipo");
  if (!hasPrimaryCuisine) missingFields.push("cocina");
  if (!hasCity) missingFields.push("ciudad");
  if (!hasRestauranteMinimumPublishImage(row, imageMode)) missingFields.push("imagen principal o primera de galería");
  if (!hasContactPath) missingFields.push("al menos un contacto");
  if (!hasHoursSignal) missingFields.push("señal de horario");

  const readyToPublish =
    hasBusinessName &&
    hasBusinessType &&
    hasPrimaryCuisine &&
    hasCity &&
    hasAnyPublishImage &&
    hasContactPath &&
    hasHoursSignal;

  return {
    hasBusinessName,
    hasBusinessType,
    hasPrimaryCuisine,
    hasSummary: true,
    hasCity,
    hasHeroImage,
    hasFirstGalleryImage,
    hasAnyPublishImage,
    hasContactPath,
    hasHoursSignal,
    readyToPublish,
    missingFields,
  };
}

/**
 * Same field checks as {@link auditRestaurantePublishReadiness} with `imageMode: "draft"` — allows local/IDB media
 * so users can open preview while images are still only in the browser.
 */
export function satisfiesRestauranteMinimumDraftForPreview(row: RestauranteMinimumValidPreviewInput): boolean {
  return auditRestaurantePublishReadiness(row, "draft").readyToPublish;
}

/**
 * Publish / API gate: minimum buyer-facing completeness **and** transport-safe image refs only.
 * Does not replace server-side validation (serviceModes length, conditional stacks, etc.).
 */
export function satisfiesRestauranteMinimumValidPreview(row: RestauranteMinimumValidPreviewInput): boolean {
  return auditRestaurantePublishReadiness(row, "transport").readyToPublish;
}

/**
 * Stacked modules: present only when parent flags allow (enforce in form + API).
 */
/** Per spec §I: stack only when `movingVendor` is true (form may auto-check `movingVendor` when truck/pop-up is chosen). */
export function shouldShowMovingVendorStack(op: RestauranteOperatingModel): boolean {
  return Boolean(op.movingVendor);
}

export function shouldShowHomeBasedStack(op: RestauranteOperatingModel): boolean {
  return Boolean(op.homeBasedBusiness);
}

export function shouldShowCateringEventsStack(op: RestauranteOperatingModel): boolean {
  return Boolean(op.cateringAvailable || op.eventFoodService);
}

/** §B: `serviceModes` must contain at least one value at publish time */
export function satisfiesRestauranteServiceModes(serviceModes: RestauranteServiceMode[] | undefined): boolean {
  return Array.isArray(serviceModes) && serviceModes.length > 0;
}

/** Max highlights rendered in desktop shell */
export const RESTAURANTE_SHELL_HIGHLIGHT_CAP = 6 as const;
