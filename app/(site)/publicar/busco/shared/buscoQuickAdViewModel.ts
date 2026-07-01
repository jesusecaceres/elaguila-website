import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";
import { digitsOnly } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import { normalizeWebsiteForOpen } from "@/app/publicar/community/shared/lib/communityWebsiteAndSocial";
import { detailPairsToMap } from "@/app/(site)/clasificados/busco/shared/buscoListingDetailPairs";
import { resolveBuscoTypePublicLabel } from "@/app/(site)/clasificados/busco/shared/buscoPublicLabel";
import { formatBuscoBudget } from "@/app/publicar/busco/shared/buscoFormatBudget";
import type { BuscoPreferredContact, BuscoQuickDraft, BuscoUrgency } from "@/app/publicar/busco/shared/buscoQuickTypes";
import type { BuscoPublishedListingLike } from "@/app/(site)/clasificados/busco/BuscoQuickPublishedAd";

export type BuscoQuickAdViewModel = {
  title: string;
  typeLabel: string;
  description: string;
  budgetLabel: string;
  budgetDisplay: string;
  urgency: BuscoUrgency | "";
  heroSrc: string | null;
  locationSummary: string;
  locationDetail: string;
  mapQuery: string | null;
  phoneDigits: string;
  whatsappDigits: string;
  smsDigits: string;
  email: string;
  preferredContact: BuscoPreferredContact;
  facebookHref: string | null;
  instagramHref: string | null;
  tiktokHref: string | null;
  otherLinkHref: string | null;
  otherLinkLabel: string;
  leonixAdId: string | null;
  listingId: string | null;
};

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
  const mapQuery = cityStateLine ? [cityStateLine, country].filter(Boolean).join(", ") : null;

  return { summary, detail, mapQuery };
}

function resolveContactFields(draft: {
  phone: string;
  whatsapp: string;
  smsPhone: string;
  email: string;
  preferredContact: BuscoPreferredContact;
}) {
  const phoneDigits = digitsOnly(draft.phone).slice(0, 15);
  const waDig = digitsOnly(draft.whatsapp).slice(0, 15);
  const smsDig = digitsOnly(draft.smsPhone).slice(0, 15);
  const smsDigits = smsDig.length >= 10 ? smsDig : phoneDigits;

  return {
    phoneDigits: phoneDigits.length >= 10 ? phoneDigits : "",
    whatsappDigits: waDig.length >= 10 ? waDig : phoneDigits.length >= 10 ? phoneDigits : "",
    smsDigits: smsDigits.length >= 10 ? smsDigits : "",
    email: draft.email.trim(),
    preferredContact: draft.preferredContact,
  };
}

function resolveSocialFields(draft: {
  facebook: string;
  instagram: string;
  tiktok: string;
  otherContactLabel: string;
  otherContactUrl: string;
}) {
  const fb = draft.facebook.trim();
  const ig = draft.instagram.trim();
  const tt = draft.tiktok.trim();
  const ocUrl = draft.otherContactUrl.trim();
  return {
    facebookHref: fb ? normalizeWebsiteForOpen(fb) : null,
    instagramHref: ig ? normalizeWebsiteForOpen(ig) : null,
    tiktokHref: tt ? normalizeWebsiteForOpen(tt) : null,
    otherLinkHref: ocUrl ? normalizeWebsiteForOpen(ocUrl) : null,
    otherLinkLabel: draft.otherContactLabel.trim(),
  };
}

export function buscoViewModelFromDraft(draft: BuscoQuickDraft, lang: Lang): BuscoQuickAdViewModel {
  const typeLabel = resolveBuscoTypePublicLabel(draft.buscoType, draft.buscoTypeCustom, lang);
  const budgetRaw = draft.budget.trim();
  const budgetDisplay = budgetRaw ? formatBuscoBudget(budgetRaw) : "";
  const loc = buildLocationParts(draft);
  const contact = resolveContactFields(draft);
  const social = resolveSocialFields(draft);

  return {
    title: draft.title.trim(),
    typeLabel,
    description: draft.description.trim(),
    budgetLabel: lang === "es" ? "Presupuesto" : "Budget",
    budgetDisplay,
    urgency: draft.urgency === "normal" ? "" : draft.urgency,
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
  const typeLabel = resolveBuscoTypePublicLabel(
    pairs["Leonix:buscoType"] ?? "",
    pairs["Leonix:buscoTypeCustom"] ?? "",
    lang,
  );

  const zone = (pairs["Leonix:buscoZone"] ?? "").trim();
  const state = (pairs["Leonix:state"] ?? "").trim();
  const country = (pairs["Leonix:buscoCountry"] ?? "").trim();
  const zip = (pairs["Leonix:zip"] ?? "").trim();
  const cityRaw = listing.city.trim();
  const loc = buildLocationParts({ city: cityRaw, state, country, zip, zone });

  const budgetRaw = (pairs["Leonix:buscoBudget"] ?? "").trim();
  const budgetDisplay = budgetRaw ? formatBuscoBudget(budgetRaw) : "";
  const urgencyRaw = (pairs["Leonix:buscoUrgency"] ?? "").trim() as BuscoUrgency;

  const phoneFromPairs = (pairs["Leonix:phoneDigits"] ?? "").replace(/\D/g, "");
  const rowPhone = String(listing.contact_phone ?? "").replace(/\D/g, "");
  const phoneDigits = (phoneFromPairs.length >= 10 ? phoneFromPairs : rowPhone).slice(0, 15);

  const prefRaw = (pairs["Leonix:buscoPreferredContact"] ?? "telefono").trim() as BuscoPreferredContact;
  const preferredContact: BuscoPreferredContact =
    prefRaw === "whatsapp" || prefRaw === "mensaje" || prefRaw === "correo" ? prefRaw : "telefono";

  const draftLike = {
    phone: phoneDigits,
    whatsapp: (pairs["Leonix:whatsappDigits"] ?? "").replace(/\D/g, ""),
    smsPhone: (pairs["Leonix:smsPhone"] ?? "").replace(/\D/g, ""),
    email: String(listing.contact_email ?? "").trim(),
    preferredContact,
    facebook: (pairs["Leonix:buscoFacebook"] ?? "").trim(),
    instagram: (pairs["Leonix:buscoInstagram"] ?? "").trim(),
    tiktok: (pairs["Leonix:buscoTiktok"] ?? "").trim(),
    otherContactLabel: (pairs["Leonix:buscoOtherContactLabel"] ?? "").trim(),
    otherContactUrl: (pairs["Leonix:buscoOtherContactUrl"] ?? "").trim(),
  };

  const contact = resolveContactFields(draftLike);
  const social = resolveSocialFields(draftLike);

  return {
    title: listing.title[lang] || listing.title.es,
    typeLabel,
    description: listing.blurb[lang] || listing.blurb.es,
    budgetLabel: lang === "es" ? "Presupuesto" : "Budget",
    budgetDisplay,
    urgency: urgencyRaw === "pronto" || urgencyRaw === "urgente" ? urgencyRaw : "",
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
