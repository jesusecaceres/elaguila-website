/**
 * Clasificados Servicios application state (advertiser-facing).
 * Step 3 will map this into `ServiciosApplicationDraft` / shell slots — not exposed in UI.
 */

export type ServiciosLang = "es" | "en";

/** Internal grouping for filters/analytics — never shown in the form copy */
export type ServiciosInternalGroup =
  | "home_trade"
  | "automotive"
  | "health_beauty"
  | "legal_professional"
  | "education_tutoring"
  | "events_entertainment"
  | "technology_support"
  | "miscellaneous"
  | "other";

export type ChipDef = {
  id: string;
  es: string;
  en: string;
};

/** Shared language chips (not business-type-specific) */
export const LANGUAGE_OPTION_CHIPS: ChipDef[] = [
  { id: "lang_es", es: "Español", en: "Spanish" },
  { id: "lang_en", es: "Inglés", en: "English" },
  { id: "lang_otro", es: "Otro", en: "Other" },
];

export type BusinessTypePreset = {
  id: string;
  internalGroup: ServiciosInternalGroup;
  labelEs: string;
  labelEn: string;
  suggestedServices: ChipDef[];
  reasonsToChoose: ChipDef[];
  quickFacts: ChipDef[];
  /** Primary CTA label options (single select) */
  primaryCtaOptions: ChipDef[];
  /** Extra secondary CTA multi-select options */
  secondaryCtaOptions: ChipDef[];
};

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DayHoursRow = {
  day: DayKey;
  closed: boolean;
  open: string;
  close: string;
};

export type GalleryItem = {
  id: string;
  url: string;
  /** "file" | "url" for future persistence hints */
  source: "file" | "url";
};

/** External video links only in the application UI (gate SERVICIOS-GATE-01). */
export const SERVICIOS_MAX_VIDEO_URLS = 4;

export type VideoItem = {
  id: string;
  url: string;
  source: "file" | "url";
  isPrimary?: boolean;
  /** After Mux direct upload (publish prep or future inline upload). */
  muxPlaybackId?: string;
  muxAssetId?: string;
  muxThumbnailUrl?: string;
  /** When publish prep could not persist a playable video (Mux/blob failure). */
  muxSkipReason?: string;
};

