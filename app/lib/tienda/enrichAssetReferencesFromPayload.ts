import type { TiendaOrderSubmissionPayload } from "@/app/tienda/types/orderSubmission";
import type { TiendaOrderAssetReference } from "@/app/tienda/types/tiendaStoredAssets";

export function enrichAssetReferencesFromPayload(
  refs: TiendaOrderAssetReference[],
  payload: TiendaOrderSubmissionPayload
): TiendaOrderAssetReference[] {
  if (payload.source !== "print-upload" || !payload.printUploadExtra) return refs;

  const { front, back } = payload.printUploadExtra;
  return refs.map((r) => {
    if (r.role === "upload-front") {
      return {
        ...r,
        originalFilename: front.name,
        mimeType: front.mime,
        widthPx: front.widthPx,
        heightPx: front.heightPx,
      };
    }
    if (r.role === "upload-back" && back) {
      return {
        ...r,
        originalFilename: back.name,
        mimeType: back.mime,
        widthPx: back.widthPx,
        heightPx: back.heightPx,
      };
    }
    return r;
  });
}
