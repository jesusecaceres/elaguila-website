"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiBookmark,
  FiExternalLink,
  FiFileText,
  FiGlobe,
  FiImage,
  FiList,
  FiLock,
  FiMapPin,
  FiShare2,
  FiShoppingBag,
  FiX,
} from "react-icons/fi";
import { formatOfertaLocalDateRange } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import type { OfertaLocalDraft, OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

function formatDrawerPrice(item: OfertaLocalItemReviewViewModel, lang: OfertasLocalesAppLang): string {
  const text = (item.offerText || item.priceText).trim();
  if (text) return text;
  if (typeof item.priceAmount === "number" && Number.isFinite(item.priceAmount)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(item.priceAmount);
  }
  return lang === "en"
    ? OFERTAS_LOCALES_PREVIEW_COPY.priceNotListedEn
    : OFERTAS_LOCALES_PREVIEW_COPY.priceNotListedEs;
}

const BTN_PRIMARY =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6a1926] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C]/40 sm:w-auto";
const BTN_OUTLINE =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#D4C4A8]/80 bg-[#FFFCF7] px-4 py-2.5 text-sm font-medium text-[#1E1814] transition hover:border-[#7A1E2C]/35 hover:bg-[#FDF8F0] sm:w-auto";
const BTN_DISABLED =
  "inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-dashed border-[#D4C4A8]/70 bg-[#FDF8F0]/50 px-4 py-2.5 text-sm font-medium text-[#1E1814]/35";

