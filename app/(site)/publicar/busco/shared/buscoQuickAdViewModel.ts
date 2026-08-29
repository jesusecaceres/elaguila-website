import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";
import { digitsOnly } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import { normalizeWebsiteForOpen } from "@/app/publicar/community/shared/lib/communityWebsiteAndSocial";
import { detailPairsToMap } from "@/app/(site)/clasificados/busco/shared/buscoListingDetailPairs";
import { resolveBuscoTypePublicLabel } from "@/app/(site)/clasificados/busco/shared/buscoPublicLabel";
import { resolveBuscoBudgetDisplay } from "@/app/publicar/busco/shared/buscoBudgetDisplay";
import type { BuscoQuickDraft, BuscoTypeSlug, BuscoUrgency } from "@/app/publicar/busco/shared/buscoQuickTypes";
import type { BuscoPublishedListingLike } from "@/app/(site)/clasificados/busco/BuscoQuickPublishedAd";

export type BuscoQuickAdTypeDetails = {
  preferredCondition: string;
  workType: string;
  workSkills: string;
  workAvailability: string;
  transportOrigin: string;
  transportDestination: string;
  volunteersCount: string;
  whenNeeded: string;
};

export type BuscoQuickAdViewModel = {
  title: string;
  typeSlug: BuscoTypeSlug;
  typeLabel: string;
  description: string;
  budgetLabel: string;
  budgetDisplay: string | null;
  urgency: BuscoUrgency;
  typeDetails: BuscoQuickAdTypeDetails;
  heroSrc: string | null;
  locationSummary: string;
  locationDetail: string;
  mapQuery: string | null;
  phoneDigits: string;
  whatsappDigits: string;
  smsDigits: string;
  email: string;
  facebookHref: string | null;
  instagramHref: string | null;
  tiktokHref: string | null;
  youtubeHref: string | null;
  otherLinkHref: string | null;
  otherLinkLabel: string;
  leonixAdId: string | null;
  listingId: string | null;
};

/** Section G — legacy 3-state urgency values (pronto/urgente) map onto the new 4-state model for
 *  published rows written before Gate 4. No new state is invented — this only relabels stored history. */
function coercePublishedUrgency(raw: string): BuscoUrgency {
  const s = raw.trim();
  if (s === "pronto") return "esta_semana";
  if (s === "urgente") return "urgente_hoy";
  if (s === "esta_semana" || s === "lo_antes_posible" || s === "urgente_hoy") return s;
  return "normal";
}

function buildLocationParts(input: {
  city: string;
  state: string;
  country: string;
  zip: string;
  zone: string;
}): { summary: string; detail: string; mapQuery: string | null } {
  const cityRaw = input.city.trim();
  const state = input.state.trim();
  const zip = input.zip.trim();
  const country = input.country.trim();
  const zone = input.zone.trim();

  const cityStateLine = [
    cityRaw,
    state && zip ? `${state} ${zip}` : state || zip,
  ]
    .filter(Boolean)
    .join(", ");

  const detail = [cityStateLine, country, zone].filter(Boolean).join(" · ");
  const summary = cityStateLine || zone || country;
  const mapQuery = [zone, cityStateLine, country].filter(Boolean).join(", ") || null;

  return { summary, detail, mapQuery };
}

function resolveContactFields(draft: { phone: string; whatsapp: string; smsPhone: string; email: string }) {
  const phoneDigits = digitsOnly(draft.phone).slice(0, 15);
  const waDig = digitsOnly(draft.whatsapp).slice(0, 15);
  const smsDig = digitsOnly(draft.smsPhone).slice(0, 15);
  const smsDigits = smsDig.length >= 10 ? smsDig : phoneDigits;

  return {
    phoneDigits: phoneDigits.length >= 10 ? phoneDigits : "",
    whatsappDigits: waDig.length >= 10 ? waDig : phoneDigits.length >= 10 ? phoneDigits : "",
    smsDigits: smsDigits.length >= 10 ? smsDigits : "",
    email: draft.email.trim(),
  };
}

function resolveSocialFields(draft: {
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  otherContactLabel: string;
  otherContactUrl: string;
}) {
  const fb = draft.facebook.trim();
  const ig = draft.instagram.trim();
  const tt = draft.tiktok.trim();
  const yt = draft.youtube.trim();
  const ocUrl = draft.otherContactUrl.trim();
  return {
    facebookHref: fb ? normalizeWebsiteForOpen(fb) : null,
    instagramHref: ig ? normalizeWebsiteForOpen(ig) : null,
    tiktokHref: tt ? normalizeWebsiteForOpen(tt) : null,
    youtubeHref: yt ? normalizeWebsiteForOpen(yt) : null,
    otherLinkHref: ocUrl ? normalizeWebsiteForOpen(ocUrl) : null,
    otherLinkLabel: draft.otherContactLabel.trim(),
  };
}

