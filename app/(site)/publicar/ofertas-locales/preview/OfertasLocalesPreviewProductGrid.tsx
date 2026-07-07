"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiChevronDown,
  FiChevronRight,
  FiEye,
  FiFilter,
  FiImage,
  FiRotateCcw,
  FiSearch,
} from "react-icons/fi";
import {
  canRenderOfertaLocalInstantCrop,
  itemHasMissingFlyerCrop,
  resolveOfertaLocalItemCropDisplayUrl,
} from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewMapper";
import type { OfertaLocalPreviewHeroAsset } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { formatOfertaLocalDateRange } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import { OfertasFlyerCropPreview } from "./OfertasFlyerCropPreview";
import {
  OfertasLocalesProductDetailDrawer,
  readOfertasPreviewItemParam,
  syncOfertasPreviewItemParam,
} from "./OfertasLocalesProductDetailDrawer";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

const SECTION_ANCHOR = "scroll-mt-24";
const LOAD_MORE_STEP = 24;

const CHIP_ACTIVE =
  "border-[#7A1E2C] bg-[#7A1E2C] text-white shadow-sm shadow-[#7A1E2C]/15";
const CHIP_INACTIVE =
  "border-[#D4C4A8] bg-[#FFFCF7] text-[#1E1814]/75 hover:border-[#B8860B]/55 hover:bg-[#FDF8F0]";
const BTN_DETAIL =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#7A1E2C] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#6a1926] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C]/40 lg:min-h-9 lg:py-1.5";
const BTN_SECONDARY =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#D4C4A8]/80 bg-white px-4 py-2.5 text-sm font-semibold text-[#7A1E2C] shadow-sm transition hover:border-[#7A1E2C]/35 hover:bg-[#FDF8F0]";

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

function itemSearchHaystack(item: OfertaLocalItemReviewViewModel): string {
  return [
    item.couponTitle,
    item.itemName,
    item.category,
    item.subcategory,
    item.description,
    item.terms,
    item.dealType,
    item.priceText,
    item.offerText,
  ]
    .join(" ")
    .toLowerCase();
}

function useInitialVisibleCount(): number {
  const [count, setCount] = useState(24);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => setCount(mq.matches ? 12 : 24);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return count;
}

