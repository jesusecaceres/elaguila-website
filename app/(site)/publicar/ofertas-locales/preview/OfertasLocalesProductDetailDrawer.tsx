"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiMapPin, FiShare2, FiX } from "react-icons/fi";
import { FiGlobe } from "react-icons/fi";
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
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926]";
const BTN_OUTLINE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D4C4A8] bg-[#FFFCF7] px-4 py-2.5 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40";
const BTN_DISABLED =
  "inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-xl border border-dashed border-[#D4C4A8] bg-[#FDF8F0]/60 px-4 py-2.5 text-sm font-medium text-[#1E1814]/40";

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
        className="absolute inset-0 bg-[#1E1814]/45 backdrop-blur-[2px]"
        aria-label={lang === "en" ? c.closeSectionEn : c.closeSectionEs}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={lang === "en" ? c.productDetailsEn : c.productDetailsEs}
        tabIndex={-1}
        className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[#D4C4A8]/80 bg-[#FFFCF7] shadow-2xl lg:h-full lg:max-h-none lg:max-w-md lg:rounded-none lg:rounded-l-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#E8D9C4]/80 px-4 py-3 sm:px-5">
          <h2 className="font-serif text-lg font-semibold text-[#1E1814]">
            {lang === "en" ? c.productDetailsEn : c.productDetailsEs}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#D4C4A8] bg-white text-[#1E1814] hover:border-[#7A1E2C]/40"
            aria-label={lang === "en" ? c.closeSectionEn : c.closeSectionEs}
          >
            <FiX className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {cropUrl ? (
            <div className="rounded-xl border border-[#D4C4A8]/80 bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cropUrl}
                alt={title || (lang === "en" ? c.productClipAltEn : c.productClipAltEs)}
                className="mx-auto max-h-56 w-full rounded-lg object-contain"
              />
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[#D4C4A8] bg-[#FDF8F0]/80 text-xs uppercase tracking-wide text-[#1E1814]/40">
              {lang === "en" ? c.noImageEn : c.noImageEs}
            </div>
          )}

          {businessName ? (
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#B8860B]">{businessName}</p>
          ) : null}
          <h3 className="mt-1 text-xl font-bold text-[#1E1814]">
            {title || (lang === "en" ? c.productFallbackEn : c.productFallbackEs)}
          </h3>

          <div className="mt-2 flex flex-wrap gap-2">
            {item.category ? (
              <span className="rounded-full border border-[#D4C4A8] bg-[#FDF8F0] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#1E1814]/65">
                {item.category}
              </span>
            ) : null}
            {item.sourcePage != null ? (
              <span className="rounded-full border border-[#D4C4A8] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#1E1814]/55">
                {lang === "en" ? c.flyerPageEn : c.flyerPageEs} {item.sourcePage}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <p className="text-2xl font-extrabold text-[#7A1E2C]">{price}</p>
            {unit ? <span className="text-sm text-[#1E1814]/55">{unit}</span> : null}
          </div>
          {brand ? <p className="mt-1 text-sm text-[#1E1814]/60">{brand}</p> : null}
          {regularPrice ? (
            <p className="mt-1 text-xs text-[#1E1814]/50">
              {lang === "en" ? c.regularPriceEn : c.regularPriceEs}: {regularPrice}
            </p>
          ) : null}
          {details ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#1E1814]/75">{details}</p>
          ) : null}
          {dateRange ? (
            <p className="mt-4 text-xs text-[#1E1814]/50">
              {lang === "en" ? c.validLabelEn : c.validLabelEs}: {dateRange}
            </p>
          ) : null}

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {heroHref ? (
              <a href={heroHref} target="_blank" rel="noopener noreferrer" className={BTN_PRIMARY}>
                {heroLabel}
              </a>
            ) : null}
            <button type="button" className={BTN_OUTLINE} onClick={() => void handleShare()}>
              <FiShare2 className="h-4 w-4" aria-hidden />
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
                <FiMapPin className="h-4 w-4" aria-hidden />
                {lang === "en" ? c.directions : c.directionsEs}
              </a>
            ) : null}
            {websiteHref ? (
              <a href={websiteHref} target="_blank" rel="noopener noreferrer" className={BTN_OUTLINE}>
                <FiGlobe className="h-4 w-4" aria-hidden />
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
              {lang === "en" ? c.viewMoreOffersEn : c.viewMoreOffersEs}
            </button>
          </div>

          <div className="mt-6 space-y-2 border-t border-[#E8D9C4]/80 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#B8860B]">
              {lang === "en" ? c.comingSoonEn : c.comingSoonEs}
            </p>
            {/* FUTURE WIRING: connect to saved shopping list table / dashboard saved offers. */}
            <button type="button" disabled className={BTN_DISABLED}>
              {lang === "en" ? c.addToListEn : c.addToListEs}
            </button>
            {/* FUTURE WIRING: connect to coupon wallet / saved offers table. */}
            <button type="button" disabled className={BTN_DISABLED}>
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
