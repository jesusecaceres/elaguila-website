/**
 * Package D Build D2, Gate 4 — shared Connection Hub contact view model.
 *
 * Category-agnostic extraction of the proven Servicios Business Hub pattern
 * (`app/(site)/servicios/lib/serviciosBusinessHubContactTypes.ts` +
 * `mapServiciosProfileToBusinessHubContact.ts`). Servicios remains the canonical, unmodified proof
 * of this shape in production; this module exists so D3 category adoption has one real foundation
 * to extend instead of re-copying the pattern again.
 *
 * Every field is optional. No field renders a CTA unless the source data is genuinely present —
 * enforced by `sharedConnectionHubHasVisibleContent` and by callers only rendering when a value is
 * truthy. No fake provider ratings, no combined Google/Yelp rating, ever.
 */

export type SharedConnectionHubSocialPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "x"
  | "youtube"
  | "linkedin"
  | "snapchat"
  | "pinterest"
  | "whatsapp";

export type SharedConnectionHubSocialLink = {
  platform: SharedConnectionHubSocialPlatform;
  url: string;
};

export type SharedConnectionHubReviewProvider = "google" | "yelp";

export type SharedConnectionHubReviewLink = {
  provider: SharedConnectionHubReviewProvider;
  label: string;
  url: string;
  /** Only ever set from genuinely connected live provider data — never owner-typed, never invented.
   * Absent in D2 (no live API integration yet); reserved for a future gate. Google and Yelp values
   * must never be combined into a single number. */
  rating?: number;
  reviewCount?: number;
};

export type SharedConnectionHubCustomLink = {
  label: string;
  url: string;
};

export type SharedConnectionHubContactActions = {
  phoneTelHref?: string;
  smsHref?: string;
  whatsappHref?: string;
  emailMailto?: string;
  emailDisplay?: string;
  websiteHref?: string;
  bookingHref?: string;
};

export type SharedConnectionHubLocation = {
  addressDisplay?: string;
  mapsHref?: string;
  mapEmbedSrc?: string;
  mapImageUrl?: string;
  /** True when `addressDisplay` is a coarse (city/state/zip) line rather than a street-level
   * address — set by the category adapter's own privacy decision, never derived here. Drives an
   * "General area"/"Zona aproximada" label instead of implying an exact pin. */
  isApproximate?: boolean;
};

export type SharedConnectionHubHoursRow = {
  dayLabel: string;
  line: string;
  isToday?: boolean;
};

export type SharedConnectionHubHours = {
  openNowLabel?: string;
  todayHoursLine?: string;
  weeklyRows?: SharedConnectionHubHoursRow[];
  specialNote?: string;
};

export type SharedConnectionHubTrustCue = {
  kind: "featured" | "verified";
  label: string;
};

/** Which Business Hub product mode this view model was built for. The renderer trusts this flag
 * rather than re-deriving it from field presence — Listing Contact Card (Mode B) renderers never
 * render a social/reviews/moreLinks section, even if an adapter's underlying source data happens
 * to carry those fields (e.g. a private-seller draft type reused from a business listing type). */
export type SharedConnectionHubMode = "full_hub" | "listing_card";

export type SharedConnectionHubContactViewModel = {
  lang: "es" | "en";
  mode: SharedConnectionHubMode;
  contact: SharedConnectionHubContactActions;
  social: SharedConnectionHubSocialLink[];
  reviews: SharedConnectionHubReviewLink[];
  moreLinks: SharedConnectionHubCustomLink[];
  location?: SharedConnectionHubLocation;
  hours?: SharedConnectionHubHours;
  trustCues?: SharedConnectionHubTrustCue[];
};

export function sharedConnectionHubHasVisibleContent(vm: SharedConnectionHubContactViewModel): boolean {
  const hasContact = Boolean(
    vm.contact.phoneTelHref || vm.contact.smsHref || vm.contact.whatsappHref || vm.contact.emailMailto,
  );
  return (
    hasContact ||
    vm.social.length > 0 ||
    vm.reviews.length > 0 ||
    vm.moreLinks.length > 0 ||
    Boolean(
      vm.location?.addressDisplay?.trim() ||
        vm.location?.mapsHref ||
        vm.location?.mapEmbedSrc ||
        vm.location?.mapImageUrl,
    )
  );
}
