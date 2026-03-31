"use client";

import type { PrintUploadSessionPayloadV1 } from "@/app/tienda/order/mappers/printUploadDocumentToReview";
import { uploadTiendaAsset } from "@/app/lib/tienda/uploadTiendaAsset";

export type StorePrintUploadAssetsResult = { ok: true } | { ok: false; error: string; code?: string };

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/** Preserves original bytes from the session data URL (no recompression). */
export async function storePrintUploadAssets(input: {
  orderId: string;
  productSlug: string;
  session: PrintUploadSessionPayloadV1;
}): Promise<StorePrintUploadAssetsResult> {
  const { orderId, productSlug, session } = input;
  const fm = session.frontMeta;
  if (!fm?.dataUrl) {
    return { ok: false, error: "Front artwork data is missing; save again in the configurator.", code: "MISSING_UPLOAD_BYTES" };
  }

  let blob = await dataUrlToBlob(fm.dataUrl);
  let step = await uploadTiendaAsset({
    orderId,
    role: "upload-front",
    source: "print-upload",
    productSlug,
    file: blob,
    mimeType: fm.mime,
    originalFilename: fm.name,
    widthPx: fm.widthPx,
    heightPx: fm.heightPx,
  });
  if (!step.ok) return step;

  const back = session.backMeta;
  if (back) {
    if (!back.dataUrl) {
      return { ok: false, error: "Back artwork data is missing; save again in the configurator.", code: "MISSING_UPLOAD_BYTES" };
    }
    blob = await dataUrlToBlob(back.dataUrl);
    step = await uploadTiendaAsset({
      orderId,
      role: "upload-back",
      source: "print-upload",
      productSlug,
      file: blob,
      mimeType: back.mime,
      originalFilename: back.name,
      widthPx: back.widthPx,
      heightPx: back.heightPx,
    });
    if (!step.ok) return step;
  }

  return { ok: true };
}
