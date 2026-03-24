/**
 * BR Negocio: map publish snapshot → ListingData + structured preview fields.
 * Single place for full-preview and open-card parity.
 */

import type { BusinessRailData, ListingData } from "@/app/clasificados/components/ListingView";
import { BR_PROPERTY_TYPE_OPTIONS } from "@/app/clasificados/bienes-raices/shared/fields/bienesRaicesTaxonomy";
import { buildBrNegocioSocialLinksForRail } from "@/app/clasificados/bienes-raices/negocio/utils/brNegocioContactHelpers";
import {
  resolveBrNegocioAddressStructuredFactsLine,
  resolveBrNegocioAgentForRail,
  resolveBrNegocioBusinessNameForRail,
  resolveBrNegocioSocialPayload,
  resolveBrNegocioVirtualTourForRail,
} from "@/app/clasificados/bienes-raices/negocio/mapping/brNegocioReadResolvers";
type Lang = "es" | "en";

type MapperParams = {
  snap: {
    title: string;
    priceLabel: string;
    city: string;
    cityCanonical: string | null;
    description: string;
    detailPairs: Array<{ label: string; value: string }>;
    details: Record<string, string>;
    images: string[];
    proVideoThumbUrl: string | null;
    proVideoUrl: string | null;
    lang: Lang;
  };
  lang: Lang;
  todayLabel: string;
  previewCategoryLabel: string;
  sellerDisplayName?: string | null;
  userId?: string | null;
  agentProfileReturnUrl: string | null;
};

