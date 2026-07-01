"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  OfertaLocalPublicOfferCard,
  OfertaLocalPublicSearchItem,
} from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OfertasLocalesFiltersDrawer } from "./OfertasLocalesFiltersDrawer";
import { OfertasLocalesPublicItemCard } from "./OfertasLocalesPublicItemCard";
import { OfertasLocalesPublicItemDetailDrawer } from "./OfertasLocalesPublicItemDetailDrawer";
import { OfertasLocalesPublicOfferCard } from "./OfertasLocalesPublicOfferCard";
import { OfertasLocalesShoppingListPanel } from "./OfertasLocalesShoppingListPanel";
import { ofertasLocalesPublicSearchCopy } from "./ofertasLocalesPublicSearchCopy";
import { useOfertasLocalesShoppingList } from "./useOfertasLocalesShoppingList";

const BTN_PRIMARY =
  "inline-flex min-h-[2.625rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721] disabled:cursor-not-allowed disabled:opacity-50";
const BTN_SECONDARY =
  "inline-flex min-h-[2.625rem] items-center justify-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3.5 text-sm font-semibold text-[#3D3428] hover:border-[#C9A84A] hover:bg-[#FBF7EF] disabled:cursor-not-allowed disabled:opacity-50";
const SEARCH_CANVAS =
  "overflow-hidden rounded-xl border border-[#D6C7AD]/90 bg-[#FFFDF7] shadow-[0_6px_22px_-16px_rgba(31,36,28,0.16)]";

