import type { AutoDealerListing, DealerSocialKey } from "../types/autoDealerListing";
import type { AutosNegociosLang } from "./autosNegociosLang";
import { safeExternalHref } from "./dealerDraftSanitize";
import {
  resolveDealerBookingHref,
  resolveDealerOfficePhone,
  resolveDealerSmsPhone,
} from "./dealerContactResolve";
import { whatsAppHrefFromDisplay } from "./dealerWhatsappHref";
import { hrefForUserWebsiteUrl, phoneDigitsForTel } from "../components/autoDealerFormatters";
import { buildDealerDisplayAddress, buildDealerMapsHref } from "@/app/lib/clasificados/autos/autosDealerStructuredAddress";
import { dealerCustomLinksForOutput } from "@/app/lib/clasificados/autos/autosDealerCustomLinks";
import { dealerLanguagesForOutput } from "@/app/lib/clasificados/autos/autosDealerLanguages";
import type {
  AutosNegociosBusinessHubContactViewModel,
  AutosNegociosBusinessHubSocialLink,
  AutosNegociosBusinessHubSocialPlatform,
} from "./autosNegociosBusinessHubContactTypes";

const SOCIAL_PLATFORM_MAP: Partial<Record<DealerSocialKey, AutosNegociosBusinessHubSocialPlatform>> = {
  facebook: "facebook",
  instagram: "instagram",
  tiktok: "tiktok",
  youtube: "youtube",
  linkedin: "linkedin",
  x: "x",
  snapchat: "snapchat",
  pinterest: "pinterest",
  whatsappProfile: "whatsapp",
};

const SOCIAL_OUTPUT_ORDER: AutosNegociosBusinessHubSocialPlatform[] = [
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

function pushSocial(
  out: AutosNegociosBusinessHubSocialLink[],
  platform: AutosNegociosBusinessHubSocialPlatform,
  url: string | undefined,
): void {
  const href = safeExternalHref(url);
  if (!href) return;
  if (out.some((s) => s.platform === platform)) return;
  out.push({ platform, url: href });
}

export function mapAutosDealerToBusinessHubContact(
  data: AutoDealerListing,
  lang: AutosNegociosLang,
): AutosNegociosBusinessHubContactViewModel {
  const contact: AutosNegociosBusinessHubContactViewModel["contact"] = {};

  const waHref = whatsAppHrefFromDisplay(data.dealerWhatsapp ?? undefined);
  if (waHref) contact.whatsappHref = waHref;

  const office = resolveDealerOfficePhone(data);
  const telDigits = phoneDigitsForTel(office);
  if (telDigits.length >= 10) contact.callTelHref = `tel:${telDigits}`;

  const smsRaw = resolveDealerSmsPhone(data);
  const smsDigits = phoneDigitsForTel(smsRaw);
  if (smsDigits.length >= 10) contact.smsHref = `sms:${smsDigits}`;

  const bookingHref = resolveDealerBookingHref(data);
  if (bookingHref) contact.bookingHref = bookingHref;

  const websiteClickHref =
    hrefForUserWebsiteUrl(data.dealerWebsite) ?? safeExternalHref(data.dealerWebsite ?? undefined);
  if (websiteClickHref) contact.websiteHref = websiteClickHref;

  const emailRaw = data.dealerEmail?.trim();
  if (emailRaw) contact.emailMailto = `mailto:${encodeURIComponent(emailRaw)}`;

  const social: AutosNegociosBusinessHubSocialLink[] = [];
  const soc = data.dealerSocials ?? {};
  for (const [key, platform] of Object.entries(SOCIAL_PLATFORM_MAP) as [DealerSocialKey, AutosNegociosBusinessHubSocialPlatform][]) {
    pushSocial(social, platform, soc[key]);
  }
  social.sort(
    (a, b) => SOCIAL_OUTPUT_ORDER.indexOf(a.platform) - SOCIAL_OUTPUT_ORDER.indexOf(b.platform),
  );

  const reviews: AutosNegociosBusinessHubContactViewModel["reviews"] = [];
  const googleRev = safeExternalHref(data.googleReviewsUrl);
  if (googleRev) {
    reviews.push({
      id: "google",
      label: lang === "en" ? "Google Reviews" : "Opiniones en Google",
      url: googleRev,
    });
  }
  const yelpRev = safeExternalHref(data.yelpReviewsUrl);
  if (yelpRev) {
    reviews.push({
      id: "yelp",
      label: lang === "en" ? "Yelp Reviews" : "Opiniones en Yelp",
      url: yelpRev,
    });
  }

  const moreLinks = dealerCustomLinksForOutput(data.dealerCustomLinks, lang);
  const languages = dealerLanguagesForOutput(data.dealerLanguages);

  const addressLine = buildDealerDisplayAddress(data);
  const mapsHref = buildDealerMapsHref(data);
  const location =
    addressLine.trim() || mapsHref
      ? {
          addressDisplay: addressLine.trim(),
          mapsHref,
        }
      : undefined;

  return {
    lang,
    contact,
    social,
    reviews,
    moreLinks,
    languages: languages.length ? languages : undefined,
    location: location?.addressDisplay || location?.mapsHref ? location : undefined,
  };
}

export function autosNegociosBusinessHubHasContactContent(
  vm: AutosNegociosBusinessHubContactViewModel,
): boolean {
  const c = vm.contact;
  return (
    Boolean(c.whatsappHref || c.callTelHref || c.smsHref || c.bookingHref || c.websiteHref || c.emailMailto) ||
    vm.social.length > 0 ||
    vm.reviews.length > 0 ||
    vm.moreLinks.length > 0 ||
    (vm.languages?.length ?? 0) > 0 ||
    Boolean(vm.location?.addressDisplay?.trim() || vm.location?.mapsHref)
  );
}
