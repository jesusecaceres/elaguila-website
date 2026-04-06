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
  websiteUrl?: string;
  websiteLabel?: string;
  messageEnabled?: boolean;
  hoursOpenNowLabel?: string;
  hoursTodayLine?: string;
  primaryCtaLabel?: string;
  isFeatured?: boolean;
  featuredLabel?: string;
  /** Raw advertiser URLs — mapped to wire `socialLinks` */
  socialInstagramUrl?: string;
  socialFacebookUrl?: string;
  socialYoutubeUrl?: string;
  socialTiktokUrl?: string;
  socialLinkedinUrl?: string;
  socialWhatsappUrl?: string;
};

export type ServiciosApplicationAboutDraft = {
  aboutText?: string;
  specialtiesLine?: string;
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
  reviews?: ServiciosApplicationReviewDraft[];
  serviceAreas?: ServiciosApplicationServiceAreasDraft;
  promo?: ServiciosApplicationPromoDraft;
};
