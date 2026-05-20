import type { ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import {
  buildQuoteSmsHref,
  resolveServiciosQuoteDestination,
} from "./serviciosContactActions";
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
  if (social?.whatsapp?.trim()) contactActions.whatsappHref = social.whatsapp.trim();
  if (c.emailMailtoHref) {
    contactActions.emailMailto = c.emailMailtoHref;
    contactActions.emailDisplay = c.email?.trim() || undefined;
  }

  const socialLinks: ServiciosBusinessHubSocialLink[] = [];
  pushSocial(socialLinks, "facebook", social?.facebook);
  pushSocial(socialLinks, "instagram", social?.instagram);
  pushSocial(socialLinks, "tiktok", social?.tiktok);
  pushSocial(socialLinks, "youtube", social?.youtube);
  pushSocial(socialLinks, "linkedin", social?.linkedin);
  // X, Snapchat, Pinterest — future profile fields; omitted when absent.

  const moreLinks: ServiciosBusinessHubCustomLink[] = [];
  if (c.websiteHref) {
    const label =
      c.websiteLabel?.trim() ||
      (lang === "en" ? "Website" : "Sitio web");
    moreLinks.push({ label, url: c.websiteHref });
  }

  const location =
    c.physicalAddressDisplay?.trim() || c.mapsSearchHref
      ? {
          addressDisplay: c.physicalAddressDisplay?.trim() || profile.hero.locationSummary?.trim() || "",
          mapsHref: c.mapsSearchHref,
        }
      : undefined;

  const showLeonixVerifiedCue = profile.hero.badges.some((b) => b.kind === "verified");

  return {
    lang,
    showLeonixVerifiedCue,
    contact: contactActions,
    social: socialLinks,
    reviews: [],
    moreLinks: moreLinks.slice(0, 3), // website + up to 2 custom (future)
    location: location?.addressDisplay || location?.mapsHref ? location : undefined,
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
    Boolean(vm.location?.addressDisplay?.trim() || vm.location?.mapsHref) ||
    vm.showLeonixVerifiedCue ||
    Boolean(opts?.hasPrimaryQuote) ||
    Boolean(opts?.hasHours) ||
    Boolean(opts?.isFeatured)
  );
}
