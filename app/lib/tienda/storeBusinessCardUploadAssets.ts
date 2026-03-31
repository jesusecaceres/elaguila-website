"use client";

import type { BusinessCardSessionPayloadV3Upload } from "@/app/tienda/order/mappers/businessCardDocumentToReview";
import { uploadTiendaAsset } from "@/app/lib/tienda/uploadTiendaAsset";

export type StoreBusinessCardUploadAssetsResult = { ok: true } | { ok: false; error: string; code?: string };

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/** Preserves original bytes; uploads JSON session + upload-front / upload-back (no PNG exports). */
export async function storeBusinessCardUploadAssets(input: {
  orderId: string;
  productSlug: string;
  session: BusinessCardSessionPayloadV3Upload;
}): Promise<StoreBusinessCardUploadAssetsResult> {
  const { orderId, productSlug, session } = input;

  const jsonBlob = new Blob([JSON.stringify(session)], { type: "application/json" });
  let step = await uploadTiendaAsset({
    orderId,
    role: "design-json-snapshot",
    source: "business-cards",
    productSlug,
    file: jsonBlob,
    mimeType: "application/json",
    originalFilename: "design-json-snapshot.json",
  });
  if (!step.ok) return step;

  const fm = session.frontMeta;
  if (!fm?.dataUrl) {
    return { ok: false, error: "Front artwork data is missing; save again in the upload flow.", code: "MISSING_UPLOAD_BYTES" };
  }

  let blob = await dataUrlToBlob(fm.dataUrl);
  step = await uploadTiendaAsset({
    orderId,
    role: "upload-front",
    source: "business-cards",
    productSlug,
    file: blob,
    mimeType: fm.mime,
    originalFilename: fm.name,
    widthPx: fm.widthPx,
    heightPx: fm.heightPx,
  });
  if (!step.ok) return step;

  const back = session.backMeta;
  if (session.sidedness === "two-sided") {
    if (!back?.dataUrl) {
      return { ok: false, error: "Back artwork data is missing; save again in the upload flow.", code: "MISSING_UPLOAD_BYTES" };
    }
    blob = await dataUrlToBlob(back.dataUrl);
    step = await uploadTiendaAsset({
      orderId,
      role: "upload-back",
      source: "business-cards",
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
