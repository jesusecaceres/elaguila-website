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
};

export type SharedConnectionHubLocation = {
  addressDisplay?: string;
  mapsHref?: string;
  mapEmbedSrc?: string;
  mapImageUrl?: string;
};

export type SharedConnectionHubContactViewModel = {
  lang: "es" | "en";
  contact: SharedConnectionHubContactActions;
  social: SharedConnectionHubSocialLink[];
  reviews: SharedConnectionHubReviewLink[];
  moreLinks: SharedConnectionHubCustomLink[];
  location?: SharedConnectionHubLocation;
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
