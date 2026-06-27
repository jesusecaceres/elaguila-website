import "server-only";

import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

import type { GeminiSourceBbox } from "./ofertasLocalesGeminiBbox";
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

type PixelCropRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type SharpModule = typeof import("sharp");

type CropSummary = {
  totalItems: number;
  itemsWithBbox: number;
  cropAttempted: number;
  cropUploaded: number;
  cropSkipped: number;
  skipReasonCounts: Record<string, number>;
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
  return `ofertas-locales/scan-crops/${ofertaId}/${jobId}/${assetId}/p${params.pageNumber}-${params.itemIndex}-${randomUUID()}.png`;
}

/**
 * Crop product tiles from rendered page PNGs and upload to Vercel Blob.
 * Rasterizes pdf_single_page / direct_image on demand when needed.
 */
export async function applyOfertaLocalScanItemCrops(
  params: ApplyOfertaLocalScanItemCropsParams
): Promise<ApplyOfertaLocalScanItemCropsResult> {
  const summary: CropSummary = {
    totalItems: params.items.length,
    itemsWithBbox: 0,
    cropAttempted: 0,
    cropUploaded: 0,
    cropSkipped: 0,
    skipReasonCounts: {},
  };

  const recordSkip = (reason: string) => {
    summary.cropSkipped += 1;
    summary.skipReasonCounts[reason] = (summary.skipReasonCounts[reason] ?? 0) + 1;
  };

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    console.warn("[ofertas-locales crop] disabled: missing BLOB_READ_WRITE_TOKEN");
    return { cropsGenerated: 0, cropErrors: ["blob_token_missing"] };
  }

  const pageByNumber = new Map(params.pageImages.map((p) => [p.pageNumber, p]));
  let cropsGenerated = 0;
  const cropErrors: string[] = [];
  const rasterCache = new Map<number, CropRasterSource>();
  const rasterFailureCache = new Set<number>();
  const pageReadyLogged = new Set<number>();

  let sharp: SharpModule | null = null;
  try {
    sharp = (await import("sharp")).default;
  } catch (err) {
    const message = err instanceof Error ? err.message : "sharp_unavailable";
    console.warn("[ofertas-locales crop] disabled: sharp unavailable", {
      error: message.slice(0, 200),
    });
    return { cropsGenerated: 0, cropErrors: ["sharp_unavailable"] };
  }

  for (let index = 0; index < params.items.length; index++) {
    const item = params.items[index];
    const geminiBbox = readGeminiBboxFromItem(item);
    const normalizedBbox = item.sourceBbox;
    if (!geminiBbox || !normalizedBbox) continue;

    summary.itemsWithBbox += 1;

    const pageNumber = item.sourcePage ?? 1;
    const page = pageByNumber.get(pageNumber);
    if (!page) {
      cropErrors.push(`page_${pageNumber}_missing`);
      recordSkip("page_missing");
      continue;
    }

    let raster: CropRasterSource | null = rasterCache.get(pageNumber) ?? null;
    if (!raster && !rasterFailureCache.has(pageNumber)) {
      raster = await resolveCropRasterSource(page, params.scanJobId, sharp);
      if (raster) {
        rasterCache.set(pageNumber, raster);
        if (!pageReadyLogged.has(pageNumber)) {
          pageReadyLogged.add(pageNumber);
          console.info("[ofertas-locales crop] page ready", {
            scanJobId: params.scanJobId,
            sourcePage: page.pageNumber,
            renderMethod: page.renderMethod,
            hasImageBytes: raster.imageBytes.length > 0,
            width: raster.width,
            height: raster.height,
          });
        }
      } else {
        rasterFailureCache.add(pageNumber);
        console.warn("[ofertas-locales crop] no_page_image_available_for_crop", {
          scanJobId: params.scanJobId,
          sourcePage: pageNumber,
          renderMethod: page.renderMethod,
        });
      }
    }
    if (!raster) {
      cropErrors.push(`page_${pageNumber}_no_raster_image`);
      recordSkip("page_no_raster");
      continue;
    }

    summary.cropAttempted += 1;

    const rect = normalizedBboxToPixelCropRect({
      bbox: normalizedBbox,
      imageWidth: raster.width,
      imageHeight: raster.height,
      paddingFraction: 0.08,
    });
    if (!rect) {
      cropErrors.push(`item_${index}_invalid_crop_rect`);
      console.warn("[ofertas-locales crop] invalid crop rectangle", {
        scanJobId: params.scanJobId,
        itemIndex: index,
        sourcePage: pageNumber,
      });
      recordSkip("invalid_crop_rect");
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
        .png()
        .toBuffer();

      const pathname = createOfertaLocalScanCropStoragePath({
        ofertaLocalId: params.ofertaLocalId,
        scanJobId: params.scanJobId,
        sourceAssetId: params.sourceAssetId,
        pageNumber,
        itemIndex: index,
      });

      const blob = await put(pathname, cropped, {
        access: "public",
        contentType: "image/png",
        token,
      });

      console.info("[ofertas-locales crop] crop upload success", {
        scanJobId: params.scanJobId,
        itemIndex: index,
        sourcePage: pageNumber,
        itemName: item.itemName,
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
      summary.cropUploaded += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "crop_failed";
      cropErrors.push(`item_${index}:${message.slice(0, 120)}`);
      console.warn("[ofertas-locales crop] crop upload failed", {
        scanJobId: params.scanJobId,
        itemIndex: index,
        sourcePage: pageNumber,
        itemName: item.itemName,
        reason: message.slice(0, 200),
        error: message.slice(0, 200),
      });
      recordSkip("crop_upload_failed");
    }
  }

  console.info("[ofertas-locales crop] summary", {
    scanJobId: params.scanJobId,
    sourceAssetId: params.sourceAssetId,
    totalItems: summary.totalItems,
    itemsWithBbox: summary.itemsWithBbox,
    cropAttempted: summary.cropAttempted,
    cropUploaded: summary.cropUploaded,
    cropSuccessCount: summary.cropUploaded,
    cropFailureCount: summary.cropSkipped,
    cropSkipped: summary.cropSkipped,
    skipReasonCounts: summary.skipReasonCounts,
  });

  return { cropsGenerated, cropErrors };
}

async function resolveCropRasterSource(
  page: OfertaLocalPageImage,
  scanJobId: string,
  sharp: SharpModule
): Promise<CropRasterSource | null> {
  if (page.renderMethod === "pdfjs_canvas_png" || page.renderMethod === "direct_image") {
    const raster = await resolveImageBytesRaster(page, sharp);
    if (raster) {
      console.info("[ofertas-locales crop] page render success", {
        scanJobId,
        sourcePage: page.pageNumber,
        width: raster.width,
        height: raster.height,
      });
    }
    return raster;
  }

  if (page.renderMethod === "pdf_single_page") {
    const raster = await renderOfertaLocalPdfPageToPngForCrop({
      pdfBytes: page.imageBytes,
      pageNumber: page.pageNumber,
    });
    if (raster) {
      console.info("[ofertas-locales crop] page render success", {
        scanJobId,
        sourcePage: page.pageNumber,
        width: raster.width,
        height: raster.height,
      });
      return {
        imageBytes: raster.imageBytes,
        width: raster.width,
        height: raster.height,
      };
    }

    console.warn("[ofertas-locales crop] page render failed", {
      scanJobId,
      sourcePage: page.pageNumber,
      reason: "pdfjs_page_render_failed",
    });
    return null;
  }

  return null;
}

function normalizedBboxToPixelCropRect(params: {
  bbox: OfertaLocalSourceBoundingBox;
  imageWidth: number;
  imageHeight: number;
  paddingFraction?: number;
}): PixelCropRect | null {
  const { bbox, imageWidth, imageHeight } = params;
  const paddingFraction = params.paddingFraction ?? 0.08;
  if (!Number.isFinite(imageWidth) || !Number.isFinite(imageHeight) || imageWidth < 1 || imageHeight < 1) {
    return null;
  }

  const xMin = Math.max(0, Math.min(1, bbox.xMin));
  const xMax = Math.max(0, Math.min(1, bbox.xMax));
  const yMin = Math.max(0, Math.min(1, bbox.yMin));
  const yMax = Math.max(0, Math.min(1, bbox.yMax));

  let left = Math.round(Math.min(xMin, xMax) * imageWidth);
  let top = Math.round(Math.min(yMin, yMax) * imageHeight);
  let width = Math.round(Math.abs(xMax - xMin) * imageWidth);
  let height = Math.round(Math.abs(yMax - yMin) * imageHeight);

  const padX = Math.round(width * paddingFraction);
  const padY = Math.round(height * paddingFraction);

  left = Math.max(0, left - padX);
  top = Math.max(0, top - padY);
  width += padX * 2;
  height += padY * 2;

  if (left + width > imageWidth) width = imageWidth - left;
  if (top + height > imageHeight) height = imageHeight - top;

  if (width < 8 || height < 8) return null;
  return { left, top, width, height };
}

async function resolveImageBytesRaster(
  page: OfertaLocalPageImage,
  sharp: SharpModule
): Promise<CropRasterSource | null> {
  if (page.imageBytes.length === 0) return null;

  if (page.width && page.height) {
    return {
      imageBytes: page.imageBytes,
      width: page.width,
      height: page.height,
    };
  }

  try {
    const meta = await sharp(page.imageBytes).metadata();
    if (meta.width && meta.height) {
      return {
        imageBytes: page.imageBytes,
        width: meta.width,
        height: meta.height,
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "metadata_failed";
    console.info("[ofertas-locales crop] image metadata read failed", {
      sourcePage: page.pageNumber,
      renderMethod: page.renderMethod,
      error: message.slice(0, 200),
    });
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
