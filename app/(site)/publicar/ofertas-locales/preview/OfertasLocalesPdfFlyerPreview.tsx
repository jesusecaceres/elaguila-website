"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiFileText } from "react-icons/fi";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";
import { acquireSharedPdfPage, releaseSharedPdfDocument } from "./ofertasLocalesPdfDocumentCache";

export function OfertasLocalesPdfFlyerPreview({
  pdfUrl,
  lang,
  fileName,
  compactMobile = false,
}: {
  pdfUrl: string;
  lang: OfertasLocalesAppLang;
  fileName?: string;
  /** Mobile-only height cap so the flyer does not dominate the first screen. */
  compactMobile?: boolean;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel?: () => void } | null>(null);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState<number | null>(null);

  // A new flyer URL always starts back on page 1.
  useEffect(() => {
    setCurrentPage(1);
    setPageCount(null);
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;

    async function renderPdf() {
      setRendering(true);
      setError(null);
      renderTaskRef.current?.cancel?.();
      renderTaskRef.current = null;

      try {
        const { page, numPages } = await acquireSharedPdfPage(pdfUrl, currentPage);
        if (cancelled) return;
        setPageCount(numPages);

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
      releaseSharedPdfDocument(pdfUrl);
    };
  }, [pdfUrl, currentPage, lang, c.flyerRenderFailedEn, c.flyerRenderFailedEs]);

  // Substantially larger + less dead whitespace than the prior fixed caps —
  // the flyer is the primary reason a shopper opens this page.
  const mobileMaxH = compactMobile ? "max-h-[420px]" : "max-h-[560px]";
  const desktopMaxH = "sm:max-h-[680px] lg:max-h-[760px]";
  const hasMultiplePages = (pageCount ?? 1) > 1;

  function goToPage(e: React.MouseEvent, next: number) {
    // The whole card is a click-to-zoom control (see OfertasLocalesPreviewHeroVisual)
    // — page-nav clicks must not bubble up and open the full-screen viewer instead.
    e.stopPropagation();
    setCurrentPage((prev) => Math.min(Math.max(1, next), pageCount ?? prev));
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-[#FDF8F0]/80 p-1.5 sm:p-3 ${compactMobile ? "max-h-[440px] sm:max-h-none" : ""}`}
    >
      <div className="mb-1 flex items-center justify-between gap-2 sm:mb-2">
        <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-[#B8860B] sm:text-[10px]">
          <FiFileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
          {lang === "en" ? c.flyerPreviewEn : c.flyerPreviewEs}
        </p>
        {hasMultiplePages ? (
          <span className="text-[9px] font-semibold uppercase tracking-wide text-[#1E1814]/55 sm:text-[10px]">
            {lang === "en" ? "Page" : "Página"} {currentPage} {lang === "en" ? "of" : "de"} {pageCount}
          </span>
        ) : null}
      </div>
      {rendering && !error ? (
        <div
          className={`flex items-center justify-center rounded-lg border border-[#D4C4A8]/60 bg-white/80 px-3 py-8 text-center sm:px-4 sm:py-12 ${mobileMaxH} ${desktopMaxH} ${compactMobile ? "min-h-[160px]" : "min-h-[260px]"}`}
        >
          <p className="text-xs text-[#1E1814]/55 sm:text-sm">
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
        <div className="relative">
          <canvas
            ref={canvasRef}
            className={`mx-auto w-full rounded-lg object-contain ${mobileMaxH} ${desktopMaxH} ${
              rendering ? "hidden" : "block"
            }`}
          />
          {!rendering && hasMultiplePages ? (
            <>
              <button
                type="button"
                aria-label={lang === "en" ? "Previous page" : "Página anterior"}
                disabled={currentPage <= 1}
                onClick={(e) => goToPage(e, currentPage - 1)}
                className="absolute left-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#D4C4A8]/80 bg-white/90 text-[#1E1814] shadow-sm transition hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
              >
                <FiChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
              </button>
              <button
                type="button"
                aria-label={lang === "en" ? "Next page" : "Página siguiente"}
                disabled={currentPage >= (pageCount ?? currentPage)}
                onClick={(e) => goToPage(e, currentPage + 1)}
                className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#D4C4A8]/80 bg-white/90 text-[#1E1814] shadow-sm transition hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
              >
                <FiChevronRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
