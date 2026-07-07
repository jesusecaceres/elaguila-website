"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { OfertaLocalPreviewHeroAsset } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { formatOfertaLocalDateRange } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import {
  OfertasLocalesProductDetailDrawer,
  readOfertasPreviewItemParam,
  syncOfertasPreviewItemParam,
} from "./OfertasLocalesProductDetailDrawer";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

const SECTION_ANCHOR = "scroll-mt-24";
const LOAD_MORE_STEP = 24;

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
  onOpenDetail,
}: {
  item: OfertaLocalItemReviewViewModel;
  draft: OfertaLocalDraft;
  lang: OfertasLocalesAppLang;
  onOpenDetail: (item: OfertaLocalItemReviewViewModel) => void;
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
      <button
        type="button"
        className="flex flex-1 flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C]/40"
        onClick={() => onOpenDetail(item)}
      >
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
      </button>
      <div className="border-t border-[#E8D9C4]/60 px-4 pb-4 pt-2">
        <button
          type="button"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#7A1E2C]/30 bg-white text-sm font-semibold text-[#7A1E2C] hover:bg-[#7A1E2C]/5"
          onClick={() => onOpenDetail(item)}
        >
          {lang === "en" ? c.viewDetailsEn : c.viewDetailsEs}
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
        className={`${SECTION_ANCHOR} mt-8 rounded-2xl border border-[#D4C4A8]/80 bg-white p-5 shadow-sm sm:p-6`}
      >
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

        {!loading && items.length > 0 ? (
          <div className="mt-5 rounded-xl border border-[#E8D9C4]/70 bg-[#FDF8F0]/40 p-4">
            <label className="block">
              <span className="sr-only">{lang === "en" ? c.searchProductsEn : c.searchProductsEs}</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "en" ? c.searchProductsEn : c.searchProductsEs}
                className="min-h-11 w-full rounded-xl border border-[#D4C4A8] bg-white px-4 py-2.5 text-sm text-[#1E1814] placeholder:text-[#1E1814]/45 focus:border-[#7A1E2C]/40 focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/15"
              />
            </label>

            {categories.length > 0 ? (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/45">
                  {lang === "en" ? c.filterProductsEn : c.filterProductsEs}
                </p>
                <div className="-mx-1 mt-2 flex flex-wrap gap-2 px-1 lg:flex-nowrap lg:overflow-x-auto lg:pb-1 lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      selectedCategory === "all"
                        ? "border-[#7A1E2C] bg-[#7A1E2C] text-white"
                        : "border-[#D4C4A8] bg-white text-[#1E1814]/75"
                    }`}
                  >
                    {lang === "en" ? c.filterAllEn : c.filterAllEs}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        selectedCategory === cat
                          ? "border-[#7A1E2C] bg-[#7A1E2C] text-white"
                          : "border-[#D4C4A8] bg-white text-[#1E1814]/75"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#1E1814]/60">
              <p>
                {lang === "en" ? c.showingEn : c.showingEs}{" "}
                <span className="font-semibold text-[#7A1E2C]">{visibleItems.length}</span>{" "}
                {lang === "en" ? c.ofEn : c.ofEs}{" "}
                <span className="font-semibold text-[#1E1814]">{filteredItems.length}</span>
                {filteredItems.length !== items.length ? (
                  <span className="text-[#1E1814]/45">
                    {" "}
                    ({items.length} {lang === "en" ? c.approvedChipEn : c.approvedChipEs})
                  </span>
                ) : null}
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetDiscovery}
                  className="min-h-11 rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 text-xs font-semibold text-[#7A1E2C] hover:border-[#7A1E2C]/35"
                >
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
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#7A1E2C]/30 bg-white px-4 py-2 text-sm font-semibold text-[#7A1E2C]"
            >
              {lang === "en" ? c.viewAllEn : c.viewAllEs}
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleItems.map((item) => (
                <ProductCard key={item.id} item={item} draft={draft} lang={lang} onOpenDetail={openDrawer} />
              ))}
            </div>
            {visibleItems.length < filteredItems.length ? (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + LOAD_MORE_STEP)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#7A1E2C]/30 bg-white px-6 py-2.5 text-sm font-semibold text-[#7A1E2C] hover:bg-[#7A1E2C]/5"
                >
                  {lang === "en" ? c.loadMoreProductsEn : c.loadMoreProductsEs}
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
        directionsHref={directionsHref ?? ""}
        websiteHref={websiteHref ?? ""}
        onViewMoreOffers={scrollToSection}
      />
    </>
  );
}
