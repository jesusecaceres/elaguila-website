/**
 * BR negocio: assemble `ListingData` for publish full preview + `/clasificados/bienes-raices/preview` JSON payload.
 * Keeps branch detection and snapshot→ListingData mapping in the negocio lane (lib stays a thin router).
 */

import type { ListingData } from "@/app/clasificados/components/ListingView";
import type { PublishDraftSnapshot } from "@/app/clasificados/lib/publishDraftSnapshot";
import { computePublishRequirements } from "@/app/clasificados/lib/publishRequirements";
import { buildBrNegocioListingData } from "@/app/clasificados/bienes-raices/negocio/mapping/bienesRaicesNegocioListingMapper";

export function isBienesRaicesNegocioPublishPreviewContext(
  categoryFromUrl: string,
  snap: PublishDraftSnapshot,
  details: Record<string, string>
): boolean {
  const brBranch = (snap.details?.bienesRaicesBranch ?? details?.bienesRaicesBranch ?? "").trim().toLowerCase();
  return categoryFromUrl === "bienes-raices" && brBranch === "negocio";
}

export type BuildBrNegocioFullPreviewListingDataParams = {
  publishDraftSnapshot: PublishDraftSnapshot;
  lang: "es" | "en";
  todayLabel: string;
  previewCategoryLabel: string;
  sellerDisplayName: string | null | undefined;
  userId: string | null | undefined;
  previewPublishReturnPath: string | null;
};

export function buildBrNegocioFullPreviewListingData(params: BuildBrNegocioFullPreviewListingDataParams): ListingData {
  const {
    publishDraftSnapshot: snap,
    lang,
    todayLabel,
    previewCategoryLabel,
    sellerDisplayName,
    userId,
    previewPublishReturnPath,
  } = params;

  const imgs = snap.images?.length ? snap.images : ["/logo.png"];

  /** Caller must gate with `isBienesRaicesNegocioPublishPreviewContext` (see `buildFullPreviewListingData`). */
  const base = buildBrNegocioListingData({
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
  const reqs = computePublishRequirements(snap);
  const d = snap.details;
  return {
    ...base,
    managementHooks: {
      branch: "negocio",
      publishReady: reqs.allOk,
      analyticsReady: true,
      boostEligible: true,
      adminReviewReady: true,
      listingTrace: {
        ownerAccountId: userId?.trim() ? userId.trim() : null,
        businessName: (d.negocioNombre ?? "").trim() || null,
        brokerageName: (d.negocioNombreCorreduria ?? "").trim() || null,
        agentName: (d.negocioAgente ?? "").trim() || null,
        cityCanonical: snap.cityCanonical,
      },
    },
  };
}