function ProductCard({
  item,
  draft,
  lang,
  heroImageHref,
  onOpenDetail,
}: {
  item: OfertaLocalItemReviewViewModel;
  draft: OfertaLocalDraft;
  lang: OfertasLocalesAppLang;
  heroImageHref: string | null;
  onOpenDetail: (item: OfertaLocalItemReviewViewModel) => void;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  const [cropLoadFailed, setCropLoadFailed] = useState(false);
  const [instantCropFailed, setInstantCropFailed] = useState(false);
  const title = (item.couponTitle || item.itemName).trim();
  const price = formatPreviewPrice(item, lang);
  const brand = (item.subcategory || "").trim();
  const details = (item.description || item.terms || item.dealType).trim();
  const cropUrl = resolveOfertaLocalItemCropDisplayUrl(item);
  const hasSourcePage = item.sourcePage != null;
  const showCropImage = Boolean(cropUrl) && !cropLoadFailed;
  const canInstantCrop =
    !showCropImage &&
    !instantCropFailed &&
    canRenderOfertaLocalInstantCrop({ item, heroImageHref });
  const missingFlyerCrop = itemHasMissingFlyerCrop(item);
  const fallbackLabel = missingFlyerCrop
    ? lang === "en"
      ? c.cropPreparingEn
      : c.cropPreparingEs
    : lang === "en"
      ? c.cropNotFoundYetEn
      : c.cropNotFoundYetEs;
  const unit = item.unit.trim();
  const regularPrice = item.regularPriceText.trim();
  const dateRange = formatOfertaLocalDateRange(
    item.validFrom ?? draft.validFrom,
    item.validUntil ?? draft.validUntil
  );

  useEffect(() => {
    setCropLoadFailed(false);
  }, [cropUrl, item.id]);

  useEffect(() => {
    setInstantCropFailed(false);
  }, [item.id]);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#D4C4A8]/70 bg-gradient-to-b from-[#FFFCF7] to-white shadow-sm transition-all duration-200 hover:border-[#B8860B]/45 hover:shadow-md">
      <button
        type="button"
        className="flex flex-1 flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C]/35 focus-visible:ring-offset-2"
        onClick={() => onOpenDetail(item)}
      >
        {showCropImage ? (
          <div className="border-b border-[#E8D9C4]/50 bg-[#FDF8F0]/60 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cropUrl!}
              alt={title || (lang === "en" ? c.flyerProductEn : c.flyerProductEs)}
              className="mx-auto h-28 w-full rounded-lg object-contain lg:h-24"
              loading="lazy"
              decoding="async"
              onError={() => setCropLoadFailed(true)}
            />
          </div>
        ) : canInstantCrop ? (
          <div className="relative border-b border-[#E8D9C4]/50">
            <OfertasFlyerCropPreview
              item={item}
              heroImageHref={heroImageHref}
              alt={title || (lang === "en" ? c.flyerProductEn : c.flyerProductEs)}
              variant="card"
              onUnavailable={() => setInstantCropFailed(true)}
            />
            <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-md bg-[#1E1814]/55 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
              {lang === "en" ? c.flyerPreviewEn : c.flyerPreviewEs}
            </span>
          </div>
        ) : (
          <div className="flex h-24 flex-col items-center justify-center gap-1.5 border-b border-[#E8D9C4]/40 bg-gradient-to-b from-[#FDF8F0]/90 to-[#F5EBD8]/30 px-3 text-center lg:h-20">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4C4A8]/70 bg-[#FFFCF7] text-[#B8860B]"
              aria-hidden
            >
              <FiImage className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/45">
              {fallbackLabel}
            </span>
            {hasSourcePage ? (
              <span className="text-[10px] font-medium text-[#1E1814]/40">
                {lang === "en" ? c.pageChipEn : c.pageChipEs} {item.sourcePage}
              </span>
            ) : null}
          </div>
        )}
        <div className="flex flex-1 flex-col p-3">
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {item.category ? (
              <span className="rounded-full border border-[#D4C4A8]/80 bg-[#FDF8F0] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/70">
                {item.category}
              </span>
            ) : null}
            {item.sourcePage != null ? (
              <span className="rounded-full border border-[#D4C4A8]/60 bg-white px-2.5 py-0.5 text-[10px] font-medium text-[#1E1814]/55">
                {lang === "en" ? c.pageChipEn : c.pageChipEs} {item.sourcePage}
              </span>
            ) : null}
          </div>
          <h3 className="line-clamp-2 font-serif text-sm font-semibold leading-snug text-[#1E1814]">
            {title || (lang === "en" ? c.productFallbackEn : c.productFallbackEs)}
          </h3>
          {brand ? <p className="mt-0.5 text-xs font-medium text-[#1E1814]/50">{brand}</p> : null}
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-base font-bold tracking-tight text-[#7A1E2C]">{price}</p>
            {unit ? <span className="text-xs font-medium text-[#1E1814]/45">{unit}</span> : null}
          </div>
          {regularPrice ? (
            <p className="mt-1 text-xs text-[#1E1814]/45">
              {lang === "en" ? c.regularPriceEn : c.regularPriceEs}:{" "}
              <span className="line-through">{regularPrice}</span>
            </p>
          ) : null}
          {details ? (
            <p className="mt-2.5 line-clamp-3 flex-1 text-xs leading-relaxed text-[#1E1814]/60">{details}</p>
          ) : (
            <div className="flex-1" />
          )}
          {dateRange ? (
            <p className="mt-3 text-[10px] font-medium uppercase tracking-wide text-[#1E1814]/40">
              {lang === "en" ? c.validLabelEn : c.validLabelEs}: {dateRange}
            </p>
          ) : null}
        </div>
      </button>
      <div className="border-t border-[#E8D9C4]/50 bg-[#FDF8F0]/30 px-3 pb-3 pt-2">
        <button type="button" className={BTN_DETAIL} onClick={() => onOpenDetail(item)}>
          <FiEye className="h-4 w-4 shrink-0" aria-hidden />
          <span>{lang === "en" ? c.viewDetailsEn : c.viewDetailsEs}</span>
          <FiChevronRight className="hidden h-3.5 w-3.5 shrink-0 opacity-80 sm:inline" aria-hidden />
        </button>
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
  heroAsset,
  heroFlyerLabel,
  directionsHref,
  websiteHref,
}: {
  draft: OfertaLocalDraft;
  items: OfertaLocalItemReviewViewModel[];
  lang: OfertasLocalesAppLang;
  loading?: boolean;
  error?: string | null;
  needsReviewCount?: number;
  totalCount?: number;
  heroAsset?: OfertaLocalPreviewHeroAsset | null;
  heroFlyerLabel?: string;
  directionsHref?: string;
  websiteHref?: string;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  const initialVisible = useInitialVisibleCount();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(initialVisible);
  const [drawerItem, setDrawerItem] = useState<OfertaLocalItemReviewViewModel | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      const cat = item.category.trim();
      if (cat) set.add(cat);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedCategory !== "all" && item.category.trim() !== selectedCategory) return false;
      if (!q) return true;
      return itemSearchHaystack(item).includes(q);
    });
  }, [items, searchQuery, selectedCategory]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount]
  );

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedCategory !== "all";

  const resetDiscovery = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
    setVisibleCount(initialVisible);
  }, [initialVisible]);

  const openDrawer = useCallback((item: OfertaLocalItemReviewViewModel) => {
    setDrawerItem(item);
    syncOfertasPreviewItemParam(item.id);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerItem(null);
    syncOfertasPreviewItemParam(null);
  }, []);

  useEffect(() => {
    setVisibleCount(initialVisible);
  }, [searchQuery, selectedCategory, initialVisible]);

  useEffect(() => {
    if (loading || items.length === 0) return;
    const paramId = readOfertasPreviewItemParam();
    if (!paramId) return;
    const found = items.find((i) => i.id === paramId);
    if (found) setDrawerItem(found);
  }, [items, loading]);

  const scrollToSection = useCallback(() => {
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const heroHref = heroAsset?.href ?? "";
  const heroImageHref = heroAsset?.isImage ? (heroAsset.href ?? null) : null;
  const flyerLabel =
    heroFlyerLabel ??
    (heroAsset?.kind === "coupon"
      ? lang === "en"
        ? c.viewCouponEn
        : c.viewCouponEs
      : lang === "en"
        ? c.viewFlyerEn
        : c.viewFlyerEs);

  if (!draft.wantsAiSearchableSpecials) return null;

  return (
    <>
      <section
        id="productos"
        className={`${SECTION_ANCHOR} mt-8 overflow-hidden rounded-2xl border border-[#D4C4A8]/70 bg-[#FFFCF7] p-5 shadow-sm sm:p-6`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#1E1814]">
              {lang === "en" ? c.flyerProductsEn : c.flyerProductsEs}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#1E1814]/55">
              {lang === "en" ? c.productsApprovedNoteEn : c.productsApprovedNoteEs}
            </p>
          </div>
          {totalCount != null && totalCount > 0 ? (
            <span className="inline-flex w-fit items-center rounded-full border border-[#D4C4A8]/80 bg-[#FDF8F0] px-3 py-1 text-xs font-semibold text-[#7A1E2C]">
              {items.length}/{totalCount}{" "}
              {lang === "en" ? c.approvedChipEn : c.approvedChipEs}
            </span>
          ) : null}
        </div>

        {!loading && items.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-[#D4C4A8]/60 bg-gradient-to-b from-[#FDF8F0]/80 to-white p-4 sm:p-5">
            <label className="relative block">
              <span className="sr-only">{lang === "en" ? c.searchProductsEn : c.searchProductsEs}</span>
              <FiSearch
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8860B]"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "en" ? c.searchProductsEn : c.searchProductsEs}
                className="min-h-11 w-full rounded-lg border border-[#D4C4A8]/80 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1E1814] shadow-sm placeholder:text-[#1E1814]/40 focus:border-[#7A1E2C]/50 focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/15"
              />
            </label>

            {categories.length > 0 ? (
              <div className="mt-4">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/50">
                  <FiFilter className="h-3.5 w-3.5 text-[#B8860B]" aria-hidden />
                  {lang === "en" ? c.filterProductsEn : c.filterProductsEs}
                </p>
                <div className="-mx-1 mt-2.5 flex max-w-full flex-wrap gap-2 px-1 sm:flex-nowrap sm:overflow-x-auto sm:pb-1 sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C]/30 ${
                      selectedCategory === "all" ? CHIP_ACTIVE : CHIP_INACTIVE
                    }`}
                  >
                    {lang === "en" ? c.filterAllEn : c.filterAllEs}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C]/30 ${
                        selectedCategory === cat ? CHIP_ACTIVE : CHIP_INACTIVE
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8D9C4]/50 pt-3">
              <p className="text-xs leading-relaxed text-[#1E1814]/55">
                {lang === "en" ? c.showingEn : c.showingEs}{" "}
                <span className="font-bold text-[#7A1E2C]">{visibleItems.length}</span>{" "}
                {lang === "en" ? c.ofEn : c.ofEs}{" "}
                <span className="font-semibold text-[#1E1814]">{filteredItems.length}</span>
                {filteredItems.length !== items.length ? (
                  <span className="text-[#1E1814]/40">
                    {" "}
                    · {items.length} {lang === "en" ? c.approvedChipEn : c.approvedChipEs}
                  </span>
                ) : null}
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetDiscovery}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-[#D4C4A8]/80 bg-white px-3.5 py-2 text-xs font-semibold text-[#7A1E2C] shadow-sm transition hover:border-[#7A1E2C]/35 hover:bg-[#FDF8F0]"
                >
                  <FiRotateCcw className="h-3.5 w-3.5" aria-hidden />
                  {lang === "en" ? c.viewAllEn : c.viewAllEs}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

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
        ) : !loading && filteredItems.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-[#D4C4A8] bg-[#FDF8F0]/80 px-4 py-10 text-center">
            <p className="text-sm text-[#1E1814]/60">
              {lang === "en" ? c.noFilterMatchesEn : c.noFilterMatchesEs}
            </p>
            <button
              type="button"
              onClick={resetDiscovery}
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#7A1E2C]/30 bg-white px-5 py-2.5 text-sm font-semibold text-[#7A1E2C] shadow-sm hover:bg-[#FDF8F0]"
            >
              <FiRotateCcw className="h-4 w-4" aria-hidden />
              {lang === "en" ? c.viewAllEn : c.viewAllEs}
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  draft={draft}
                  lang={lang}
                  heroImageHref={heroImageHref}
                  onOpenDetail={openDrawer}
                />
              ))}
            </div>
            {visibleItems.length < filteredItems.length ? (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + LOAD_MORE_STEP)}
                  className={BTN_SECONDARY}
                >
                  {lang === "en" ? c.loadMoreProductsEn : c.loadMoreProductsEs}
                  <FiChevronDown className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <OfertasLocalesProductDetailDrawer
        item={drawerItem}
        draft={draft}
        lang={lang}
        open={drawerItem != null}
        onClose={closeDrawer}
        heroHref={heroHref}
        heroLabel={flyerLabel}
        heroImageHref={heroImageHref}
        directionsHref={directionsHref ?? ""}
        websiteHref={websiteHref ?? ""}
        onViewMoreOffers={scrollToSection}
      />
    </>
  );
}