export function OfertasLocalesProductDetailDrawer({
  item,
  draft,
  lang,
  open,
  onClose,
  heroHref,
  heroLabel,
  directionsHref,
  websiteHref,
  onViewMoreOffers,
}: {
  item: OfertaLocalItemReviewViewModel | null;
  draft: OfertaLocalDraft;
  lang: OfertasLocalesAppLang;
  open: boolean;
  onClose: () => void;
  heroHref: string;
  heroLabel: string;
  directionsHref: string;
  websiteHref: string;
  onViewMoreOffers: () => void;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  const panelRef = useRef<HTMLDivElement>(null);
  const [shareCopied, setShareCopied] = useState(false);

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
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open, item?.id]);

  const handleShare = useCallback(async () => {
    if (!item) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = (item.couponTitle || item.itemName).trim() || draft.businessName;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url });
        return;
      }
      if (url) {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      /* cancelled */
    }
  }, [draft.businessName, item]);

  if (!open || !item) return null;

  const title = (item.couponTitle || item.itemName).trim();
  const price = formatDrawerPrice(item, lang);
  const brand = (item.subcategory || "").trim();
  const details = (item.description || item.terms || item.dealType).trim();
  const cropUrl = item.sourceCropUrl.trim();
  const sourceAssetUrl = (item.sourceAssetUrl || "").trim();
  const sourceFlyerHref = heroHref || sourceAssetUrl;
  const hasSourceProof = !cropUrl && (item.sourcePage != null || sourceAssetUrl);
  const unit = item.unit.trim();
  const regularPrice = item.regularPriceText.trim();
  const dateRange = formatOfertaLocalDateRange(
    item.validFrom ?? draft.validFrom,
    item.validUntil ?? draft.validUntil
  );
  const businessName = draft.businessName.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-stretch lg:justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-[#1E1814]/50 backdrop-blur-[3px]"
        aria-label={lang === "en" ? c.closeSectionEn : c.closeSectionEs}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={lang === "en" ? c.productDetailsEn : c.productDetailsEs}
        tabIndex={-1}
        className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-[#D4C4A8]/70 bg-[#FFFCF7] shadow-2xl lg:h-full lg:max-h-none lg:max-w-md lg:rounded-none lg:rounded-l-3xl"
      >
        <div className="flex shrink-0 justify-center pt-2 lg:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-[#D4C4A8]/80" />
        </div>

        <div className="flex items-center justify-between border-b border-[#E8D9C4]/70 bg-gradient-to-r from-[#FDF8F0]/60 to-[#FFFCF7] px-4 py-3 sm:px-5">
          <h2 className="font-serif text-lg font-semibold text-[#1E1814]">
            {lang === "en" ? c.productDetailsEn : c.productDetailsEs}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#D4C4A8]/80 bg-white text-[#1E1814] transition hover:border-[#7A1E2C]/40 hover:bg-[#FDF8F0]"
            aria-label={lang === "en" ? c.closeSectionEn : c.closeSectionEs}
          >
            <FiX className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-8 sm:px-5 sm:pb-10">
          <div className="overflow-hidden rounded-lg border border-[#D4C4A8]/70 bg-white shadow-sm">
            {cropUrl ? (
              <div className="bg-[#FDF8F0]/50 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cropUrl}
                  alt={title || (lang === "en" ? c.productClipAltEn : c.productClipAltEs)}
                  className="mx-auto max-h-44 w-full rounded-lg object-contain"
                />
              </div>
            ) : hasSourceProof ? (
              <div className="flex flex-col items-center gap-2 bg-gradient-to-b from-[#FDF8F0]/90 to-[#F5EBD8]/25 px-4 py-6 text-center">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4C4A8]/70 bg-[#FFFCF7] text-[#B8860B]"
                  aria-hidden
                >
                  <FiFileText className="h-4 w-4" />
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#B8860B]">
                  {lang === "en" ? c.flyerSourceEn : c.flyerSourceEs}
                </p>
                <p className="text-xs text-[#1E1814]/55">
                  {lang === "en" ? c.noClipYetEn : c.noClipYetEs}
                </p>
                {item.sourcePage != null ? (
                  <span className="rounded-md border border-[#D4C4A8]/60 bg-white px-2 py-0.5 text-[10px] font-medium text-[#1E1814]/55">
                    {lang === "en" ? c.flyerPageEn : c.flyerPageEs} {item.sourcePage}
                  </span>
                ) : null}
                {sourceFlyerHref ? (
                  <a href={sourceFlyerHref} target="_blank" rel="noopener noreferrer" className={BTN_OUTLINE}>
                    <FiExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                    {lang === "en" ? c.viewSourceOnFlyerEn : c.viewSourceOnFlyerEs}
                  </a>
                ) : null}
              </div>
            ) : (
              <div className="flex h-36 flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#FDF8F0]/90 to-[#F5EBD8]/25 px-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4C4A8]/70 bg-[#FFFCF7] text-[#B8860B]"
                  aria-hidden
                >
                  <FiImage className="h-4 w-4" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/40">
                  {lang === "en" ? c.noImageEn : c.noImageEs}
                </span>
              </div>
            )}
            {cropUrl && item.sourcePage != null ? (
              <div className="flex items-center gap-2 border-t border-[#E8D9C4]/50 bg-[#FDF8F0]/40 px-3 py-2">
                <FiFileText className="h-3.5 w-3.5 shrink-0 text-[#B8860B]" aria-hidden />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/55">
                  {lang === "en" ? c.flyerPageEn : c.flyerPageEs} {item.sourcePage}
                </span>
              </div>
            ) : null}
          </div>

          {businessName ? (
            <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#2D5A3D]">
              <FiShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {businessName}
            </p>
          ) : null}

          <h3 className="mt-1.5 font-serif text-lg font-semibold leading-snug text-[#1E1814] sm:text-xl">
            {title || (lang === "en" ? c.productFallbackEn : c.productFallbackEs)}
          </h3>

          {item.category ? (
            <div className="mt-2.5">
              <span className="inline-flex rounded-full border border-[#D4C4A8]/80 bg-[#FDF8F0] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/65">
                {item.category}
              </span>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-xl font-bold tracking-tight text-[#7A1E2C]">{price}</p>
            {unit ? <span className="text-sm font-medium text-[#1E1814]/50">{unit}</span> : null}
          </div>
          {brand ? <p className="mt-1 text-sm font-medium text-[#1E1814]/55">{brand}</p> : null}
          {regularPrice ? (
            <p className="mt-1 text-xs text-[#1E1814]/45">
              {lang === "en" ? c.regularPriceEn : c.regularPriceEs}:{" "}
              <span className="line-through">{regularPrice}</span>
            </p>
          ) : null}
          {details ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#1E1814]/70">{details}</p>
          ) : null}
          {dateRange ? (
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-[#1E1814]/40">
              {lang === "en" ? c.validLabelEn : c.validLabelEs}: {dateRange}
            </p>
          ) : null}

          <div className="mt-6 space-y-2">
            {heroHref ? (
              <a href={heroHref} target="_blank" rel="noopener noreferrer" className={BTN_PRIMARY}>
                <FiExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                {heroLabel}
              </a>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" className={BTN_OUTLINE} onClick={() => void handleShare()}>
                <FiShare2 className="h-4 w-4 shrink-0" aria-hidden />
                {shareCopied
                  ? lang === "en"
                    ? c.shareCopiedEn
                    : c.shareCopiedEs
                  : lang === "en"
                    ? c.shareProductEn
                    : c.shareProductEs}
              </button>
              {directionsHref ? (
                <a href={directionsHref} target="_blank" rel="noopener noreferrer" className={BTN_OUTLINE}>
                  <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
                  {lang === "en" ? c.directions : c.directionsEs}
                </a>
              ) : null}
              {websiteHref ? (
                <a href={websiteHref} target="_blank" rel="noopener noreferrer" className={BTN_OUTLINE}>
                  <FiGlobe className="h-4 w-4 shrink-0" aria-hidden />
                  {lang === "en" ? c.businessWebsiteEn : c.businessWebsiteEs}
                </a>
              ) : null}
              <button
                type="button"
                className={BTN_OUTLINE}
                onClick={() => {
                  onClose();
                  onViewMoreOffers();
                }}
              >
                <FiList className="h-4 w-4 shrink-0" aria-hidden />
                {lang === "en" ? c.viewMoreOffersEn : c.viewMoreOffersEs}
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-2 rounded-lg border border-dashed border-[#D4C4A8]/60 bg-[#FDF8F0]/40 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#B8860B]">
              <FiLock className="h-3.5 w-3.5" aria-hidden />
              {lang === "en" ? c.comingSoonEn : c.comingSoonEs}
            </p>
            {/* FUTURE WIRING: connect to saved shopping list table / dashboard saved offers. */}
            <button type="button" disabled className={BTN_DISABLED}>
              <FiList className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
              {lang === "en" ? c.addToListEn : c.addToListEs}
            </button>
            {/* FUTURE WIRING: connect to coupon wallet / saved offers table. */}
            <button type="button" disabled className={BTN_DISABLED}>
              <FiBookmark className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
              {lang === "en" ? c.saveCouponEn : c.saveCouponEs}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Preview-only: sync ?item= approved item id in URL (no public route yet). */
export function syncOfertasPreviewItemParam(itemId: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (itemId) url.searchParams.set("item", itemId);
  else url.searchParams.delete("item");
  window.history.replaceState(null, "", url.toString());
}

export function readOfertasPreviewItemParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("item");
}
