"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiCoffee, FiGift, FiShoppingBag, FiShoppingCart, FiStar, FiTag, FiTool } from "react-icons/fi";
import type {
  OfertaLocalPublicOfferCard,
  OfertaLocalPublicSearchItem,
} from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OfertasLocalesFiltersDrawer } from "./OfertasLocalesFiltersDrawer";
import { OfertasLocalesPublicItemCard } from "./OfertasLocalesPublicItemCard";
import { OfertasLocalesPublicItemDetailDrawer } from "./OfertasLocalesPublicItemDetailDrawer";
import { OfertasLocalesPublicOfferCard } from "./OfertasLocalesPublicOfferCard";
import { OfertasLocalesPublicOfferDetailDrawer } from "./OfertasLocalesPublicOfferDetailDrawer";
import { OfertasLocalesShoppingListPanel } from "./OfertasLocalesShoppingListPanel";
import { ofertasLocalesPublicSearchCopy, ofertasLocalesResultModeCopy, ofertasLocalesCuponesResultsIntroCopy, parseOfertasLocalesResultMode } from "./ofertasLocalesPublicSearchCopy";
import { useOfertasLocalesShoppingList } from "./useOfertasLocalesShoppingList";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryCta,
  LeonixCategoryPartnerSection,
  LeonixCategoryDiscoveryGrid,
  LeonixCategoryVisibilityStrip,
  LeonixCategoryActiveFilters,
  LeonixCategoryResultsShell,
  LeonixCategoryResultsToolbar,
  LeonixCategoryCompactEmptyState,
  type Lang as V2Lang,
  type ViewMode,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import {
  OfertaLocalPostalInput,
  OfertaLocalRegionStateInput,
} from "@/app/lib/ofertas-locales/ofertasLocalesLocationFieldControls";
import {
  OFERTA_LOCAL_DEFAULT_COUNTRY,
  readOfertaLocalPostalFromSearchParams,
} from "@/app/lib/ofertas-locales/ofertasLocalesLocationHelpers";

const OFERTAS_LOCALES_LANDING_PATH = "/clasificados/ofertas-locales";
const OFERTAS_LOCALES_RESULTS_PATH = "/clasificados/ofertas-locales/results";
const CUPONES_LANDING_PATH = "/cupones";
const CUPONES_RESULTS_PATH = "/cupones/resultados";
const CUPON_SURFACE_OFFER_TYPES = [
  "coupon",
  "promotion",
  "seasonal_special",
  "bundle",
  "featured_deal",
] as const;
const CUPON_SURFACE_OFFER_TYPE_SET = new Set<string>(CUPON_SURFACE_OFFER_TYPES);

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

