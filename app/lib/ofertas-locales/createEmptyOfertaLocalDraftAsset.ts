import type { OfertaLocalDraftAsset, OfertaLocalDraftAssetType } from "./ofertasLocalesTypes";

function newAssetId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `oferta-asset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Safe empty draft asset — metadata only, no file bytes or fake URLs. */
export function createEmptyOfertaLocalDraftAsset(
  assetType: OfertaLocalDraftAssetType,
  sortOrder = 0
): OfertaLocalDraftAsset {
  return {
    id: newAssetId(),
    assetType,
    title: "",
    note: "",
    url: "",
    fileName: "",
    mimeType: "",
    storagePath: "",
    sizeBytes: null,
    pageNumber: null,
    sortOrder,
    status: assetType === "external_url" ? "draft" : "needs_upload",
  };
}
