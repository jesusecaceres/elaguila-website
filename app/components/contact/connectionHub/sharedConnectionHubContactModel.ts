/**
 * Package D Build D2, Gate 4 — pure builder for the shared Connection Hub contact view model.
 *
 * Category-agnostic mirror of `mapServiciosProfileToBusinessHubContact.ts`'s logic: every field is
 * built defensively from raw optional source values, never invented. `buildSharedConnectionHubContact`
 * is the one function D3 category adapters call — each category writes a small "raw source → this
 * input shape" adapter, not another full mapper+card copy.
 */
import type {
  SharedConnectionHubContactViewModel,
  SharedConnectionHubCustomLink,
  SharedConnectionHubReviewLink,
  SharedConnectionHubSocialLink,
  SharedConnectionHubSocialPlatform,
} from "./sharedConnectionHubContactTypes";

export type SharedConnectionHubContactSourceInput = {
  lang: "es" | "en";
  phoneTelHref?: string | null;
  smsHref?: string | null;
  whatsappHref?: string | null;
  emailMailto?: string | null;
  emailDisplay?: string | null;
  websiteHref?: string | null;
  social?: Partial<Record<SharedConnectionHubSocialPlatform, string | null | undefined>>;
  googleReviewUrl?: string | null;
  yelpReviewUrl?: string | null;
  moreLinks?: { label?: string | null; url?: string | null }[];
  addressDisplay?: string | null;
  mapsHref?: string | null;
  mapEmbedSrc?: string | null;
  mapImageUrl?: string | null;
};

/** Rejects anything that isn't a genuine http(s) URL — never renders a `javascript:`/malformed href. */
export function isSafeExternalHref(raw: string | null | undefined): boolean {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function safeHref(raw: string | null | undefined): string | undefined {
  return isSafeExternalHref(raw) ? raw!.trim() : undefined;
}

const SOCIAL_PLATFORMS: SharedConnectionHubSocialPlatform[] = [
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "linkedin",
  "x",
  "snapchat",
  "pinterest",
  "whatsapp",
];

export function buildSharedConnectionHubContact(
  input: SharedConnectionHubContactSourceInput,
): SharedConnectionHubContactViewModel {
  const contact: SharedConnectionHubContactViewModel["contact"] = {};
  if ((input.phoneTelHref ?? "").trim()) contact.phoneTelHref = input.phoneTelHref!.trim();
  if ((input.smsHref ?? "").trim()) contact.smsHref = input.smsHref!.trim();
  if ((input.whatsappHref ?? "").trim()) contact.whatsappHref = input.whatsappHref!.trim();
  if ((input.emailMailto ?? "").trim()) {
    contact.emailMailto = input.emailMailto!.trim();
    contact.emailDisplay = input.emailDisplay?.trim() || undefined;
  }
  const website = safeHref(input.websiteHref);
  if (website) contact.websiteHref = website;

  const social: SharedConnectionHubSocialLink[] = [];
  for (const platform of SOCIAL_PLATFORMS) {
    const url = safeHref(input.social?.[platform]);
    if (url) social.push({ platform, url });
  }

  const reviews: SharedConnectionHubReviewLink[] = [];
  const googleUrl = safeHref(input.googleReviewUrl);
  if (googleUrl) {
    reviews.push({
      provider: "google",
      label: input.lang === "en" ? "Google Reviews" : "Opiniones en Google",
      url: googleUrl,
    });
  }
  const yelpUrl = safeHref(input.yelpReviewUrl);
  if (yelpUrl) {
    reviews.push({
      provider: "yelp",
      label: input.lang === "en" ? "Yelp Reviews" : "Opiniones en Yelp",
      url: yelpUrl,
    });
  }

  const moreLinks: SharedConnectionHubCustomLink[] = [];
  for (const row of input.moreLinks ?? []) {
    const url = safeHref(row.url);
    if (!url) continue;
    moreLinks.push({ label: row.label?.trim() || (input.lang === "en" ? "Link" : "Enlace"), url });
    if (moreLinks.length >= 6) break;
  }

  const addressDisplay = input.addressDisplay?.trim() || "";
  const mapsHref = safeHref(input.mapsHref);
  const mapImageUrl = safeHref(input.mapImageUrl);
  const mapEmbedSrc = input.mapEmbedSrc?.trim() || undefined;
  const location =
    addressDisplay || mapsHref || mapImageUrl || mapEmbedSrc
      ? { addressDisplay, mapsHref, mapImageUrl, mapEmbedSrc }
      : undefined;

  return { lang: input.lang, contact, social, reviews, moreLinks, location };
}