function OfertasFloatingShoppingListCart({
  title,
  emptyHelper,
  openLabel,
  itemCount,
  listSummary,
  onOpen,
}: {
  title: string;
  emptyHelper: string;
  openLabel: string;
  itemCount: number;
  listSummary: string;
  onOpen: () => void;
}) {
  const subtitle = itemCount > 0 ? listSummary : emptyHelper;

  return (
    <div
      className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-40 max-w-[min(20rem,calc(100vw-1.5rem))] sm:bottom-6 sm:right-6"
      data-testid="ofertas-floating-shopping-list-cart"
    >
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto group flex w-full items-stretch overflow-hidden rounded-2xl border-2 border-[#B8860B]/75 bg-gradient-to-br from-[#FDF8F0] via-[#FFFCF7] to-[#F5EBD8] text-left shadow-[0_10px_36px_rgba(30,24,20,0.28)] ring-1 ring-[#7A1E2C]/15 transition duration-200 hover:-translate-y-0.5 hover:border-[#B8860B] hover:shadow-[0_14px_44px_rgba(122,30,44,0.28)] active:scale-[0.98]"
        aria-label={`${title}. ${subtitle}`}
      >
        <span className="relative flex w-[3.75rem] shrink-0 flex-col items-center justify-center bg-gradient-to-b from-[#7A1E2C] to-[#5c1723] py-3.5 text-white sm:w-[4.25rem]">
          <FiShoppingCart className="h-6 w-6 drop-shadow-sm" aria-hidden />
          {itemCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border-2 border-[#FDF8F0] bg-[#B8860B] px-1.5 text-[11px] font-bold leading-none text-white shadow-md">
              {itemCount}
            </span>
          ) : null}
        </span>

        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2.5 sm:px-3.5 sm:py-3">
          <span className="text-sm font-bold leading-tight text-[#1E1814] sm:text-[0.9375rem]">
            {title}
          </span>
          <span className="line-clamp-2 text-[11px] leading-snug text-[#1E1814]/68 sm:text-xs">
            {subtitle}
          </span>
          <span className="mt-0.5 inline-flex w-fit min-h-8 items-center rounded-lg bg-[#7A1E2C] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm group-hover:bg-[#6a1926] sm:min-h-9 sm:px-3 sm:text-xs">
            {openLabel}
            {itemCount > 0 ? (
              <span className="ml-1.5 inline-flex min-w-[1.125rem] items-center justify-center rounded bg-white/20 px-1 text-[10px] font-bold">
                {itemCount}
              </span>
            ) : null}
          </span>
        </span>
      </button>
    </div>
  );
}

type OfertasLocalesPublicSearchMode = "landing" | "results";
type OfertasLocalesPublicSurface = "ofertas" | "cupones";

export function OfertasLocalesPublicSearchClient({
  mode = "landing",
  surface = "ofertas",
}: {
  mode?: OfertasLocalesPublicSearchMode;
  surface?: OfertasLocalesPublicSurface;
}) {
  const isResults = mode === "results";
  const isCupones = surface === "cupones";
  const landingPath = isCupones ? CUPONES_LANDING_PATH : OFERTAS_LOCALES_LANDING_PATH;
  const resultsPath = isCupones ? CUPONES_RESULTS_PATH : OFERTAS_LOCALES_RESULTS_PATH;
  const browsePath = resultsPath;
  const clearPath = isResults ? resultsPath : landingPath;
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = parseLang(searchParams?.get("lang") ?? null);
  const c = ofertasLocalesPublicSearchCopy(lang, surface);

  const [q, setQ] = useState(() => searchParams?.get("q") ?? "");
  const [city, setCity] = useState(() => searchParams?.get("city") ?? "");
  const [state, setState] = useState(() => searchParams?.get("state") ?? "");
  const [zip, setZip] = useState(() =>
    searchParams ? readOfertaLocalPostalFromSearchParams(searchParams) : ""
  );
  const [country, setCountry] = useState(() => searchParams?.get("country") ?? "");
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
  const [selectedCouponOffer, setSelectedCouponOffer] = useState<OfertaLocalPublicOfferCard | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const shoppingList = useOfertasLocalesShoppingList();

  const queryString = useMemo(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("lang", lang);
    if (isCupones && params.get("sort") === "price_low") {
      params.delete("sort");
    }
    return params.toString();
  }, [searchParams, lang, isCupones]);

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offersRes = await fetch(`/api/ofertas-locales/public-offers?${queryString}`, { cache: "no-store" });
      const offersData = (await offersRes.json()) as {
        ok: boolean;
        offers?: OfertaLocalPublicOfferCard[];
      };
      if (isCupones) {
        if (!offersData.ok) {
          setError(c.loadFailed);
          setOffers([]);
          setItems([]);
          return;
        }
        setOffers((offersData.offers ?? []).filter((offer) => CUPON_SURFACE_OFFER_TYPE_SET.has(offer.offerType)));
        setItems([]);
        return;
      }

      const itemsRes = await fetch(`/api/ofertas-locales/public-search?${queryString}`, { cache: "no-store" });
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
  }, [c.loadFailed, queryString, isCupones]);

  useEffect(() => {
    setQ(searchParams?.get("q") ?? "");
    setCity(searchParams?.get("city") ?? "");
    setState(searchParams?.get("state") ?? "");
    setZip(searchParams?.get("zip") ?? "");
    setCountry(searchParams?.get("country") ?? "");
    setCategory(searchParams?.get("category") ?? "");
    setMarketType(searchParams?.get("marketType") ?? "");
    const nextOfferType = searchParams?.get("offerType") ?? "";
    setOfferType(isCupones && nextOfferType && !CUPON_SURFACE_OFFER_TYPE_SET.has(nextOfferType) ? "" : nextOfferType);
    const nextSort = searchParams?.get("sort") ?? "newest";
    setSort(isCupones && nextSort === "price_low" ? "newest" : nextSort);
  }, [searchParams, isCupones]);

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
      state: string;
      zip: string;
      country: string;
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
        state: overrides?.state ?? state,
        zip: overrides?.zip ?? zip,
        country: overrides?.country ?? country,
        category: overrides?.category ?? category,
        marketType: overrides?.marketType ?? marketType,
        offerType: overrides?.offerType ?? offerType,
        sort: overrides?.sort ?? sort,
      };
      if (next.q.trim()) params.set("q", next.q.trim());
      if (next.city.trim()) params.set("city", next.city.trim());
      if (next.state.trim()) params.set("state", next.state.trim());
      if (next.zip.trim()) params.set("zip", next.zip.trim());
      if (next.country.trim()) params.set("country", next.country.trim());
      if (next.category.trim()) params.set("category", next.category.trim());
      if (next.marketType.trim()) params.set("marketType", next.marketType.trim());
      if (next.offerType.trim() && (!isCupones || CUPON_SURFACE_OFFER_TYPE_SET.has(next.offerType.trim()))) {
        params.set("offerType", next.offerType.trim());
      }
      if (next.sort && next.sort !== "newest" && (!isCupones || next.sort !== "price_low")) params.set("sort", next.sort);
      const mode = searchParams?.get("mode")?.trim();
      if (mode) params.set("mode", mode);
      router.push(`${resultsPath}?${params.toString()}`);
    },
    [router, lang, q, city, state, zip, country, category, marketType, offerType, sort, isCupones, resultsPath, searchParams]
  );

  const browseAllHref = `${browsePath}?lang=${lang}`;

  const intentResultsHref = useCallback(
    (intent: { offerType?: string; marketType?: string; category?: string; mode: string }) => {
      const params = new URLSearchParams({ lang, mode: intent.mode });
      if (intent.offerType) params.set("offerType", intent.offerType);
      if (intent.marketType) params.set("marketType", intent.marketType);
      if (intent.category) params.set("category", intent.category);
      return `${resultsPath}?${params.toString()}`;
    },
    [lang, resultsPath]
  );

  const cuponesResultsHref = useCallback(
    (offerType?: string) => {
      const params = new URLSearchParams({ lang });
      if (offerType) params.set("offerType", offerType);
      return `${resultsPath}?${params.toString()}`;
    },
    [lang, resultsPath]
  );

  const cuponesIntroCopy = isCupones ? ofertasLocalesCuponesResultsIntroCopy(lang) : null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    pushSearch();
  };

  const publishHref = isCupones
    ? `/publicar/ofertas-locales?lang=${lang}&product=coupon_promotion`
    : `/publicar/ofertas-locales?lang=${lang}`;
  const hasFilters = Boolean(q || city || state || zip || country || category || marketType || offerType || (sort && sort !== "newest"));
  const showPipelineEmpty = !loading && offers.length === 0 && items.length === 0 && !hasFilters;
  const resultCount = offers.length + items.length;
  const parsedResultMode = parseOfertasLocalesResultMode(searchParams?.get("mode"));
  const displayResultMode =
    !isCupones && q.trim() && parsedResultMode === "all" ? "products" : parsedResultMode;
  const resultModeCopy = !isCupones ? ofertasLocalesResultModeCopy(lang, displayResultMode) : null;
  const showItemsFirst = !isCupones && (parsedResultMode === "products" || Boolean(q.trim()));
  const activeFilterChips = [
    ...(q ? [{ id: "q", label: `“${q}”`, onClear: () => pushSearch({ q: "" }) }] : []),
    ...(city ? [{ id: "city", label: city, onClear: () => pushSearch({ city: "" }) }] : []),
    ...(state ? [{ id: "state", label: state, onClear: () => pushSearch({ state: "" }) }] : []),
    ...(zip ? [{ id: "zip", label: zip, onClear: () => pushSearch({ zip: "" }) }] : []),
    ...(country ? [{ id: "country", label: country, onClear: () => pushSearch({ country: "" }) }] : []),
    ...(category ? [{ id: "category", label: category, onClear: () => pushSearch({ category: "" }) }] : []),
    ...(marketType ? [{ id: "marketType", label: marketType, onClear: () => pushSearch({ marketType: "" }) }] : []),
    ...(offerType ? [{ id: "offerType", label: offerType, onClear: () => pushSearch({ offerType: "" }) }] : []),
  ];

  const clearFilters = () => {
    setFiltersOpen(false);
    setQ("");
    setCity("");
    setState("");
    setZip("");
    setCountry("");
    setCategory("");
    setMarketType("");
    setOfferType("");
    setSort("newest");
    router.push(`${clearPath}?lang=${lang}`);
  };

  const applyDrawerFilters = () => {
    setFiltersOpen(false);
    pushSearch();
  };

  const searchForm = (
    <LeonixCategorySearchCanvas
      lang={lang as V2Lang}
      surface={isResults ? "results" : "landing"}
      query={q}
      city={city}
      state={state}
      zip={zip}
      country={country}
      onQuery={setQ}
      onCity={setCity}
      onState={setState}
      onZip={setZip}
      onCountry={setCountry}
      onSearch={() => pushSearch()}
      onOpenFilters={() => setFiltersOpen(true)}
      browseAllHref={browseAllHref}
      browseAllLabel={c.browseAllDeals}
      queryPlaceholder={c.searchPlaceholderCompact}
      searchButtonLabel={c.searchButton}
      filtersButtonLabel={c.filtersButton}
      publishHref={isResults ? undefined : publishHref}
      publishLabel={isResults ? undefined : c.sponsorPrimaryCta}
    />
  );

  const hero = (
    <LeonixCategoryHeroGateway
      lang={lang as V2Lang}
      surface={isResults ? "results" : "landing"}
      title={c.heroTitle}
      tagline={c.heroTagline}
      intro={c.heroIntro}
      introSecondary={c.heroHelper}
      searchSlot={searchForm}
      eyebrow={c.heroEyebrow}
    />
  );

  const openShoppingList = () => setListOpen(true);

  const floatingShoppingListCart = !isCupones ? (
    <OfertasFloatingShoppingListCart
      title={c.shoppingListTitle}
      emptyHelper={c.shoppingListEmptyHelper}
      openLabel={c.shoppingListOpen}
      itemCount={shoppingList.counts.itemCount}
      listSummary={c.listSummary(shoppingList.counts.storeCount, shoppingList.counts.itemCount)}
      onOpen={openShoppingList}
    />
  ) : null;

  const resultsContent = (
    <div
      id={isCupones ? "cupones-browse" : "ofertas-browse"}
      className="scroll-mt-24 space-y-6 sm:space-y-8"
      data-testid={isCupones ? "cupones-public-results" : undefined}
    >
      {isResults && isCupones && cuponesIntroCopy ? (
        <section
          className="rounded-xl border border-[#B8860B]/40 bg-gradient-to-r from-[#FDF8F0] to-[#FFFCF7] px-3.5 py-3 shadow-sm"
          data-testid="cupones-results-intro"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-[#2A4536]/25 bg-[#2A4536]/8 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#2A4536]">
              {lang === "es" ? "Cupones" : "Coupons"}
            </span>
            {q.trim() ? (
              <span className="inline-flex rounded-full border border-[#7A1E2C]/25 bg-[#7A1E2C]/8 px-2.5 py-0.5 text-[11px] font-medium text-[#7A1E2C]">
                {lang === "es" ? `Búsqueda: “${q.trim()}”` : `Search: “${q.trim()}”`}
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 font-serif text-base font-bold text-[#2A4536] sm:text-lg">{cuponesIntroCopy.title}</h2>
          <p className="mt-1 text-sm leading-snug text-[#1E1814]/70">{cuponesIntroCopy.helper}</p>
        </section>
      ) : null}

      {isResults && !isCupones && resultModeCopy ? (
        <section
          className="rounded-xl border border-[#B8860B]/40 bg-gradient-to-r from-[#FDF8F0] to-[#FFFCF7] px-3.5 py-3 shadow-sm"
          data-testid="ofertas-results-mode-intro"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-[#2A4536]/25 bg-[#2A4536]/8 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#2A4536]">
              {resultModeCopy.pill}
            </span>
            {q.trim() ? (
              <span className="inline-flex rounded-full border border-[#7A1E2C]/25 bg-[#7A1E2C]/8 px-2.5 py-0.5 text-[11px] font-medium text-[#7A1E2C]">
                {lang === "es" ? `Búsqueda: “${q.trim()}”` : `Search: “${q.trim()}”`}
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 font-serif text-base font-bold text-[#2A4536] sm:text-lg">{resultModeCopy.title}</h2>
          <p className="mt-1 text-sm leading-snug text-[#1E1814]/70">{resultModeCopy.helper}</p>
          {showItemsFirst && resultModeCopy.listNote ? (
            <p className="mt-1.5 text-xs font-medium text-[#7A1E2C]/90">{resultModeCopy.listNote}</p>
          ) : null}
        </section>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <p className="text-sm text-[#3D3428]/65">{c.searching}</p> : null}

      {showItemsFirst ? (
        <>
          {!isCupones && !loading && items.length > 0 ? (
            <section>
              <h2 className="mb-3 font-serif text-base font-bold text-[#2A4536] sm:mb-4 sm:text-lg">{c.itemsSectionTitle}</h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
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

          {!loading && offers.length > 0 ? (
            <section>
              <h2 className="mb-3 font-serif text-base font-bold text-[#2A4536] sm:mb-4 sm:text-lg">{c.offersSectionTitle}</h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {offers.map((offer) => (
                  <li key={offer.id}>
                    <OfertasLocalesPublicOfferCard
                      lang={lang}
                      offer={offer}
                      surface={surface}
                      onSelect={isCupones ? setSelectedCouponOffer : undefined}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <>
          {!loading && offers.length > 0 ? (
            <section>
              <h2 className="mb-3 font-serif text-base font-bold text-[#2A4536] sm:mb-4 sm:text-lg">{c.offersSectionTitle}</h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {offers.map((offer) => (
                  <li key={offer.id}>
                    <OfertasLocalesPublicOfferCard
                      lang={lang}
                      offer={offer}
                      surface={surface}
                      onSelect={isCupones ? setSelectedCouponOffer : undefined}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {!isCupones && !loading && items.length > 0 ? (
            <section>
              <h2 className="mb-3 font-serif text-base font-bold text-[#2A4536] sm:mb-4 sm:text-lg">{c.itemsSectionTitle}</h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
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
        </>
      )}
    </div>
  );

  return (
    <>
      <LeonixCategoryPageShell surface={isResults ? "results" : "landing"}>
        <div data-testid={isCupones ? "cupones-public-surface" : undefined} className="contents">
        {isResults ? (
          <LeonixCategoryResultsShell
            surface="results"
            hero={hero}
            activeFilters={
              <LeonixCategoryActiveFilters
                label={lang === "es" ? "Filtros activos" : "Active filters"}
                chips={activeFilterChips}
                clearAllLabel={c.clearFiltersLink}
                onClearAll={clearFilters}
              />
            }
            toolbar={
              <LeonixCategoryResultsToolbar
                lang={lang as V2Lang}
                countText={c.resultsCount(resultCount)}
                resultCount={resultCount}
                showingFrom={resultCount > 0 ? 1 : 0}
                showingTo={resultCount}
                sortLabel={lang === "es" ? "Orden" : "Sort"}
                sortValue={sort}
                onSortChange={(value) => {
                  setSort(value);
                  pushSearch({ sort: value });
                }}
                sortOptions={[
                  { value: "newest", label: lang === "es" ? "Más recientes" : "Newest" },
                  { value: "expiring_soon", label: lang === "es" ? "Terminan pronto" : "Expiring soon" },
                  ...(isCupones
                    ? []
                    : [{ value: "price_low", label: lang === "es" ? "Precio bajo" : "Price low" }]),
                ]}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filtersButtonLabel={c.filtersButton}
                onOpenFilters={() => setFiltersOpen(true)}
                perPageValue={resultCount}
                clearAllLabel={hasFilters ? c.clearFiltersLink : undefined}
                onClearAll={hasFilters ? clearFilters : undefined}
              />
            }
            emptyState={
              <LeonixCategoryCompactEmptyState
                title={
                  showPipelineEmpty
                    ? c.pipelineEmptyTitle
                    : hasFilters
                      ? c.approvedEmptyTitle
                      : !isCupones && resultModeCopy
                        ? resultModeCopy.emptyTitle
                        : c.emptyTitle
                }
                body={
                  showPipelineEmpty
                    ? `${c.pipelineEmptyBody} ${c.pipelineEmptyHint}`
                    : hasFilters
                      ? `${c.approvedEmptyBody} ${c.approvedEmptyHint}`
                      : !isCupones && resultModeCopy
                        ? resultModeCopy.emptyHint
                        : c.emptyHint
                }
                ctaLabel={hasFilters ? c.clearFiltersLink : c.browseAllDeals}
                ctaHref={hasFilters ? undefined : browseAllHref}
              />
            }
            hasResults={loading || resultCount > 0 || Boolean(error)}
          >
            {resultsContent}
          </LeonixCategoryResultsShell>
        ) : (
          <div className="px-3.5 pb-14 sm:px-5 lg:px-6">
            {hero}
            <main className="space-y-6 overflow-x-hidden sm:space-y-8">
              <LeonixCategoryDiscoveryGrid
                lang={lang as V2Lang}
                surface="landing"
                heading={c.discoveryTitle}
                subtitle={c.discoverySubtitle}
                items={
                  isCupones
                    ? [
                        {
                          id: "coupon",
                          label: lang === "es" ? "Cupones" : "Coupons",
                          hint: lang === "es" ? "Descuentos directos" : "Direct discounts",
                          href: cuponesResultsHref("coupon"),
                          icon: FiTag,
                        },
                        {
                          id: "promotion",
                          label: lang === "es" ? "Promociones" : "Promotions",
                          hint: lang === "es" ? "Ofertas por tiempo limitado" : "Limited-time deals",
                          href: cuponesResultsHref("promotion"),
                          icon: FiGift,
                        },
                        {
                          id: "bundle",
                          label: lang === "es" ? "Combos" : "Bundles",
                          hint: lang === "es" ? "Paquetes y combos" : "Bundles and combos",
                          href: cuponesResultsHref("bundle"),
                          icon: FiShoppingBag,
                        },
                        {
                          id: "seasonal",
                          label: lang === "es" ? "Especiales" : "Seasonal specials",
                          hint: lang === "es" ? "Temporada y eventos" : "Seasonal and events",
                          href: cuponesResultsHref("seasonal_special"),
                          icon: FiStar,
                        },
                      ]
                    : [
                        {
                          id: "weekly-flyer",
                          label: lang === "es" ? "Volante semanal" : "Weekly flyer",
                          hint: lang === "es" ? "Especiales de tienda" : "Store specials",
                          href: intentResultsHref({ offerType: "weekly_flyer", mode: "flyers" }),
                          icon: FiShoppingCart,
                        },
                        {
                          id: "coupon",
                          label: lang === "es" ? "Cupón" : "Coupon",
                          hint: lang === "es" ? "Descuentos directos" : "Direct discounts",
                          href: intentResultsHref({ offerType: "coupon", mode: "coupons" }),
                          icon: FiTag,
                        },
                        {
                          id: "promotion",
                          label: lang === "es" ? "Promoción" : "Promotion",
                          hint: lang === "es" ? "Ofertas por tiempo limitado" : "Limited-time deals",
                          href: intentResultsHref({ offerType: "promotion", mode: "promos" }),
                          icon: FiGift,
                        },
                        {
                          id: "local-store",
                          label: lang === "es" ? "Tienda local" : "Local store",
                          hint: lang === "es" ? "Negocios cerca de ti" : "Nearby businesses",
                          href: intentResultsHref({ marketType: "retail", mode: "stores" }),
                          icon: FiShoppingBag,
                        },
                        {
                          id: "local-service",
                          label: lang === "es" ? "Servicio local" : "Local service",
                          hint: lang === "es" ? "Promos de servicios" : "Service promos",
                          href: intentResultsHref({ marketType: "service", mode: "services" }),
                          icon: FiTool,
                        },
                        {
                          id: "food",
                          label: lang === "es" ? "Comida" : "Food",
                          hint: lang === "es" ? "Restaurantes y mercados" : "Restaurants and markets",
                          href: intentResultsHref({ category: "food", mode: "food" }),
                          icon: FiCoffee,
                        },
                      ]
                }
              />

              <LeonixCategoryPartnerSection
                enabled
                lang={lang as V2Lang}
                surface="landing"
                eyebrow={c.sponsorEyebrow}
                title={c.sponsorTitle}
                body={c.sponsorBody}
                supportingLine={c.sponsorSupport}
                chips={[...c.sponsorChips]}
                secondaryCta={{ label: c.sponsorSecondaryCta, href: browseAllHref }}
              />

              {!isCupones ? (
              <LeonixCategoryVisibilityStrip
                lang={lang as V2Lang}
                surface="landing"
                eyebrow={lang === "es" ? "VISIBILIDAD PRINT + DIGITAL" : "PRINT + DIGITAL VISIBILITY"}
                title={lang === "es" ? "Haz que tus ofertas tengan más visibilidad" : "Give your offers more visibility"}
                body={
                  lang === "es"
                    ? "Opciones de revista, digital y destacados se revisan con Leonix. Nada aparece como Destacado sin un paquete activo."
                    : "Print, digital, and featured options are reviewed with Leonix. Nothing is marked Featured without an active package."
                }
                ctaLabel={lang === "es" ? "Conocer opciones de visibilidad" : "Explore visibility options"}
                ctaHref={`/contacto?lang=${lang}&categoria=ofertas-locales&surface=landing`}
              />
              ) : null}
            </main>
          </div>
        )}
        </div>
      </LeonixCategoryPageShell>

      <OfertasLocalesFiltersDrawer
        open={filtersOpen}
        lang={lang}
        c={c}
        city={city}
        state={state}
        zip={zip}
        country={country}
        category={category}
        marketType={marketType}
        offerType={offerType}
        sort={sort}
        onCityChange={setCity}
        onStateChange={setState}
        onZipChange={setZip}
        onCountryChange={setCountry}
        onCategoryChange={setCategory}
        onMarketTypeChange={setMarketType}
        onOfferTypeChange={setOfferType}
        onSortChange={setSort}
        onClose={() => setFiltersOpen(false)}
        onApply={applyDrawerFilters}
        onClear={clearFilters}
        surface={surface}
      />

      {!isCupones && selectedItem ? (
        <OfertasLocalesPublicItemDetailDrawer
          lang={lang}
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          isAdded={shoppingList.isAdded(selectedItem.id)}
          onAdd={shoppingList.addFromPublicItem}
          onRemove={shoppingList.removeItem}
          onOpenList={() => {
            setSelectedItem(null);
            setListOpen(true);
          }}
        />
      ) : null}

      {isCupones && selectedCouponOffer ? (
        <OfertasLocalesPublicOfferDetailDrawer
          lang={lang}
          offer={selectedCouponOffer}
          surface="cupones"
          onClose={() => setSelectedCouponOffer(null)}
        />
      ) : null}

      {!isCupones && listOpen ? (
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

      {floatingShoppingListCart}
    </>
  );
}
