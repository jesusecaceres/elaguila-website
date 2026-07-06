"use client";

import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { formatOfertaLocalDateRange } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

function formatPreviewPrice(item: OfertaLocalItemReviewViewModel, lang: OfertasLocalesAppLang): string {
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

function ProductCard({
  item,
  draft,
  lang,
}: {
  item: OfertaLocalItemReviewViewModel;
  draft: OfertaLocalDraft;
  lang: OfertasLocalesAppLang;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  const title = (item.couponTitle || item.itemName).trim();
  const price = formatPreviewPrice(item, lang);
  const brand = (item.subcategory || "").trim();
  const details = (item.description || item.terms || item.dealType).trim();
  const cropUrl = item.sourceCropUrl.trim();
  const unit = item.unit.trim();
  const regularPrice = item.regularPriceText.trim();
  const dateRange = formatOfertaLocalDateRange(
    item.validFrom ?? draft.validFrom,
    item.validUntil ?? draft.validUntil
  );

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#D4C4A8]/80 bg-white shadow-sm transition-shadow hover:shadow-md">
      {cropUrl ? (
        <div className="bg-[#FDF8F0]/80 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cropUrl}
            alt={title || (lang === "en" ? c.productClipAltEn : c.productClipAltEs)}
            className="mx-auto h-40 w-full rounded-lg object-contain"
          />
        </div>
      ) : (
        <div className="flex h-32 flex-col items-center justify-center gap-1 bg-gradient-to-b from-[#FDF8F0]/80 to-[#F5EBD8]/40 px-3 text-center">
          <span className="rounded-full border border-[#D4C4A8]/60 bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/40">
            {lang === "en" ? c.noImageEn : c.noImageEs}
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap gap-1">
          {item.category ? (
            <span className="rounded-full border border-[#D4C4A8] bg-[#FDF8F0] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#1E1814]/65">
              {item.category}
            </span>
          ) : null}
          {item.sourcePage != null ? (
            <span className="rounded-full border border-[#D4C4A8] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#1E1814]/55">
              {lang === "en" ? c.pageChipEn : c.pageChipEs} {item.sourcePage}
            </span>
          ) : null}
        </div>
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#1E1814]">
          {title || (lang === "en" ? c.productFallbackEn : c.productFallbackEs)}
        </h3>
        {brand ? <p className="mt-1 text-xs text-[#1E1814]/55">{brand}</p> : null}
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <p className="text-xl font-extrabold text-[#7A1E2C]">{price}</p>
          {unit ? <span className="text-xs font-medium text-[#1E1814]/50">{unit}</span> : null}
        </div>
        {regularPrice ? (
          <p className="mt-1 text-xs text-[#1E1814]/50">
            {lang === "en" ? c.regularPriceEn : c.regularPriceEs}: {regularPrice}
          </p>
        ) : null}
        {details ? (
          <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-[#1E1814]/65">{details}</p>
        ) : (
          <div className="flex-1" />
        )}
        {dateRange ? (
          <p className="mt-3 text-[10px] font-medium text-[#1E1814]/45">
            {lang === "en" ? c.validLabelEn : c.validLabelEs}: {dateRange}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function OfertasLocalesPreviewProductGrid({
  draft,
  items,
  lang,
  loading,
  error,
  needsReviewCount,
  totalCount,
}: {
  draft: OfertaLocalDraft;
  items: OfertaLocalItemReviewViewModel[];
  lang: OfertasLocalesAppLang;
  loading?: boolean;
  error?: string | null;
  needsReviewCount?: number;
  totalCount?: number;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  if (!draft.wantsAiSearchableSpecials) return null;

  return (
    <section className="mt-8 rounded-2xl border border-[#D4C4A8]/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#1E1814]">
            {lang === "en" ? c.flyerProductsEn : c.flyerProductsEs}
          </h2>
          <p className="mt-1 text-xs text-[#1E1814]/55">
            {lang === "en" ? c.productsApprovedNoteEn : c.productsApprovedNoteEs}
          </p>
        </div>
        {totalCount != null && totalCount > 0 ? (
          <span className="rounded-full border border-[#D4C4A8] bg-[#FDF8F0] px-3 py-1 text-xs font-semibold text-[#7A1E2C]">
            {items.length}/{totalCount}{" "}
            {lang === "en" ? c.approvedChipEn : c.approvedChipEs}
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-[#1E1814]/60">{lang === "en" ? c.loadingProductsEn : c.loadingProductsEs}</p>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {error}
        </p>
      ) : null}
      {needsReviewCount != null && needsReviewCount > 0 ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
          {lang === "en"
            ? c.reviewBeforeSubmitEn.replace("{count}", String(needsReviewCount))
            : c.reviewBeforeSubmitEs.replace("{count}", String(needsReviewCount))}
        </p>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[#D4C4A8] bg-[#FDF8F0]/80 px-4 py-12 text-center text-sm text-[#1E1814]/55">
          {lang === "en" ? c.noApprovedProductsEn : c.noApprovedProductsEs}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <ProductCard key={item.id} item={item} draft={draft} lang={lang} />
          ))}
        </div>
      )}
    </section>
  );
}
