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
  { id: "lang_bi", es: "Bilingüe", en: "Bilingual" },
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
  businessTypeId: string;
  businessName: string;
  city: string;
  serviceAreaNotes: string;
  phone: string;
  website: string;
  whatsapp: string;
  /** Chip ids from LANGUAGE_OPTIONS */
  languageIds: string[];
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
  /** primary CTA: preset chip id from current preset's primaryCtaOptions */
  primaryCtaId: string;
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
};
