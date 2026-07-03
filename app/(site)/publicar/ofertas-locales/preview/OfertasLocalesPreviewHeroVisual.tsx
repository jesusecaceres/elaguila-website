"use client";

import {
  isOfertaLocalCouponPromotionFlow,
  isOfertaLocalWeeklyFlyerFlow,
} from "@/app/lib/ofertas-locales/ofertasLocalesApplicationHelpers";
import type { OfertaLocalPreviewHeroAsset } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

const CARD = "overflow-hidden rounded-2xl border border-[#D4C4A8]/80 bg-white shadow-md";
const BTN =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#7A1E2C]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#7A1E2C] hover:bg-[#7A1E2C]/5";

export function OfertasLocalesPreviewHeroVisual({
  draft,
  heroAsset,
  lang,
}: {
  draft: OfertaLocalDraft;
  heroAsset: OfertaLocalPreviewHeroAsset | null;
  lang: OfertasLocalesAppLang;
}) {
  const isFlyer = isOfertaLocalWeeklyFlyerFlow(draft.offerType);
  const isCoupon = isOfertaLocalCouponPromotionFlow(draft.offerType);
  const laneLabel = isCoupon
    ? lang === "en"
      ? OFERTAS_LOCALES_PREVIEW_COPY.couponPromotionEn
      : OFERTAS_LOCALES_PREVIEW_COPY.couponPromotionEs
    : isFlyer
      ? lang === "en"
        ? OFERTAS_LOCALES_PREVIEW_COPY.weeklyFlyerEn
        : OFERTAS_LOCALES_PREVIEW_COPY.weeklyFlyerEs
      : null;

  return (
    <div className="space-y-3">
      {laneLabel ? (
        <p className="text-xs font-semibold uppercase tracking-widest text-[#B8860B]">{laneLabel}</p>
      ) : null}

      <div className={CARD}>
        {heroAsset?.href && heroAsset.isImage ? (
          <div className="bg-[#FDF8F0]/80 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroAsset.href}
              alt={heroAsset.fileName}
              className="mx-auto max-h-[520px] w-full rounded-xl object-contain"
            />
          </div>
        ) : heroAsset?.href && heroAsset.isPdf ? (
          <div className="flex flex-col items-center justify-center bg-gradient-to-b from-[#FDF8F0] to-white px-6 py-16 text-center">
            <div className="rounded-2xl border border-[#D4C4A8] bg-white px-8 py-10 shadow-sm">
              <p className="text-4xl">📄</p>
              <p className="mt-3 text-sm font-semibold text-[#1E1814]">{heroAsset.fileName}</p>
              <p className="mt-1 text-xs text-[#1E1814]/55">PDF</p>
            </div>
          </div>
        ) : heroAsset ? (
          <div className="flex flex-col items-center justify-center bg-[#FDF8F0]/80 px-6 py-16 text-center">
            <p className="text-sm font-medium text-[#1E1814]">{heroAsset.fileName}</p>
            <p className="mt-2 text-xs text-[#1E1814]/55">
              {lang === "en" ? "File on record" : "Archivo registrado"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-dashed border-[#D4C4A8] bg-[#FDF8F0]/60 px-6 py-20 text-center">
            <p className="text-sm text-[#1E1814]/55">
              {isCoupon
                ? lang === "en"
                  ? OFERTAS_LOCALES_PREVIEW_COPY.couponAssetPlaceholder
                  : OFERTAS_LOCALES_PREVIEW_COPY.couponAssetPlaceholder
                : lang === "en"
                  ? OFERTAS_LOCALES_PREVIEW_COPY.flyerPlaceholder
                  : OFERTAS_LOCALES_PREVIEW_COPY.flyerPlaceholderEs}
            </p>
          </div>
        )}
      </div>

      {heroAsset?.href ? (
        <div className="grid gap-2">
          <a href={heroAsset.href} target="_blank" rel="noopener noreferrer" className={BTN}>
            {heroAsset.kind === "coupon"
              ? lang === "en"
                ? OFERTAS_LOCALES_PREVIEW_COPY.viewCouponEn
                : OFERTAS_LOCALES_PREVIEW_COPY.viewCouponEs
              : lang === "en"
                ? OFERTAS_LOCALES_PREVIEW_COPY.viewFlyerEn
                : OFERTAS_LOCALES_PREVIEW_COPY.viewFlyerEs}
          </a>
          <a href={heroAsset.href} target="_blank" rel="noopener noreferrer" className={BTN}>
            {lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.openFileEn : OFERTAS_LOCALES_PREVIEW_COPY.openFileEs}
          </a>
        </div>
      ) : null}
    </div>
  );
}
