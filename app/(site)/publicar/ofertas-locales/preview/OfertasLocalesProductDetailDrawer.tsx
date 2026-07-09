"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FiExternalLink,
  FiFileText,
  FiGlobe,
  FiImage,
  FiList,
  FiLock,
  FiMapPin,
  FiShare2,
  FiShoppingBag,
} from "react-icons/fi";
import { formatOfertaLocalDateRange } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import { LeonixMobileBottomSheet } from "@/app/(site)/components/mobile/LeonixMobileBottomSheet";
import {
  canRenderOfertaLocalInstantCrop,
  canRenderOfertaLocalPdfCrop,
  itemHasMissingFlyerCrop,
  ofertaLocalCommerceMetadataHasDisplayData,
  resolveOfertaLocalInstantCropPdfSource,
  resolveOfertaLocalItemCropDisplayUrl,
  validateOfertaLocalCommerceItemUrl,
} from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewMapper";
import type { OfertaLocalDraft, OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OfertasFlyerCropPreview } from "./OfertasFlyerCropPreview";
import { OfertasPdfItemCropPreview } from "./OfertasPdfItemCropPreview";
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
  "inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#6a1926] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C]/40 sm:min-h-11 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm lg:w-auto";
const BTN_OUTLINE =
  "inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-[#D4C4A8]/80 bg-[#FFFCF7] px-3 py-2 text-xs font-medium text-[#1E1814] transition hover:border-[#7A1E2C]/35 hover:bg-[#FDF8F0] sm:min-h-11 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm lg:w-auto";

