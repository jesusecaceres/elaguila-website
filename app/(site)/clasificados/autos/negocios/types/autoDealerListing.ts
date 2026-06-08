/**
 * Dealership vehicle open-card listing — maps 1:1 from application data.
 * Preview and live route share the same shape. Optional fields omit from UI when empty.
 */

import type { AutosListingAnalyticsSnapshot } from "@/app/clasificados/autos/shared/types/autosListingAnalytics";

export type VehicleBadge =
  | "certified"
  | "new"
  | "used"
  | "clean_title"
  | "one_owner"
  | "low_miles"
  | "dealer_maintained";

export type DealerSocialKey =
  | "instagram"
  | "facebook"
  | "youtube"
  | "tiktok"
  | "website"
  | "linkedin"
  | "x"
  | "snapchat"
  | "pinterest"
  | "whatsappProfile";

export type DealerSocials = Partial<Record<DealerSocialKey, string>>;

/** Up to 3 dealership links with custom titles (Negocios Business Hub). */
export type DealerCustomLink = {
  id: string;
  label?: string;
  url?: string;
};

/** Structured business hours (form + preview). */
export type DealerHoursEntry = {
  /** Stable row id for controlled updates (avoids index/key bugs). */
  rowId?: string;
  day: string;
  open: string;
  close: string;
  closed: boolean;
};

export type RelatedDealerListing = {
  id: string;
  imageUrl: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price: number;
  mileage: number;
  city?: string;
  state?: string;
  href: string;
};

/** Draft/preview image row — ordering + primary hero for gallery. */
export type MediaImageSourceType = "url" | "file";

export type MediaImageEntry = {
  id: string;
  url: string;
  sourceType: MediaImageSourceType;
  isPrimary: boolean;
  sortOrder: number;
};

/**
 * Video source while drafting. File bytes are not uploaded to Mux until publish.
 *
 * Publish flow (future): if videoSourceType === "file", upload file → Mux → set muxAssetId + muxPlaybackId.
 * Takedown (future): delete muxAssetId from Mux when listing is removed.
 * Draft/preview: local preview uses videoFileDataUrl (data: or blob) or videoUrl (https). After publish, durable Mux IDs + thumbnail are stored; inline file bytes are never persisted.
 */
export type VideoSourceType = "url" | "file" | null;

/** Local draft status only — not a Mux API state. */
export type VideoDraftUploadStatus = "local_preview" | "pending_mux" | "ready" | "error" | null;

