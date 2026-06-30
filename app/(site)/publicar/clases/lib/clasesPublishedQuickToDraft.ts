import type { Lang } from "@/app/clasificados/config/clasificadosHub";
/**
 * WYSIWYG trace — Clases quick published detail:
 * - Public page: `clasificados/anuncio/[id]/page.tsx` → `ClasesPublishedQuickAd` → `ClasesQuickAdCanvas` (embedded).
 * - Preview: `publicar/clases/quick/preview` → `CommunityQuickPublicDetailShell` → same `ClasesQuickAdCanvas` (embedded).
 * - Source fields: Supabase `detail_pairs` (Leonix:*) + listing row (title, blurb, city, images, contact_*).
 */
import {
  detailPairsToMap,
  isCommunityQuickListing,
  parseWeeklyScheduleJson,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import { digitsOnly, formatPhoneInputDisplay } from "@/app/(site)/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import type { EmpleosImageItem } from "@/app/publicar/empleos/shared/media/empleosMediaTypes";
import { normalizeWeeklyScheduleArray } from "@/app/(site)/publicar/community/shared/lib/communityWeeklySchedule";
import { extractCommunityQuickUserDescriptionFromPublishedBlurb } from "@/app/(site)/publicar/community/shared/lib/communityPublishedBlurbExtract";
import {
  emptyClasesQuickDraft,
  type ClasesClassLinks,
  type ClasesQuickDraft,
  type CommunityPrimaryCta,
} from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";
import { CLASES_CATEGORY_LEGACY_MAP } from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";

export type ClasesPublishedListingLike = {
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

const CLASES_FREQ = new Set(["porClase", "porSesion", "porMes", "porCursoCompleto", "otro"]);

export function clasesPublishedQuickToDraft(
  detailPairs: unknown,
  listing: ClasesPublishedListingLike,
  lang: Lang,
): ClasesQuickDraft | null {
  const pairs = detailPairsToMap(detailPairs);
  if (!isCommunityQuickListing(pairs) || pairs["Leonix:communityKind"] !== "clases") return null;

  const d = emptyClasesQuickDraft();
  d.title = (listing.title[lang] ?? listing.title.es ?? "").trim();
  d.organizer = (pairs["Leonix:organizer"] ?? "").trim();
  let cat = (pairs["Leonix:classCategory"] ?? "").trim();
  if (CLASES_CATEGORY_LEGACY_MAP[cat]) cat = CLASES_CATEGORY_LEGACY_MAP[cat]!;
  d.category = cat;
  d.categoryCustom = (pairs["Leonix:classCategoryCustom"] ?? "").trim();

  const cct = pairs["Leonix:classCostType"] ?? "";
  d.classCostType = cct === "pagada" ? "pagada" : "gratis";
  const mode = pairs["Leonix:mode"] ?? "";
  d.mode =
    mode === "enLinea" || mode === "hibrida" || mode === "presencial" ? (mode as ClasesQuickDraft["mode"]) : "presencial";

  d.priceAmount = (pairs["Leonix:priceAmount"] ?? "").trim();
  const fq = pairs["Leonix:priceFrequency"] ?? "";
  d.priceFrequency = CLASES_FREQ.has(fq) ? (fq as ClasesQuickDraft["priceFrequency"]) : "porClase";
  d.priceNote = (pairs["Leonix:priceNote"] ?? "").trim();

  d.weeklySchedule = normalizeWeeklyScheduleArray(parseWeeklyScheduleJson(pairs["Leonix:weeklyScheduleJson"]), []);

  d.skillLevel = (pairs["Leonix:skillLevel"] ?? "").trim();
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

  const cl: ClasesClassLinks = {
    registrationUrl: (pairs["Leonix:clsRegistrationUrl"] ?? "").trim(),
    paymentUrl: (pairs["Leonix:clsPaymentUrl"] ?? "").trim(),
    ticketsUrl: (pairs["Leonix:clsTicketsUrl"] ?? "").trim(),
    donationUrl: (pairs["Leonix:clsDonationUrl"] ?? "").trim(),
    classMaterialsUrl: (pairs["Leonix:clsMaterialsUrl"] ?? "").trim(),
    syllabusUrl: (pairs["Leonix:clsSyllabusUrl"] ?? "").trim(),
    classGuideUrl: (pairs["Leonix:clsGuideUrl"] ?? "").trim(),
    instructorPageUrl: (pairs["Leonix:clsInstructorUrl"] ?? "").trim(),
    studentPortalUrl: (pairs["Leonix:clsStudentPortalUrl"] ?? "").trim(),
    vendorsResourcesUrl: (pairs["Leonix:clsVendorsUrl"] ?? "").trim(),
    foodVendorsUrl: (pairs["Leonix:clsFoodVendorsUrl"] ?? "").trim(),
    sponsorsUrl: (pairs["Leonix:clsSponsorsUrl"] ?? "").trim(),
    customLink1Label: (pairs["Leonix:clsCustom1Label"] ?? "").trim(),
    customLink1Url: (pairs["Leonix:clsCustom1Url"] ?? "").trim(),
    customLink2Label: (pairs["Leonix:clsCustom2Label"] ?? "").trim(),
    customLink2Url: (pairs["Leonix:clsCustom2Url"] ?? "").trim(),
  };
  d.classLinks = cl;

  d.primaryCta = pickPrimaryCta(pairs["Leonix:primaryCta"]);
  d.description = extractCommunityQuickUserDescriptionFromPublishedBlurb(listing.blurb[lang] ?? listing.blurb.es ?? "");
  d.images = listingUrlsToImages(listing.images);

  return d;
}