export function buscoViewModelFromDraft(draft: BuscoQuickDraft, lang: Lang): BuscoQuickAdViewModel {
  const typeLabel = resolveBuscoTypePublicLabel(draft.buscoType, draft.buscoTypeCustom, lang);
  const loc = buildLocationParts(draft);
  const contact = resolveContactFields(draft);
  const social = resolveSocialFields(draft);
  const budgetDisplay = resolveBuscoBudgetDisplay(
    { budgetMode: draft.budgetMode, budgetAmount: draft.budgetAmount },
    lang,
  );

  return {
    title: draft.title.trim(),
    typeSlug: draft.buscoType,
    typeLabel,
    description: draft.description.trim(),
    budgetLabel: lang === "es" ? "Presupuesto" : "Budget",
    budgetDisplay,
    urgency: draft.urgency,
    typeDetails: {
      preferredCondition: draft.preferredCondition.trim(),
      workType: draft.workType.trim(),
      workSkills: draft.workSkills.trim(),
      workAvailability: draft.workAvailability.trim(),
      transportOrigin: draft.transportOrigin.trim(),
      transportDestination: draft.transportDestination.trim(),
      volunteersCount: draft.volunteersCount.trim(),
      whenNeeded: draft.whenNeeded.trim(),
    },
    heroSrc: draft.imageDataUrl.trim() || null,
    locationSummary: loc.summary,
    locationDetail: loc.detail,
    mapQuery: loc.mapQuery,
    ...contact,
    ...social,
    leonixAdId: formatLeonixAdId(draft.previewListingId),
    listingId: draft.previewListingId,
  };
}

export function buscoViewModelFromPublished(
  listing: BuscoPublishedListingLike,
  lang: Lang,
): BuscoQuickAdViewModel {
  const pairs = detailPairsToMap(listing.detailPairs);
  const typeSlug = (pairs["Leonix:buscoType"] ?? "") as BuscoTypeSlug;
  const typeLabel = resolveBuscoTypePublicLabel(typeSlug, pairs["Leonix:buscoTypeCustom"] ?? "", lang);

  const zone = (pairs["Leonix:buscoZone"] ?? "").trim();
  const state = (pairs["Leonix:state"] ?? "").trim();
  const country = (pairs["Leonix:buscoCountry"] ?? "").trim();
  const zip = (pairs["Leonix:zip"] ?? "").trim();
  const cityRaw = listing.city.trim();
  const loc = buildLocationParts({ city: cityRaw, state, country, zip, zone });

  const budgetDisplay = resolveBuscoBudgetDisplay(
    {
      budgetMode: pairs["Leonix:buscoBudgetMode"] ?? "",
      budgetAmount: pairs["Leonix:buscoBudgetAmount"] ?? "",
      // Section AB — legacy rows only ever wrote the old free-text key.
      legacyBudgetText: pairs["Leonix:buscoBudget"] ?? "",
    },
    lang,
  );
  const urgency = coercePublishedUrgency(pairs["Leonix:buscoUrgency"] ?? "");

  const phoneFromPairs = (pairs["Leonix:phoneDigits"] ?? "").replace(/\D/g, "");
  const rowPhone = String(listing.contact_phone ?? "").replace(/\D/g, "");
  const phoneDigits = (phoneFromPairs.length >= 10 ? phoneFromPairs : rowPhone).slice(0, 15);

  const draftLike = {
    phone: phoneDigits,
    whatsapp: (pairs["Leonix:whatsappDigits"] ?? "").replace(/\D/g, ""),
    smsPhone: (pairs["Leonix:smsPhone"] ?? "").replace(/\D/g, ""),
    email: String(listing.contact_email ?? "").trim(),
    facebook: (pairs["Leonix:buscoFacebook"] ?? "").trim(),
    instagram: (pairs["Leonix:buscoInstagram"] ?? "").trim(),
    tiktok: (pairs["Leonix:buscoTiktok"] ?? "").trim(),
    youtube: (pairs["Leonix:buscoYoutube"] ?? "").trim(),
    otherContactLabel: (pairs["Leonix:buscoOtherContactLabel"] ?? "").trim(),
    otherContactUrl: (pairs["Leonix:buscoOtherContactUrl"] ?? "").trim(),
  };

  const contact = resolveContactFields(draftLike);
  const social = resolveSocialFields(draftLike);

  return {
    title: listing.title[lang] || listing.title.es,
    typeSlug,
    typeLabel,
    description: listing.blurb[lang] || listing.blurb.es,
    budgetLabel: lang === "es" ? "Presupuesto" : "Budget",
    budgetDisplay,
    urgency,
    typeDetails: {
      preferredCondition: (pairs["Leonix:buscoPreferredCondition"] ?? "").trim(),
      workType: (pairs["Leonix:buscoWorkType"] ?? "").trim(),
      workSkills: (pairs["Leonix:buscoWorkSkills"] ?? "").trim(),
      workAvailability: (pairs["Leonix:buscoWorkAvailability"] ?? "").trim(),
      transportOrigin: (pairs["Leonix:buscoTransportOrigin"] ?? "").trim(),
      transportDestination: (pairs["Leonix:buscoTransportDestination"] ?? "").trim(),
      volunteersCount: (pairs["Leonix:buscoVolunteersCount"] ?? "").trim(),
      whenNeeded: (pairs["Leonix:buscoWhenNeeded"] ?? "").trim(),
    },
    heroSrc: listing.images?.[0]?.trim() || null,
    locationSummary: loc.summary,
    locationDetail: loc.detail,
    mapQuery: loc.mapQuery,
    ...contact,
    ...social,
    leonixAdId: formatLeonixAdId(listing.id),
    listingId: listing.id,
  };
}
