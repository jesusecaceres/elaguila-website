"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiDownload, FiExternalLink, FiX } from "react-icons/fi";
import {
  mapOfertaLocalSourceBboxToDisplayRect,
  type ClipReviewDisplayRect,
} from "@/app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime";
import type { OfertaLocalPreviewHeroAsset } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import type { OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

function bboxRecord(bbox: OfertaLocalItemReviewViewModel["sourceBbox"]): Record<string, unknown> | null {
  if (!bbox) return null;
  return bbox as unknown as Record<string, unknown>;
}

function itemDisplayName(item: OfertaLocalItemReviewViewModel): string {
  return (item.couponTitle || item.itemName).trim() || item.itemName.trim();
}

function resolveItemPage(item: OfertaLocalItemReviewViewModel): number {
  return item.sourcePage != null && item.sourcePage > 0 ? item.sourcePage : 1;
}

function itemHasOverlayBbox(item: OfertaLocalItemReviewViewModel): boolean {
  return Boolean(item.sourceBbox);
}

const OVERLAY_BASE =
  "pointer-events-auto absolute rounded-md border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C]/45";
const OVERLAY_IDLE =
  "border-[#B8860B]/70 bg-[#C9A227]/10 hover:border-[#7A1E2C] hover:bg-[#7A1E2C]/14";
const OVERLAY_ACTIVE =
  "border-[#7A1E2C] bg-[#7A1E2C]/16 ring-2 ring-[#B8860B]/50 shadow-[0_0_0_2px_rgba(255,252,247,0.92)]";

/**
 * Ofertas Public Flyer Viewer V1 — shopper-facing flyer modal with approved-item
 * bbox overlays. Overlay click opens the shared product detail drawer (no edit/review).
 */
export function OfertasLocalesFlyerViewerModal({
  open,
  onClose,
  heroAsset,
  lang,
  onDownload,
  downloading = false,
  items = [],
  selectedItemId = null,
  onOpenProductDetail,
  stackBelowDrawer = false,
}: {
  open: boolean;
  onClose: () => void;
  heroAsset: OfertaLocalPreviewHeroAsset | null;
  lang: OfertasLocalesAppLang;
  onDownload?: () => void;
  downloading?: boolean;
  /** Approved public-safe items only — parent filters review status. */
  items?: OfertaLocalItemReviewViewModel[];
  selectedItemId?: string | null;
  onOpenProductDetail?: (item: OfertaLocalItemReviewViewModel) => void;
  /** When product detail drawer is open, sit below it (z-100) so overlay click → drawer works. */
  stackBelowDrawer?: boolean;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<{ cancel?: () => void } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [surfaceSize, setSurfaceSize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const close = useCallback(() => onClose(), [onClose]);

  const interactiveItems = useMemo(
    () => items.filter((item) => itemHasOverlayBbox(item)),
    [items]
  );
  const hasInteractiveFlyer = interactiveItems.length > 0;

  const itemsOnPage = useMemo(
    () => interactiveItems.filter((item) => resolveItemPage(item) === currentPage),
    [interactiveItems, currentPage]
  );

  const effectivePageCount = heroAsset?.isPdf ? (pdfPageCount ?? 1) : 1;
  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, effectivePageCount));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setCurrentPage(1);
    setSurfaceSize({ width: 0, height: 0 });
    setNaturalSize({ width: 0, height: 0 });
    setRenderError(null);
  }, [open, heroAsset?.href]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (open && panelRef.current) panelRef.current.focus();
  }, [open]);

  const measureImageSurface = useCallback(() => {
    const image = imageRef.current;
    if (image && image.clientWidth > 0 && image.clientHeight > 0) {
      setSurfaceSize({ width: image.clientWidth, height: image.clientHeight });
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
      }
    }
  }, []);

  useEffect(() => {
    if (!open || !heroAsset?.href || !heroAsset.isPdf) return;
    const sourceUrl = heroAsset.href;
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

        const pdf = await pdfjs.getDocument({ url: sourceUrl, withCredentials: false }).promise;
        if (cancelled) return;

        setPdfPageCount(pdf.numPages);
        const pageNum = Math.min(Math.max(1, safePage), pdf.numPages);
        const page = await pdf.getPage(pageNum);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        setNaturalSize({ width: baseViewport.width, height: baseViewport.height });

        const containerWidth = surfaceRef.current?.clientWidth ?? baseViewport.width;
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
        if (cancelled) return;

        setSurfaceSize({
          width: viewport.width / dpr,
          height: viewport.height / dpr,
        });
      } catch (err) {
        if (cancelled) return;
        console.error("[OfertasLocalesFlyerViewerModal] pdf render failed", err);
        setRenderError(lang === "en" ? c.flyerRenderFailedEn : c.flyerRenderFailedEs);
      } finally {
        if (!cancelled) setRendering(false);
      }
    }

    void renderPdfPage();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
    };
  }, [open, heroAsset?.href, heroAsset?.isPdf, safePage, lang, c.flyerRenderFailedEn, c.flyerRenderFailedEs]);

  useEffect(() => {
    if (!open || !heroAsset?.isImage) return;
    const image = imageRef.current;
    if (!image) return;

    const handleLoad = () => measureImageSurface();
    if (image.complete) handleLoad();
    image.addEventListener("load", handleLoad);
    return () => image.removeEventListener("load", handleLoad);
  }, [open, heroAsset?.href, heroAsset?.isImage, measureImageSurface]);

  useEffect(() => {
    if (!open) return;
    const node = surfaceRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      if (heroAsset?.isImage) measureImageSurface();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, heroAsset?.isImage, measureImageSurface]);

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
    () => itemsOnPage.filter((item) => overlayRects.has(item.id)),
    [itemsOnPage, overlayRects]
  );

  if (!mounted || !open || !heroAsset?.href) return null;

  const closeLabel = lang === "en" ? c.closeFlyerEn : c.closeFlyerEs;
  const isCoupon = heroAsset.kind === "coupon";
  const title = isCoupon
    ? lang === "en"
      ? c.couponViewerTitleEn
      : c.couponViewerTitleEs
    : lang === "en"
      ? c.flyerViewerTitleEn
      : c.flyerViewerTitleEs;

  const helper = isCoupon
    ? lang === "en"
      ? c.couponViewerHelperEn
      : c.couponViewerHelperEs
    : hasInteractiveFlyer
      ? lang === "en"
        ? c.flyerViewerInteractiveHelperEn
        : c.flyerViewerInteractiveHelperEs
      : lang === "en"
        ? c.flyerViewerHelperEn
        : c.flyerViewerHelperEs;

  const showPageEmptyNote =
    hasInteractiveFlyer && visibleOverlays.length === 0 && !rendering && !renderError;

  const renderOverlays = () =>
    surfaceSize.width > 0 && surfaceSize.height > 0 ? (
      <div className="pointer-events-none absolute inset-0">
        {visibleOverlays.map((item) => {
          const rect = overlayRects.get(item.id);
          if (!rect) return null;
          const name = itemDisplayName(item);
          const ariaPrefix = lang === "en" ? c.flyerViewDetailAriaEn : c.flyerViewDetailAriaEs;
          const selected = item.id === selectedItemId;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={`${ariaPrefix} ${name}`}
              title={name}
              className={`${OVERLAY_BASE} ${selected ? OVERLAY_ACTIVE : OVERLAY_IDLE}`}
              style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              }}
              onClick={() => onOpenProductDetail?.(item)}
            />
          );
        })}
      </div>
    ) : null;

  const modal = (
    <div
      className={`fixed inset-0 ${stackBelowDrawer ? "z-[90]" : "z-[110]"} flex items-stretch justify-center overflow-hidden sm:items-center sm:p-6`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1F241C]/70 backdrop-blur-[3px]"
        aria-label={closeLabel}
        onClick={close}
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 flex h-full w-full max-w-[100vw] flex-col overflow-hidden border border-[#D4C4A8]/60 bg-[#FFFCF7] shadow-2xl outline-none sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl lg:max-w-3xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E8D9C4]/70 bg-gradient-to-r from-[#FDF8F0]/60 to-[#FFFCF7] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pt-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#B8860B]">{title}</p>
              {hasInteractiveFlyer ? (
                <span className="inline-flex items-center rounded-full border border-[#2D5A3D]/30 bg-[#2D5A3D]/[0.06] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#2D5A3D]">
                  {lang === "en" ? c.flyerInteractiveOffersEn : c.flyerInteractiveOffersEs}
                </span>
              ) : null}
            </div>
            <h2 className="truncate font-serif text-base font-semibold text-[#1F241C]" title={heroAsset.fileName}>
              {heroAsset.fileName}
            </h2>
            <p className="mt-0.5 truncate text-[11px] text-[#1E1814]/55">{helper}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#D4C4A8]/80 bg-white text-[#1F241C] transition hover:border-[#7A1E2C]/40 hover:bg-[#FDF8F0]"
            aria-label={closeLabel}
          >
            <FiX className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#FDF8F0]/40 px-3 py-3 sm:px-4 sm:py-4">
          {heroAsset.isPdf && effectivePageCount > 1 ? (
            <div className="mb-2 flex items-center justify-center gap-2">
              <button
                type="button"
                className="min-h-10 rounded-lg border border-[#D4C4A8] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                {lang === "en" ? "Prev page" : "Pág. ant."}
              </button>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/60">
                {lang === "en" ? "Page" : "Página"} {safePage}/{effectivePageCount}
              </span>
              <button
                type="button"
                className="min-h-10 rounded-lg border border-[#D4C4A8] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={safePage >= effectivePageCount}
                onClick={() => setCurrentPage((p) => Math.min(effectivePageCount, p + 1))}
              >
                {lang === "en" ? "Next page" : "Pág. sig."}
              </button>
            </div>
          ) : null}

          {showPageEmptyNote ? (
            <p className="mb-2 rounded-lg border border-[#D4C4A8]/60 bg-[#FDF8F0]/80 px-3 py-2 text-center text-[11px] text-[#1E1814]/60">
              {lang === "en" ? c.flyerNoInteractivePageEn : c.flyerNoInteractivePageEs}
            </p>
          ) : null}

          <div ref={surfaceRef} className="mx-auto w-full max-w-full">
            {heroAsset.isImage ? (
              <div className="relative mx-auto w-fit max-w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={heroAsset.href}
                  alt={heroAsset.fileName}
                  className="mx-auto h-auto w-full max-w-full rounded-lg object-contain"
                  onLoad={measureImageSurface}
                />
                {renderOverlays()}
              </div>
            ) : heroAsset.isPdf ? (
              <div className="relative mx-auto w-fit max-w-full">
                {rendering && !renderError ? (
                  <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-[#D4C4A8]/60 bg-white/80 px-4 py-10 text-center">
                    <p className="text-xs text-[#1E1814]/55 sm:text-sm">
                      {lang === "en" ? c.flyerRenderingEn : c.flyerRenderingEs}
                    </p>
                  </div>
                ) : null}
                {renderError ? (
                  <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#D4C4A8] bg-[#FDF8F0] px-4 py-8 text-center">
                    <p className="text-sm text-[#1E1814]/60">{renderError}</p>
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    className={`mx-auto max-w-full rounded-lg object-contain ${rendering ? "hidden" : "block"}`}
                  />
                )}
                {!rendering && !renderError ? renderOverlays() : null}
              </div>
            ) : (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#D4C4A8] bg-white px-6 py-10 text-center">
                <p className="text-sm font-semibold text-[#1E1814]">{heroAsset.fileName}</p>
                <p className="text-xs text-[#1E1814]/55">{lang === "en" ? c.fileOnRecordEn : c.fileOnRecordEs}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 border-t border-[#E8D9C4]/70 bg-[#FFFCF7] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          {onDownload ? (
            <button
              type="button"
              onClick={onDownload}
              disabled={downloading}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6a1926] disabled:opacity-70 sm:flex-none"
            >
              <FiDownload className="h-4 w-4 shrink-0" aria-hidden />
              {downloading
                ? lang === "en"
                  ? c.downloadingFlyerEn
                  : c.downloadingFlyerEs
                : heroAsset.kind === "coupon"
                  ? lang === "en"
                    ? c.downloadCouponEn
                    : c.downloadCouponEs
                  : lang === "en"
                    ? c.downloadFlyerEn
                    : c.downloadFlyerEs}
            </button>
          ) : null}
          <a
            href={heroAsset.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-[#D4C4A8]/80 bg-white px-4 py-2.5 text-sm font-semibold text-[#7A1E2C] transition hover:border-[#7A1E2C]/35 hover:bg-[#FDF8F0] sm:flex-none"
          >
            <FiExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            {lang === "en" ? c.openInTabEn : c.openInTabEs}
          </a>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
