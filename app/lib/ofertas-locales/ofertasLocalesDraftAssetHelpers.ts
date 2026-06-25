import { OFERTAS_LOCALES_DRAFT_ASSET_TYPE_OPTIONS } from "./ofertasLocalesConstants";
import type { OfertaLocalDraftAsset, OfertaLocalDraftAssetType } from "./ofertasLocalesTypes";
import type { OfertaLocalDraftAssetSectionMode } from "./ofertasLocalesStep5AssetLayout";

export function isActiveOfertaLocalDraftAsset(asset: OfertaLocalDraftAsset): boolean {
  return asset.status !== "removed";
}

export function activeOfertaLocalDraftAssets(assets: OfertaLocalDraftAsset[]): OfertaLocalDraftAsset[] {
  return assets.filter(isActiveOfertaLocalDraftAsset).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function labelForOfertaLocalDraftAssetType(
  assetType: OfertaLocalDraftAssetType,
  lang: "es" | "en" = "es"
): string {
  const opt = OFERTAS_LOCALES_DRAFT_ASSET_TYPE_OPTIONS.find((o) => o.value === assetType);
  if (!opt) return assetType;
  return lang === "en" ? opt.labelEn : opt.labelEs;
}

export function assetHasExternalUrlReady(asset: OfertaLocalDraftAsset): boolean {
  return asset.assetType === "external_url" && Boolean(asset.url.trim());
}

export function assetNeedsFileUpload(asset: OfertaLocalDraftAsset): boolean {
  if (asset.assetType === "external_url") return !asset.url.trim();
  return asset.status === "needs_upload" && !asset.fileName.trim();
}

export function assetHasUploadedStorage(asset: OfertaLocalDraftAsset): boolean {
  return asset.assetType !== "external_url" && Boolean(asset.storagePath.trim());
}

export function assetHasUploadedWithUrl(asset: OfertaLocalDraftAsset): boolean {
  return assetHasUploadedStorage(asset) && Boolean(asset.url.trim());
}

export function assetHasUploadedStorageOnly(asset: OfertaLocalDraftAsset): boolean {
  return assetHasUploadedStorage(asset) && !asset.url.trim();
}

/** File selected locally (metadata in draft) but not uploaded to storage yet. */
export function assetHasLocalFileMetadata(asset: OfertaLocalDraftAsset): boolean {
  return (
    asset.assetType !== "external_url" &&
    Boolean(asset.fileName.trim()) &&
    !asset.storagePath.trim()
  );
}

const AI_SCAN_READY_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

export function assetIsAiScanEligible(asset: OfertaLocalDraftAsset): boolean {
  if (asset.assetType === "external_url") return false;
  if (!assetHasUploadedWithUrl(asset)) return false;
  const mime = (asset.mimeType || "").toLowerCase();
  return !mime || AI_SCAN_READY_MIMES.has(mime);
}

export function findDuplicateOfertaLocalDraftAsset(
  assets: OfertaLocalDraftAsset[],
  file: File,
  excludeAssetId?: string
): OfertaLocalDraftAsset | null {
  for (const asset of assets) {
    if (asset.status === "removed") continue;
    if (excludeAssetId && asset.id === excludeAssetId) continue;
    if (asset.fileName !== file.name) continue;
    if (asset.mimeType && file.type && asset.mimeType !== file.type) continue;
    if (asset.sizeBytes != null && asset.sizeBytes === file.size) return asset;
    if (asset.sizeBytes == null && asset.fileName === file.name) return asset;
  }
  return null;
}

export function ofertaLocalDraftAssetRoleLabel(params: {
  asset: OfertaLocalDraftAsset;
  bucket: "flyerAssets" | "couponAssets";
  sectionMode: OfertaLocalDraftAssetSectionMode;
  lang: "es" | "en";
}): string {
  const { asset, bucket, sectionMode, lang } = params;
  const es = lang === "es";

  if (asset.assetType === "external_url") {
    return es ? "URL externa" : "External URL";
  }
  if (sectionMode === "primaryMainFlyer") {
    return es ? "Volante principal" : "Main flyer";
  }
  if (sectionMode === "mainCoupons") {
    return es ? "Cupón principal" : "Main coupon file";
  }
  if (bucket === "couponAssets") {
    if (asset.assetType === "coupon_image") {
      return es ? "Imagen de cupón" : "Coupon image";
    }
    return es ? "Cupón / archivo adicional" : "Coupon / additional file";
  }
  if (sectionMode === "supportingFlyerExtras" || sectionMode === "additionalPromo") {
    return es ? "Archivo adicional" : "Additional file";
  }
  return es ? "Volante" : "Flyer";
}

export function ofertaLocalDraftAssetUploadStatusLabel(
  asset: OfertaLocalDraftAsset,
  lang: "es" | "en"
): string {
  if (asset.assetType === "external_url") {
    return asset.url.trim()
      ? lang === "es"
        ? "Enlace listo"
        : "Link ready"
      : lang === "es"
        ? "Falta URL"
        : "URL missing";
  }
  if (assetHasUploadedStorage(asset)) {
    return lang === "es" ? "Subido" : "Uploaded";
  }
  if (assetHasLocalFileMetadata(asset)) {
    return lang === "es" ? "Pendiente de subir" : "Pending upload";
  }
  return lang === "es" ? "Sin archivo" : "No file";
}
