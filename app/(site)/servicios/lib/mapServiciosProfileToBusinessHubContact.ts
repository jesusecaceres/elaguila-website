import type { ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { buildServiciosGoogleMapsEmbedSrc } from "./serviciosBusinessHubMapEmbed";
import {
  buildQuoteSmsHref,
  resolveServiciosQuoteDestination,
} from "./serviciosContactActions";
import { resolveServiciosProfileDirectWhatsAppHref, resolveServiciosWhatsAppSocialRowHrefForDisplay } from "./serviciosWhatsAppHref";
import type {
  ServiciosBusinessHubContactViewModel,
  ServiciosBusinessHubCustomLink,
  ServiciosBusinessHubSocialLink,
} from "./serviciosBusinessHubContactTypes";

function pushSocial(
  out: ServiciosBusinessHubSocialLink[],
  platform: ServiciosBusinessHubSocialLink["platform"],
  url: string | undefined,
): void {
  const t = (url ?? "").trim();
  if (!t) return;
  out.push({ platform, url: t });
}

/**
 * Maps resolved Servicios profile → Business Hub card view model.
 * Only includes fields backed by existing published listing data (no invented URLs or ratings).
 */
export function mapServiciosProfileToBusinessHubContact(
  profile: ServiciosProfileResolved,
  lang: ServiciosBusinessHubContactViewModel["lang"],
): ServiciosBusinessHubContactViewModel {
  const c = profile.contact;
  const social = c.socialLinks;

  const quote = resolveServiciosQuoteDestination(profile, lang);
  const smsHref =
    quote?.kind === "sms"
      ? quote.href
      : c.quoteMessagePhone
        ? buildQuoteSmsHref(c.quoteMessagePhone, lang) ?? undefined
        : undefined;

  const contactActions: ServiciosBusinessHubContactViewModel["contact"] = {};
  if (c.phoneTelHref) contactActions.hasCall = true;
  if (smsHref && (quote?.kind === "sms" || c.messageEnabled)) contactActions.messageSmsHref = smsHref;
  const waHref = resolveServiciosProfileDirectWhatsAppHref(c);
  if (waHref) contactActions.whatsappHref = waHref;
  if (c.emailMailtoHref) {
    contactActions.emailMailto = c.emailMailtoHref;
    contactActions.emailDisplay = c.email?.trim() || undefined;
  }

  const waSocialHref = resolveServiciosWhatsAppSocialRowHrefForDisplay(social?.whatsappProfile, waHref);
  const socialLinks: ServiciosBusinessHubSocialLink[] = [];
  pushSocial(socialLinks, "facebook", social?.facebook);
  pushSocial(socialLinks, "instagram", social?.instagram);
  pushSocial(socialLinks, "tiktok", social?.tiktok);
  pushSocial(socialLinks, "youtube", social?.youtube);
  pushSocial(socialLinks, "linkedin", social?.linkedin);
  pushSocial(socialLinks, "x", social?.x);
  pushSocial(socialLinks, "snapchat", social?.snapchat);
  pushSocial(socialLinks, "whatsapp", waSocialHref ?? undefined);

  const reviews: ServiciosBusinessHubContactViewModel["reviews"] = [];
  const googleRev = profile.contact.externalReviewLinks?.google?.trim();
  if (googleRev) {
    reviews.push({
      id: "google_review",
      label: lang === "en" ? "Google Reviews" : "Opiniones en Google",
      url: googleRev,
    });
  }
  const yelpRev = profile.contact.externalReviewLinks?.yelp?.trim();
  if (yelpRev) {
    reviews.push({
      id: "yelp",
      label: lang === "en" ? "Yelp Reviews" : "Opiniones en Yelp",
      url: yelpRev,
    });
  }

  const moreLinks: ServiciosBusinessHubCustomLink[] = [];
  if (c.websiteHref) {
    moreLinks.push({
      label: lang === "en" ? "Website" : "Sitio web",
      url: c.websiteHref,
    });
  }
  const googleBusiness = social?.googleBusiness?.trim();
  if (googleBusiness) {
    moreLinks.push({
      label: lang === "en" ? "Google Business" : "Google Business",
      url: googleBusiness,
    });
  }
  if (googleRev) {
    moreLinks.push({
      label: lang === "en" ? "Google Reviews" : "Google Reviews",
      url: googleRev,
    });
  }
  if (yelpRev) {
    moreLinks.push({
      label: lang === "en" ? "Yelp" : "Yelp",
      url: yelpRev,
    });
  }
  for (const row of profile.contact.extraLinks ?? []) {
    const url = row.url?.trim();
    if (!url) continue;
    moreLinks.push({ label: row.label?.trim() || (lang === "en" ? "Additional link" : "Enlace adicional"), url });
    if (moreLinks.length >= 6) break;
  }

  const addressDisplay = c.physicalAddressDisplay?.trim() || profile.hero.locationSummary?.trim() || "";
  const mapImageUrl = profile.serviceAreas?.mapImageUrl?.trim() || undefined;
  const mapEmbedSrc = buildServiciosGoogleMapsEmbedSrc(addressDisplay);
  const location =
    addressDisplay || c.mapsSearchHref || mapImageUrl || mapEmbedSrc
      ? {
          addressDisplay,
          mapsHref: c.mapsSearchHref,
          ...(mapImageUrl ? { mapImageUrl } : {}),
          ...(mapEmbedSrc ? { mapEmbedSrc } : {}),
        }
      : undefined;

  const showLeonixVerifiedCue = profile.hero.badges.some((b) => b.kind === "verified");

  return {
    lang,
    showLeonixVerifiedCue,
    contact: contactActions,
    social: socialLinks,
    reviews,
    moreLinks: moreLinks.slice(0, 6),
    location:
      location?.addressDisplay?.trim() ||
      location?.mapsHref ||
      location?.mapEmbedSrc ||
      location?.mapImageUrl
        ? location
        : undefined,
  };
}

export function serviciosBusinessHubHasVisibleContent(
  vm: ServiciosBusinessHubContactViewModel,
  opts?: { hasPrimaryQuote?: boolean; hasHours?: boolean; isFeatured?: boolean },
): boolean {
  const hasContact = Boolean(
    vm.contact.hasCall ||
      vm.contact.messageSmsHref ||
      vm.contact.whatsappHref ||
      vm.contact.emailMailto,
  );
  return (
    hasContact ||
    vm.social.length > 0 ||
    vm.reviews.length > 0 ||
    vm.moreLinks.length > 0 ||
    Boolean(vm.location?.addressDisplay?.trim() || vm.location?.mapsHref || vm.location?.mapEmbedSrc || vm.location?.mapImageUrl) ||
    vm.showLeonixVerifiedCue ||
    Boolean(opts?.hasPrimaryQuote) ||
    Boolean(opts?.hasHours) ||
    Boolean(opts?.isFeatured)
  );
}
