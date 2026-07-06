"use client";

import {
  isOfertaLocalCouponPromotionFlow,
  isOfertaLocalWeeklyFlyerFlow,
} from "@/app/lib/ofertas-locales/ofertasLocalesApplicationHelpers";
import type { OfertaLocalPreviewHeroAsset } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

const CARD =
  "overflow-hidden rounded-2xl border border-[#D4C4A8]/80 bg-white shadow-md ring-1 ring-[#D4C4A8]/30";
const BTN_PRIMARY =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926]";
const BTN_OUTLINE =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#7A1E2C]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#7A1E2C] hover:bg-[#7A1E2C]/5";

function PdfFlyerPanel({
  fileName,
  laneLabel,
  lang,
}: {
  fileName: string;
  laneLabel: string | null;
  lang: OfertasLocalesAppLang;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  return (
    <div className="relative bg-gradient-to-br from-[#FDF8F0] via-white to-[#F5EBD8]/60 px-6 py-10 sm:py-14">
      <div
        className="pointer-events-none absolute inset-3 rounded-xl border border-dashed border-[#D4C4A8]/50"
        aria-hidden
      />
      <div className="relative mx-auto max-w-[280px]">
        <div className="rounded-xl border border-[#D4C4A8] bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-2 border-b border-[#E8D9C4]/80 pb-3">
            <span className="rounded-md bg-[#7A1E2C] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              PDF
            </span>
            {laneLabel ? (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#B8860B]">{laneLabel}</span>
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full rounded bg-[#E8D9C4]/60" />
            <div className="h-2 w-4/5 rounded bg-[#E8D9C4]/40" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="aspect-[4/3] rounded border border-[#D4C4A8]/60 bg-[#FDF8F0]" />
              <div className="aspect-[4/3] rounded border border-[#D4C4A8]/60 bg-[#FDF8F0]" />
            </div>
            <div className="h-2 w-3/5 rounded bg-[#E8D9C4]/40" />
          </div>
          <p className="mt-4 truncate text-sm font-semibold text-[#1E1814]" title={fileName}>
            {fileName}
          </p>
          <p className="mt-1 text-xs text-[#1E1814]/55">
            {lang === "en" ? c.pdfPanelNoteEn : c.pdfPanelNoteEs}
          </p>
        </div>
      </div>
    </div>
  );
}

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
    <div className="space-y-3">
      {laneLabel ? (
        <p className="text-xs font-semibold uppercase tracking-widest text-[#B8860B]">{laneLabel}</p>
      ) : null}

      <div className={CARD}>
        {heroAsset?.href && heroAsset.isImage ? (
          <div className="bg-[#FDF8F0]/80 p-2 sm:p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroAsset.href}
              alt={heroAsset.fileName}
              className="mx-auto max-h-[560px] w-full rounded-xl object-contain"
            />
          </div>
        ) : heroAsset?.href && heroAsset.isPdf ? (
          <PdfFlyerPanel fileName={heroAsset.fileName} laneLabel={laneLabel} lang={lang} />
        ) : heroAsset ? (
          <div className="flex flex-col items-center justify-center bg-[#FDF8F0]/80 px-6 py-16 text-center">
            <div className="rounded-xl border border-[#D4C4A8] bg-white px-6 py-8 shadow-sm">
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
              ? "grid grid-cols-2 gap-2 lg:grid-cols-1"
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