function parseLang(raw: string | null): OfertasLocalesAppLang {
  return raw === "en" ? "en" : "es";
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 12l-8.5 8.5a2 2 0 01-2.83 0L3 14.5V4h10.5L20 12z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function OfertasLocalesPublicSearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = parseLang(searchParams?.get("lang") ?? null);
  const c = ofertasLocalesPublicSearchCopy(lang);

  const [q, setQ] = useState(() => searchParams?.get("q") ?? "");
  const [city, setCity] = useState(() => searchParams?.get("city") ?? "");
  const [zip, setZip] = useState(() => searchParams?.get("zip") ?? "");
  const [category, setCategory] = useState(() => searchParams?.get("category") ?? "");
  const [marketType, setMarketType] = useState(() => searchParams?.get("marketType") ?? "");
  const [offerType, setOfferType] = useState(() => searchParams?.get("offerType") ?? "");
  const [sort, setSort] = useState(() => searchParams?.get("sort") ?? "newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [offers, setOffers] = useState<OfertaLocalPublicOfferCard[]>([]);
  const [items, setItems] = useState<OfertaLocalPublicSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<OfertaLocalPublicSearchItem | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const shoppingList = useOfertasLocalesShoppingList();

  const queryString = useMemo(() => {
    const qs = searchParams?.toString() ?? "";
    return qs || `lang=${lang}`;
  }, [searchParams, lang]);

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [offersRes, itemsRes] = await Promise.all([
        fetch(`/api/ofertas-locales/public-offers?${queryString}`, { cache: "no-store" }),
        fetch(`/api/ofertas-locales/public-search?${queryString}`, { cache: "no-store" }),
      ]);
      const offersData = (await offersRes.json()) as {
        ok: boolean;
        offers?: OfertaLocalPublicOfferCard[];
      };
      const itemsData = (await itemsRes.json()) as {
        ok: boolean;
        items?: OfertaLocalPublicSearchItem[];
      };
      if (!offersData.ok && !itemsData.ok) {
        setError(c.loadFailed);
        setOffers([]);
        setItems([]);
        return;
      }
      setOffers(offersData.offers ?? []);
      setItems(itemsData.items ?? []);
    } catch {
      setError(c.loadFailed);
      setOffers([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [c.loadFailed, queryString]);

  useEffect(() => {
    setQ(searchParams?.get("q") ?? "");
    setCity(searchParams?.get("city") ?? "");
    setZip(searchParams?.get("zip") ?? "");
    setCategory(searchParams?.get("category") ?? "");
    setMarketType(searchParams?.get("marketType") ?? "");
    setOfferType(searchParams?.get("offerType") ?? "");
    setSort(searchParams?.get("sort") ?? "newest");
  }, [searchParams]);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  const pushSearch = useCallback(
    (overrides?: Partial<{
      q: string;
      city: string;
      zip: string;
      category: string;
      marketType: string;
      offerType: string;
      sort: string;
    }>) => {
      const params = new URLSearchParams();
      params.set("lang", lang);
      const next = {
        q: overrides?.q ?? q,
        city: overrides?.city ?? city,
        zip: overrides?.zip ?? zip,
        category: overrides?.category ?? category,
        marketType: overrides?.marketType ?? marketType,
        offerType: overrides?.offerType ?? offerType,
        sort: overrides?.sort ?? sort,
      };
      if (next.q.trim()) params.set("q", next.q.trim());
      if (next.city.trim()) params.set("city", next.city.trim());
      if (next.zip.trim()) params.set("zip", next.zip.trim());
      if (next.category.trim()) params.set("category", next.category.trim());
      if (next.marketType.trim()) params.set("marketType", next.marketType.trim());
      if (next.offerType.trim()) params.set("offerType", next.offerType.trim());
      if (next.sort && next.sort !== "newest") params.set("sort", next.sort);
      router.push(`/clasificados/ofertas-locales?${params.toString()}`);
    },
    [router, lang, q, city, zip, category, marketType, offerType, sort]
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    pushSearch();
  };

  const publishHref = `/publicar/ofertas-locales?lang=${lang}`;
  const hasFilters = Boolean(q || city || zip || category || marketType || offerType);
  const showPipelineEmpty = !loading && offers.length === 0 && items.length === 0 && !hasFilters;
  const listHasItems = shoppingList.counts.itemCount > 0;
  const resultCount = offers.length + items.length;

  const clearFilters = () => {
    setFiltersOpen(false);
    setCategory("");
    setMarketType("");
    setOfferType("");
    setSort("newest");
    router.push(`/clasificados/ofertas-locales?lang=${lang}`);
  };

  const applyDrawerFilters = () => {
    setFiltersOpen(false);
    pushSearch();
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF6EE] text-[#1F241C]">
      <div className="mx-auto max-w-[1080px] px-3.5 pb-10 pt-[calc(2.75rem+env(safe-area-inset-top,0px))] sm:px-4 sm:pt-4 lg:px-5">
        <header className="mb-3 sm:mb-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#C9A84A]/40 bg-[#FFFDF7] text-[#7A1E2C]">
              <TagIcon />
            </span>
            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">
                {lang === "es" ? "Leonix Clasificados" : "Leonix Classifieds"}
              </p>
              <h1 className="font-serif text-[1.35rem] font-bold leading-tight text-[#2A4536] sm:text-[1.65rem]">
                {c.pageTitle}
              </h1>
              <p className="mt-1 text-sm text-[#3D3428]/80">{c.pageSubtitle}</p>
            </div>
          </div>
        </header>

        <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:flex-wrap">
          <Link href={publishHref} className={`${BTN_PRIMARY} w-full sm:w-auto`}>
            {c.publishCta}
          </Link>
          <Link
            href={`/clasificados/ofertas-locales?lang=${lang}`}
            className={`${BTN_SECONDARY} w-full sm:w-auto`}
          >
            {c.viewAllDeals}
          </Link>
          {hasFilters ? (
            <button type="button" className={`${BTN_SECONDARY} w-full sm:w-auto`} onClick={clearFilters}>
              {c.clearFiltersLink}
            </button>
          ) : null}
          {listHasItems ? (
            <button type="button" className={`${BTN_SECONDARY} w-full sm:w-auto`} onClick={() => setListOpen(true)}>
              {c.listButton}
              <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-md bg-[#7A1E2C] px-1.5 py-0.5 text-[11px] font-bold text-[#FFFDF7]">
                {shoppingList.counts.itemCount}
              </span>
            </button>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className={SEARCH_CANVAS}>
          <div className="flex flex-col sm:grid sm:grid-cols-12 sm:items-stretch">
            <label className="flex min-h-[2.625rem] min-w-0 items-center border-b border-[#D6C7AD]/80 sm:col-span-5 sm:border-b-0 sm:border-r">
              <span className="shrink-0 pl-3 text-[#556B3E]" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" strokeLinecap="round" />
                </svg>
              </span>
              <input
                className="min-h-[2.625rem] min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[#3D3428]/45"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={c.searchPlaceholderCompact}
                aria-label={c.mobileSearchLabel}
              />
            </label>
            <label className="flex min-h-[2.625rem] min-w-0 border-b border-[#D6C7AD]/80 sm:col-span-2 sm:border-b-0 sm:border-r">
              <input
                className="min-h-[2.625rem] w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#3D3428]/45"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={c.cityPlaceholder}
                aria-label={c.cityLabel}
              />
            </label>
            <label className="flex min-h-[2.625rem] min-w-0 border-b border-[#D6C7AD]/80 sm:col-span-2 sm:border-b-0 sm:border-r">
              <input
                className="min-h-[2.625rem] w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#3D3428]/45"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder={c.zipPlaceholder}
                aria-label={c.zipLabel}
                inputMode="numeric"
                maxLength={10}
              />
            </label>
            <div className="flex gap-1.5 p-1.5 sm:col-span-3">
              <button type="button" className={`${BTN_SECONDARY} flex-1`} onClick={() => setFiltersOpen(true)}>
                {c.filtersButton}
              </button>
              <button type="submit" className={`${BTN_PRIMARY} flex-[1.2]`} disabled={loading}>
                {loading ? c.searching : c.searchButton}
              </button>
            </div>
          </div>
        </form>

        {!loading && resultCount > 0 ? (
          <p className="mt-2 text-xs font-semibold text-[#556B3E]">{c.resultsCount(resultCount)}</p>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? <p className="mt-3 text-sm text-[#3D3428]/65">{c.searching}</p> : null}

        {!loading && showPipelineEmpty ? (
          <div className="mt-4 rounded-xl border border-[#D6C7AD]/70 bg-[#FFFDF7] px-4 py-4 text-center">
            <p className="text-sm font-semibold text-[#3D3428]">{c.pipelineEmptyTitle}</p>
            <p className="mt-1 text-xs text-[#3D3428]/70">{c.pipelineEmptyBody}</p>
            <Link href={publishHref} className={`${BTN_PRIMARY} mt-3 inline-flex`}>
              {c.publishCta}
            </Link>
          </div>
        ) : null}

        {!loading && !showPipelineEmpty && offers.length === 0 && items.length === 0 ? (
          <div className="mt-4 rounded-xl border border-[#D6C7AD]/70 bg-[#FFFDF7] px-4 py-4 text-center">
            <p className="text-sm font-semibold text-[#3D3428]">{c.emptyTitle}</p>
            <p className="mt-1 text-xs text-[#3D3428]/70">{c.emptyHint}</p>
          </div>
        ) : null}

        {!loading && offers.length > 0 ? (
          <section className="mt-4 sm:mt-5">
            <h2 className="mb-2 font-serif text-base font-bold text-[#2A4536] sm:text-lg">{c.offersSectionTitle}</h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] sm:gap-4">
              {offers.map((offer) => (
                <li key={offer.id}>
                  <OfertasLocalesPublicOfferCard lang={lang} offer={offer} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!loading && items.length > 0 ? (
          <section className="mt-5 sm:mt-6">
            <h2 className="mb-2 font-serif text-base font-bold text-[#2A4536] sm:text-lg">{c.itemsSectionTitle}</h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] sm:gap-4">
              {items.map((item) => (
                <li key={item.id}>
                  <OfertasLocalesPublicItemCard
                    lang={lang}
                    item={item}
                    isAdded={shoppingList.isAdded(item.id)}
                    onSelect={setSelectedItem}
                    onAdd={shoppingList.addFromPublicItem}
                    onRemove={shoppingList.removeItem}
                    onOpenList={() => setListOpen(true)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!showPipelineEmpty ? (
          <div className="mt-5 rounded-lg border border-[#C9A84A]/35 bg-[#FFFDF7] px-3 py-2.5 sm:mt-6">
            <p className="text-xs font-medium text-[#3D3428]">{c.publishCtaHint}</p>
            <Link href={publishHref} className="mt-1 inline-block text-xs font-bold text-[#7A1E2C] underline">
              {c.publishCta}
            </Link>
          </div>
        ) : null}
      </div>

      <OfertasLocalesFiltersDrawer
        open={filtersOpen}
        lang={lang}
        c={c}
        category={category}
        marketType={marketType}
        offerType={offerType}
        sort={sort}
        onCategoryChange={setCategory}
        onMarketTypeChange={setMarketType}
        onOfferTypeChange={setOfferType}
        onSortChange={setSort}
        onClose={() => setFiltersOpen(false)}
        onApply={applyDrawerFilters}
        onClear={clearFilters}
      />

      {selectedItem ? (
        <OfertasLocalesPublicItemDetailDrawer
          lang={lang}
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      ) : null}

      {listOpen ? (
        <OfertasLocalesShoppingListPanel
          lang={lang}
          list={shoppingList.list}
          storeCount={shoppingList.counts.storeCount}
          itemCount={shoppingList.counts.itemCount}
          onClose={() => setListOpen(false)}
          onRemove={shoppingList.removeItem}
          onUpdateQuantity={shoppingList.updateQuantity}
          onUpdateNote={shoppingList.updateNote}
          onClear={shoppingList.clearList}
        />
      ) : null}
    </div>
  );
}
