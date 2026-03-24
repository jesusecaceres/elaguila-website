/**
 * BR privado: assemble `ListingData` for publish preview + `/clasificados/bienes-raices/privado/preview`.
 */

import type { ListingData } from "@/app/clasificados/components/ListingView";
import type { PublishDraftSnapshot } from "@/app/clasificados/lib/publishDraftSnapshot";
import { computePublishRequirements } from "@/app/clasificados/lib/publishRequirements";
import { buildBrPrivadoListingData } from "@/app/clasificados/bienes-raices/privado/mapping/buildBrPrivadoPreviewListingData";

function formatPhoneDigits(raw: string): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 10);
}

function formatPhoneDisplay(raw: string): string {
  const digits = formatPhoneDigits(raw);
  if (digits.length <= 3) return digits.length > 0 ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isBienesRaicesPrivadoPublishPreviewContext(
  categoryFromUrl: string,
  snap: PublishDraftSnapshot,
  details: Record<string, string>
): boolean {
  const br = (snap.details?.bienesRaicesBranch ?? details?.bienesRaicesBranch ?? "").trim().toLowerCase();
  return categoryFromUrl === "bienes-raices" && br === "privado";
}

export type BuildBrPrivadoFullPreviewListingDataParams = {
  publishDraftSnapshot: PublishDraftSnapshot;
  lang: "es" | "en";
  todayLabel: string;
  previewCategoryLabel: string;
  sellerDisplayName: string | null | undefined;
  userId: string | null | undefined;
  contactPhoneDisplay: string;
};

export function buildBrPrivadoFullPreviewListingData(params: BuildBrPrivadoFullPreviewListingDataParams): ListingData {
  const {
    publishDraftSnapshot: snap,
    lang,
    todayLabel,
    previewCategoryLabel,
    sellerDisplayName,
    userId,
    contactPhoneDisplay,
  } = params;

  const base = buildBrPrivadoListingData({
    snap: {
      title: snap.title,
      priceLabel: snap.priceLabel,
      city: snap.city,
      cityCanonical: snap.cityCanonical,
      description: snap.description,
      detailPairs: snap.detailPairs ?? [],
      details: snap.details,
      images: snap.images?.length ? snap.images : ["/logo.png"],
      proVideoThumbUrl: snap.proVideoThumbUrl ?? null,
      proVideoUrl: snap.proVideoUrl ?? null,
      proVideoThumbUrl2: snap.proVideoThumbUrl2 ?? null,
      proVideoUrl2: snap.proVideoUrl2 ?? null,
      lang: snap.lang,
      contactMethod: snap.contactMethod,
      contactPhone: snap.contactPhone,
      contactEmail: snap.contactEmail,
      isPro: snap.isPro,
    },
    lang,
    todayLabel,
    previewCategoryLabel,
    sellerDisplayName,
    userId,
    contactPhoneDisplay,
  });
  const reqs = computePublishRequirements(snap);
  return {
    ...base,
    managementHooks: {
      branch: "privado",
      publishReady: reqs.allOk,
      analyticsReady: true,
      boostEligible: Boolean(snap.isPro),
      adminReviewReady: true,
      listingTrace: {
        ownerAccountId: userId?.trim() ? userId.trim() : null,
        cityCanonical: snap.cityCanonical,
      },
    },
  };
}

export { formatPhoneDisplay as formatBrPrivadoPreviewPhoneDisplay };
