import {
  activeOfertaLocalDraftAssets,
  assetHasUploadedWithUrl,
} from "./ofertasLocalesDraftAssetHelpers";
import { isOfertaLocalCouponPromotionFlow, isOfertaLocalWeeklyFlyerFlow } from "./ofertasLocalesApplicationHelpers";
import type { OfertaLocalDraft, OfertaLocalDraftAsset } from "./ofertasLocalesTypes";

export type OfertaLocalAiScanReadinessStatus =
  | "not_ready"
  | "ready"
  | "processing"
  | "needs_review"
  | "failed";

export type OfertaLocalScanEligibleAsset = {
  assetId: string;
  assetKind: "flyer" | "coupon";
  assetUrl: string;
  storagePath: string;
  mimeType: string;
  fileName: string;
};

export type OfertaLocalAiScanReadiness = {
  status: OfertaLocalAiScanReadinessStatus;
  ready: boolean;
  missingPrerequisites: string[];
  infoNotes: string[];
  eligibleAssets: OfertaLocalScanEligibleAsset[];
  requiresSubmittedOffer: boolean;
  hasOfertaLocalId: boolean;
};

export type OfertaLocalAiScanReadinessContext = {
  ofertaLocalId?: string | null;
  lang?: "es" | "en";
  /** Set after a scan attempt when server reports missing Google config. */
  serverConfigurationMissing?: boolean;
};

function eligibleAssetFromDraft(
  asset: OfertaLocalDraftAsset,
  assetKind: "flyer" | "coupon"
): OfertaLocalScanEligibleAsset | null {
  if (!assetHasUploadedWithUrl(asset)) return null;
  return {
    assetId: asset.id,
    assetKind,
    assetUrl: asset.url.trim(),
    storagePath: asset.storagePath.trim(),
    mimeType: asset.mimeType.trim() || "application/octet-stream",
    fileName: asset.fileName.trim(),
  };
}

export function getOfertaLocalScanEligibleAssets(draft: OfertaLocalDraft): OfertaLocalScanEligibleAsset[] {
  const out: OfertaLocalScanEligibleAsset[] = [];
  const isFlyer = isOfertaLocalWeeklyFlyerFlow(draft.offerType);
  const isCoupon = isOfertaLocalCouponPromotionFlow(draft.offerType);

  if (isFlyer) {
    for (const asset of activeOfertaLocalDraftAssets(draft.flyerAssets)) {
      const mapped = eligibleAssetFromDraft(asset, "flyer");
      if (mapped) out.push(mapped);
    }
    for (const asset of activeOfertaLocalDraftAssets(draft.couponAssets)) {
      const mapped = eligibleAssetFromDraft(asset, "coupon");
      if (mapped) out.push(mapped);
    }
  } else if (isCoupon) {
    for (const asset of activeOfertaLocalDraftAssets(draft.couponAssets)) {
      const mapped = eligibleAssetFromDraft(asset, "coupon");
      if (mapped) out.push(mapped);
    }
  }

  return out;
}

export function getOfertaLocalAiScanReadiness(
  draft: OfertaLocalDraft,
  context: OfertaLocalAiScanReadinessContext = {}
): OfertaLocalAiScanReadiness {
  const lang = context.lang ?? "es";
  const missing: string[] = [];

  if (!draft.wantsAiSearchableSpecials) {
    missing.push(
      lang === "en"
        ? "Enable AI Product Search in Step 1."
        : "Activa Búsqueda por producto con AI en el Paso 1."
    );
  }

  const eligibleAssets = getOfertaLocalScanEligibleAssets(draft);
  if (eligibleAssets.length === 0) {
    missing.push(
      lang === "en"
        ? "Upload a flyer or coupon file with a public URL."
        : "Sube un volante o cupón con URL pública."
    );
  }

  const requiresSubmittedOffer = true;
  const hasOfertaLocalId = Boolean(context.ofertaLocalId?.trim());
  if (requiresSubmittedOffer && !hasOfertaLocalId) {
    missing.push(
      lang === "en"
        ? "Submit your offer for review first (Step 7) to link a record ID."
        : "Envía tu oferta para revisión primero (Paso 7) para obtener un ID."
    );
  }

  if (context.serverConfigurationMissing) {
    missing.push(
      lang === "en"
        ? "Google Document AI is not configured on the server."
        : "Google Document AI no está configurado en el servidor."
    );
  }

  const infoNotes = [
    lang === "en"
      ? "Google Document AI configuration is verified when you scan."
      : "La configuración de Google Document AI se verifica al escanear.",
  ];

  return {
    status: missing.length === 0 ? "ready" : "not_ready",
    ready: missing.length === 0,
    missingPrerequisites: missing,
    infoNotes,
    eligibleAssets,
    requiresSubmittedOffer,
    hasOfertaLocalId,
  };
}
