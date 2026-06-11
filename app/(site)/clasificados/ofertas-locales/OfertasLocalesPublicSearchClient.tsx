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
import { OfertasLocalesPublicItemCard } from "./OfertasLocalesPublicItemCard";
import { OfertasLocalesPublicItemDetailDrawer } from "./OfertasLocalesPublicItemDetailDrawer";
import { OfertasLocalesPublicOfferCard } from "./OfertasLocalesPublicOfferCard";
import { OfertasLocalesShoppingListPanel } from "./OfertasLocalesShoppingListPanel";
import { ofertasLocalesPublicSearchCopy } from "./ofertasLocalesPublicSearchCopy";
import { useOfertasLocalesShoppingList } from "./useOfertasLocalesShoppingList";

const INPUT =
  "w-full min-h-[2.75rem] rounded-lg border border-[#D4C4A8]/90 bg-white px-3 py-2.5 text-sm text-[#1E1814] focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/20";
const BTN =
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-50";
const BTN_OUTLINE =
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/35 disabled:cursor-not-allowed disabled:opacity-50";
const BTN_LIST_EMPTY =
  "inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-lg border border-[#D4C4A8]/90 bg-[#FAF6F0] px-2.5 py-2 text-xs font-medium text-[#1E1814]/75 hover:border-[#7A1E2C]/25";
const BTN_LIST_ACTIVE =
  "inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-full border border-[#7A1E2C]/35 bg-white px-3 py-2 text-sm font-semibold text-[#7A1E2C] shadow-sm hover:bg-[#7A1E2C]/5";

