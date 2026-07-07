"use client";

import { useEffect, useRef, useState } from "react";
import { FiFileText } from "react-icons/fi";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

export function OfertasLocalesPdfFlyerPreview({
  pdfUrl,
  lang,
  fileName,
}: {
  pdfUrl: string;
  lang: OfertasLocalesAppLang;
  fileName?: string;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel?: () => void } | null>(null);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;

    async function renderPdf() {
      setRendering(true);
      setError(null);
      renderTaskRef.current?.cancel?.();
      renderTaskRef.current = null;

      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
        }

        const pdf = await pdfjs.getDocument({ url: pdfUrl, withCredentials: false }).promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const containerWidth = containerRef.current?.clientWidth ?? baseViewport.width;
        const fitScale = containerWidth > 0 ? containerWidth / baseViewport.width : 1;
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: fitScale * dpr });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("canvas_context_unavailable");

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const renderTask = page.render({ canvasContext: context, viewport, canvas });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err) {
        if (cancelled) return;
        console.error("[OfertasLocalesPdfFlyerPreview] render failed", err);
        setError(lang === "en" ? c.flyerRenderFailedEn : c.flyerRenderFailedEs);
      } finally {
        if (!cancelled) setRendering(false);
      }
    }

    void renderPdf();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
    };
  }, [pdfUrl, lang, c.flyerRenderFailedEn, c.flyerRenderFailedEs]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden bg-[#FDF8F0]/80 p-2 sm:p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#B8860B]">
        <FiFileText className="h-3.5 w-3.5" aria-hidden />
        {lang === "en" ? c.flyerPreviewEn : c.flyerPreviewEs}
      </p>
      {rendering && !error ? (
        <div className="flex min-h-[200px] max-h-[420px] items-center justify-center rounded-lg border border-[#D4C4A8]/60 bg-white/80 px-4 py-12 text-center sm:max-h-[480px] lg:max-h-[520px]">
          <p className="text-sm text-[#1E1814]/55">
            {lang === "en" ? c.flyerRenderingEn : c.flyerRenderingEs}
          </p>
        </div>
      ) : null}
      {error ? (
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#D4C4A8] bg-[#FDF8F0] px-4 py-8 text-center">
          <p className="text-sm text-[#1E1814]/60">{error}</p>
          {fileName ? (
            <p className="max-w-full truncate text-xs font-medium text-[#1E1814]/45" title={fileName}>
              {fileName}
            </p>
          ) : null}
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className={`mx-auto max-h-[420px] w-full rounded-lg object-contain sm:max-h-[480px] lg:max-h-[520px] ${
            rendering ? "hidden" : "block"
          }`}
        />
      )}
    </div>
  );
}
