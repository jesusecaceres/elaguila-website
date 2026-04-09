/**
 * Leonix Servicios — canonical public profile wire model (application → UI).
 * Map form/API fields into this shape; run through `resolveServiciosProfile` before rendering.
 */

export type ServiciosLang = "es" | "en";

export type ServiciosQuickFactKind =
  | "years_experience"
  | "response_time"
  | "free_estimate"
  | "emergency"
  | "mobile_service"
  | "same_day"
  | "bilingual"
  | "licensed_insured"
  | "custom";

export type ServiciosQuickFact = {
  kind: ServiciosQuickFactKind;
  /** Pre-localized label for current locale */
  label: string;
};

export type ServiciosHeroBadgeKind =
  | "verified"
  | "licensed"
  | "spanish"
  | "insured"
  | "background_check"
  | "custom";

export type ServiciosHeroBadge = {
  kind: ServiciosHeroBadgeKind;
  label: string;
};

/** Leonix-controlled service card look — used when no business-specific photo is provided */
export type ServiciosServiceVisualVariant =
  | "instalacion"
  | "mantenimiento"
  | "reparacion"
  | "consulta"
  | "emergencia"
  | "default";

export type ServiciosServiceCard = {
  id: string;
  title: string;
  secondaryLine: string;
  /** When omitted, shell renders a variant pattern card */
  imageUrl?: string;
  imageAlt: string;
  visualVariant?: ServiciosServiceVisualVariant;
};

export type ServiciosGalleryImage = {
  id: string;
  url: string;
  alt: string;
};

/** Optional tour / promo videos (draft-safe https or data: URLs) */
export type ServiciosGalleryVideo = {
  id: string;
  url: string;
  isPrimary?: boolean;
};

export type ServiciosTrustItem = {
  id: string;
  label: string;
  icon: "shield" | "shieldCheck" | "star" | "clock" | "heart" | "check";
};

export type ServiciosReview = {
  id: string;
  authorName: string;
  avatarUrl?: string;
  quote: string;
  rating?: number;
};

export type ServiciosServiceArea = {
  id: string;
  label: string;
  kind?: "city" | "neighborhood" | "zip" | "region";
};

/** One row in the weekly schedule (localized day label + hours line). */
export type ServiciosWeeklyHourRow = {
  dayLabel: string;
  line: string;
};

export type ServiciosHoursSummary = {
  /** e.g. "Hoy" / "Today" — paired with todayHoursLine for the hero panel */
  openNowLabel?: string;
  todayHoursLine?: string;
  /** Full week from the application — shown under the today line when present */
  weeklyRows?: ServiciosWeeklyHourRow[];
};

export type ServiciosPromoOffer = {
  id: string;
  headline: string;
  footnote?: string;
  /** Internal or relative promo link — sanitized before render */
  href?: string;
  /** Optional supporting assets (local-first data URLs or https) — Phase 5 can wire uploads */
  assetImageUrl?: string;
  assetPdfUrl?: string;
};

/** Identity — required for a routable profile */
export type ServiciosIdentity = {
  slug: string;
  businessName: string;
  /**
   * Leonix-controlled verification (e.g. published listing from ops).
   * Never set from advertiser self-serve; resolver injects the hero badge when true.
   */
  leonixVerified?: boolean;
};

/** Hero banner + overlay card */
export type ServiciosHeroBlock = {
  categoryLine?: string;
  logoUrl?: string;
  logoAlt?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  rating?: number;
  reviewCount?: number;
  badges?: ServiciosHeroBadge[];
  locationSummary?: string;
};

/** Optional social URLs (wire) — sanitized in resolver */
export type ServiciosContactSocialLinks = {
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
  whatsappUrl?: string;
};

