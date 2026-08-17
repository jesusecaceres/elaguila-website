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
  SharedConnectionHubHours,
  SharedConnectionHubHoursRow,
  SharedConnectionHubMode,
  SharedConnectionHubReviewLink,
  SharedConnectionHubSocialLink,
  SharedConnectionHubSocialPlatform,
  SharedConnectionHubTrustCue,
} from "./sharedConnectionHubContactTypes";

export type SharedConnectionHubContactSourceInput = {
  lang: "es" | "en";
  /** Which product mode this adapter is building for. Required — every adapter must be explicit,
   * the renderer trusts this instead of guessing from which fields happen to be populated. */
  mode: SharedConnectionHubMode;
  phoneTelHref?: string | null;
  smsHref?: string | null;
  whatsappHref?: string | null;
  emailMailto?: string | null;
  emailDisplay?: string | null;
  websiteHref?: string | null;
  bookingHref?: string | null;
  social?: Partial<Record<SharedConnectionHubSocialPlatform, string | null | undefined>>;
  googleReviewUrl?: string | null;
  yelpReviewUrl?: string | null;
  moreLinks?: { label?: string | null; url?: string | null }[];
  addressDisplay?: string | null;
  mapsHref?: string | null;
  mapEmbedSrc?: string | null;
  mapImageUrl?: string | null;
  /** Set true only when `addressDisplay` is a coarse (city/state/zip) fallback rather than a
   * street-level address — the adapter's own privacy decision, not derived here. */
  isApproximate?: boolean;
  hours?: {
    openNowLabel?: string | null;
    todayHoursLine?: string | null;
    weeklyRows?: { dayLabel: string; line: string; isToday?: boolean }[] | null;
    specialNote?: string | null;
  } | null;
  trustCues?: { kind: "featured" | "verified"; label?: string | null }[] | null;
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
  const booking = safeHref(input.bookingHref);
  if (booking) contact.bookingHref = booking;

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
      ? { addressDisplay, mapsHref, mapImageUrl, mapEmbedSrc, isApproximate: input.isApproximate === true }
      : undefined;

  const weeklyRows: SharedConnectionHubHoursRow[] = (input.hours?.weeklyRows ?? [])
    .filter((row) => row.dayLabel?.trim() && row.line?.trim())
    .map((row) => ({ dayLabel: row.dayLabel.trim(), line: row.line.trim(), isToday: row.isToday }));
  const hoursSource = input.hours;
  const hasHours = Boolean(
    hoursSource?.openNowLabel?.trim() ||
      hoursSource?.todayHoursLine?.trim() ||
      weeklyRows.length > 0 ||
      hoursSource?.specialNote?.trim(),
  );
  const hours: SharedConnectionHubHours | undefined = hasHours
    ? {
        openNowLabel: hoursSource?.openNowLabel?.trim() || undefined,
        todayHoursLine: hoursSource?.todayHoursLine?.trim() || undefined,
        weeklyRows: weeklyRows.length > 0 ? weeklyRows : undefined,
        specialNote: hoursSource?.specialNote?.trim() || undefined,
      }
    : undefined;

  const trustCues: SharedConnectionHubTrustCue[] = (input.trustCues ?? [])
    .filter((cue) => cue.label?.trim())
    .map((cue) => ({ kind: cue.kind, label: cue.label!.trim() }));

  return {
    lang: input.lang,
    mode: input.mode,
    contact,
    social,
    reviews,
    moreLinks,
    location,
    hours,
    trustCues: trustCues.length > 0 ? trustCues : undefined,
  };
}
