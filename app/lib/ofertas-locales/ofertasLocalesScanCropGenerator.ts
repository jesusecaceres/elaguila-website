import "server-only";

import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

import { geminiBboxToPixelCropRect, type GeminiSourceBbox } from "./ofertasLocalesGeminiBbox";
import {
  renderOfertaLocalPdfPageToPngForCrop,
  type OfertaLocalPageImage,
} from "./ofertasLocalesPdfPageImages";
import { sanitizeOfertaLocalStorageSegment } from "./ofertasLocalesStoragePaths";
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

type CropRasterSource = {
  imageBytes: Buffer;
  width: number;
  height: number;
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
 * Rasterizes pdf_single_page fallback on demand when needed (Gate OFERTAS-CROP-PATCH-1).
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
  const rasterCache = new Map<number, CropRasterSource>();

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

    const pageNumber = item.sourcePage ?? 0;
    const page = pageByNumber.get(pageNumber);
    if (!page) {
      cropErrors.push(`page_${pageNumber}_missing`);
      continue;
    }

    let raster: CropRasterSource | null = rasterCache.get(pageNumber) ?? null;
    if (!raster) {
      raster = await resolveCropRasterSource(page, params.scanJobId);
      if (raster) rasterCache.set(pageNumber, raster);
    }
    if (!raster) {
      cropErrors.push(`page_${pageNumber}_no_raster_image`);
      continue;
    }

    const rect = geminiBboxToPixelCropRect({
      bbox: geminiBbox,
      imageWidth: raster.width,
      imageHeight: raster.height,
      paddingFraction: 0.08,
    });
    if (!rect) {
      cropErrors.push(`item_${index}_invalid_crop_rect`);
      continue;
    }

    try {
      const cropped = await sharp(raster.imageBytes)
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

      console.info("[ofertas-locales crop] crop upload success", {
        scanJobId: params.scanJobId,
        itemIndex: index,
        sourcePage: pageNumber,
      });

      item.sourceCropUrl = blob.url;
      item.extractedJson = {
        ...(item.extractedJson ?? {}),
        sourceBboxGemini: geminiBbox,
        cropRect: rect,
        cropPageWidth: raster.width,
        cropPageHeight: raster.height,
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

async function resolveCropRasterSource(
  page: OfertaLocalPageImage,
  scanJobId: string
): Promise<CropRasterSource | null> {
  if (page.renderMethod === "pdfjs_canvas_png" && page.width && page.height) {
    console.info("[ofertas-locales crop] using existing raster page", {
      scanJobId,
      sourcePage: page.pageNumber,
    });
    return {
      imageBytes: page.imageBytes,
      width: page.width,
      height: page.height,
    };
  }

  if (page.renderMethod === "pdf_single_page") {
    console.info("[ofertas-locales crop] rasterizing pdf fallback page", {
      scanJobId,
      sourcePage: page.pageNumber,
    });
    const raster = await renderOfertaLocalPdfPageToPngForCrop({
      pdfBytes: page.imageBytes,
      pageNumber: page.pageNumber,
    });
    if (!raster) {
      console.info("[ofertas-locales crop] fallback rasterization failed", {
        scanJobId,
        sourcePage: page.pageNumber,
      });
      return null;
    }
    return {
      imageBytes: raster.imageBytes,
      width: raster.width,
      height: raster.height,
    };
  }

  return null;
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
