import {
  activeOfertaLocalDraftAssets,
  assetHasUploadedWithUrl,
} from "./ofertasLocalesDraftAssetHelpers";
import { isOfertaLocalCouponPromotionFlow, isOfertaLocalWeeklyFlyerFlow } from "./ofertasLocalesApplicationHelpers";
import { canOfertaLocalDraftPersistForAiScan } from "./ofertasLocalesAiScanPersist";
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
  requiresScanRecord: boolean;
  hasOfertaLocalId: boolean;
  canPersistForScan: boolean;
};

export type OfertaLocalAiScanReadinessContext = {
  ofertaLocalId?: string | null;
  lang?: "es" | "en";
  /** Set after a scan attempt when server reports missing Google config. */
  serverConfigurationMissing?: boolean;
  /** When true, user is signed in and core draft fields allow scan-prep persist. */
  signedIn?: boolean;
};

const AI_SCAN_READY_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

function eligibleAssetFromDraft(
  asset: OfertaLocalDraftAsset,
  assetKind: "flyer" | "coupon"
): OfertaLocalScanEligibleAsset | null {
  if (asset.assetType === "external_url") return null;
  if (!assetHasUploadedWithUrl(asset)) return null;
  const mime = (asset.mimeType || "").toLowerCase();
  if (mime && !AI_SCAN_READY_MIMES.has(mime)) return null;
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
        ? "Upload a PDF, JPG, or PNG to activate AI scanning."
        : "Sube un PDF, JPG o PNG para activar el escaneo AI."
    );
  }

  const hasOfertaLocalId = Boolean(context.ofertaLocalId?.trim());
  const signedIn = context.signedIn !== false;
  const canPersistForScan = signedIn && canOfertaLocalDraftPersistForAiScan(draft);

  if (!signedIn) {
    missing.push(
      lang === "en" ? "Sign in to scan with AI." : "Inicia sesión para escanear con AI."
    );
  } else if (!hasOfertaLocalId && !canPersistForScan) {
    missing.push(
      lang === "en"
        ? "Complete business details in Steps 2–4 before scanning."
        : "Completa los datos del negocio en los Pasos 2–4 antes de escanear."
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
      ? "Scanning may take a few moments. Afterward, you can review and edit suggestions before publishing."
      : "El escaneo puede tardar unos momentos. Después podrás revisar y editar las sugerencias antes de publicarlas.",
    lang === "en"
      ? "Only uploaded PDF, JPG, or PNG files are AI scan-ready. External links are reference-only."
      : "Solo archivos subidos PDF, JPG o PNG están listos para escaneo AI. Los enlaces externos son solo referencia.",
    ...(eligibleAssets.length > 1
      ? [
          lang === "en"
            ? "Only one file can be scanned at a time. Scan the main flyer first, then additional coupon files if needed."
            : "Solo se puede escanear un archivo a la vez. Escanea primero el volante principal y luego archivos de cupón adicionales si aplica.",
        ]
      : []),
  ];

  const scanReady =
    draft.wantsAiSearchableSpecials &&
    eligibleAssets.length > 0 &&
    signedIn &&
    (hasOfertaLocalId || canPersistForScan) &&
    !context.serverConfigurationMissing;

  return {
    status: scanReady ? "ready" : "not_ready",
    ready: scanReady,
    missingPrerequisites: missing,
    infoNotes,
    eligibleAssets,
    requiresScanRecord: !hasOfertaLocalId,
    hasOfertaLocalId,
    canPersistForScan,
  };
}
