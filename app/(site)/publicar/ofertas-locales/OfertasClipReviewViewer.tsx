"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  mapOfertaLocalSourceBboxToDisplayRect,
  type ClipReviewDisplayRect,
} from "@/app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime";
import type {
  OfertaLocalItemReviewStatus,
  OfertaLocalSourceBoundingBox,
} from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";

export type ClipReviewViewerItem = {
  id: string;
  itemName: string;
  reviewStatus: OfertaLocalItemReviewStatus;
  sourceBbox: OfertaLocalSourceBoundingBox | null;
  sourceCropUrl?: string;
  sourcePage?: number | null;
};

type ZoomMode = "fit" | 1 | 1.25 | 1.5;

type Props = {
  lang: OfertasLocalesAppLang;
  fileUrl: string | null;
  isPdf: boolean;
  isImage: boolean;
  currentPage: number;
  pageCount?: number | null;
  itemsOnPage: ClipReviewViewerItem[];
  selectedItemId: string | null;
  highlightOverlay?: boolean;
  onSelectItem: (itemId: string) => void;
  onPageChange?: (page: number) => void;
  onViewerReady?: (info: { pageCount: number }) => void;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

const BTN =
  "min-h-10 rounded-lg border border-[#D4C4A8] bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45";
const BTN_ACTIVE = "border-[#7A1E2C] bg-[#7A1E2C]/10 text-[#7A1E2C]";

function overlayClassForStatus(
  status: OfertaLocalItemReviewStatus,
  selected: boolean,
  highlight: boolean
): string {
  if (status === "rejected") {
    return selected || highlight
      ? "border-[#7A1E2C]/35 bg-[#7A1E2C]/8 opacity-60"
      : "border-transparent bg-transparent opacity-0 hover:opacity-35 hover:border-[#7A1E2C]/25 hover:bg-[#7A1E2C]/5";
  }
  if (status === "approved") {
    return selected || highlight
      ? "border-emerald-600 bg-emerald-500/20 ring-2 ring-[#C9A227]/70 shadow-[0_0_0_2px_rgba(255,252,247,0.9)]"
      : "border-emerald-500/70 bg-emerald-500/12 hover:border-emerald-600 hover:bg-emerald-500/18";
  }
  if (selected || highlight) {
    return "border-[#7A1E2C] bg-[#7A1E2C]/18 ring-2 ring-[#C9A227]/80 shadow-[0_0_0_2px_rgba(255,252,247,0.95)]";
  }
  return "border-[#C9A227]/75 bg-[#C9A227]/12 hover:border-[#7A1E2C]/60 hover:bg-[#7A1E2C]/12";
}

function bboxRecord(bbox: OfertaLocalSourceBoundingBox | null): Record<string, unknown> | null {
  if (!bbox) return null;
  return bbox as unknown as Record<string, unknown>;
}

export function OfertasClipReviewViewer({
  lang,
  fileUrl,
  isPdf,
  isImage,
  currentPage,
  pageCount: pageCountProp,
  itemsOnPage,
  selectedItemId,
  highlightOverlay = false,
  onSelectItem,
  onPageChange,
  onViewerReady,
  collapsible = false,
  collapsed = false,
  onCollapsedChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const renderTaskRef = useRef<{ cancel?: () => void } | null>(null);

  const [zoom, setZoom] = useState<ZoomMode>("fit");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [surfaceSize, setSurfaceSize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const effectivePageCount = pageCountProp ?? pdfPageCount ?? 1;
  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, effectivePageCount));

  const zoomScale = zoom === "fit" ? null : zoom;

  const measureSurface = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      setSurfaceSize({ width: canvas.width, height: canvas.height });
      return;
    }
    if (image && image.clientWidth > 0 && image.clientHeight > 0) {
      setSurfaceSize({ width: image.clientWidth, height: image.clientHeight });
    }
  }, []);

  useEffect(() => {
    if (!fileUrl || !isPdf) return;
    const sourceUrl = fileUrl;
    let cancelled = false;

    async function renderPdfPage() {
      setRendering(true);
      setRenderError(null);
      renderTaskRef.current?.cancel?.();
      renderTaskRef.current = null;

      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
        }

        const loadingTask = pdfjs.getDocument({ url: sourceUrl, withCredentials: false });
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        setPdfPageCount(pdf.numPages);
        onViewerReady?.({ pageCount: pdf.numPages });

        const page = await pdf.getPage(safePage);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        setNaturalSize({ width: baseViewport.width, height: baseViewport.height });

        const containerWidth = surfaceRef.current?.clientWidth ?? baseViewport.width;
        const fitScale = containerWidth > 0 ? containerWidth / baseViewport.width : 1;
        const scale = (zoomScale ?? fitScale) * (window.devicePixelRatio || 1);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("canvas_context_unavailable");

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / (window.devicePixelRatio || 1)}px`;
        canvas.style.height = `${viewport.height / (window.devicePixelRatio || 1)}px`;

        const renderTask = page.render({ canvasContext: context, viewport, canvas });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (cancelled) return;

        setSurfaceSize({
          width: viewport.width / (window.devicePixelRatio || 1),
          height: viewport.height / (window.devicePixelRatio || 1),
        });
      } catch (error) {
        if (cancelled) return;
        console.error("[OfertasClipReviewViewer] pdf render failed", error);
        setRenderError(
          lang === "en"
            ? "Could not render this PDF page. Open the source file in a new tab to review manually."
            : "No se pudo renderizar esta página PDF. Abre el archivo fuente en una pestaña nueva para revisar manualmente."
        );
      } finally {
        if (!cancelled) setRendering(false);
      }
    }

    void renderPdfPage();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
    };
  }, [fileUrl, isPdf, safePage, zoomScale, lang, onViewerReady]);

  useEffect(() => {
    if (!isImage) return;
    const image = imageRef.current;
    if (!image) return;

    const handleLoad = () => {
      setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
      measureSurface();
    };
    if (image.complete) handleLoad();
    image.addEventListener("load", handleLoad);
    return () => image.removeEventListener("load", handleLoad);
  }, [fileUrl, isImage, measureSurface, zoomScale]);

  useEffect(() => {
    const node = surfaceRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      if (isPdf && zoom === "fit") {
        // Re-trigger pdf render via state tick
        setZoom((z) => (z === "fit" ? "fit" : z));
      } else {
        measureSurface();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [isPdf, zoom, measureSurface]);

  const overlayRects = useMemo(() => {
    const map = new Map<string, ClipReviewDisplayRect>();
    if (surfaceSize.width <= 0 || surfaceSize.height <= 0) return map;
    for (const item of itemsOnPage) {
      const rect = mapOfertaLocalSourceBboxToDisplayRect(
        bboxRecord(item.sourceBbox),
        surfaceSize.width,
        surfaceSize.height,
        naturalSize.width,
        naturalSize.height
      );
      if (rect) map.set(item.id, rect);
    }
    return map;
  }, [itemsOnPage, surfaceSize.width, surfaceSize.height, naturalSize.width, naturalSize.height]);

  const visibleOverlays = useMemo(
    () =>
      itemsOnPage.filter((item) => {
        if (item.reviewStatus === "rejected" && item.id !== selectedItemId && !highlightOverlay) {
          return false;
        }
        return overlayRects.has(item.id);
      }),
    [itemsOnPage, overlayRects, selectedItemId, highlightOverlay]
  );

  const zoomButtons: { id: ZoomMode; label: string }[] = [
    { id: "fit", label: lang === "en" ? "Fit width" : "Ajustar" },
    { id: 1, label: "100%" },
    { id: 1.25, label: "125%" },
    { id: 1.5, label: "150%" },
  ];

  const viewerBody = (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {zoomButtons.map(({ id, label }) => (
            <button
              key={String(id)}
              type="button"
              className={`${BTN} ${zoom === id ? BTN_ACTIVE : ""}`}
              onClick={() => setZoom(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {isPdf && effectivePageCount > 1 ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={BTN}
              disabled={safePage <= 1}
              onClick={() => onPageChange?.(safePage - 1)}
            >
              {lang === "en" ? "Prev page" : "Pág. ant."}
            </button>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/60">
              {lang === "en" ? "Page" : "Página"} {safePage}/{effectivePageCount}
            </span>
            <button
              type="button"
              className={BTN}
              disabled={safePage >= effectivePageCount}
              onClick={() => onPageChange?.(safePage + 1)}
            >
              {lang === "en" ? "Next page" : "Pág. sig."}
            </button>
          </div>
        ) : null}
      </div>

      {renderError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-800">
          <p>{renderError}</p>
          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-10 items-center rounded-lg border border-[#7A1E2C]/30 bg-white px-3 py-2 font-semibold text-[#7A1E2C]"
            >
              {lang === "en" ? "Open source file" : "Abrir archivo fuente"}
            </a>
          ) : null}
        </div>
      ) : null}

      <div
        ref={surfaceRef}
        className="max-h-[min(58vh,620px)] overflow-auto rounded-xl border border-[#D4C4A8] bg-[#FDF8F0] shadow-inner lg:max-h-[min(72vh,900px)]"
      >
        {!fileUrl ? (
          <div className="px-4 py-10 text-center text-xs text-[#1E1814]/55">
            {lang === "en" ? "No source file available." : "No hay archivo fuente disponible."}
          </div>
        ) : isPdf ? (
          <div className="p-2">
            <div className="relative mx-auto w-fit max-w-full">
              <canvas ref={canvasRef} className="block max-w-full bg-white shadow-sm" />
              {rendering ? (
                <p className="absolute inset-x-0 top-1 text-center text-[10px] font-medium text-[#7A1E2C]/80">
                  {lang === "en" ? "Rendering page…" : "Renderizando página…"}
                </p>
              ) : null}
              {surfaceSize.width > 0 && surfaceSize.height > 0 ? (
                <div className="pointer-events-none absolute inset-0">
                  {visibleOverlays.map((item) => {
                    const rect = overlayRects.get(item.id);
                    if (!rect) return null;
                    const selected = item.id === selectedItemId;
                    const highlight = highlightOverlay && selected;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-label={item.itemName}
                        title={item.itemName}
                        className={`pointer-events-auto absolute rounded-md border-2 transition-colors ${overlayClassForStatus(
                          item.reviewStatus,
                          selected,
                          highlight
                        )}`}
                        style={{
                          left: rect.left,
                          top: rect.top,
                          width: rect.width,
                          height: rect.height,
                        }}
                        onClick={() => onSelectItem(item.id)}
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        ) : isImage ? (
          <div className="p-2">
            <div className="relative mx-auto w-fit max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={fileUrl}
                alt={lang === "en" ? "Flyer page" : "Página del volante"}
                className="block max-w-full rounded bg-white object-contain shadow-sm"
                style={
                  zoomScale != null
                    ? { width: `${Math.round(100 * zoomScale)}%`, maxWidth: "none" }
                    : { width: "100%", height: "auto" }
                }
                onLoad={measureSurface}
              />
              {surfaceSize.width > 0 && surfaceSize.height > 0 ? (
                <div className="pointer-events-none absolute inset-0">
                  {visibleOverlays.map((item) => {
                    const rect = overlayRects.get(item.id);
                    if (!rect) return null;
                    const selected = item.id === selectedItemId;
                    const highlight = highlightOverlay && selected;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-label={item.itemName}
                        title={item.itemName}
                        className={`pointer-events-auto absolute rounded-md border-2 transition-colors ${overlayClassForStatus(
                          item.reviewStatus,
                          selected,
                          highlight
                        )}`}
                        style={{
                          left: rect.left,
                          top: rect.top,
                          width: rect.width,
                          height: rect.height,
                        }}
                        onClick={() => onSelectItem(item.id)}
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="px-4 py-10 text-center text-xs text-[#1E1814]/55">
            {lang === "en"
              ? "Preview not available for this file type."
              : "Vista previa no disponible para este tipo de archivo."}
          </div>
        )}
      </div>
    </div>
  );

  const shell = (
    <div className="overflow-hidden rounded-xl border border-[#D4C4A8]/70 bg-white shadow-sm">
      <div className="border-b border-[#D4C4A8]/50 bg-[#FFFCF7] px-4 py-3">
        <p className="text-sm font-semibold text-[#7A1E2C]">
          {lang === "en" ? "Flyer source viewer" : "Visor del volante fuente"}
        </p>
        <p className="mt-0.5 text-[10px] text-[#1E1814]/55">
          {lang === "en"
            ? "Click a highlighted region to select the matching product."
            : "Haz clic en una región resaltada para seleccionar el producto correspondiente."}
        </p>
      </div>
      <div className="p-3">{viewerBody}</div>
    </div>
  );

  if (!collapsible) return shell;

  return (
    <div className="overflow-hidden rounded-xl border border-[#D4C4A8]/70 bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full min-h-11 items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-[#7A1E2C]"
        onClick={() => onCollapsedChange?.(!collapsed)}
      >
        <span>
          {collapsed
            ? lang === "en"
              ? "Show flyer viewer"
              : "Mostrar visor del volante"
            : lang === "en"
              ? "Hide flyer viewer"
              : "Ocultar visor del volante"}
        </span>
        <span className="text-xs text-[#1E1814]/50">{collapsed ? "▾" : "▴"}</span>
      </button>
      {!collapsed ? <div className="border-t border-[#D4C4A8]/50 p-3">{viewerBody}</div> : null}
    </div>
  );
}
