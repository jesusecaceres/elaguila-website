/**
 * Map live `/clasificados/anuncio/[id]` BR rows → `ListingData` for preview-parity UI.
 */

import type { ListingData } from "@/app/clasificados/components/ListingView";
import type { ProVideoInfo } from "@/app/clasificados/components/proVideo";
import { parseBrNegocioHighlights } from "@/app/clasificados/bienes-raices/negocio/mapping/bienesRaicesNegocioListingMapper";
import { pickDetailPairValue } from "@/app/clasificados/bienes-raices/negocio/preview/brNegocioPremiumPreviewHelpers";
import {
  brBaseAddressFromListing,
  brBaseZoneFromListing,
  buildBrNegocioLiveDisplay,
  parseBienesRaicesBusinessMeta,
} from "@/app/clasificados/bienes-raices/listing/utils/brAnuncioLiveDerived";
import type { BrAnuncioLang, BrAnuncioListingLike } from "@/app/clasificados/bienes-raices/listing/types/brAnuncioLiveTypes";
import type { BusinessRailData } from "@/app/clasificados/components/ListingView";

function normalizeDetailPairs(listing: BrAnuncioListingLike): Array<{ label: string; value: string }> {
  const raw = listing.detailPairs ?? listing.detail_pairs;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => ({
      label: String(p?.label ?? "").trim(),
      value: String(p?.value ?? "").trim(),
    }))
    .filter((p) => p.label && p.value);
}

function pickPair(
  pairs: Array<{ label: string; value: string }>,
  labelTest: (label: string) => boolean
): string {
  const hit = pairs.find((p) => labelTest((p.label ?? "").toLowerCase()));
  return (hit?.value ?? "").trim();
}

function highlightChipsFromPrivadoPairs(pairs: Array<{ label: string; value: string }>): string[] | undefined {
  const raw = pickPair(pairs, (lab) =>
    /comodidades|amenities|amenidades|características destacadas|highlight/i.test(lab)
  );
  if (!raw) return undefined;
  const parts = raw.includes("|") ? raw.split("|") : raw.split(/[,;\n]/);
  const chips = parts.map((s) => s.trim()).filter(Boolean).slice(0, 12);
  return chips.length ? chips : undefined;
}

function highlightsFromNegocioPairs(pairs: Array<{ label: string; value: string }>): string[] {
  const raw = pickPair(pairs, (lab) =>
    /destacado|highlight|resalt|características clave|key features/i.test(lab)
  );
  if (raw) return parseBrNegocioHighlights(raw);
  return [];
}

function listingSummaryFromPairs(pairs: Array<{ label: string; value: string }>, lang: BrAnuncioLang): string | null {
  const short =
    pickPair(pairs, (lab) => /short summary|resumen corto/i.test(lab)) ||
    pickPair(pairs, (lab) => /^resumen$/i.test(lab));
  return short || null;
}

function approximateLocationFromPairs(pairs: Array<{ label: string; value: string }>): boolean {
  const mode = pickPair(pairs, (lab) =>
    /precisi[oó]n.*ubic|location.*(precision|display)|modo.*ubic|mostrar.*ubic/i.test(lab)
  );
  if (/aprox/i.test(mode)) return true;
  const v = pickPair(pairs, (lab) => /ubicaci[oó]n.*aprox|approximate.*location/i.test(lab));
  return /^s[ií]|y(es)?$/i.test(v) || v.toLowerCase() === "true";
}

function inferStructuredFactsFromPairs(
  pairs: Array<{ label: string; value: string }>,
  city: string,
  _lang: BrAnuncioLang
): NonNullable<ListingData["structuredFacts"]> {
  const find = (res: RegExp[]) => {
    for (const re of res) {
      const p = pairs.find((x) => re.test((x.label ?? "").toLowerCase()));
      const v = (p?.value ?? "").trim();
      if (v) return v;
    }
    return undefined;
  };
  return {
    propertyTypeLabel: find([/tipo.*propiedad|property type|tipo de propiedad/i]),
    architecturalStyle: find([/estilo|style|arquitect/i]),
    addressLine: find([/direcci[oó]n|address/i]),
    neighborhood: find([/vecindad|neighborhood|zona|colonia/i]),
    beds: find([/rec[aá]maras|bedrooms?|habitaciones/i]),
    baths: find([/ba[ñn]os|bathrooms?/i]),
    halfBaths: find([/medios baños|half baths/i]),
    sqft: find([/pies|sq\.?\s*ft|superficie|m²|metros|cuadrados/i]),
    lotSize: find([/terreno|lot( size)?/i]),
    levels: find([/niveles|levels|pisos/i]),
    parking: find([/estacionamiento|parking|garage/i]),
    yearBuilt: find([/año|year built|construcci/i]),
    zoning: find([/zonificaci[oó]n|zoning/i]),
    zip: find([/cp|zip|c\.?\s*p\.?|c[oó]digo postal/i]),
    city: city || undefined,
  };
}

