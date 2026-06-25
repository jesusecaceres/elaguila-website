import "server-only";

import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

import { geminiBboxToPixelCropRect, type GeminiSourceBbox } from "./ofertasLocalesGeminiBbox";
import { sanitizeOfertaLocalStorageSegment } from "./ofertasLocalesStoragePaths";
import type { OfertaLocalPageImage } from "./ofertasLocalesPdfPageImages";
import type { OfertaLocalSearchableItemDraft, OfertaLocalSourceBoundingBox } from "./ofertasLocalesTypes";

export type ApplyOfertaLocalScanItemCropsParams = {
  items: OfertaLocalSearchableItemDraft[];
  ofertaLocalId: string;
  scanJobId: string;
  sourceAssetId: string;
  pageImages: OfertaLocalPageImage[];
};

export type ApplyOfertaLocalScanItemCropsResult = {
  cropsGenerated: number;
  cropErrors: string[];
};

export function createOfertaLocalScanCropStoragePath(params: {
  ofertaLocalId: string;
  scanJobId: string;
  sourceAssetId: string;
  pageNumber: number;
  itemIndex: number;
}): string {
  const ofertaId = sanitizeOfertaLocalStorageSegment(params.ofertaLocalId, 64);
  const jobId = sanitizeOfertaLocalStorageSegment(params.scanJobId, 64);
  const assetId = sanitizeOfertaLocalStorageSegment(params.sourceAssetId, 64);
  return `ofertas-locales/scan-crops/${ofertaId}/${jobId}/${assetId}/p${params.pageNumber}-${params.itemIndex}-${randomUUID()}.webp`;
}

/**
 * Crop product tiles from rendered page PNGs and upload to Vercel Blob.
 * Requires sharp + BLOB_READ_WRITE_TOKEN. Skips gracefully when unavailable.
 */
export async function applyOfertaLocalScanItemCrops(
  params: ApplyOfertaLocalScanItemCropsParams
): Promise<ApplyOfertaLocalScanItemCropsResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return { cropsGenerated: 0, cropErrors: ["blob_unconfigured"] };
  }

  const pageByNumber = new Map(params.pageImages.map((p) => [p.pageNumber, p]));
  let cropsGenerated = 0;
  const cropErrors: string[] = [];

  let sharp: typeof import("sharp") | null = null;
  try {
    sharp = (await import("sharp")).default;
  } catch (err) {
    const message = err instanceof Error ? err.message : "sharp_unavailable";
    console.warn("[ofertas-locales ai] crop generation skipped — sharp unavailable", {
      error: message.slice(0, 200),
    });
    return { cropsGenerated: 0, cropErrors: ["sharp_unavailable"] };
  }

  for (let index = 0; index < params.items.length; index++) {
    const item = params.items[index];
    const geminiBbox = readGeminiBboxFromItem(item);
    const normalizedBbox = item.sourceBbox;
    if (!geminiBbox || !normalizedBbox) continue;

    const page = pageByNumber.get(item.sourcePage ?? 0);
    if (!page || page.renderMethod !== "pdfjs_canvas_png" || !page.width || !page.height) {
      cropErrors.push(`page_${item.sourcePage ?? 0}_no_raster_image`);
      continue;
    }

    const rect = geminiBboxToPixelCropRect({
      bbox: geminiBbox,
      imageWidth: page.width,
      imageHeight: page.height,
      paddingFraction: 0.08,
    });
    if (!rect) {
      cropErrors.push(`item_${index}_invalid_crop_rect`);
      continue;
    }

    try {
      const cropped = await sharp(page.imageBytes)
        .extract({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        })
        .webp({ quality: 85 })
        .toBuffer();

      const pathname = createOfertaLocalScanCropStoragePath({
        ofertaLocalId: params.ofertaLocalId,
        scanJobId: params.scanJobId,
        sourceAssetId: params.sourceAssetId,
        pageNumber: item.sourcePage ?? 1,
        itemIndex: index,
      });

      const blob = await put(pathname, cropped, {
        access: "public",
        contentType: "image/webp",
        token,
      });

      item.sourceCropUrl = blob.url;
      item.extractedJson = {
        ...(item.extractedJson ?? {}),
        sourceBboxGemini: geminiBbox,
        cropRect: rect,
        cropPageWidth: page.width,
        cropPageHeight: page.height,
        cropStoragePath: pathname,
      };
      item.sourceBbox = normalizedBbox;
      cropsGenerated += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "crop_failed";
      cropErrors.push(`item_${index}:${message.slice(0, 120)}`);
    }
  }

  if (cropsGenerated > 0) {
    console.info("[ofertas-locales ai] scan crops generated", {
      scanJobId: params.scanJobId,
      cropsGenerated,
      cropErrors: cropErrors.length,
    });
  }

  return { cropsGenerated, cropErrors };
}

function readGeminiBboxFromItem(item: OfertaLocalSearchableItemDraft): GeminiSourceBbox | null {
  const fromJson = item.extractedJson?.sourceBboxGemini;
  if (Array.isArray(fromJson) && fromJson.length === 4) {
    return fromJson as GeminiSourceBbox;
  }
  if (item.sourceBbox) {
    return normalizedBboxToGemini(item.sourceBbox);
  }
  return null;
}

function normalizedBboxToGemini(box: OfertaLocalSourceBoundingBox): GeminiSourceBbox {
  return [
    Math.round(box.yMin * 1000),
    Math.round(box.xMin * 1000),
    Math.round(box.yMax * 1000),
    Math.round(box.xMax * 1000),
  ];
}