export type AutoDealerListing = {
  /**
   * Which Autos paid shell to render in preview/live.
   * `privado` = private seller lane (no dealership stack). Omit / `negocios` = dealer lane.
   */
  autosLane?: "negocios" | "privado";
  vehicleTitle?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  condition?: "new" | "used" | "certified";
  price?: number;
  monthlyEstimate?: string | null;
  mileage?: number;
  /** Canonical NorCal city name (from `CityAutocomplete` + `getCanonicalCityName`); legacy drafts may be normalized on load. */
  city?: string;
  state?: string;
  /**
   * US ZIP: digits only, up to 5 while typing; filter/geo use when length is 5.
   * Future: pair with lat/lng from ZIP centroid if needed.
   */
  zip?: string;
  vin?: string;
  stockNumber?: string;
  /** Trim alias for filters/payload (often mirrors trim). */
  version?: string;
  trim2?: string;
  series?: string;
  series2?: string;
  /** Set when trim/version came from VIN decode outside local catalog. */
  vinDetectedTrim?: string;
  /** Free-text motor label (often mirrors engine). */
  motor?: string;
  engineCylinders?: number;
  displacementL?: number;
  displacementCC?: number;
  displacementCI?: number;
  engineModel?: string;
  engineManufacturer?: string;
  engineConfiguration?: string;
  engineHP?: number;
  engineKW?: number;
  turbo?: string;
  valveTrain?: string;
  vehicleType?: string;
  vehicleDescriptor?: string;
  bodyClass?: string;
  driveType?: string;
  transmissionStyle?: string;
  transmissionSpeeds?: string;
  fuelTypePrimary?: string;
  fuelTypeSecondary?: string;
  electrificationLevel?: string;
  cabType?: string;
  bedType?: string;
  bedLength?: string;
  gvwr?: string;
  manufacturer?: string;
  manufacturerId?: string;
  plantCountry?: string;
  plantState?: string;
  plantCity?: string;
  plantCompanyName?: string;
  safetyFeatures?: Record<string, boolean>;
  nhtsaDecode?: {
    source: "nhtsa_vpic";
    decodedAt: string;
    completenessScore: number;
    completenessStatus: "full" | "partial" | "minimal";
    availableFields: string[];
  };
  /** Select value; use `exteriorColorCustom` when this is `Otro`. */
  exteriorColor?: string;
  exteriorColorCustom?: string;
  interiorColor?: string;
  interiorColorCustom?: string;
  bodyStyle?: string;
  bodyStyleCustom?: string;
  drivetrain?: string;
  drivetrainCustom?: string;
  transmission?: string;
  transmissionCustom?: string;
  engine?: string;
  fuelType?: string;
  fuelTypeCustom?: string;
  mpgCity?: number | null;
  mpgHighway?: number | null;
  doors?: number;
  seats?: number;
  titleStatus?: string;
  titleStatusCustom?: string;
  badges?: VehicleBadge[];
  features?: string[];
  /** Seller-added equipment/upgrades not in the checklist (e.g. Apple CarPlay). */
  customEquipment?: string[];
  description?: string;
  /** Free-text upgrades / unlisted equipment / maintenance notes (Privado + shared payload). */
  otherEquipmentDetails?: string | null;
  /** Rich media rows (preferred). `heroImages` is derived for preview compatibility. */
  mediaImages?: MediaImageEntry[];
  /** Derived from `mediaImages` in normalize; legacy drafts may only have this. */
  heroImages?: string[];
  /** External video URL when videoSourceType === "url" (YouTube/Vimeo/direct mp4, etc.). */
  videoUrl?: string | null;
  videoSourceType?: VideoSourceType;
  /** Local data URL for preview when videoSourceType === "file"; upload to Mux on publish only. */
  videoFileDataUrl?: string | null;
  videoFileName?: string | null;
  videoUploadStatus?: VideoDraftUploadStatus;
  muxAssetId?: string | null;
  muxPlaybackId?: string | null;
  /** Mux-generated poster image (https), when available. */
  muxThumbnailUrl?: string | null;
  /** Cached manifest or progressive URL returned by Mux status (optional). */
  muxPlaybackUrl?: string | null;
  /** Last optional-video publish attempt diagnostics (Mux). Not user-facing playback. */
  autosVideoPublishDiagnostics?: {
    muxUploadAttempted?: boolean;
    muxUploadError?: string | null;
    muxUploadAt?: string | null;
  } | null;
  dealerName?: string;
  dealerLogo?: string | null;
  /** Primary public office phone for display + “Llamar” / `tel:`. */
  dealerPhoneOffice?: string;
  /**
   * @deprecated Loaded drafts migrate this into `dealerPhoneOffice` on normalize; do not write from new UI.
   */
  dealerPhone?: string;
  /** Optional direct/mobile line — persisted only; not shown as a second call CTA on preview. */
  dealerPhoneMobile?: string;
  /** Optional SMS/text line — shown only when valid; separate from call/WhatsApp. */
  dealerSmsPhone?: string;
  /** Business WhatsApp (display as typed; normalized for wa.me links in preview). */
  dealerWhatsapp?: string | null;
  /** Private-seller / optional email for “Email” CTA (Privado); omitted in Negocios UI today. */
  dealerEmail?: string | null;
  /**
   * Privado: when false, hide the site “Message” CTA on preview. Default is treated as enabled when unset.
   */
  privadoSiteMessageEnabled?: boolean;
  /** @deprecated Synced from structured fields on save when present; legacy rows may only have this string. */
  dealerAddress?: string;
  dealerStreetNumber?: string;
  dealerStreetName?: string;
  dealerUnitOrSuite?: string;
  dealerAddressCity?: string;
  dealerAddressState?: string;
  dealerAddressZip?: string;
  /** Catalog engine value for filter facets; omit when seller enters custom motor text. */
  engineNormalized?: string;
  dealerHours?: DealerHoursEntry[];
  dealerWebsite?: string | null;
  /** Dedicated booking / test-drive / appointment URL — “Agendar cita” when valid https. */
  dealerBookingUrl?: string | null;
  dealerSocials?: DealerSocials;
  /** Google Business / Maps review URL — no invented ratings. */
  googleReviewsUrl?: string;
  /** Yelp review URL — no invented ratings. */
  yelpReviewsUrl?: string;
  /** Up to 3 titled dealership links (financing, trade-in, service, etc.). */
  dealerCustomLinks?: DealerCustomLink[];
  /** Optional financing / pre-approval contact (Negocios only). */
  financeContactName?: string;
  financeContactTitle?: string;
  financeContactPhone?: string;
  financeContactWhatsapp?: string;
  financeContactEmail?: string;
  financeApplicationUrl?: string;
  /** Optional https image URL — advisor headshot or bank/finance logo (Negocios only). */
  financeContactImageUrl?: string;
  /** Local upload filename for finance image preview (Negocios only). */
  financeContactImageFileName?: string;
  /** How the finance image was added — url vs local file preview (Negocios only). */
  financeContactImageSource?: "url" | "local";
  financeNotes?: string;
  /** Engagement snapshot for preview / live analytics strip. */
  listingAnalytics?: AutosListingAnalyticsSnapshot;
  relatedDealerListings?: RelatedDealerListing[];
  relatedDealerInventoryHref?: string | null;
  relatedDealerInventoryHasMore?: boolean;
};