function negocioListingStatusFromPairs(pairs: Array<{ label: string; value: string }>, lang: BrAnuncioLang): string | null {
  const v = pickPair(pairs, (lab) => /estado del listado|listing status/i.test(lab)).toLowerCase();
  if (!v) return null;
  if (v.includes("activ")) return lang === "es" ? "Activo" : "Active";
  if (v.includes("pend")) return lang === "es" ? "Pendiente" : "Pending";
  if (v.includes("vend") || v.includes("sold")) return lang === "es" ? "Vendido" : "Sold";
  if (v.includes("próx") || v.includes("coming")) return lang === "es" ? "Próximamente" : "Coming soon";
  return v;
}

export function brNegocioLiveToBusinessRail(
  display: NonNullable<ReturnType<typeof buildBrNegocioLiveDisplay>>,
  meta: Record<string, string> | null,
  listing: { contact_phone?: string | null; contact_email?: string | null }
): BusinessRailData {
  const m = meta ?? {};
  const email = (m.negocioEmail ?? "").trim() || String(listing.contact_email ?? "").trim() || null;
  return {
    name: display.name,
    agent: display.agent,
    role: display.role,
    agentLicense: display.agentLicense?.trim() || undefined,
    brokerageName: (m.negocioNombreCorreduria ?? "").trim() || null,
    coAgentName: (m.negocioCoAgente ?? "").trim() || null,
    lenderPartnerName: (m.negocioSocioFinanciero ?? "").trim() || null,
    officePhone: display.officePhone,
    agentEmail: email,
    website: display.website,
    socialLinks: display.socialLinks ?? [],
    rawSocials: display.rawSocials,
    logoUrl: display.logoUrl,
    agentPhotoUrl: display.agentPhotoUrl,
    languages: display.languages,
    hours: display.hours,
    virtualTourUrl: display.virtualTourUrl,
    plusMoreListings: display.plusMoreListings,
    businessDescription: display.businessDescription || undefined,
    availabilityRows: display.availabilityRows.length > 0 ? display.availabilityRows : undefined,
  };
}

export type BienesRaicesLiveListingRow = BrAnuncioListingLike & {
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  blurb: { es: string; en: string };
  images?: string[] | null;
  sellerName?: string | null;
  seller_name?: string | null;
  owner_id?: string | null;
  status?: string;
};

export function buildBienesRaicesPrivadoLiveListingData(options: {
  listing: BienesRaicesLiveListingRow;
  lang: BrAnuncioLang;
  postedAgoLabel: string;
  isPro: boolean;
  proVideoInfos: ProVideoInfo[];
}): ListingData {
  const { listing, lang, postedAgoLabel, isPro, proVideoInfos } = options;
  const pairs = normalizeDetailPairs(listing);
  const city = (listing.city ?? "").trim() || (lang === "es" ? "Ciudad" : "City");
  const structured = inferStructuredFactsFromPairs(pairs, city, lang);
  const addrLine = (brBaseAddressFromListing(listing) || structured.addressLine || "").trim();
  const zoneLine = (brBaseZoneFromListing(listing) || structured.neighborhood || "").trim();
  if (addrLine) structured.addressLine = addrLine;
  if (zoneLine) structured.neighborhood = zoneLine;

  const imgs = listing.images?.filter((u): u is string => typeof u === "string" && u.trim() !== "") ?? [];
  const images = imgs.length > 0 ? imgs : ["/logo.png"];

  const phone = String((listing as { contact_phone?: string | null }).contact_phone ?? "").trim();
  const email = String((listing as { contact_email?: string | null }).contact_email ?? "").trim();

  return {
    title: (listing.title?.[lang] ?? "").trim() || (lang === "es" ? "(Sin título)" : "(No title)"),
    priceLabel: listing.priceLabel?.[lang] ?? "",
    city,
    description: (listing.blurb?.[lang] ?? "").trim() || (lang === "es" ? "(Sin descripción)" : "(No description)"),
    todayLabel: postedAgoLabel,
    images,
    detailPairs: pairs,
    contactMethod: phone && email ? "both" : phone ? "phone" : "email",
    contactPhone: phone,
    contactEmail: email,
    isPro,
    proVideoThumbUrl: proVideoInfos[0]?.thumbUrl ?? null,
    proVideoUrl: proVideoInfos[0]?.url ?? null,
    proVideoUrl2: proVideoInfos[1]?.url ?? null,
    proVideoThumbUrl2: proVideoInfos[1]?.thumbUrl ?? null,
    lang,
    sellerName: (listing.sellerName ?? listing.seller_name ?? "").trim() || undefined,
    categoryLabel: lang === "es" ? "Bienes Raíces" : "Real Estate",
    category: "bienes-raices",
    businessRail: undefined,
    businessRailTier: null,
    floorPlanUrl: null,
    ownerId: listing.owner_id?.trim() ? listing.owner_id.trim() : null,
    agentProfileReturnUrl: null,
    structuredFacts: structured,
    highlightChips: highlightChipsFromPrivadoPairs(pairs),
    listingSummaryShort: listingSummaryFromPairs(pairs, lang),
    listingStatusLabel:
      listing.status === "sold" ? (lang === "es" ? "Vendido" : "Sold") : lang === "es" ? "Activo" : "Active",
    listingLocationIsApproximate: approximateLocationFromPairs(pairs),
  };
}

