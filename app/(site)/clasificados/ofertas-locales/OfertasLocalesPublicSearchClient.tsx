"use client";

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
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryCta,
  LeonixCategoryPartnerSection,
  LeonixCategoryShortcutSection,
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
      router.push(`${resultsPath}?${params.toString()}`);
    },
    [router, lang, q, city, state, zip, country, category, marketType, offerType, sort, isCupones, resultsPath]
  );

  const browseAllHref = `${browsePath}?lang=${lang}`;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    pushSearch();
  };

  const publishHref = isCupones
    ? `/publicar/ofertas-locales?lang=${lang}&product=coupon_promotion`
    : `/publicar/ofertas-locales?lang=${lang}`;
  const hasFilters = Boolean(q || city || state || zip || country || category || marketType || offerType || (sort && sort !== "newest"));
  const showPipelineEmpty = !loading && offers.length === 0 && items.length === 0 && !hasFilters;
  const listHasItems = !isCupones && shoppingList.counts.itemCount > 0;
  const resultCount = offers.length + items.length;
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

  const resultsContent = (
    <div id="ofertas-browse" className="scroll-mt-24 space-y-5">
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <p className="text-sm text-[#3D3428]/65">{c.searching}</p> : null}

      {!loading && offers.length > 0 ? (
        <section>
          <h2 className="mb-2 font-serif text-base font-bold text-[#2A4536] sm:text-lg">{c.offersSectionTitle}</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] sm:gap-4">
            {offers.map((offer) => (
              <li key={offer.id}>
                <OfertasLocalesPublicOfferCard lang={lang} offer={offer} surface={surface} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!loading && listHasItems ? (
        <div className="flex justify-end">
          <LeonixCategoryCta variant="secondary" onClick={() => setListOpen(true)}>
            {c.listButton}
            <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-md bg-[#7A1E2C] px-1.5 py-0.5 text-[11px] font-bold text-[#FFFDF7]">
              {shoppingList.counts.itemCount}
            </span>
          </LeonixCategoryCta>
        </div>
      ) : null}

      {!isCupones && !loading && items.length > 0 ? (
        <section>
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
    </div>
  );

  return (
    <>
      <LeonixCategoryPageShell surface={isResults ? "results" : "landing"}>
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
                title={showPipelineEmpty ? c.pipelineEmptyTitle : c.emptyTitle}
                body={showPipelineEmpty ? c.pipelineEmptyBody : c.emptyHint}
                ctaLabel={hasFilters ? c.clearFiltersLink : c.browseAllDeals}
                ctaHref={hasFilters ? undefined : browseAllHref}
              />
            }
            hasResults={loading || resultCount > 0 || Boolean(error)}
          >
            {resultsContent}
          </LeonixCategoryResultsShell>
        ) : (
          <>
            {hero}
            <main className="mx-auto max-w-[1280px] space-y-6 overflow-x-hidden px-3.5 pb-14 sm:px-4 sm:space-y-8 lg:px-5">
              <LeonixCategoryPartnerSection
                enabled
                lang={lang as V2Lang}
                surface="landing"
                eyebrow={c.sponsorEyebrow}
                title={c.sponsorTitle}
                body={c.sponsorBody}
                supportingLine={c.sponsorSupport}
                chips={[...c.sponsorChips]}
                primaryCta={{ label: c.sponsorPrimaryCta, href: publishHref }}
                secondaryCta={{ label: c.sponsorSecondaryCta, href: browseAllHref }}
              />

              <LeonixCategoryShortcutSection
                lang={lang as V2Lang}
                surface="landing"
                title={c.discoveryTitle}
                subtitle={c.discoverySubtitle}
                variant="default"
                chips={[
                  ...(isCupones
                    ? [
                        { id: "offerType:coupon", label: lang === "es" ? "Cupón" : "Coupon", href: `${browseAllHref}&offerType=coupon` },
                        { id: "offerType:promotion", label: lang === "es" ? "Promoción" : "Promotion", href: `${browseAllHref}&offerType=promotion` },
                        { id: "offerType:seasonal_special", label: lang === "es" ? "Especial de temporada" : "Seasonal special", href: `${browseAllHref}&offerType=seasonal_special` },
                        { id: "offerType:bundle", label: lang === "es" ? "Combo" : "Bundle", href: `${browseAllHref}&offerType=bundle` },
                        { id: "offerType:featured_deal", label: lang === "es" ? "Oferta destacada" : "Featured deal", href: `${browseAllHref}&offerType=featured_deal` },
                        { id: "category:restaurant", label: lang === "es" ? "Restaurantes" : "Restaurants", href: `${browseAllHref}&category=restaurant` },
                      ]
                    : [
                        { id: "offerType:weekly_flyer", label: lang === "es" ? "Volante semanal" : "Weekly flyer", href: `${browseAllHref}&offerType=weekly_flyer` },
                        { id: "offerType:coupon", label: lang === "es" ? "Cupón" : "Coupon", href: `${browseAllHref}&offerType=coupon` },
                        { id: "offerType:promotion", label: lang === "es" ? "Promoción" : "Promotion", href: `${browseAllHref}&offerType=promotion` },
                        { id: "marketType:retail", label: lang === "es" ? "Tienda local" : "Local retail", href: `${browseAllHref}&marketType=retail` },
                        { id: "marketType:service", label: lang === "es" ? "Servicio local" : "Local service", href: `${browseAllHref}&marketType=service` },
                        { id: "category:food", label: lang === "es" ? "Comida" : "Food", href: `${browseAllHref}&category=food` },
                      ]),
                ]}
              />
            </main>
          </>
        )}
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
    </>
  );
}
