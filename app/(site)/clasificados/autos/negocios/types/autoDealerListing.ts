/**
 * Dealership vehicle open-card listing — maps 1:1 from application data.
 * Preview and live route share the same shape. Optional fields omit from UI when empty.
 */

import type { AutosListingAnalyticsSnapshot } from "@/app/clasificados/autos/shared/types/autosListingAnalytics";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";

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

/**
 * Privado only — optional seller-entered social DM links, filled per listing. Deliberately a
 * separate type/field from `DealerSocials`/`dealerSocials`: Privado never reads `dealerSocials`
 * (see `PrivadoContactStrip`'s documented Business Hub OS leak-fix), so reusing that field would
 * risk resurfacing dealer/business social links on a private-seller card. Keep this field the
 * only source of Privado social CTAs.
 */
export type PrivadoSellerSocialKey = "facebook" | "instagram" | "tiktok" | "x" | "other";

export type PrivadoSellerSocials = Partial<Record<PrivadoSellerSocialKey, string>>;

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

/** Named/date-specific exception to the regular weekly schedule (holiday hours, closures). Same shape as Servicios' proven `specialHoursRows`. */
export type DealerSpecialHoursRow = {
  /** Occasion/date label, e.g. "Nochebuena" or "Dec 24". */
  label: string;
  /** Resulting hours or closure note, e.g. "9:00 AM – 2:00 PM" or "Cerrado". */
  note: string;
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
  /**
   * Gate QB-MEDIA-03 — what this image DEPICTS (`vehicle` | `logo` | `business` | …), as declared
   * by whoever uploaded it. Optional and additive: every existing reader ignores it and every
   * existing draft stays valid on load.
   *
   * It exists because "at least one real photo of the vehicle" is otherwise unenforceable — a
   * dealership logo and a vehicle photo are the same `MediaImageEntry` without it. The dealer
   * publish seam re-reads this server-side and refuses a listing whose declared roles cannot
   * satisfy the vehicle requirement, so the rule holds regardless of what the browser did.
   */
  role?: string;
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
   * Postal / ZIP code — any format (US 5-digit, ZIP+4, international).
   * Used for public browse filters and listing location display.
   */
  zip?: string;
  /** Defaults to United States when empty; not hard-locked. */
  country?: string;
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
  /** Up to 4 external HTTPS video links (YouTube, TikTok, Instagram, Vimeo, etc.). Autos publish forms are external-URL-only. */
  videoUrls?: string[];
  /** @deprecated Prefer `videoUrls`; kept for legacy drafts and single-URL readers. */
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
  /** Privado only — optional seller-entered social DM links. See `PrivadoSellerSocials` for why this is kept separate from `dealerSocials`. */
  privadoSellerSocials?: PrivadoSellerSocials;
  /** @deprecated Synced from structured fields on save when present; legacy rows may only have this string. */
  dealerAddress?: string;
  dealerStreetNumber?: string;
  dealerStreetName?: string;
  dealerUnitOrSuite?: string;
  dealerAddressCity?: string;
  dealerAddressState?: string;
  dealerAddressZip?: string;
  /** Dealership country — defaults to United States when empty. */
  dealerAddressCountry?: string;
  /**
   * Shared business-address provider status for the street line (`BusinessAddressVerifiedInput`
   * contract) — "manual" (typed) or "user_confirmed" (picked from Google Maps suggestions).
   * Never "verified"; that value is reserved for a provider adapter's own confirmed result.
   */
  dealerAddressVerificationStatus?: "unverified" | "manual" | "user_confirmed" | "provider_suggested" | "verified";
  /** Provider name that produced/confirmed the street line, e.g. "google_places". Null for manual entry. */
  dealerAddressProvider?: string | null;
  /** Provider-specific place id for the confirmed street line, if any. Null for manual entry. */
  dealerAddressProviderPlaceId?: string | null;
  /** Catalog engine value for filter facets; omit when seller enters custom motor text. */
  engineNormalized?: string;
  dealerHours?: DealerHoursEntry[];
  /** Named/date-specific exceptions (holidays, events) — separate from the regular weekly schedule above. */
  dealerSpecialHoursRows?: DealerSpecialHoursRow[];
  dealerWebsite?: string | null;
  /** Dedicated booking / test-drive / appointment URL — “Agendar cita” when valid https. */
  dealerBookingUrl?: string | null;
  dealerSocials?: DealerSocials;
  /** Google Business / Maps review URL — no invented ratings. */
  googleReviewsUrl?: string;
  /** Google Business Profile page URL — separate from reviews and Maps search. */
  googleBusinessUrl?: string;
  /** Yelp review URL — no invented ratings. */
  yelpReviewsUrl?: string;
  /** Up to 3 titled dealership links (financing, trade-in, service, etc.). */
  dealerCustomLinks?: DealerCustomLink[];
  /** Up to 3 languages spoken at the dealership (Negocios Business Hub). */
  dealerLanguages?: string[];
  /** Optional financing / pre-approval contact (Negocios only). */
  financeContactName?: string;
  financeContactTitle?: string;
  financeContactPhone?: string;
  financeContactWhatsapp?: string;
  /** Dedicated SMS/text-capable number — distinct from financeContactPhone/Whatsapp (Negocios only). */
  financeContactSms?: string;
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
  /**
   * Durable server-side staging for Dealer additional-inventory (child) vehicle drafts, written
   * to the parent's own `listing_payload` before Stripe Checkout opens (negocios main listing
   * only). The Stripe webhook has no access to browser state after redirect, so it reads this
   * field to know exactly which children to create/activate once payment is verified. Same key
   * `syncDealerInventoryChildRowsFromParentPayload` already reads for post-publish child edits —
   * not a buyer-facing field, never surfaced by the public listing mapper.
   */
  additionalInventoryVehicles?: AutosAdditionalInventoryVehicleDraft[];
};
