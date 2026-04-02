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

export type ServiciosServiceCard = {
  id: string;
  title: string;
  secondaryLine: string;
  imageUrl: string;
  imageAlt: string;
};

export type ServiciosGalleryImage = {
  id: string;
  url: string;
  alt: string;
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

export type ServiciosHoursSummary = {
  openNowLabel?: string;
  todayHoursLine?: string;
};

export type ServiciosPromoOffer = {
  id: string;
  headline: string;
  footnote?: string;
  /** Internal or relative promo link — sanitized before render */
  href?: string;
};

/** Identity — required for a routable profile */
export type ServiciosIdentity = {
  slug: string;
  businessName: string;
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

/** Contact & primary actions (sticky panel) */
export type ServiciosContactBlock = {
  phone?: string;
  websiteUrl?: string;
  websiteLabel?: string;
  messageEnabled?: boolean;
  hours?: ServiciosHoursSummary;
  primaryCtaLabel?: string;
  isFeatured?: boolean;
  featuredLabel?: string;
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
    hours?: { openNowLabel: string; todayHoursLine: string };
    primaryCtaLabel?: string;
    isFeatured: boolean;
    featuredLabel?: string;
  };
  quickFacts: ServiciosQuickFact[];
  about?: ServiciosAboutBlock;
  services: ServiciosServiceCard[];
  gallery: ServiciosGalleryImage[];
  trust: ServiciosTrustItem[];
  reviews: ServiciosReview[];
  serviceAreas: { items: ServiciosServiceArea[]; mapImageUrl?: string };
  /** Sanitized offer — only safe href exposed for links */
  promo?: { id: string; headline: string; footnote?: string; hrefSafe?: string };
};