function parseLang(raw: string | null): OfertasLocalesAppLang {
  return raw === "en" ? "en" : "es";
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("lang", lang);
    if (q.trim()) params.set("q", q.trim());
    if (city.trim()) params.set("city", city.trim());
    if (zip.trim()) params.set("zip", zip.trim());
    if (category.trim()) params.set("category", category.trim());
    if (marketType.trim()) params.set("marketType", marketType.trim());
    if (offerType.trim()) params.set("offerType", offerType.trim());
    if (sort && sort !== "newest") params.set("sort", sort);
    router.push(`/clasificados/ofertas-locales?${params.toString()}`);
  };

  const publishHref = `/publicar/ofertas-locales?lang=${lang}`;
  const hasFilters = Boolean(q || city || zip || category || marketType || offerType);
  const showPipelineEmpty = !loading && offers.length === 0 && items.length === 0 && !hasFilters;
  const listHasItems = shoppingList.counts.itemCount > 0;
  const mobileFiltersLabel = mobileFiltersOpen ? c.filtersToggleHide : c.filtersToggleShow;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <header className="mb-4 sm:mb-6">
          <h1 className="text-xl font-bold leading-tight text-[#1E1814] sm:text-3xl">{c.pageTitle}</h1>
          <p className="mt-1 text-sm text-[#1E1814]/75 sm:mt-2 sm:text-base">{c.pageSubtitle}</p>
          <p className="mt-1 text-sm text-[#1E1814]/60 sm:mt-2">{c.pageHeroBody}</p>
        </header>

        <form
          onSubmit={onSubmit}
          className="mb-4 rounded-2xl border border-[#D4C4A8]/80 bg-white p-3 shadow-sm sm:mb-6 sm:p-5"
        >
          {/* Mobile primary action row */}
          <div className="flex flex-wrap items-center gap-2 md:hidden">
            <label className="min-w-0 flex-1">
              <span className="sr-only">{c.mobileSearchLabel}</span>
              <input
                className={INPUT}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={c.searchPlaceholder}
              />
            </label>
            <button
              type="button"
              className={BTN_OUTLINE}
              aria-expanded={mobileFiltersOpen}
              aria-controls="ofertas-locales-mobile-filters"
              onClick={() => setMobileFiltersOpen((open) => !open)}
            >
              {c.filtersButton}
            </button>
            <button
              type="button"
              className={listHasItems ? BTN_LIST_ACTIVE : BTN_LIST_EMPTY}
              onClick={() => setListOpen(true)}
            >
              {c.listButton}
              {listHasItems ? (
                <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#7A1E2C] px-1.5 py-0.5 text-[11px] font-bold text-white">
                  {shoppingList.counts.itemCount}
                </span>
              ) : null}
            </button>
            <button type="submit" className={`${BTN} w-full sm:w-auto`} disabled={loading}>
              {loading ? c.searching : c.searchButton}
            </button>
          </div>

          <button
            type="button"
            className="mt-2 text-xs font-medium text-[#7A1E2C] underline md:hidden"
            aria-expanded={mobileFiltersOpen}
            aria-controls="ofertas-locales-mobile-filters"
            onClick={() => setMobileFiltersOpen((open) => !open)}
          >
            {mobileFiltersLabel}
          </button>

          {/* Mobile collapsible advanced filters */}
          <div
            id="ofertas-locales-mobile-filters"
            className={`md:hidden ${mobileFiltersOpen ? "mt-3 block" : "hidden"}`}
          >
            <div className="grid gap-3 border-t border-[#D4C4A8]/50 pt-3">
              <label>
                <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.cityLabel}</span>
                <input
                  className={INPUT}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={c.cityPlaceholder}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.zipLabel}</span>
                <input
                  className={INPUT}
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder={c.zipPlaceholder}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.categoryLabel}</span>
                <input
                  className={INPUT}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={c.categoryPlaceholder}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.marketTypeLabel}</span>
                <input
                  className={INPUT}
                  value={marketType}
                  onChange={(e) => setMarketType(e.target.value)}
                  placeholder={c.marketTypePlaceholder}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.offerTypeLabel}</span>
                <input
                  className={INPUT}
                  value={offerType}
                  onChange={(e) => setOfferType(e.target.value)}
                  placeholder={c.offerTypePlaceholder}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.sortLabel}</span>
                <select className={INPUT} value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="newest">{c.sortNewest}</option>
                  <option value="price_low">{c.sortPriceLow}</option>
                  <option value="expiring_soon">{c.sortExpiringSoon}</option>
                </select>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="submit" className={BTN} disabled={loading}>
                {loading ? c.searching : c.searchButton}
              </button>
              {!loading ? (
                <p className="text-sm text-[#1E1814]/65">
                  {c.resultsCount(offers.length + items.length)}
                </p>
              ) : null}
            </div>
          </div>

          {/* Desktop / tablet full filter grid */}
          <div className="hidden md:block">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="sm:col-span-2 lg:col-span-3">
                <span className="sr-only">{c.pageTitle}</span>
                <input
                  className={INPUT}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={c.searchPlaceholder}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.cityLabel}</span>
                <input
                  className={INPUT}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={c.cityPlaceholder}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.zipLabel}</span>
                <input
                  className={INPUT}
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder={c.zipPlaceholder}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.categoryLabel}</span>
                <input
                  className={INPUT}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={c.categoryPlaceholder}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.marketTypeLabel}</span>
                <input
                  className={INPUT}
                  value={marketType}
                  onChange={(e) => setMarketType(e.target.value)}
                  placeholder={c.marketTypePlaceholder}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.offerTypeLabel}</span>
                <input
                  className={INPUT}
                  value={offerType}
                  onChange={(e) => setOfferType(e.target.value)}
                  placeholder={c.offerTypePlaceholder}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.sortLabel}</span>
                <select className={INPUT} value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="newest">{c.sortNewest}</option>
                  <option value="price_low">{c.sortPriceLow}</option>
                  <option value="expiring_soon">{c.sortExpiringSoon}</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="submit" className={BTN} disabled={loading}>
                {loading ? c.searching : c.searchButton}
              </button>
              {!loading ? (
                <p className="text-sm text-[#1E1814]/65">
                  {c.resultsCount(offers.length + items.length)}
                </p>
              ) : null}
              <button
                type="button"
                className={listHasItems ? BTN_LIST_ACTIVE : BTN_OUTLINE}
                onClick={() => setListOpen(true)}
              >
                {c.listButton}
                {listHasItems ? (
                  <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#7A1E2C] px-1.5 py-0.5 text-[11px] font-bold text-white">
                    {shoppingList.counts.itemCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </form>

        {error ? (
          <p className="mb-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? <p className="text-sm text-[#1E1814]/65">{c.searching}</p> : null}

        {!loading && showPipelineEmpty ? (
          <div className="rounded-xl border border-[#D4C4A8]/70 bg-white px-4 py-5 text-center sm:rounded-2xl sm:px-6 sm:py-8">
            <p className="text-base font-semibold text-[#1E1814]">{c.pipelineEmptyTitle}</p>
            <p className="mt-2 text-sm text-[#1E1814]/65">{c.pipelineEmptyBody}</p>
            <Link
              href={publishHref}
              className="mt-4 inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6a1926]"
            >
              {c.publishCta}
            </Link>
          </div>
        ) : null}

        {!loading && !showPipelineEmpty && offers.length === 0 && items.length === 0 ? (
          <div className="rounded-xl border border-[#D4C4A8]/70 bg-white px-4 py-5 text-center sm:rounded-2xl sm:px-6 sm:py-8">
            <p className="text-base font-semibold text-[#1E1814]">{c.emptyTitle}</p>
            <p className="mt-2 text-sm text-[#1E1814]/65">{c.emptyHint}</p>
          </div>
        ) : null}

        {!loading && offers.length > 0 ? (
          <section className="mb-6 sm:mb-10">
            <h2 className="mb-3 text-lg font-semibold text-[#1E1814] sm:mb-4">{c.offersSectionTitle}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <li key={offer.id}>
                  <OfertasLocalesPublicOfferCard lang={lang} offer={offer} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!loading && items.length > 0 ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1E1814] sm:mb-4">{c.itemsSectionTitle}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="mt-6 rounded-xl border border-[#7A1E2C]/20 bg-[#7A1E2C]/5 px-4 py-3 sm:mt-10 sm:py-4">
            <p className="text-sm font-medium text-[#1E1814]">{c.publishCtaHint}</p>
            <Link href={publishHref} className="mt-2 inline-block text-sm font-semibold text-[#7A1E2C] underline">
              {c.publishCta}
            </Link>
          </div>
        ) : null}
      </div>

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