export function shortenServiciosVideoUrlDisplay(url: string, max = 56): string {
  const t = url.trim();
  if (!t) return "—";
  if (t.startsWith("data:")) return t.length > 28 ? `${t.slice(0, 28)}…` : t;
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

/** Normalize video list for storage/preview (up to 4; preserves legacy file rows). */
export function normalizeServiciosApplicationVideos(videos: VideoItem[]): VideoItem[] {
  let list = videos
    .filter((v) => v && typeof v.url === "string" && v.url.trim().length > 0)
    .map((v) => ({
      ...v,
      url: v.url.trim(),
      isPrimary: v.isPrimary === true,
    }))
    .slice(0, SERVICIOS_MAX_VIDEO_URLS);
  if (list.length > 0 && !list.some((v) => v.isPrimary === true)) {
    list = list.map((v, i) => ({ ...v, isPrimary: i === 0 }));
  }
  return list;
}

export type TestimonialRow = {
  id: string;
  authorName: string;
  quote: string;
};

/** One promo slot in the classified Servicios form (Phase 7A — up to 4). */
export type ClasificadosServiciosPromoRow = {
  title: string;
  details: string;
  link: string;
  imageUrl: string;
  pdfUrl: string;
  /** Original filename when uploaded from device (display only). */
  pdfFileName: string;
  /** Byte size when uploaded from device (display only). */
  pdfFileSizeBytes: number;
  primaryAsset: "none" | "link" | "image" | "pdf";
  qrLater: boolean;
};

/** Featured coupon row (paid add-on) */
export type ClasificadosServiciosCouponRow = {
  title: string;
  description: string;
  regularPrice: string;
  specialPrice: string;
  savings: string;
  imageUrl: string;
  url: string;
  couponCode: string;
  expirationDate: string;
  redemptionNote: string;
  ctaLabel: string;
};

export type ClasificadosServiciosApplicationState = {
  /**
   * Current stepped UI index (0-based), persisted for preview roundtrips.
   * Must stay in sync with `SERVICIOS_APPLICATION_STEP_COUNT`.
   */
  applicationStepIndex: number;
  /** Selected product type from checkpoint */
  listingProduct: string;
  /** Base monthly price from checkpoint */
  baseMonthlyPrice: number;
  /** Category plan label for display */
  categoryPlan: string;
  /** Coupon add-on enabled flag */
  couponsAddOn: boolean;
  /** Coupon monthly price when active */
  couponsMonthlyPrice: number;
  businessTypeId: string;
  businessName: string;
  /** Custom service description when "Otro servicio" is selected */
  customServiceDescription?: string;
  city: string;
  /** State / Province / Region for discovery (defaults to CA for US, free text for non-US) */
  state: string;
  /** Country for discovery (defaults to United States) */
  country: string;
  /** Optional public storefront / mailing address (distinct from discovery `city` anchor). */
  physicalStreet: string;
  physicalSuite: string;
  physicalAddressCity: string;
  physicalRegion: string;
  physicalCountry: string;
  physicalPostalCode: string;
  serviceAreaNotes: string;
  phone: string;
  /** Optional second line — same digit rules as `phone` */
  phoneOffice: string;
  website: string;
  whatsapp: string;
  /** Public WhatsApp Business / profile URL if the number field is not used */
  whatsappBusinessUrl: string;
  /**
   * Dedicated SMS/call-to-message number for quote & inquiry CTAs (distinct from main/office phone and WhatsApp).
   */
  quoteMessagePhone: string;
  /** Advertiser email — shown when `enableEmail` */
  email: string;
  /** Chip ids from LANGUAGE_OPTION_CHIPS */
  languageIds: string[];
  /**
   * When "Otro" is selected: one language per line (also accepts comma/semicolon-separated paste).
   * Legacy `languageOtherNote` is migrated in normalize.
   */
  languageOtherLines: string;
  logoUrl: string;
  coverUrl: string;
  gallery: GalleryItem[];
  /** Up to four gallery ids, in display order, for the main shell grid */
  featuredGalleryIds: string[];
  videos: VideoItem[];
  aboutText: string;
  specialtiesLine: string;
  selectedServiceIds: string[];
  /** Free-text services the advertiser added (trimmed); independent of preset chip cap */
  customServicesOffered: string[];
  /** Short free-text service when presets do not cover it */
  customServiceLabel: string;
  /** Legacy single custom chip flag — migrated into `customServicesOffered` in normalize; not used for caps */
  customServiceIncluded: boolean;
  selectedReasonIds: string[];
  /** Short label — paired with `customReasonIncluded` */
  customReasonLabel: string;
  customReasonIncluded: boolean;
  selectedQuickFactIds: string[];
  /** Short label — paired with `customQuickFactIncluded` */
  customQuickFactLabel: string;
  customQuickFactIncluded: boolean;
  /** Preset highlight chip ids from `BUSINESS_HIGHLIGHT_PRESET_CHIPS` */
  selectedBusinessHighlightIds: string[];
  /** Advertiser-typed highlight lines (trimmed in normalize / caps) */
  customBusinessHighlights: string[];
  /** Pending custom highlight input (flushed on Añadir / Siguiente) */
  customBusinessHighlightLabel: string;
  /** Interest in Leonix verification — does not grant a badge; ops-controlled later */
  leonixVerifiedInterest: boolean;
  /** contact method toggles */
  enableCall: boolean;
  enableMessage: boolean;
  enableWhatsapp: boolean;
  enableWebsite: boolean;
  enableEmail: boolean;
  /** @deprecated Preset-driven CTA — kept for stored drafts; shell uses fixed Leonix priority */
  primaryCtaId: string;
  /** @deprecated */
  secondaryCtaIds: string[];
  socialInstagram: string;
  socialFacebook: string;
  socialYoutube: string;
  socialTiktok: string;
  socialLinkedin: string;
  socialX: string;
  socialSnapchat: string;
  googleReviewsUrl: string;
  googleBusinessUrl: string;
  yelpReviewsUrl: string;
  extraLink1Url: string;
  extraLink1Label: string;
  extraLink2Url: string;
  extraLink2Label: string;
  hours: DayHoursRow[];
  testimonials: TestimonialRow[];
  /** Featured promotions — 1–4 rows; legacy single-promo fields migrate in normalize */
  promotions: ClasificadosServiciosPromoRow[];
  /** Featured coupons (paid add-on) — up to 4 rows when couponsAddOn is true */
  coupons: ClasificadosServiciosCouponRow[];
  /** Shared flyer for coupons/promotions — single image */
  couponFlyer: {
    imageUrl: string;
  };
  /** Shared more offers link — external URL and button label */
  couponMoreOffers: {
    url: string;
    buttonLabel: string;
  };
  /** Pre-publish attestations (same pattern as En Venta) */
  confirmListingAccurate: boolean;
  confirmPhotosRepresentBusiness: boolean;
  confirmCommunityRules: boolean;
  /** Canonical payment method ids (shared catalog) */
  paymentMethodIds: string[];
  /** Advertiser custom payment labels */
  customPaymentMethods: string[];
  /** Pending custom payment input — flushed on Add / Next */
  customPaymentMethodLabel: string;
  /** Standard amenities / options ids */
  amenityOptionIds: string[];
  /** Custom amenities / options labels */
  customAmenityOptions: string[];
  /** Pending custom amenity input (flushed on Next) */
  pendingCustomAmenityOption: string;
  /** Credentials, license & insurance (Phase 6A) */
  hasLicense: boolean;
  licenseType: string;
  licenseNumber: string;
  licenseAuthority: string;
  licenseExpiration: string;
  isInsured: boolean;
  insuranceType: string;
  certifications: string[];
  pendingCertification: string;
  licenseDocumentUrl: string;
  insuranceDocumentUrl: string;
};
