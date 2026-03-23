/**
 * BR negocio: assemble `ListingData` for publish full preview + `/clasificados/preview-listing` JSON payload.
 * Keeps branch detection and snapshot→ListingData mapping in the negocio lane (lib stays a thin router).
 */

import type { ListingData } from "@/app/clasificados/components/ListingView";
import type { EnVentaDraftSnapshot } from "@/app/clasificados/en-venta/publish/buildEnVentaDraftSnapshot";
import { buildBrNegocioListingData } from "@/app/clasificados/bienes-raices/negocio/mapping/bienesRaicesNegocioListingMapper";

export function isBienesRaicesNegocioPublishPreviewContext(
  categoryFromUrl: string,
  snap: EnVentaDraftSnapshot,
  details: Record<string, string>
): boolean {
  const brBranch = (snap.details?.bienesRaicesBranch ?? details?.bienesRaicesBranch ?? "").trim().toLowerCase();
  return categoryFromUrl === "bienes-raices" && brBranch === "negocio";
}

export type BuildBrNegocioFullPreviewListingDataParams = {
  enVentaSnapshot: EnVentaDraftSnapshot;
  lang: "es" | "en";
  todayLabel: string;
  previewCategoryLabel: string;
  sellerDisplayName: string | null | undefined;
  userId: string | null | undefined;
  previewPublishReturnPath: string | null;
};

export function buildBrNegocioFullPreviewListingData(params: BuildBrNegocioFullPreviewListingDataParams): ListingData {
  const {
    enVentaSnapshot: snap,
    lang,
    todayLabel,
    previewCategoryLabel,
    sellerDisplayName,
    userId,
    previewPublishReturnPath,
  } = params;

  const imgs = snap.images?.length ? snap.images : ["/logo.png"];

  /** Caller must gate with `isBienesRaicesNegocioPublishPreviewContext` (see `buildFullPreviewListingData`). */
  return buildBrNegocioListingData({
    snap: {
      title: snap.title,
      priceLabel: snap.priceLabel,
      city: snap.city,
      cityCanonical: snap.cityCanonical,
      description: snap.description,
      detailPairs: snap.detailPairs ?? [],
      details: snap.details,
      images: imgs,
      proVideoThumbUrl: snap.proVideoThumbUrl ?? null,
      proVideoUrl: snap.proVideoUrl ?? null,
      lang: snap.lang,
    },
    lang,
    todayLabel,
    previewCategoryLabel: previewCategoryLabel || "",
    sellerDisplayName: sellerDisplayName ?? null,
    userId: userId ?? null,
    agentProfileReturnUrl: previewPublishReturnPath,
  });
}