function parseAvailability(raw: string): Array<{ title: string; price: string; size: string; ctaText?: string; ctaLink?: string }> {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Highlight chips: one per line or split on | */
export function parseBrNegocioHighlights(raw: string | undefined): string[] {
  const t = (raw ?? "").trim();
  if (!t) return [];
  const lines = t.includes("|") ? t.split("|") : t.split(/\r?\n/);
  return lines.map((s) => s.trim()).filter(Boolean).slice(0, 16);
}

export function buildStructuredFactsFromDetails(details: Record<string, string>, cityDisplay: string, lang: Lang) {
  const addr = resolveBrNegocioAddressStructuredFactsLine(details);
  const pt = (details.brPropertyType ?? "").trim();
  const ptOpt = pt ? BR_PROPERTY_TYPE_OPTIONS.find((o) => o.value === pt) : undefined;
  const propertyTypeLabel = ptOpt ? ptOpt.label[lang] : undefined;
  const arch = (details.brArchitecturalStyle ?? "").trim();
  return {
    propertyTypeLabel: propertyTypeLabel || undefined,
    architecturalStyle: arch || undefined,
    addressLine: addr || undefined,
    neighborhood: (details.brZone ?? "").trim() || undefined,
    beds: (details.brBedrooms ?? "").trim() || undefined,
    baths: (details.brBathrooms ?? "").trim() || undefined,
    halfBaths: (details.brHalfBathrooms ?? "").trim() || undefined,
    sqft: (details.brSquareFeet ?? "").trim() || undefined,
    lotSize: (details.brLotSize ?? "").trim() || undefined,
    levels: (details.brLevels ?? "").trim() || undefined,
    parking: (details.brParkingSpaces ?? "").trim() || undefined,
    yearBuilt: (details.brYearBuilt ?? "").trim() || undefined,
    zoning: (details.brZoning ?? "").trim() || undefined,
    city: cityDisplay || undefined,
    zip: (details.brNegocioZip ?? "").trim() || undefined,
  };
}

export function buildBrNegocioListingData(params: MapperParams): ListingData {
  const { snap, lang, todayLabel, previewCategoryLabel, sellerDisplayName, userId, agentProfileReturnUrl } = params;
  const d = snap.details;
  const imgs = snap.images?.length ? snap.images : ["/logo.png"];
  const cityDisplay = (snap.cityCanonical ?? snap.city).trim() || (lang === "es" ? "Ciudad" : "City");

  let availabilityRows = parseAvailability((d.negocioDisponibilidadPrecios ?? "").trim());
  const rawSocialsPreview = resolveBrNegocioSocialPayload(d);
  const phoneFmt = (d.negocioTelOficina ?? "").trim();
  const extFmt = (d.negocioTelExtension ?? "").trim();
  const officeDisplay = phoneFmt ? (extFmt ? `${phoneFmt} · Ext. ${extFmt}` : phoneFmt) : "";

  const businessRail: BusinessRailData = {
    name: resolveBrNegocioBusinessNameForRail(d, lang),
    agent: resolveBrNegocioAgentForRail(d),
    role: (d.negocioCargo ?? "").trim(),
    agentLicense: (d.negocioLicencia ?? "").trim() || undefined,
    officePhone: officeDisplay,
    agentEmail: (d.negocioEmail ?? "").trim() || null,
    website: (d.negocioSitioWeb ?? "").trim() || null,
    socialLinks: buildBrNegocioSocialLinksForRail(d, lang),
    rawSocials: rawSocialsPreview,
    logoUrl: (d.negocioLogoUrl ?? "").trim() || null,
    agentPhotoUrl: (d.negocioFotoAgenteUrl ?? "").trim() || null,
    languages: (d.negocioIdiomas ?? "").trim(),
    hours: (d.negocioHorario ?? "").trim(),
    virtualTourUrl: resolveBrNegocioVirtualTourForRail(d),
    plusMoreListings: (d.negocioPlusMasAnuncios ?? "") === "si",
    businessDescription: (d.negocioDescripcion ?? "").trim() || undefined,
    availabilityRows: availabilityRows.length > 0 ? availabilityRows : undefined,
    brokerageName: (d.negocioNombreCorreduria ?? "").trim() || null,
    coAgentName: (d.negocioCoAgente ?? "").trim() || null,
    lenderPartnerName: (d.negocioSocioFinanciero ?? "").trim() || null,
  };

  const structuredFacts = buildStructuredFactsFromDetails(d, cityDisplay, lang);
  const highlights = parseBrNegocioHighlights(d.brNegocioHighlights);
  const summaryShort = (d.brNegocioListingSummary ?? "").trim() || null;

  const statusRaw = (d.brNegocioListingStatus ?? "").trim();
  const listingStatusLabel =
    statusRaw === "active"
      ? lang === "es"
        ? "Activo"
        : "Active"
      : statusRaw === "pending"
        ? lang === "es"
          ? "Pendiente"
          : "Pending"
        : statusRaw === "sold"
          ? lang === "es"
            ? "Vendido"
            : "Sold"
          : statusRaw === "coming_soon"
            ? lang === "es"
              ? "Próximamente"
              : "Coming soon"
            : statusRaw
              ? statusRaw
              : null;

  return {
    title: snap.title || (lang === "es" ? "(Sin título)" : "(No title)"),
    priceLabel: snap.priceLabel,
    city: cityDisplay,
    description: snap.description || (lang === "es" ? "(Sin descripción)" : "(No description)"),
    todayLabel,
    images: imgs,
    detailPairs: snap.detailPairs ?? [],
    contactMethod: "phone",
    contactPhone: "",
    contactEmail: "",
    isPro: true,
    proVideoThumbUrl: snap.proVideoThumbUrl ?? null,
    proVideoUrl: snap.proVideoUrl ?? null,
    lang: snap.lang,
    sellerName: sellerDisplayName || undefined,
    categoryLabel: previewCategoryLabel || undefined,
    category: "bienes-raices",
    businessRailTier: "business_plus",
    businessRail,
    floorPlanUrl: (d.negocioFloorPlanUrl ?? "").trim() || null,
    ownerId: userId?.trim() ? userId.trim() : undefined,
    agentProfileReturnUrl,
    structuredFacts,
    listingSummaryShort: summaryShort,
    highlightChips: highlights.length ? highlights : undefined,
    listingStatusLabel,
  };
}
