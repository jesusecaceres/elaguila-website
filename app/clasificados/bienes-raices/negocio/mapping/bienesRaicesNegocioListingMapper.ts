/**
 * BR Negocio: map publish snapshot → ListingData + structured preview fields.
 * Single place for full-preview and open-card parity.
 */

import type { BusinessRailData, ListingData } from "@/app/clasificados/components/ListingView";
import { buildNegocioRedesPayload } from "@/app/clasificados/lib/brNegocioContactHelpers";
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

export function buildStructuredFactsFromDetails(details: Record<string, string>, cityDisplay: string) {
  const addr =
    [details.brNegocioStreetNumber, details.brNegocioStreet].filter(Boolean).join(" ").trim() ||
    (details.enVentaAddress ?? "").trim() ||
    (details.direccionPropiedad ?? "").trim();
  return {
    propertyTypeLabel: "",
    addressLine: addr || undefined,
    neighborhood: (details.enVentaZone ?? "").trim() || undefined,
    beds: (details.enVentaBedrooms ?? "").trim() || undefined,
    baths: (details.enVentaBathrooms ?? "").trim() || undefined,
    halfBaths: (details.enVentaHalfBathrooms ?? "").trim() || undefined,
    sqft: (details.enVentaSquareFeet ?? "").trim() || undefined,
    lotSize: (details.enVentaLotSize ?? "").trim() || undefined,
    levels: (details.enVentaLevels ?? "").trim() || undefined,
    parking: (details.enVentaParkingSpaces ?? "").trim() || undefined,
    yearBuilt: (details.enVentaYearBuilt ?? "").trim() || undefined,
    zoning: (details.enVentaZoning ?? "").trim() || undefined,
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
  const mergedRedes = buildNegocioRedesPayload(d as Record<string, string | undefined>);
  const rawSocialsPreview = mergedRedes.trim() || (d.negocioRedes ?? "").trim();
  const phoneFmt = (d.negocioTelOficina ?? "").trim();
  const extFmt = (d.negocioTelExtension ?? "").trim();
  const officeDisplay = phoneFmt ? (extFmt ? `${phoneFmt} · Ext. ${extFmt}` : phoneFmt) : "";

  const businessRail: BusinessRailData = {
    name: (d.negocioNombre ?? "").trim() || (lang === "es" ? "Negocio" : "Business"),
    agent: (d.negocioAgente ?? "").trim(),
    role: (d.negocioCargo ?? "").trim(),
    agentLicense: (d.negocioLicencia ?? "").trim() || undefined,
    officePhone: officeDisplay,
    agentEmail: (d.negocioEmail ?? "").trim() || null,
    website: (d.negocioSitioWeb ?? "").trim() || null,
    socialLinks: [],
    rawSocials: rawSocialsPreview,
    logoUrl: (d.negocioLogoUrl ?? "").trim() || null,
    agentPhotoUrl: (d.negocioFotoAgenteUrl ?? "").trim() || null,
    languages: (d.negocioIdiomas ?? "").trim(),
    hours: (d.negocioHorario ?? "").trim(),
    virtualTourUrl: (d.negocioRecorridoVirtual ?? d.enVentaVirtualTourUrl ?? "").trim() || null,
    plusMoreListings: (d.negocioPlusMasAnuncios ?? "") === "si",
    businessDescription: (d.negocioDescripcion ?? "").trim() || undefined,
    availabilityRows: availabilityRows.length > 0 ? availabilityRows : undefined,
    brokerageName: (d.negocioNombreCorreduria ?? "").trim() || null,
    coAgentName: (d.negocioCoAgente ?? "").trim() || null,
  };

  const structuredFacts = buildStructuredFactsFromDetails(d, cityDisplay);
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
