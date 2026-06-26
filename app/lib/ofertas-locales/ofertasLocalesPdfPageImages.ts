import "server-only";

import { createRequire } from "module";
import { PDFDocument } from "pdf-lib";

import {
  getOfertaLocalGeminiMaxPages,
  getOfertaLocalGeminiPageConcurrency,
} from "./ofertasLocalesGeminiConfig";

export const OFERTAS_GEMINI_MAX_IMAGE_WIDTH_PX = 2048;
export const OFERTAS_GEMINI_TARGET_DPI = 200;

export type OfertaLocalPageImageRenderMethod =
  | "pdfjs_canvas_png"
  | "pdf_single_page"
  | "direct_image";

export type OfertaLocalPageImage = {
  pageNumber: number;
  imageBytes: Buffer;
  mimeType: "image/png" | "image/jpeg" | "image/webp" | "application/pdf";
  width?: number;
  height?: number;
  renderMethod: OfertaLocalPageImageRenderMethod;
};

export type OfertaLocalPdfPagePrepareResult = {
  pages: OfertaLocalPageImage[];
  totalPageCount: number;
  pagesCapped: boolean;
  renderWarnings: string[];
  /** Documented runtime limitation when PNG rasterization is unavailable. */
  rasterizationFallback: boolean;
};

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Production note (Vercel/Next.js):
 * - Primary: pdfjs-dist + @napi-rs/canvas PNG rasterization (~200 DPI, max 2048px width).
 * - Fallback: pdf-lib single-page PDF buffers sent to Gemini as application/pdf (multimodal).
 * - Page images are held in memory only for the scan request; not persisted to Supabase by default.
 */
export async function prepareOfertaLocalScanPageImages(params: {
  fileBuffer: Buffer;
  mimeType: string;
}): Promise<OfertaLocalPdfPagePrepareResult> {
  const mimeType = params.mimeType.trim().toLowerCase();
  const maxPages = getOfertaLocalGeminiMaxPages();

  if (IMAGE_MIMES.has(mimeType)) {
    console.info("[ofertas-locales ai] pdf pages rendered", {
      mode: "direct_image",
      pageCount: 1,
    });
    return {
      pages: [
        {
          pageNumber: 1,
          imageBytes: params.fileBuffer,
          mimeType: mimeType as OfertaLocalPageImage["mimeType"],
          renderMethod: "direct_image",
        },
      ],
      totalPageCount: 1,
      pagesCapped: false,
      renderWarnings: [],
      rasterizationFallback: false,
    };
  }

  if (mimeType !== "application/pdf") {
    throw new Error(`Unsupported mime type for Gemini page extraction: ${mimeType}`);
  }

  const pdfDoc = await PDFDocument.load(params.fileBuffer, { ignoreEncryption: true });
  const totalPageCount = pdfDoc.getPageCount();
  const pagesToProcess = Math.min(totalPageCount, maxPages);
  const pagesCapped = totalPageCount > maxPages;

  const singlePagePdfBuffers = await splitPdfToSinglePageBuffers(params.fileBuffer, pagesToProcess);

  const renderWarnings: string[] = [];
  let rasterizationFallback = false;
  const pages: OfertaLocalPageImage[] = [];

  for (let i = 0; i < singlePagePdfBuffers.length; i++) {
    const pageNumber = i + 1;
    const singlePagePdf = singlePagePdfBuffers[i];

    const png = await tryRenderPdfPageToPng(singlePagePdf, pageNumber);
    if (png) {
      pages.push({
        pageNumber,
        imageBytes: png.bytes,
        mimeType: "image/png",
        width: png.width,
        height: png.height,
        renderMethod: "pdfjs_canvas_png",
      });
      continue;
    }

    rasterizationFallback = true;
    renderWarnings.push(
      `Page ${pageNumber}: PNG rasterization unavailable; using single-page PDF for Gemini.`
    );
    pages.push({
      pageNumber,
      imageBytes: singlePagePdf,
      mimeType: "application/pdf",
      renderMethod: "pdf_single_page",
    });
  }

  console.info("[ofertas-locales ai] pdf pages rendered", {
    totalPageCount,
    pagesProcessed: pages.length,
    pagesCapped,
    rasterizationFallback,
    pngPages: pages.filter((p) => p.renderMethod === "pdfjs_canvas_png").length,
    pdfPages: pages.filter((p) => p.renderMethod === "pdf_single_page").length,
  });

  return {
    pages,
    totalPageCount,
    pagesCapped,
    renderWarnings,
    rasterizationFallback,
  };
}

