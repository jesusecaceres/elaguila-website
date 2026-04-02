/**
 * Public Servicios provider profile — one universal shape for all business types.
 * Map application fields to this model at the data layer; UI consumes only this type.
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
  /** Price line, e.g. "Desde $80" or "Cotización gratis" */
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
  /** Icon hint for mapping to react-icons */
  icon: "shield" | "shieldCheck" | "star" | "clock" | "heart" | "check";
};

export type ServiciosReview = {
  id: string;
  authorName: string;
  /** Optional avatar URL; initials used when absent */
  avatarUrl?: string;
  quote: string;
  rating?: number;
};

export type ServiciosServiceArea = {
  id: string;
  label: string;
  /** Optional icon for list display */
  kind?: "city" | "neighborhood" | "zip" | "region";
};

export type ServiciosHoursSummary = {
  /** Pre-localized open-now line */
  openNowLabel?: string;
  /** e.g. "8:00 AM - 6:00 PM" */
  todayHoursLine?: string;
};

export type ServiciosPromoOffer = {
  id: string;
  /** Main headline — may include markdown-like emphasis in string; render as JSX in component */
  headlineHtml?: string;
  headline: string;
  footnote?: string;
  /** Future: coupon deep link */
  href?: string;
};

export type ServiciosBusinessProfile = {
  slug: string;
  businessName: string;
  /** e.g. "Plumbing, Electrical & Remodeling" */
  categoryLine?: string;
  logoUrl?: string;
  logoAlt?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  rating?: number;
  reviewCount?: number;
  heroBadges?: ServiciosHeroBadge[];
  /** Short location line under hero */
  locationSummary?: string;
  quickFacts?: ServiciosQuickFact[];
  /** Rich text paragraphs (plain string); optional second line for specialties */
  aboutText?: string;
  aboutSpecialtiesLine?: string;
  services?: ServiciosServiceCard[];
  gallery?: ServiciosGalleryImage[];
  trustItems?: ServiciosTrustItem[];
  reviews?: ServiciosReview[];
  serviceAreas?: ServiciosServiceArea[];
  /** Optional static map image URL */
  serviceAreaMapImageUrl?: string;
  promo?: ServiciosPromoOffer;
  /** Featured / highlighted listing */
  isFeatured?: boolean;
  featuredLabel?: string;
  phone?: string;
  websiteUrl?: string;
  websiteLabel?: string;
  /** When false, hide Message CTA */
  messageEnabled?: boolean;
  hours?: ServiciosHoursSummary;
  /** Primary CTA — defaults handled in UI */
  primaryCtaLabel?: string;
};
