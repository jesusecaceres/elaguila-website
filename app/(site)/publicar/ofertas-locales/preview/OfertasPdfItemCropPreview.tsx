"use client";

import { useEffect, useRef, useState } from "react";
import {
  getOfertaLocalPaddedNormalizedCrop,
  type OfertaLocalNormalizedCropRegion,
} from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewMapper";
import type { OfertaLocalSourceBoundingBox } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

/**
 * Gate 4C Repair — render a real product crop from a PDF page + normalized bbox
 * using pdf.js. Renders only the crop region to a crop-sized canvas via a viewport
 * translate transform (no giant offscreen canvas). No data URLs, no DB writes, no
 * network beyond fetching the already-public PDF. Calls onUnavailable on failure.
 */

const MAX_CANVAS_PX = 2000;

export function OfertasPdfItemCropPreview({
  pdfUrl,
  pageNumber,
  bbox,
  alt,
  variant,
  lang,
  onUnavailable,
}: {
  pdfUrl: string;
  pageNumber: number | null;
  bbox: OfertaLocalSourceBoundingBox | null;
  alt: string;
  variant: "card" | "drawer";
  lang: OfertasLocalesAppLang;
  onUnavailable?: () => void;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel?: () => void } | null>(null);
  const onUnavailableRef = useRef(onUnavailable);
  const [rendering, setRendering] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onUnavailableRef.current = onUnavailable;
  }, [onUnavailable]);

  const region: OfertaLocalNormalizedCropRegion | null = getOfertaLocalPaddedNormalizedCrop(bbox);

  useEffect(() => {
    if (!pdfUrl || !region) {
      setFailed(true);
      onUnavailableRef.current?.();
      return;
    }

    let cancelled = false;
    const page = pageNumber && pageNumber >= 1 ? Math.floor(pageNumber) : 1;

    async function renderCrop() {
      setRendering(true);
      setFailed(false);
      renderTaskRef.current?.cancel?.();
      renderTaskRef.current = null;

      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
        }

        const doc = await pdfjs.getDocument({ url: pdfUrl, withCredentials: false }).promise;
        if (cancelled) return;

        const safePage = Math.min(page, doc.numPages || 1);
        const pdfPage = await doc.getPage(safePage);
        if (cancelled) return;

        const base = pdfPage.getViewport({ scale: 1 });
        const cropWFrac = region!.xMax - region!.xMin;
        const cropHFrac = region!.yMax - region!.yMin;

        const targetCssWidth =
          containerRef.current?.clientWidth || (variant === "drawer" ? 380 : 260);
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

        const cropWidthAtScale1 = cropWFrac * base.width;
        let scale = cropWidthAtScale1 > 0 ? (targetCssWidth * dpr) / cropWidthAtScale1 : 1;
        scale = Math.max(0.2, Math.min(6, scale));

        let viewport = pdfPage.getViewport({ scale });
        let cropLeft = region!.xMin * viewport.width;
        let cropTop = region!.yMin * viewport.height;
        let cropW = cropWFrac * viewport.width;
        let cropH = cropHFrac * viewport.height;

        // Cap canvas size to protect memory on very large scales.
        const maxDim = Math.max(cropW, cropH);
        if (maxDim > MAX_CANVAS_PX) {
          const shrink = MAX_CANVAS_PX / maxDim;
          scale *= shrink;
          viewport = pdfPage.getViewport({ scale });
          cropLeft = region!.xMin * viewport.width;
          cropTop = region!.yMin * viewport.height;
          cropW = cropWFrac * viewport.width;
          cropH = cropHFrac * viewport.height;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("canvas_context_unavailable");

        canvas.width = Math.max(1, Math.round(cropW));
        canvas.height = Math.max(1, Math.round(cropH));

        const renderTask = pdfPage.render({
          canvasContext: context,
          viewport,
          transform: [1, 0, 0, 1, -cropLeft, -cropTop],
          canvas,
        });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (cancelled) return;
      } catch (err) {
        if (cancelled) return;
        console.error("[OfertasPdfItemCropPreview] crop render failed", err);
        setFailed(true);
        onUnavailableRef.current?.();
      } finally {
        if (!cancelled) setRendering(false);
      }
    }

    void renderCrop();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
    };
  }, [pdfUrl, pageNumber, region?.xMin, region?.yMin, region?.xMax, region?.yMax, variant]);

  if (failed) return null;

  const heightClass = variant === "drawer" ? "h-52 sm:h-60" : "h-28 lg:h-24";

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden bg-[#FDF8F0]/60 ${heightClass}`}>
      {rendering ? (
        <div className="absolute inset-0 flex items-center justify-center px-3 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wide text-[#1E1814]/45">
            {lang === "en" ? c.renderingCropEn : c.renderingCropEs}
          </span>
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        aria-label={alt}
        role="img"
        className={`mx-auto h-full w-full object-contain ${rendering ? "opacity-0" : "opacity-100"}`}
      />
    </div>
  );
}