export function OfertasLocalesProductDetailDrawer({
  item,
  draft,
  lang,
  open,
  onClose,
  heroHref,
  heroLabel,
  heroImageHref,
  heroPdfHref,
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
  heroImageHref?: string | null;
  heroPdfHref?: string | null;
  directionsHref: string;
  websiteHref: string;
  onViewMoreOffers: () => void;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  const [shareCopied, setShareCopied] = useState(false);
  const [cropLoadFailed, setCropLoadFailed] = useState(false);
  const [instantCropFailed, setInstantCropFailed] = useState(false);
  const [pdfCropFailed, setPdfCropFailed] = useState(false);

  useEffect(() => {
    setCropLoadFailed(false);
    setInstantCropFailed(false);
    setPdfCropFailed(false);
  }, [item?.id, item?.sourceCropUrl]);

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

  if (!item) return null;

  const title = (item.couponTitle || item.itemName).trim();
  const price = formatDrawerPrice(item, lang);
  const brand = (item.subcategory || "").trim();
  const details = (item.description || item.terms || item.dealType).trim();
  const cropUrl = resolveOfertaLocalItemCropDisplayUrl(item);
  const sourceAssetUrl = (item.sourceAssetUrl || "").trim();
  const sourceFlyerHref =
    heroHref ||
    (sourceAssetUrl.startsWith("https://") ? sourceAssetUrl : "");
  const missingFlyerCrop = itemHasMissingFlyerCrop(item);
  const showCropImage = Boolean(cropUrl) && !cropLoadFailed;
  const canInstantCrop =
    !showCropImage &&
    !instantCropFailed &&
    canRenderOfertaLocalInstantCrop({ item, heroImageHref });
  const canPdfCrop =
    !showCropImage &&
    !canInstantCrop &&
    !pdfCropFailed &&
    canRenderOfertaLocalPdfCrop({ item, heroPdfHref });
  const pdfCropSrc = resolveOfertaLocalInstantCropPdfSource({ item, heroPdfHref });
  const hasSourceProof = !showCropImage && !canInstantCrop && !canPdfCrop && missingFlyerCrop;
  const unit = item.unit.trim();
  const regularPrice = item.regularPriceText.trim();
  const dateRange = formatOfertaLocalDateRange(
    item.validFrom ?? draft.validFrom,
    item.validUntil ?? draft.validUntil
  );
  const businessName = draft.businessName.trim();
  const commerce = item.commerceMetadata;
  const showCommerceData = ofertaLocalCommerceMetadataHasDisplayData(commerce);
  const safeItemUrl = validateOfertaLocalCommerceItemUrl(commerce.itemUrl);

  return (
    <LeonixMobileBottomSheet
      open={open}
      onClose={onClose}
      placement="right"
      lang={lang}
      title={lang === "en" ? c.productDetailsEn : c.productDetailsEs}
      ariaLabel={lang === "en" ? c.productDetailsEn : c.productDetailsEs}
      closeLabel={lang === "en" ? c.closeSectionEn : c.closeSectionEs}
      contentClassName="pb-[max(3.5rem,env(safe-area-inset-bottom))] sm:pb-[max(2rem,env(safe-area-inset-bottom))]"
    >
          <div className="overflow-hidden rounded-lg border border-[#D4C4A8]/70 bg-white shadow-sm">
            {showCropImage ? (
              <div className="bg-[#FDF8F0]/50 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cropUrl!}
                  alt={title || (lang === "en" ? c.flyerProductEn : c.flyerProductEs)}
                  className="mx-auto max-h-36 w-full rounded-lg object-contain sm:max-h-44"
                  loading="lazy"
                  decoding="async"
                  onError={() => setCropLoadFailed(true)}
                />
              </div>
            ) : canInstantCrop ? (
              <div className="relative">
                <OfertasFlyerCropPreview
                  item={item}
                  heroImageHref={heroImageHref}
                  alt={title || (lang === "en" ? c.flyerProductEn : c.flyerProductEs)}
                  variant="drawer"
                  onUnavailable={() => setInstantCropFailed(true)}
                />
                <span className="pointer-events-none absolute left-2 top-2 rounded-full border border-[#B8860B]/45 bg-[#FFFCF7]/95 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7A1E2C] shadow-sm backdrop-blur-sm">
                  {lang === "en" ? c.previewFromFlyerEn : c.previewFromFlyerEs}
                </span>
              </div>
            ) : canPdfCrop && pdfCropSrc ? (
              <div className="relative">
                <OfertasPdfItemCropPreview
                  pdfUrl={pdfCropSrc}
                  pageNumber={item.sourcePage}
                  bbox={item.sourceBbox}
                  alt={title || (lang === "en" ? c.flyerProductEn : c.flyerProductEs)}
                  variant="drawer"
                  lang={lang}
                  onUnavailable={() => setPdfCropFailed(true)}
                />
                <span className="pointer-events-none absolute left-2 top-2 rounded-full border border-[#B8860B]/45 bg-[#FFFCF7]/95 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7A1E2C] shadow-sm backdrop-blur-sm">
                  {lang === "en" ? c.previewFromFlyerEn : c.previewFromFlyerEs}
                </span>
              </div>
            ) : hasSourceProof ? (
              <div className="flex flex-col items-center gap-2 bg-gradient-to-b from-[#FDF8F0]/90 to-[#F5EBD8]/25 px-4 py-6 text-center">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4C4A8]/70 bg-[#FFFCF7] text-[#B8860B]"
                  aria-hidden
                >
                  <FiFileText className="h-4 w-4" />
                </span>
                <p className="text-xs font-semibold text-[#1E1814]/70">
                  {lang === "en" ? c.drawerCropPreparingEn : c.drawerCropPreparingEs}
                </p>
                <p className="text-xs leading-relaxed text-[#1E1814]/55">
                  {lang === "en" ? c.drawerCropPreparingHintEn : c.drawerCropPreparingHintEs}
                </p>
                {item.sourcePage != null ? (
                  <span className="rounded-md border border-[#D4C4A8]/60 bg-white px-2 py-0.5 text-[10px] font-medium text-[#1E1814]/55">
                    {lang === "en" ? c.flyerPageEn : c.flyerPageEs} {item.sourcePage}
                  </span>
                ) : null}
                {sourceFlyerHref ? (
                  <a href={sourceFlyerHref} target="_blank" rel="noopener noreferrer" className={BTN_OUTLINE}>
                    <FiExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                    {lang === "en" ? c.viewFullFlyerEn : c.viewFullFlyerEs}
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
                  {lang === "en" ? c.cropNotFoundYetEn : c.cropNotFoundYetEs}
                </span>
              </div>
            )}
            {(showCropImage || canInstantCrop) && item.sourcePage != null ? (
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

          <h3 className="mt-1 font-serif text-base font-semibold leading-snug text-[#1E1814] sm:mt-1.5 sm:text-lg lg:text-xl">
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

          {showCommerceData ? (
            <div className="mt-5 rounded-lg border border-[#D4C4A8]/60 bg-[#FDF8F0]/50 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/55">
                {lang === "en" ? c.productDataEn : c.productDataEs}
              </p>
              <dl className="mt-2 space-y-1.5 text-xs">
                {safeItemUrl ? (
                  <div>
                    <dt className="font-medium text-[#1E1814]/50">
                      {lang === "en" ? c.linkedProductEn : c.linkedProductEs}
                    </dt>
                    <dd className="break-all text-[#7A1E2C]">{safeItemUrl}</dd>
                  </div>
                ) : null}
                {commerce.itemNumber.trim() ? (
                  <div>
                    <dt className="font-medium text-[#1E1814]/50">
                      {lang === "en" ? c.itemNumberEn : c.itemNumberEs}
                    </dt>
                    <dd className="text-[#1E1814]/75">{commerce.itemNumber}</dd>
                  </div>
                ) : null}
                {commerce.sku.trim() ? (
                  <div>
                    <dt className="font-medium text-[#1E1814]/50">
                      {lang === "en" ? c.skuLabelEn : c.skuLabelEs}
                    </dt>
                    <dd className="text-[#1E1814]/75">{commerce.sku}</dd>
                  </div>
                ) : null}
                {commerce.modelNumber.trim() ? (
                  <div>
                    <dt className="font-medium text-[#1E1814]/50">
                      {lang === "en" ? c.modelNumberEn : c.modelNumberEs}
                    </dt>
                    <dd className="text-[#1E1814]/75">{commerce.modelNumber}</dd>
                  </div>
                ) : null}
                {commerce.upc.trim() ? (
                  <div>
                    <dt className="font-medium text-[#1E1814]/50">
                      {lang === "en" ? c.upcLabelEn : c.upcLabelEs}
                    </dt>
                    <dd className="text-[#1E1814]/75">{commerce.upc}</dd>
                  </div>
                ) : null}
                {commerce.couponCode.trim() ? (
                  <div>
                    <dt className="font-medium text-[#1E1814]/50">
                      {lang === "en" ? c.couponCodeEn : c.couponCodeEs}
                    </dt>
                    <dd className="text-[#1E1814]/75">{commerce.couponCode}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          <div className="mt-4 space-y-1.5 sm:mt-6 sm:space-y-2">
            {heroHref ? (
              <a href={heroHref} target="_blank" rel="noopener noreferrer" className={BTN_PRIMARY}>
                <FiExternalLink className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                {heroLabel || (lang === "en" ? c.viewFullFlyerEn : c.viewFullFlyerEs)}
              </a>
            ) : null}
            <div className="grid grid-cols-1 gap-1.5 min-[400px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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

          {/* Neutralized future roadmap — non-interactive info only (no live-looking buttons). */}
          <div className="mt-4 rounded-lg border border-dashed border-[#D4C4A8]/60 bg-[#FDF8F0]/40 p-2.5 sm:mt-5 sm:p-3">
            <p className="flex items-start gap-1.5 text-xs font-medium leading-relaxed text-[#1E1814]/60">
              <FiLock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B8860B]" aria-hidden />
              {lang === "en" ? c.comingSoonListsRoutesEn : c.comingSoonListsRoutesEs}
            </p>
          </div>
    </LeonixMobileBottomSheet>
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
