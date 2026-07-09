"use client";

import { useState } from "react";
import { FiDownload, FiEye } from "react-icons/fi";
import {
  isOfertaLocalCouponPromotionFlow,
  isOfertaLocalWeeklyFlyerFlow,
} from "@/app/lib/ofertas-locales/ofertasLocalesApplicationHelpers";
import type { OfertaLocalPreviewHeroAsset } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OfertasLocalesPdfFlyerPreview } from "./OfertasLocalesPdfFlyerPreview";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

const CARD =
  "overflow-hidden rounded-xl border border-[#D4C4A8]/80 bg-white shadow-sm ring-1 ring-[#D4C4A8]/20 sm:rounded-2xl sm:shadow-md sm:ring-[#D4C4A8]/30";
const BTN_PRIMARY =
  "inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6a1926] sm:min-h-11 sm:px-4 sm:py-2.5 sm:text-sm";
const BTN_OUTLINE =
  "inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-[#D4C4A8] bg-[#FFFCF7] px-3 py-2 text-xs font-semibold text-[#7A1E2C] hover:border-[#7A1E2C]/35 hover:bg-[#FDF8F0] sm:min-h-11 sm:px-4 sm:py-2.5 sm:text-sm";

export function OfertasLocalesPreviewHeroVisual({
  draft,
  heroAsset,
  lang,
  compactMobile = false,
  onOpenViewer,
}: {
  draft: OfertaLocalDraft;
  heroAsset: OfertaLocalPreviewHeroAsset | null;
  lang: OfertasLocalesAppLang;
  compactMobile?: boolean;
  /** When provided, the flyer preview + primary action open the in-page viewer instead of a raw tab. */
  onOpenViewer?: () => void;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  const [downloading, setDownloading] = useState(false);
  const isFlyer = isOfertaLocalWeeklyFlyerFlow(draft.offerType);
  const isCoupon = isOfertaLocalCouponPromotionFlow(draft.offerType);

  /**
   * Download the flyer/coupon asset reliably. The `download` attribute is
   * ignored for cross-origin URLs, so we fetch the file into a blob and click a
   * synthetic link. If that fails (CORS/network), fall back to opening the file
   * in a new tab so the user still gets it — never a dead "download" button.
   */
  async function handleDownload(href: string, fileName: string) {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(href, { credentials: "omit" });
      if (!res.ok) throw new Error(`download_failed_${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName || (isCoupon ? "cupon" : "volante");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(href, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  }
  const laneLabel = isCoupon
    ? lang === "en"
      ? c.couponPromotionEn
      : c.couponPromotionEs
    : isFlyer
      ? lang === "en"
        ? c.weeklyFlyerEn
        : c.weeklyFlyerEs
      : null;

  const viewLabel =
    heroAsset?.kind === "coupon"
      ? lang === "en"
        ? c.viewCouponEn
        : c.viewCouponEs
      : lang === "en"
        ? c.viewFlyerEn
        : c.viewFlyerEs;

  const canOpenViewer = Boolean(onOpenViewer && heroAsset?.href);

  const previewInner =
    heroAsset?.href && heroAsset.isImage ? (
      <div className="bg-[#FDF8F0]/80 p-1.5 sm:p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroAsset.href}
          alt={heroAsset.fileName}
          className={`mx-auto w-full rounded-lg object-contain ${
            compactMobile
              ? "max-h-[300px] sm:max-h-[480px] lg:max-h-[520px]"
              : "max-h-[420px] sm:max-h-[480px] lg:max-h-[520px]"
          }`}
        />
      </div>
    ) : heroAsset?.href && heroAsset.isPdf ? (
      <OfertasLocalesPdfFlyerPreview
        pdfUrl={heroAsset.href}
        lang={lang}
        fileName={heroAsset.fileName}
        compactMobile={compactMobile}
      />
    ) : heroAsset ? (
      <div className="flex flex-col items-center justify-center bg-[#FDF8F0]/80 px-6 py-10 text-center">
        <div className="rounded-lg border border-[#D4C4A8] bg-white px-6 py-7 shadow-sm">
          <p className="text-sm font-semibold text-[#1E1814]">{heroAsset.fileName}</p>
          <p className="mt-2 text-xs text-[#1E1814]/55">
            {lang === "en" ? c.fileOnRecordEn : c.fileOnRecordEs}
          </p>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center border border-dashed border-[#D4C4A8] bg-[#FDF8F0]/60 px-6 py-12 text-center">
        <p className="max-w-xs text-sm leading-relaxed text-[#1E1814]/55">
          {isCoupon
            ? lang === "en"
              ? c.couponEmptyEn
              : c.couponEmptyEs
            : lang === "en"
              ? c.flyerEmptyEn
              : c.flyerEmptyEs}
        </p>
      </div>
    );

  return (
    <div className="space-y-2 sm:space-y-3">
      {laneLabel ? (
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#B8860B] sm:text-xs">{laneLabel}</p>
      ) : null}

      <div className={CARD}>
        {canOpenViewer ? (
          <button
            type="button"
            onClick={onOpenViewer}
            aria-label={viewLabel}
            className="group block w-full cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C]/40"
          >
            {previewInner}
          </button>
        ) : (
          previewInner
        )}
      </div>

      {heroAsset?.href ? (
        <div
          className={
            compactMobile
              ? "grid grid-cols-1 gap-1.5 min-[400px]:grid-cols-2 lg:grid-cols-1 lg:gap-2"
              : "grid gap-2 sm:grid-cols-2 lg:grid-cols-1"
          }
        >
          {onOpenViewer ? (
            <button type="button" onClick={onOpenViewer} className={`${BTN_PRIMARY} gap-2`}>
              <FiEye className="h-4 w-4 shrink-0" aria-hidden />
              {viewLabel}
            </button>
          ) : (
            <a href={heroAsset.href} target="_blank" rel="noopener noreferrer" className={`${BTN_PRIMARY} gap-2`}>
              <FiEye className="h-4 w-4 shrink-0" aria-hidden />
              {viewLabel}
            </a>
          )}
          <button
            type="button"
            className={`${BTN_OUTLINE} gap-2`}
            onClick={() => void handleDownload(heroAsset.href!, heroAsset.fileName)}
            disabled={downloading}
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
        </div>
      ) : null}
    </div>
  );
}
