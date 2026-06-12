import { activeOfertaLocalDraftAssets, assetHasLocalFileMetadata } from "./ofertasLocalesDraftAssetHelpers";
import type { OfertaLocalDraft, OfertaLocalDraftAsset } from "./ofertasLocalesTypes";

/** Split shopping-lane flyer assets: first = primary, rest = legacy/supporting extras. */
export function splitOfertaLocalPrimaryFlyerAssets(flyerAssets: OfertaLocalDraftAsset[]): {
  primary: OfertaLocalDraftAsset | null;
  supporting: OfertaLocalDraftAsset[];
} {
  const active = activeOfertaLocalDraftAssets(flyerAssets);
  return {
    primary: active[0] ?? null,
    supporting: active.slice(1),
  };
}

/** True when draft has file metadata saved locally but not uploaded to storage. */
export function ofertaLocalDraftHasUnuploadedAssetMetadata(draft: OfertaLocalDraft): boolean {
  for (const asset of [...draft.flyerAssets, ...draft.couponAssets]) {
    if (assetHasLocalFileMetadata(asset)) return true;
  }
  return false;
}

export type OfertaLocalDraftAssetSectionMode =
  | "default"
  | "primaryMainFlyer"
  | "supportingFlyerExtras"
  | "additionalCoupons"
  | "mainCoupons"
  | "additionalPromo";

export function visibleAssetsForSectionMode(
  assets: OfertaLocalDraftAsset[],
  mode: OfertaLocalDraftAssetSectionMode
): OfertaLocalDraftAsset[] {
  const active = activeOfertaLocalDraftAssets(assets);
  if (mode === "primaryMainFlyer") {
    return active.slice(0, 1);
  }
  if (mode === "supportingFlyerExtras") {
    return active.slice(1);
  }
  return active;
}

export function canAddAssetInSectionMode(
  assets: OfertaLocalDraftAsset[],
  mode: OfertaLocalDraftAssetSectionMode,
  maxBucket: number
): boolean {
  const active = activeOfertaLocalDraftAssets(assets);
  if (mode === "primaryMainFlyer") {
    return active.length === 0;
  }
  if (mode === "supportingFlyerExtras") {
    return false;
  }
  return active.length < maxBucket;
}
