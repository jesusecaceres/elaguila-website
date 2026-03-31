/**
 * BR Privado: publish snapshot → ListingData for embedded + full-page preview.
 */

import type { ListingData } from "@/app/clasificados/components/ListingView";
import { BR_PROPERTY_TYPE_OPTIONS } from "@/app/clasificados/bienes-raices/shared/fields/bienesRaicesTaxonomy";
import { isBrPrivadoResidential } from "@/app/clasificados/publicar/bienes-raices/privado/publish/brPrivadoPublishConstants";
import type { PublishDraftSnapshot } from "@/app/clasificados/lib/publishDraftSnapshot";

type Lang = "es" | "en";

export type BuildBrPrivadoListingDataParams = {
  snap: Pick<
    PublishDraftSnapshot,
    | "title"
    | "priceLabel"
    | "city"
    | "cityCanonical"
    | "description"
    | "detailPairs"
    | "details"
    | "images"
    | "proVideoThumbUrl"
    | "proVideoUrl"
    | "proVideoThumbUrl2"
    | "proVideoUrl2"
    | "lang"
    | "contactMethod"
    | "contactPhone"
    | "contactEmail"
    | "isPro"
  >;
  lang: Lang;
  todayLabel: string;
  previewCategoryLabel: string;
  sellerDisplayName?: string | null;
  userId?: string | null;
  /** Formatted display phone for preview CTAs */
  contactPhoneDisplay: string;
};

function formatHighlightChipsFromComodidades(raw: string | undefined): string[] | undefined {
  const t = (raw ?? "").trim();
  if (!t) return undefined;
  const parts = t.includes("|") ? t.split("|") : t.split(/[,;\n]/);
  const chips = parts.map((s) => s.trim()).filter(Boolean).slice(0, 12);
  return chips.length ? chips : undefined;
}

export function buildBrPrivadoStructuredFacts(
  details: Record<string, string>,
  cityDisplay: string,
  lang: Lang
): NonNullable<ListingData["structuredFacts"]> {
  const pt = (details.brPropertyType ?? "").trim();
  const ptOpt = pt ? BR_PROPERTY_TYPE_OPTIONS.find((o) => o.value === pt) : undefined;
  const addr = (details.brAddress ?? "").trim() || (details.direccionPropiedad ?? "").trim();
  const arch = (details.brArchitecturalStyle ?? "").trim();
  const residential = isBrPrivadoResidential(pt);
  return {
    propertyTypeLabel: ptOpt ? ptOpt.label[lang] : undefined,
    architecturalStyle: arch || undefined,
    addressLine: addr || undefined,
    neighborhood: (details.brZone ?? "").trim() || undefined,
    beds: residential ? (details.brBedrooms ?? "").trim() || undefined : undefined,
    baths: residential ? (details.brBathrooms ?? "").trim() || undefined : undefined,
    halfBaths: residential ? (details.brHalfBathrooms ?? "").trim() || undefined : undefined,
    sqft: (details.brSquareFeet ?? "").trim() || undefined,
    lotSize: (details.brLotSize ?? "").trim() || undefined,
    levels: (details.brLevels ?? "").trim() || undefined,
    parking: (details.brParkingSpaces ?? "").trim() || undefined,
    yearBuilt: (details.brYearBuilt ?? "").trim() || undefined,
    zoning: (details.brZoning ?? "").trim() || undefined,
    city: cityDisplay || undefined,
    zip: undefined,
  };
}

export function buildBrPrivadoListingData(params: BuildBrPrivadoListingDataParams): ListingData {
  const {
    snap,
    lang,
    todayLabel,
    previewCategoryLabel,
    sellerDisplayName,
    userId,
    contactPhoneDisplay,
  } = params;
  const d = snap.details;
  const imgs = snap.images?.length ? snap.images : ["/logo.png"];
  const cityDisplay = (snap.cityCanonical ?? snap.city).trim() || (lang === "es" ? "Ciudad" : "City");
  const structuredFacts = buildBrPrivadoStructuredFacts(d, cityDisplay, lang);
  const highlightChips = formatHighlightChipsFromComodidades(d.comodidades);

  return {
    title: snap.title || (lang === "es" ? "(Sin título)" : "(No title)"),
    priceLabel: snap.priceLabel,
    city: cityDisplay,
    description: snap.description || (lang === "es" ? "(Sin descripción)" : "(No description)"),
    todayLabel,
    images: imgs,
    detailPairs: snap.detailPairs ?? [],
    contactMethod: snap.contactMethod,
    contactPhone: contactPhoneDisplay,
    contactEmail: snap.contactEmail,
    isPro: snap.isPro,
    proVideoThumbUrl: snap.proVideoThumbUrl ?? null,
    proVideoUrl: snap.proVideoUrl ?? null,
    proVideoThumbUrl2: snap.proVideoThumbUrl2 ?? null,
    proVideoUrl2: snap.proVideoUrl2 ?? null,
    lang: snap.lang,
    sellerName: sellerDisplayName || undefined,
    categoryLabel: previewCategoryLabel || undefined,
    category: "bienes-raices",
    businessRail: undefined,
    businessRailTier: null,
    floorPlanUrl: null,
    ownerId: userId?.trim() ? userId.trim() : undefined,
    structuredFacts,
    highlightChips,
    listingSummaryShort: null,
    listingStatusLabel: null,
    listingLocationIsApproximate: (d.brLocationDisplayMode ?? "").trim().toLowerCase() === "aproximada",
  };
}
