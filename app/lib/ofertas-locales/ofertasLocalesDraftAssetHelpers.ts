import { OFERTAS_LOCALES_DRAFT_ASSET_TYPE_OPTIONS } from "./ofertasLocalesConstants";
import type { OfertaLocalDraftAsset, OfertaLocalDraftAssetType } from "./ofertasLocalesTypes";

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
