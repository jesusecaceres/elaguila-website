"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiDownload, FiExternalLink, FiX } from "react-icons/fi";
import type { OfertaLocalPreviewHeroAsset } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OfertasLocalesPdfFlyerPreview } from "./OfertasLocalesPdfFlyerPreview";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

/**
 * Ofertas Preview V2.2 — in-page flyer/coupon viewer modal.
 *
 * Reuses the existing PDF preview component for PDF assets and a contained
 * <img> for image assets. Dark translucent backdrop, centered panel on desktop,
 * near full-screen on mobile, Escape + backdrop + button close, body scroll
 * lock, internal scroll. Does NOT open a raw tab (that stays on the separate
 * Descargar / "Abrir en pestaña" actions). No fake data, no DB writes.
 */
export function OfertasLocalesFlyerViewerModal({
  open,
  onClose,
  heroAsset,
  lang,
  onDownload,
  downloading = false,
}: {
  open: boolean;
  onClose: () => void;
  heroAsset: OfertaLocalPreviewHeroAsset | null;
  lang: OfertasLocalesAppLang;
  onDownload?: () => void;
  downloading?: boolean;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted || !open || !heroAsset?.href) return null;

  const closeLabel = lang === "en" ? c.closeFlyerEn : c.closeFlyerEs;
  const title =
    heroAsset.kind === "coupon"
      ? lang === "en"
        ? c.viewCouponEn
        : c.viewCouponEs
      : lang === "en"
        ? c.flyerViewEn
        : c.flyerViewEs;

  const modal = (
    <div
      className="fixed inset-0 z-[110] flex items-stretch justify-center overflow-hidden sm:items-center sm:p-6"
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
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E8D9C4]/70 bg-gradient-to-r from-[#FDF8F0]/60 to-[#FFFCF7] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#B8860B]">{title}</p>
            <h2 className="truncate font-serif text-base font-semibold text-[#1F241C]" title={heroAsset.fileName}>
              {heroAsset.fileName}
            </h2>
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
          {heroAsset.isImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={heroAsset.href}
              alt={heroAsset.fileName}
              className="mx-auto h-auto w-full max-w-full rounded-lg object-contain"
            />
          ) : heroAsset.isPdf ? (
            <OfertasLocalesPdfFlyerPreview
              pdfUrl={heroAsset.href}
              lang={lang}
              fileName={heroAsset.fileName}
            />
          ) : (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#D4C4A8] bg-white px-6 py-10 text-center">
              <p className="text-sm font-semibold text-[#1E1814]">{heroAsset.fileName}</p>
              <p className="text-xs text-[#1E1814]/55">{lang === "en" ? c.fileOnRecordEn : c.fileOnRecordEs}</p>
            </div>
          )}
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
