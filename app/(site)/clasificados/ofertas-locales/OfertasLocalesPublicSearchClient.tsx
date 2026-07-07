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
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryCta,
  LeonixCategoryPartnerSection,
  LeonixCategoryShortcutSection,
  LeonixCategoryActiveFilters,
  type Lang as V2Lang,
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

export function OfertasLocalesPublicSearchClient({
  mode = "landing",
}: {
  mode?: OfertasLocalesPublicSearchMode;
}) {
  const isResults = mode === "results";
  const browsePath = OFERTAS_LOCALES_RESULTS_PATH;
  const clearPath = isResults ? OFERTAS_LOCALES_RESULTS_PATH : OFERTAS_LOCALES_LANDING_PATH;
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = parseLang(searchParams?.get("lang") ?? null);
  const c = ofertasLocalesPublicSearchCopy(lang);

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
    setState(searchParams?.get("state") ?? "");
    setZip(searchParams?.get("zip") ?? "");
    setCountry(searchParams?.get("country") ?? "");
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
      if (next.offerType.trim()) params.set("offerType", next.offerType.trim());
      if (next.sort && next.sort !== "newest") params.set("sort", next.sort);
      router.push(`${OFERTAS_LOCALES_RESULTS_PATH}?${params.toString()}`);
    },
    [router, lang, q, city, state, zip, country, category, marketType, offerType, sort]
  );

  const browseAllHref = `${browsePath}?lang=${lang}`;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    pushSearch();
  };

  const publishHref = `/publicar/ofertas-locales?lang=${lang}`;
  const hasFilters = Boolean(q || city || state || zip || country || category || marketType || offerType || (sort && sort !== "newest"));
  const showPipelineEmpty = !loading && offers.length === 0 && items.length === 0 && !hasFilters;
  const listHasItems = shoppingList.counts.itemCount > 0;
  const resultCount = offers.length + items.length;

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

  const landingSearchForm = (
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

  return (
    <>
      <LeonixCategoryPageShell surface={isResults ? "results" : "landing"}>
        {isResults ? (
          <Link
            href={`${OFERTAS_LOCALES_LANDING_PATH}?lang=${lang}`}
            className="mb-2 inline-flex text-[11px] font-semibold text-[#556B3E] hover:text-[#7A1E2C] sm:text-sm"
          >
            {lang === "es" ? "← Ofertas Locales" : "← Local Deals"}
          </Link>
        ) : null}

        <LeonixCategoryHeroGateway
          lang={lang as V2Lang}
          surface={isResults ? "results" : "landing"}
          title={c.heroTitle}
          tagline={c.heroTagline}
          intro={c.heroIntro}
          introSecondary={c.heroHelper}
          searchSlot={landingSearchForm}
          eyebrow={c.heroEyebrow}
        />

        <main className="mx-auto max-w-[1280px] space-y-6 overflow-x-hidden px-3.5 pb-14 sm:px-4 sm:space-y-8 lg:px-5">
          {/* Sponsor lane - landing only */}
          <LeonixCategoryPartnerSection
          enabled={!isResults}
          lang={lang as V2Lang}
          surface={isResults ? "results" : "landing"}
          eyebrow={c.sponsorEyebrow}
          title={c.sponsorTitle}
          body={c.sponsorBody}
          supportingLine={c.sponsorSupport}
          chips={[...c.sponsorChips]}
          primaryCta={{ label: c.sponsorPrimaryCta, href: publishHref }}
          secondaryCta={{ label: c.sponsorSecondaryCta, href: browseAllHref }}
        />

        {/* Discovery/shortcut section - landing only */}
        <LeonixCategoryShortcutSection
          lang={lang as V2Lang}
          surface={isResults ? "results" : "landing"}
          title={c.discoveryTitle}
          subtitle={c.discoverySubtitle}
          variant="default"
          chips={[
            { id: "weekly_flyer", label: lang === "es" ? "Volante semanal" : "Weekly flyer", href: `${browseAllHref}&offerType=weekly_flyer` },
            { id: "coupon", label: lang === "es" ? "Cupón" : "Coupon", href: `${browseAllHref}&offerType=coupon` },
            { id: "promotion", label: lang === "es" ? "Promoción" : "Promotion", href: `${browseAllHref}&offerType=promotion` },
            { id: "seasonal_special", label: lang === "es" ? "Especial de temporada" : "Seasonal special", href: `${browseAllHref}&offerType=seasonal_special` },
            { id: "bundle", label: lang === "es" ? "Paquete / combo" : "Bundle", href: `${browseAllHref}&offerType=bundle` },
            { id: "featured_deal", label: lang === "es" ? "Oferta destacada" : "Featured deal", href: `${browseAllHref}&offerType=featured_deal` },
          ]}
        />


        {/* Active filters */}
        <LeonixCategoryActiveFilters
          label={lang === "es" ? "Filtros activos" : "Active filters"}
          chips={[
            ...(q ? [{ id: "q", label: lang === "es" ? "Quitar palabra clave" : "Remove keyword", onClear: () => pushSearch({ q: "" }) }] : []),
            ...(city ? [{ id: "city", label: city, onClear: () => pushSearch({ city: "" }) }] : []),
            ...(state ? [{ id: "state", label: state, onClear: () => pushSearch({ state: "" }) }] : []),
            ...(zip ? [{ id: "zip", label: zip, onClear: () => pushSearch({ zip: "" }) }] : []),
            ...(country ? [{ id: "country", label: country, onClear: () => pushSearch({ country: "" }) }] : []),
            ...(category ? [{ id: "category", label: category, onClear: () => pushSearch({ category: "" }) }] : []),
            ...(marketType ? [{ id: "marketType", label: marketType, onClear: () => pushSearch({ marketType: "" }) }] : []),
            ...(offerType ? [{ id: "offerType", label: offerType, onClear: () => pushSearch({ offerType: "" }) }] : []),
          ]}
          clearAllLabel={c.clearFiltersLink}
          onClearAll={clearFilters}
        />

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
            <div id="ofertas-browse" className="mt-4 scroll-mt-24 rounded-xl border border-[#D6C7AD]/70 bg-[#FFFDF7] px-4 py-4 text-center">
              <p className="text-sm font-semibold text-[#3D3428]">{c.pipelineEmptyTitle}</p>
              <p className="mt-1 text-xs text-[#3D3428]/70">{c.pipelineEmptyBody}</p>
              <div className="mt-3">
                <Link href={browseAllHref} className="inline-block text-xs font-semibold text-[#B8954A] underline">
                  {c.browseAllDeals}
                </Link>
              </div>
            </div>
          ) : null}

          {!loading && !showPipelineEmpty && offers.length === 0 && items.length === 0 ? (
            <div className="mt-4 rounded-xl border border-[#D6C7AD]/70 bg-[#FFFDF7] px-4 py-4 text-center">
              <p className="text-sm font-semibold text-[#3D3428]">{c.emptyTitle}</p>
              <p className="mt-1 text-xs text-[#3D3428]/70">{c.emptyHint}</p>
              {hasFilters ? (
                <div className="mt-3">
                  <button type="button" className="inline-block text-xs font-semibold text-[#B8954A] underline" onClick={clearFilters}>
                    {c.clearFiltersLink}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div id="ofertas-browse" className="scroll-mt-24">
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
          </div>

          {/* Results CTAs - clear filters and shopping list on results */}
          {isResults && hasFilters ? (
            <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:flex-wrap">
              <LeonixCategoryCta variant="secondary" onClick={clearFilters}>
                {c.clearFiltersLink}
              </LeonixCategoryCta>
              {listHasItems ? (
                <LeonixCategoryCta variant="secondary" onClick={() => setListOpen(true)}>
                  {c.listButton}
                  <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-md bg-[#7A1E2C] px-1.5 py-0.5 text-[11px] font-bold text-[#FFFDF7]">
                    {shoppingList.counts.itemCount}
                  </span>
                </LeonixCategoryCta>
              ) : null}
            </div>
          ) : null}
        </main>
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
    </>
  );
}
