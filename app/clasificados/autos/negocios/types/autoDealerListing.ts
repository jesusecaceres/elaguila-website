/**
 * Dealership vehicle open-card listing — maps 1:1 from application data.
 * Preview and live route share the same shape. Optional fields omit from UI when empty.
 */

export type VehicleBadge =
  | "certified"
  | "new"
  | "used"
  | "clean_title"
  | "one_owner"
  | "low_miles"
  | "dealer_maintained";

export type DealerSocialKey = "instagram" | "facebook" | "youtube" | "tiktok" | "website";

export type DealerSocials = Partial<Record<DealerSocialKey, string>>;

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
  price: number;
  mileage: number;
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
 * Draft/preview: never calls Mux; local preview uses videoFileDataUrl (data: or blob) or videoUrl (https).
 */
export type VideoSourceType = "url" | "file" | null;

/** Local draft status only — not a Mux API state. */
export type VideoDraftUploadStatus = "local_preview" | "pending_mux" | "ready" | "error" | null;

export type AutoDealerListing = {
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
  description?: string;
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
  /** Business WhatsApp (display as typed; normalized for wa.me links in preview). */
  dealerWhatsapp?: string | null;
  dealerAddress?: string;
  dealerHours?: DealerHoursEntry[];
  dealerWebsite?: string | null;
  /** Dedicated booking / test-drive / appointment URL — “Agendar cita” when valid https. */
  dealerBookingUrl?: string | null;
  dealerSocials?: DealerSocials;
  /** @deprecated Not shown in UI; may remain in older local drafts. */
  dealerRating?: number;
  /** @deprecated Not shown in UI; may remain in older local drafts. */
  dealerReviewCount?: number;
  relatedDealerListings?: RelatedDealerListing[];
};
