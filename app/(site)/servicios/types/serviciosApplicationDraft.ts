/**
 * Leonix Servicios — application / form draft model (pre-publication).
 * Map to `ServiciosBusinessProfile` via `mapServiciosApplicationDraftToBusinessProfile` only.
 *
 * Naming is stable for API parity (camelCase); backend snake_case maps 1:1 at the edge.
 */

import type {
  ServiciosHeroBadgeKind,
  ServiciosQuickFactKind,
  ServiciosServiceVisualVariant,
  ServiciosTrustItem,
} from "./serviciosBusinessProfile";

/** identity.slug · identity.businessName */
export type ServiciosApplicationIdentityDraft = {
  slug: string;
  businessName: string;
  /** Ops / published source only — not set from the advertiser form */
  leonixVerified?: boolean;
};

/**
 * Hero & basic business info.
 * categoryLine: optional explicit line; else built from primaryCategory + subcategory.
 */
export type ServiciosApplicationHeroDraft = {
  /** e.g. "Plomería" — combined with subcategory when categoryLine omitted */
  primaryCategory?: string;
  subcategory?: string;
  /** When set, overrides primaryCategory/subcategory join */
  categoryLine?: string;
  logoUrl?: string;
  logoAlt?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  rating?: number;
  reviewCount?: number;
  locationSummary?: string;
  badges?: ServiciosApplicationHeroBadgeDraft[];
};

export type ServiciosApplicationHeroBadgeDraft = {
  kind: ServiciosHeroBadgeKind;
  label: string;
};

export type ServiciosApplicationContactDraft = {
  phone?: string;
  phoneOffice?: string;
  /** Dedicated quote / SMS inquiry number (clasificados Servicios) */
  quoteMessagePhone?: string;
  /** Plain email local-part@domain — rendered as mailto: in shell when present */
  email?: string;
  websiteUrl?: string;
  websiteLabel?: string;
  messageEnabled?: boolean;
  hoursOpenNowLabel?: string;
  hoursTodayLine?: string;
  /** Mon→Sun localized rows for public weekly schedule */
  weeklyHoursRows?: { dayLabel: string; line: string }[];
  primaryCtaLabel?: string;
  /** Preset secondary CTA chip labels (localized at map time) */
  secondaryCtaLabels?: string[];
  isFeatured?: boolean;
  featuredLabel?: string;
  /** Raw advertiser URLs — mapped to wire `socialLinks` */
  socialInstagramUrl?: string;
  socialFacebookUrl?: string;
  socialYoutubeUrl?: string;
  socialTiktokUrl?: string;
  socialLinkedinUrl?: string;
  socialWhatsappUrl?: string;
  /** Optional public storefront / mailing address — shown in contact panel + maps when present */
  physicalStreet?: string;
  physicalSuite?: string;
  physicalCity?: string;
  physicalRegion?: string;
  physicalPostalCode?: string;
};

export type ServiciosApplicationAboutDraft = {
  aboutText?: string;
  specialtiesLine?: string;
};

/** License / insurance / certifications (clasificados Servicios Phase 6A). */
export type ServiciosApplicationCredentialsDraft = {
  hasLicense?: boolean;
  licenseType?: string;
  licenseNumber?: string;
  licenseAuthority?: string;
  licenseExpiration?: string;
  isInsured?: boolean;
  insuranceType?: string;
  certifications?: string[];
  /** Flushed on step Next where applicable; omitted on wire profile */
  pendingCertification?: string;
  licenseDocumentUrl?: string;
  insuranceDocumentUrl?: string;
};

export type ServiciosApplicationServiceDraft = {
  id: string;
  title: string;
  secondaryLine?: string;
  imageUrl?: string;
  imageAlt?: string;
  visualVariant?: ServiciosServiceVisualVariant;
};

export type ServiciosApplicationGalleryItemDraft = {
  id: string;
  url: string;
  alt?: string;
};

export type ServiciosApplicationGalleryVideoDraft = {
  id: string;
  url: string;
  isPrimary?: boolean;
};

export type ServiciosApplicationTrustRowDraft = {
  id: string;
  label: string;
  icon: ServiciosTrustItem["icon"];
};

export type ServiciosApplicationReviewDraft = {
  id: string;
  authorName: string;
  quote: string;
  rating?: number;
  avatarUrl?: string;
};

export type ServiciosApplicationServiceAreaDraft = {
  id: string;
  label: string;
  kind?: "city" | "neighborhood" | "zip" | "region";
};

export type ServiciosApplicationServiceAreasDraft = {
  items?: ServiciosApplicationServiceAreaDraft[];
  mapImageUrl?: string;
};

export type ServiciosApplicationPromoDraft = {
  id: string;
  headline: string;
  footnote?: string;
  href?: string;
  assetImageUrl?: string;
  assetPdfUrl?: string;
  /** Application hint for future coupon pipeline (not rendered in shell yet) */
  primaryAssetKind?: "link" | "image" | "pdf";
  /** Reserved for QR attachment phase */
  qrIntent?: boolean;
};

export type ServiciosApplicationQuickFactDraft = {
  kind: ServiciosQuickFactKind;
  label: string;
};

/** Trust / conversion highlight line (preset or custom), localized at map time */
export type ServiciosApplicationHighlightDraft = {
  id: string;
  label: string;
};

/**
 * Full Servicios business application draft — one group per form step / persistence blob.
 */
export type ServiciosApplicationDraft = {
  identity: ServiciosApplicationIdentityDraft;
  hero: ServiciosApplicationHeroDraft;
  contact: ServiciosApplicationContactDraft;
  quickFacts?: ServiciosApplicationQuickFactDraft[];
  about?: ServiciosApplicationAboutDraft;
  services?: ServiciosApplicationServiceDraft[];
  gallery?: ServiciosApplicationGalleryItemDraft[];
  featuredGalleryIds?: string[];
  galleryVideos?: ServiciosApplicationGalleryVideoDraft[];
  trust?: ServiciosApplicationTrustRowDraft[];
  /** Business highlights (Clasificados Servicios Phase 3) */
  highlights?: ServiciosApplicationHighlightDraft[];
  reviews?: ServiciosApplicationReviewDraft[];
  serviceAreas?: ServiciosApplicationServiceAreasDraft;
  promo?: ServiciosApplicationPromoDraft;
  /** Accepted payment methods (Leonix Servicios); sanitized on map/resolve */
  paymentMethodIds?: string[];
  /** Custom payment method labels; sanitized on map/resolve */
  customPaymentMethods?: string[];
  /** Pending custom payment input (flushed on preview navigation where applicable) */
  customPaymentMethodLabel?: string;
  /** Standard amenities / options ids; sanitized on map/resolve */
  amenityOptionIds?: string[];
  /** Custom amenities / options labels; sanitized on map/resolve */
  customAmenityOptions?: string[];
  /** Pending custom amenity input (flushed on step Next where applicable) */
  pendingCustomAmenityOption?: string;
  /** Credentials, license & insurance (optional) */
  credentials?: ServiciosApplicationCredentialsDraft;
};
