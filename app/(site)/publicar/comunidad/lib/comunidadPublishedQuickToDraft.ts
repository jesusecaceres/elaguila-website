import type { Lang } from "@/app/clasificados/config/clasificadosHub";
/**
 * WYSIWYG trace — Comunidad quick published detail:
 * - Public: `clasificados/anuncio/[id]/page.tsx` → `ComunidadPublishedQuickAd` → `ComunidadQuickAdCanvas` (embedded).
 * - Preview: `publicar/comunidad/quick/preview` → `CommunityQuickPreviewCard` → same shell + canvas as published.
 * - Source: `detail_pairs` + listing row as in Clases mapper.
 */
import {
  detailPairsToMap,
  isCommunityQuickListing,
  parseAccessibilityKeysCsv,
  parseWeeklyScheduleJson,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import { digitsOnly, formatPhoneInputDisplay } from "@/app/(site)/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import type { EmpleosImageItem } from "@/app/publicar/empleos/shared/media/empleosMediaTypes";
import { normalizeWeeklyScheduleArray } from "@/app/(site)/publicar/community/shared/lib/communityWeeklySchedule";
import { extractCommunityQuickUserDescriptionFromPublishedBlurb } from "@/app/(site)/publicar/community/shared/lib/communityPublishedBlurbExtract";
import {
  emptyComunidadQuickDraft,
  type ComunidadEventLinks,
  type ComunidadQuickDraft,
  type CommunityPrimaryCta,
} from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";

export type ComunidadPublishedListingLike = {
  title: { es: string; en: string };
  blurb: { es: string; en: string };
  city: string;
  images?: string[] | null;
  contact_phone?: string | null;
  contact_email?: string | null;
};

function to10Display(rawDigits: string): string {
  const d = rawDigits.replace(/\D/g, "").slice(0, 10);
  return formatPhoneInputDisplay(d);
}

function listingUrlsToImages(urls: string[] | null | undefined): EmpleosImageItem[] {
  if (!urls?.length) return [];
  return urls.map((url, i) => ({
    id: `lst_${i}`,
    url,
    alt: "",
    isMain: i === 0,
  }));
}

function pickPrimaryCta(raw: string | undefined): CommunityPrimaryCta {
  const v = (raw ?? "").trim();
  if (v === "phone" || v === "whatsapp" || v === "email" || v === "website") return v;
  return "phone";
}

const COMUNIDAD_COST = new Set(["gratis", "pagado", "donacion", "noConfirmado"]);

export function comunidadPublishedQuickToDraft(
  detailPairs: unknown,
  listing: ComunidadPublishedListingLike,
  lang: Lang,
): ComunidadQuickDraft | null {
  const pairs = detailPairsToMap(detailPairs);
  if (!isCommunityQuickListing(pairs) || pairs["Leonix:communityKind"] !== "comunidad") return null;

  const d = emptyComunidadQuickDraft();
  d.title = (listing.title[lang] ?? listing.title.es ?? "").trim();
  d.organizer = (pairs["Leonix:organizer"] ?? "").trim();
  d.category = (pairs["Leonix:eventCategory"] ?? "").trim();
  d.categoryCustom = (pairs["Leonix:eventCategoryCustom"] ?? "").trim();

  const ec = pairs["Leonix:eventCost"] ?? "";
  d.eventCost = COMUNIDAD_COST.has(ec) ? (ec as ComunidadQuickDraft["eventCost"]) : "gratis";
  d.admissionNote = (pairs["Leonix:admissionNote"] ?? "").trim();
  d.date = (pairs["Leonix:eventDate"] ?? "").trim();
  d.eventEndDate = (pairs["Leonix:eventEndDate"] ?? "").trim();
  d.eventSessionStart = (pairs["Leonix:eventSessionStart"] ?? "").trim();
  d.eventSessionEnd = (pairs["Leonix:eventSessionEnd"] ?? "").trim();

  d.weeklySchedule = normalizeWeeklyScheduleArray(parseWeeklyScheduleJson(pairs["Leonix:weeklyScheduleJson"]), []);

  d.accessibilityKeys = parseAccessibilityKeysCsv(pairs["Leonix:accessibility"]);

  d.audience = (pairs["Leonix:audience"] ?? "").trim();
  d.registrationRequired = (pairs["Leonix:registrationRequired"] ?? "").trim();
  d.bringNote = (pairs["Leonix:bringNote"] ?? "").trim();

  d.publicCity = (listing.city ?? "").trim();
  d.state = (pairs["Leonix:state"] ?? "").trim();
  d.country = (pairs["Leonix:country"] ?? "").trim();
  d.zip = (pairs["Leonix:zip"] ?? "").trim();
  d.venue = (pairs["Leonix:venue"] ?? "").trim();
  d.addressLine1 = (pairs["Leonix:addressLine1"] ?? "").trim();
  d.addressLine2 = (pairs["Leonix:addressLine2"] ?? "").trim();
  d.website = (pairs["Leonix:website"] ?? "").trim();

  const pDig = (pairs["Leonix:phoneDigits"] ?? "").replace(/\D/g, "").slice(0, 10);
  const rowPhone = digitsOnly(String(listing.contact_phone ?? "")).slice(0, 10);
  const phoneDigits = pDig.length >= 10 ? pDig : rowPhone;
  d.phone = phoneDigits.length >= 10 ? to10Display(phoneDigits) : formatPhoneInputDisplay(String(listing.contact_phone ?? ""));

  const wDig = (pairs["Leonix:whatsappDigits"] ?? "").replace(/\D/g, "").slice(0, 10);
  d.whatsapp = wDig.length >= 10 ? to10Display(wDig) : "";

  const smsRaw = (pairs["Leonix:smsPhone"] ?? "").replace(/\D/g, "").slice(0, 10);
  d.smsPhone = smsRaw.length >= 10 ? to10Display(smsRaw) : "";

  d.email = String(listing.contact_email ?? "").trim();
  d.socialLinks.facebook = (pairs["Leonix:socialFacebook"] ?? "").trim();
  d.socialLinks.instagram = (pairs["Leonix:socialInstagram"] ?? "").trim();
  d.socialLinks.tiktok = (pairs["Leonix:socialTiktok"] ?? "").trim();
  d.socialLinks.youtube = (pairs["Leonix:socialYoutube"] ?? "").trim();
  d.socialLinks.xTwitter = (pairs["Leonix:socialXTwitter"] ?? "").trim();
  d.socialLinks.linkedin = (pairs["Leonix:socialLinkedin"] ?? "").trim();
  d.socialLinks.snapchat = (pairs["Leonix:socialSnapchat"] ?? "").trim();
  d.socialLinks.pinterest = (pairs["Leonix:socialPinterest"] ?? "").trim();

  const el: ComunidadEventLinks = {
    registrationUrl: (pairs["Leonix:registrationUrl"] ?? "").trim(),
    ticketsUrl: (pairs["Leonix:ticketsUrl"] ?? "").trim(),
    donationUrl: (pairs["Leonix:donationUrl"] ?? "").trim(),
    eventProgramUrl: (pairs["Leonix:eventProgramUrl"] ?? "").trim(),
    eventGuideUrl: (pairs["Leonix:eventGuideUrl"] ?? "").trim(),
    vendorListUrl: (pairs["Leonix:vendorListUrl"] ?? "").trim(),
    foodVendorsUrl: (pairs["Leonix:foodVendorsUrl"] ?? "").trim(),
    sponsorsUrl: (pairs["Leonix:sponsorsUrl"] ?? "").trim(),
    customLink1Label: (pairs["Leonix:customLink1Label"] ?? "").trim(),
    customLink1Url: (pairs["Leonix:customLink1Url"] ?? "").trim(),
    customLink2Label: (pairs["Leonix:customLink2Label"] ?? "").trim(),
    customLink2Url: (pairs["Leonix:customLink2Url"] ?? "").trim(),
  };
  d.eventLinks = el;

  d.primaryCta = pickPrimaryCta(pairs["Leonix:primaryCta"]);
  d.description = extractCommunityQuickUserDescriptionFromPublishedBlurb(listing.blurb[lang] ?? listing.blurb.es ?? "");
  d.images = listingUrlsToImages(listing.images);

  return d;
}