export function getOfertaLocalGeminiScanPageConcurrency(): number {
  return getOfertaLocalGeminiPageConcurrency();
}

export type OfertaLocalPdfPageRasterForCrop = {
  imageBytes: Buffer;
  mimeType: "image/png";
  width: number;
  height: number;
  renderMethod: "pdfjs_canvas_png";
};

let pdfjsWorkerLoadPromise: Promise<void> | null = null;
const requirePdfjsWorker = createRequire(`${process.cwd()}/package.json`);

/** On-demand single-page PDF → PNG rasterization for crop generation (Gate OFERTAS-CROP-PATCH-1). */
export async function renderOfertaLocalPdfPageToPngForCrop(params: {
  pdfBytes: Buffer;
  pageNumber: number;
  maxWidth?: number;
}): Promise<OfertaLocalPdfPageRasterForCrop | null> {
  const png = await tryRenderPdfPageToPng(
    params.pdfBytes,
    params.pageNumber,
    params.maxWidth ?? OFERTAS_GEMINI_MAX_IMAGE_WIDTH_PX
  );
  if (!png) return null;
  return {
    imageBytes: png.bytes,
    mimeType: "image/png",
    width: png.width,
    height: png.height,
    renderMethod: "pdfjs_canvas_png",
  };
}

async function splitPdfToSinglePageBuffers(pdfBytes: Buffer, maxPages: number): Promise<Buffer[]> {
  const source = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const count = Math.min(source.getPageCount(), maxPages);
  const out: Buffer[] = [];

  for (let i = 0; i < count; i++) {
    const single = await PDFDocument.create();
    const [copied] = await single.copyPages(source, [i]);
    single.addPage(copied);
    out.push(Buffer.from(await single.save()));
  }

  return out;
}

async function tryRenderPdfPageToPng(
  singlePagePdfBytes: Buffer,
  pageNumber: number,
  maxWidthPx: number = OFERTAS_GEMINI_MAX_IMAGE_WIDTH_PX
): Promise<{ bytes: Buffer; width: number; height: number } | null> {
  try {
    console.info("[ofertas-locales ai] pdf page png render started", {
      pageNumber,
    });

    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const canvasMod = await import("@napi-rs/canvas");
    await ensurePdfjsWorkerLoaded();

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(singlePagePdfBytes),
      useSystemFonts: true,
      disableFontFace: true,
      useWorkerFetch: false,
      isOffscreenCanvasSupported: false,
      isImageDecoderSupported: false,
    });
    const doc = await loadingTask.promise;

    try {
      const page = await doc.getPage(1);
      const baseViewport = page.getViewport({ scale: 1 });
      const scaleFromDpi = OFERTAS_GEMINI_TARGET_DPI / 72;
      const scaleFromMaxWidth = maxWidthPx / baseViewport.width;
      const scale = Math.min(scaleFromDpi, scaleFromMaxWidth, 3);

      const viewport = page.getViewport({ scale });
      const width = Math.ceil(viewport.width);
      const height = Math.ceil(viewport.height);
      const canvas = canvasMod.createCanvas(width, height);
      const context = canvas.getContext("2d");

      await page.render({
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport,
        canvas: canvas as unknown as HTMLCanvasElement,
      }).promise;

      const bytes = canvas.toBuffer("image/png");
      console.info("[ofertas-locales ai] pdf page png render success", {
        pageNumber,
        width,
        height,
        renderMethod: "pdfjs_canvas_png",
      });
      return {
        bytes: Buffer.from(bytes),
        width,
        height,
      };
    } finally {
      await loadingTask.destroy();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "pdf render failed";
    console.warn("[ofertas-locales ai] pdf page png render failed", {
      pageNumber,
      reason: message.slice(0, 200),
    });
    return null;
  }
}

async function ensurePdfjsWorkerLoaded(): Promise<void> {
  pdfjsWorkerLoadPromise ??= Promise.resolve().then(() => {
    requirePdfjsWorker("pdfjs-dist/legacy/build/pdf.worker.mjs");
  });
  await pdfjsWorkerLoadPromise;
}
