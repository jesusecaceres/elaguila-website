/**
 * Leonix Clasificados — Restaurantes
 * Strict application data model: fields needed for shell output, filters, trust, CTAs,
 * stacked modules (moving / home-based / catering), and admin/dashboard control.
 *
 * @see `getCanonicalCityName` — `cityCanonical` must match NorCal pipeline output where applicable.
 */

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
// G. Gallery / media
// ---------------------------------------------------------------------------

export type RestauranteGalleryMedia = {
  heroImage: RestauranteFileRef;
  galleryImages?: RestauranteFileRef[];
  /** Display order: indices or media ids — implementation-specific */
  galleryOrder?: string[];
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
  boosted?: boolean;
  featured?: boolean;
};

// ---------------------------------------------------------------------------
// A. Business identity (cityCanonical + zip live once on composed listing — see below)
// ---------------------------------------------------------------------------

export type RestauranteBusinessIdentity = {
  businessName: string;
  businessType: RestauranteBusinessTypeKey;
  primaryCuisine: RestauranteCuisineKey;
  secondaryCuisine?: RestauranteCuisineKey;
  additionalCuisines?: RestauranteCuisineKey[];
  shortSummary: string;
  longDescription?: string;
  /** Canonical city string from controlled selector (shared with location) */
  cityCanonical: string;
  neighborhood?: string;
  /** Normalized 5-digit when US; optional depending on flow */
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
  RestauranteInternalContract & {
    featuredDishes?: RestauranteFeaturedDish[];
    highlights?: RestauranteHighlightKey[];
    /** Drafts may omit keys until the conditional stack is filled */
    movingVendorStack?: Partial<RestauranteMovingVendorStack>;
    homeBasedStack?: Partial<RestauranteHomeBasedStack>;
    cateringEventsStack?: Partial<RestauranteCateringEventsStack>;
  };

// ---------------------------------------------------------------------------
// Minimum valid preview (publish gate / empty-state shell)
// ---------------------------------------------------------------------------

export type RestauranteMinimumValidPreview = Pick<
  RestauranteListingApplication,
  | "businessName"
  | "businessType"
  | "primaryCuisine"
  | "shortSummary"
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

function hasOperatingSignal(h: RestauranteWeeklyHours): boolean {
  if (hasWeeklyHoursSignal(h)) return true;
  if (h.temporaryHoursActive && nonEmpty(h.temporaryHoursNote)) return true;
  if (nonEmpty(h.specialHoursNote)) return true;
  return false;
}

/**
 * Publish / preview gate: minimum buyer-facing completeness.
 * Does not replace server-side validation (serviceModes length, conditional stacks, etc.).
 */
export function satisfiesRestauranteMinimumValidPreview(
  row: Pick<
    RestauranteListingApplication,
    | "businessName"
    | "businessType"
    | "primaryCuisine"
    | "shortSummary"
    | "cityCanonical"
    | "heroImage"
  > &
    RestauranteContactCta &
    RestauranteWeeklyHours
): boolean {
  if (!nonEmpty(row.businessName)) return false;
  if (!nonEmpty(row.businessType)) return false;
  if (!nonEmpty(row.primaryCuisine)) return false;
  if (!nonEmpty(row.shortSummary)) return false;
  if (!nonEmpty(row.cityCanonical)) return false;
  if (!nonEmpty(row.heroImage)) return false;
  if (!hasPrimaryContactPath(row)) return false;
  if (!hasOperatingSignal(row)) return false;
  return true;
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