export function buildBienesRaicesNegocioLiveListingData(options: {
  listing: BienesRaicesLiveListingRow;
  lang: BrAnuncioLang;
  postedAgoLabel: string;
  isPro: boolean;
  proVideoInfos: ProVideoInfo[];
}): ListingData {
  const { listing, lang, postedAgoLabel, isPro, proVideoInfos } = options;
  const pairs = normalizeDetailPairs(listing);
  const meta = parseBienesRaicesBusinessMeta(listing);
  const display = buildBrNegocioLiveDisplay(listing, meta, lang);
  if (!display) {
    return buildBienesRaicesPrivadoLiveListingData({ listing, lang, postedAgoLabel, isPro, proVideoInfos });
  }

  const city = (listing.city ?? "").trim() || (lang === "es" ? "Ciudad" : "City");
  const structured = inferStructuredFactsFromPairs(pairs, city, lang);
  const detailAddr = pickDetailPairValue(pairs, (lab) => /direcci[oó]n|address/i.test(lab));
  const detailZone = pickDetailPairValue(pairs, (lab) => /vecindad|neighborhood/i.test(lab));
  const addrLine = detailAddr || structured.addressLine || (brBaseAddressFromListing(listing) || "").trim();
  const zoneLine = detailZone || structured.neighborhood || (brBaseZoneFromListing(listing) || "").trim();
  if (addrLine) structured.addressLine = addrLine;
  if (zoneLine) structured.neighborhood = zoneLine;

  const imgs = listing.images?.filter((u): u is string => typeof u === "string" && u.trim() !== "") ?? [];
  const images = imgs.length > 0 ? imgs : ["/logo.png"];

  const floorPlan =
    pickDetailPairValue(pairs, (lab) => /plano|floorplan|floor plan/i.test(lab)) ||
    pickDetailPairValue(pairs, (lab) => /plano de planta/i.test(lab));

  const hl = highlightsFromNegocioPairs(pairs);
  const statusFromPairs = negocioListingStatusFromPairs(pairs, lang);
  const sold = listing.status === "sold";

  const businessRail = brNegocioLiveToBusinessRail(display, meta, {
    contact_phone: (listing as { contact_phone?: string | null }).contact_phone,
    contact_email: (listing as { contact_email?: string | null }).contact_email,
  });

  return {
    title: (listing.title?.[lang] ?? "").trim() || (lang === "es" ? "(Sin título)" : "(No title)"),
    priceLabel: listing.priceLabel?.[lang] ?? "",
    city,
    description: (listing.blurb?.[lang] ?? "").trim() || (lang === "es" ? "(Sin descripción)" : "(No description)"),
    todayLabel: postedAgoLabel,
    images,
    detailPairs: pairs,
    contactMethod: "phone",
    contactPhone: String((listing as { contact_phone?: string | null }).contact_phone ?? "").trim(),
    contactEmail: String((listing as { contact_email?: string | null }).contact_email ?? "").trim(),
    isPro,
    proVideoThumbUrl: proVideoInfos[0]?.thumbUrl ?? null,
    proVideoUrl: proVideoInfos[0]?.url ?? null,
    proVideoUrl2: proVideoInfos[1]?.url ?? null,
    proVideoThumbUrl2: proVideoInfos[1]?.thumbUrl ?? null,
    lang,
    sellerName: (listing.sellerName ?? listing.seller_name ?? "").trim() || undefined,
    categoryLabel: lang === "es" ? "Bienes Raíces" : "Real Estate",
    category: "bienes-raices",
    businessRail,
    businessRailTier: "business_plus",
    floorPlanUrl: floorPlan || null,
    ownerId: listing.owner_id?.trim() ? listing.owner_id.trim() : null,
    agentProfileReturnUrl: null,
    structuredFacts: structured,
    highlightChips: hl.length ? hl : undefined,
    listingSummaryShort: listingSummaryFromPairs(pairs, lang),
    listingStatusLabel: sold ? (lang === "es" ? "Vendido" : "Sold") : statusFromPairs || (lang === "es" ? "Activo" : "Active"),
    listingLocationIsApproximate: approximateLocationFromPairs(pairs),
    approximateArea: pickDetailPairValue(pairs, (lab) => /[áa]rea aproximada|approximate area|zona aprox/i.test(lab)) || null,
    managementHooks: {
      branch: "negocio",
      publishReady: true,
      analyticsReady: true,
      boostEligible: true,
      adminReviewReady: true,
      listingTrace: {
        listingId: listing.id,
        ownerAccountId: listing.owner_id?.trim() ? listing.owner_id.trim() : null,
        businessName: (meta?.negocioNombre ?? "").trim() || null,
        brokerageName: (meta?.negocioNombreCorreduria ?? "").trim() || null,
        agentName: (meta?.negocioAgente ?? "").trim() || null,
        cityCanonical: (listing.city ?? "").trim() || null,
      },
    },
  };
}