/** Contact & primary actions (sticky panel) */
export type ServiciosContactBlock = {
  phone?: string;
  websiteUrl?: string;
  websiteLabel?: string;
  messageEnabled?: boolean;
  hours?: ServiciosHoursSummary;
  primaryCtaLabel?: string;
  secondaryCtaLabels?: string[];
  isFeatured?: boolean;
  featuredLabel?: string;
  socialLinks?: ServiciosContactSocialLinks;
  /** Optional mailing / storefront address (distinct from hero location summary line). */
  physicalStreet?: string;
  physicalSuite?: string;
  physicalCity?: string;
  physicalRegion?: string;
  physicalPostalCode?: string;
};

export type ServiciosAboutBlock = {
  text?: string;
  specialtiesLine?: string;
};

/** Cities / neighborhoods / ZIPs + optional static map asset */
export type ServiciosServiceAreasBlock = {
  items?: ServiciosServiceArea[];
  mapImageUrl?: string;
};

/**
 * Single canonical Servicios business profile (all business types share this shape).
 */
export type ServiciosBusinessProfile = {
  identity: ServiciosIdentity;
  hero: ServiciosHeroBlock;
  contact: ServiciosContactBlock;
  quickFacts?: ServiciosQuickFact[];
  about?: ServiciosAboutBlock;
  services?: ServiciosServiceCard[];
  gallery?: ServiciosGalleryImage[];
  /** Up to four gallery image ids, in display order, for the main shell grid; remainder are "more" */
  featuredGalleryIds?: string[];
  galleryVideos?: ServiciosGalleryVideo[];
  trust?: ServiciosTrustItem[];
  reviews?: ServiciosReview[];
  serviceAreas?: ServiciosServiceAreasBlock;
  promo?: ServiciosPromoOffer;
};

/**
 * Sanitized profile for presentation — safe strings, filtered arrays, normalized numbers.
 * Components should only consume this type (output of `resolveServiciosProfile`).
 */
export type ServiciosProfileResolved = {
  identity: { slug: string; businessName: string };
  hero: {
    categoryLine?: string;
    logoUrl?: string;
    logoAlt?: string;
    coverImageUrl?: string;
    coverImageAlt?: string;
    rating?: number;
    reviewCount?: number;
    badges: ServiciosHeroBadge[];
    locationSummary?: string;
  };
  contact: {
    phoneDisplay?: string;
    phoneTelHref?: string;
    websiteHref?: string;
    websiteLabel?: string;
    messageEnabled: boolean;
    hours?: {
      openNowLabel?: string;
      todayHoursLine?: string;
      weeklyRows?: ServiciosWeeklyHourRow[];
    };
    primaryCtaLabel?: string;
    secondaryCtaLabels?: string[];
    isFeatured: boolean;
    featuredLabel?: string;
    /** Sanitized external URLs only */
    socialLinks?: {
      instagram?: string;
      facebook?: string;
      youtube?: string;
      tiktok?: string;
      linkedin?: string;
      whatsapp?: string;
    };
    /** Formatted for display; omitted when no physical address provided */
    physicalAddressDisplay?: string;
    /** https://www.google.com/maps/search/... built in resolver */
    mapsSearchHref?: string;
  };
  quickFacts: ServiciosQuickFact[];
  about?: ServiciosAboutBlock;
  services: ServiciosServiceCard[];
  /** Main shell grid (up to four featured, or full gallery when no featured ids) */
  gallery: ServiciosGalleryImage[];
  /** Additional gallery images (future lightbox); empty when legacy / no featured split */
  galleryMore: ServiciosGalleryImage[];
  /** Up to two sanitized video URLs (https or draft data: URLs) */
  galleryVideos: ServiciosGalleryVideo[];
  trust: ServiciosTrustItem[];
  reviews: ServiciosReview[];
  serviceAreas: { items: ServiciosServiceArea[]; mapImageUrl?: string };
  /** Sanitized offer — only safe href exposed for links */
  promo?: {
    id: string;
    headline: string;
    footnote?: string;
    hrefSafe?: string;
    assetImageHrefSafe?: string;
    assetPdfHrefSafe?: string;
  };
};
