"use client";

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
}: {
  draft: OfertaLocalDraft;
  heroAsset: OfertaLocalPreviewHeroAsset | null;
  lang: OfertasLocalesAppLang;
  compactMobile?: boolean;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  const isFlyer = isOfertaLocalWeeklyFlyerFlow(draft.offerType);
  const isCoupon = isOfertaLocalCouponPromotionFlow(draft.offerType);
  const laneLabel = isCoupon
    ? lang === "en"
      ? c.couponPromotionEn
      : c.couponPromotionEs
    : isFlyer
      ? lang === "en"
        ? c.weeklyFlyerEn
        : c.weeklyFlyerEs
      : null;

  return (
    <div className="space-y-2 sm:space-y-3">
      {laneLabel ? (
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#B8860B] sm:text-xs">{laneLabel}</p>
      ) : null}

      <div className={CARD}>
        {heroAsset?.href && heroAsset.isImage ? (
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
          <div className="flex flex-col items-center justify-center bg-[#FDF8F0]/80 px-6 py-16 text-center">
            <div className="rounded-lg border border-[#D4C4A8] bg-white px-6 py-8 shadow-sm">
              <p className="text-sm font-semibold text-[#1E1814]">{heroAsset.fileName}</p>
              <p className="mt-2 text-xs text-[#1E1814]/55">
                {lang === "en" ? c.fileOnRecordEn : c.fileOnRecordEs}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-dashed border-[#D4C4A8] bg-[#FDF8F0]/60 px-6 py-20 text-center">
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
          <a href={heroAsset.href} target="_blank" rel="noopener noreferrer" className={BTN_PRIMARY}>
            {heroAsset.kind === "coupon"
              ? lang === "en"
                ? c.viewCouponEn
                : c.viewCouponEs
              : lang === "en"
                ? c.viewFlyerEn
                : c.viewFlyerEs}
          </a>
          <a href={heroAsset.href} target="_blank" rel="noopener noreferrer" className={BTN_OUTLINE}>
            {lang === "en" ? c.openFileEn : c.openFileEs}
          </a>
        </div>
      ) : null}
    </div>
  );
}
