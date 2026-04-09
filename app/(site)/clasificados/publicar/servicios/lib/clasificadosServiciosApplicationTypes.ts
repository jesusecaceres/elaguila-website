/**
 * Clasificados Servicios application state (advertiser-facing).
 * Step 3 will map this into `ServiciosApplicationDraft` / shell slots — not exposed in UI.
 */

export type ServiciosLang = "es" | "en";

/** Internal grouping for filters/analytics — never shown in the form copy */
export type ServiciosInternalGroup =
  | "home_trade"
  | "legal"
  | "health"
  | "beauty"
  | "automotive"
  | "education"
  | "pets"
  | "moving"
  | "cleaning"
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

export type VideoItem = {
  id: string;
  url: string;
  source: "file" | "url";
  isPrimary?: boolean;
};

export type TestimonialRow = {
  id: string;
  authorName: string;
  quote: string;
};

export type ClasificadosServiciosApplicationState = {
  /**
   * Current stepped UI index (0-based), persisted for preview roundtrips.
   * Must stay in sync with `SERVICIOS_APPLICATION_STEP_COUNT`.
   */
  applicationStepIndex: number;
  businessTypeId: string;
  businessName: string;
  city: string;
  /** Optional public storefront / mailing address (distinct from discovery `city` anchor). */
  physicalStreet: string;
  physicalSuite: string;
  physicalAddressCity: string;
  physicalRegion: string;
  physicalPostalCode: string;
  serviceAreaNotes: string;
  phone: string;
  /** Optional second line — same digit rules as `phone` */
  phoneOffice: string;
  website: string;
  whatsapp: string;
  /** Public WhatsApp Business / profile URL if the number field is not used */
  whatsappBusinessUrl: string;
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
  /** Short free-text service when presets do not cover it */
  customServiceLabel: string;
  /** Interest in Leonix verification — does not grant a badge; ops-controlled later */
  leonixVerifiedInterest: boolean;
  selectedReasonIds: string[];
  selectedQuickFactIds: string[];
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
  hours: DayHoursRow[];
  testimonials: TestimonialRow[];
  offerTitle: string;
  offerDetails: string;
  offerLink: string;
  /** Local-first promo attachments (data URLs or https) — publish wiring comes later */
  offerImageUrl: string;
  offerPdfUrl: string;
  /**
   * Which attachment the advertiser treats as primary (UI + future publish).
   * Does not change the promo shell in this phase.
   */
  offerPrimaryAsset: "none" | "link" | "image" | "pdf";
  /** Placeholder intent for a future QR asset on the coupon card */
  offerQrLater: boolean;
  /** Pre-publish attestations (same pattern as En Venta) */
  confirmListingAccurate: boolean;
  confirmPhotosRepresentBusiness: boolean;
  confirmCommunityRules: boolean;
};
