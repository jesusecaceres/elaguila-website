/**
 * Builds `ListingData` for the in-page full preview modal from the unified publish snapshot.
 */

import type { ListingData } from "@/app/clasificados/components/ListingView";
import {
  buildBrNegocioFullPreviewListingData,
  isBienesRaicesNegocioPublishPreviewContext,
} from "@/app/clasificados/bienes-raices/negocio/preview/buildBrNegocioFullPreviewListingData";
import {
  buildBrPrivadoFullPreviewListingData,
  isBienesRaicesPrivadoPublishPreviewContext,
} from "@/app/clasificados/bienes-raices/privado/preview/buildBrPrivadoFullPreviewListingData";
import { buildRentasNegocioPreviewListingData } from "@/app/clasificados/rentas/negocio/mapping/buildRentasNegocioPreviewListingData";
import type { PublishDraftSnapshot } from "@/app/clasificados/lib/publishDraftSnapshot";

function formatPhoneDigits(raw: string): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 10);
}

function formatPhoneDisplay(raw: string): string {
  const digits = formatPhoneDigits(raw);
  if (digits.length <= 3) return digits.length > 0 ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export type BuildFullPreviewListingDataParams = {
  publishDraftSnapshot: PublishDraftSnapshot;
  lang: "es" | "en";
  todayLabel: string;
  previewCategoryLabel: string;
  sellerDisplayName: string | null | undefined;
  /** React category state (e.g. rentas zona). */
  category: string;
  categoryFromUrl: string;
  /** Live form details for branch fallbacks when snapshot lags. */
  details: Record<string, string>;
  userId: string | null | undefined;
  previewPublishReturnPath: string | null;
};

export function buildFullPreviewListingData(params: BuildFullPreviewListingDataParams): ListingData {
  const {
    publishDraftSnapshot: snap,
    lang,
    todayLabel,
    previewCategoryLabel,
    sellerDisplayName,
    category,
    categoryFromUrl,
    details,
    userId,
    previewPublishReturnPath,
  } = params;

  const imgs = snap.images?.length ? snap.images : ["/logo.png"];
  const isBrNegocioPreviewData = isBienesRaicesNegocioPublishPreviewContext(categoryFromUrl, snap, details);
  const isBrPrivadoPreviewData = isBienesRaicesPrivadoPublishPreviewContext(categoryFromUrl, snap, details);

  const base: ListingData = {
    title: snap.title || (lang === "es" ? "(Sin título)" : "(No title)"),
    priceLabel: snap.priceLabel,
    city: (snap.cityCanonical ?? snap.city) || (lang === "es" ? "Ciudad" : "City"),
    description: snap.description || (lang === "es" ? "(Sin descripción)" : "(No description)"),
    todayLabel,
    images: imgs,
    detailPairs: snap.detailPairs ?? [],
    contactMethod: snap.contactMethod,
    contactPhone: formatPhoneDisplay(snap.contactPhone),
    contactEmail: snap.contactEmail,
    isPro: snap.isPro,
    proVideoThumbUrl: snap.proVideoThumbUrl ?? null,
    proVideoUrl: snap.proVideoUrl ?? null,
    proVideoThumbUrl2: snap.proVideoThumbUrl2 ?? null,
    proVideoUrl2: snap.proVideoUrl2 ?? null,
    lang,
    sellerName: sellerDisplayName || undefined,
    categoryLabel: previewCategoryLabel || undefined,
    approximateArea: category === "rentas" && snap.details?.zonaDireccion?.trim() ? snap.details.zonaDireccion.trim() : undefined,
    ownerId: userId?.trim() ? userId.trim() : undefined,
    /** So ListingView BR preview branch runs even if `category` state lags `categoryFromUrl`. */
    ...(categoryFromUrl === "bienes-raices" ? { category: "bienes-raices" as const } : {}),
  };

  if (isBrNegocioPreviewData) {
    return buildBrNegocioFullPreviewListingData({
      publishDraftSnapshot: snap,
      lang,
      todayLabel,
      previewCategoryLabel,
      sellerDisplayName,
      userId,
      previewPublishReturnPath,
    });
  }

  if (isBrPrivadoPreviewData) {
    return buildBrPrivadoFullPreviewListingData({
      publishDraftSnapshot: snap,
      lang,
      todayLabel,
      previewCategoryLabel,
      sellerDisplayName,
      userId,
      contactPhoneDisplay: formatPhoneDisplay(snap.contactPhone),
    });
  }

  const rentasBranchNormalized = (snap.details?.rentasBranch ?? details?.rentasBranch ?? "").trim().toLowerCase();
  if (categoryFromUrl === "rentas" && rentasBranchNormalized === "negocio") {
    return buildRentasNegocioPreviewListingData({
      base,
      categoryFromUrl,
      details: snap.details,
      contactEmail: snap.contactEmail,
      agentProfileReturnUrl: previewPublishReturnPath,
      lang,
    });
  }

  return base;
}
