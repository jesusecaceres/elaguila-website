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
import { CATEGORY_STANDARD_MAIN } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
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
/** Rentas/Bienes shell — warm Leonix city-living atmosphere, wide premium gateway lane. */
const OFERTAS_LOCALES_SHELL = "relative min-h-screen overflow-x-hidden bg-[#F3EBDD] text-[#1F241C]";
const OFERTAS_LOCALES_HEADER_SAFE_TOP = "pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-12 lg:pt-14";
const OFERTAS_LOCALES_LANDING_LANE = "mx-auto w-full min-w-0 max-w-[1280px]";
const OFERTAS_LOCALES_RESULTS_SHELL = "relative mx-auto w-full min-w-0 max-w-[1280px] px-3.5 pb-12 sm:px-4 lg:px-5";

/** Rentas/Bienes search shell — landing + results DNA */
const OFERTAS_LOCALES_SEARCH_SHELL =
  "relative w-full rounded-xl bg-white/96 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_28px_-16px_rgba(42,36,22,0.18)] ring-1 ring-[#C9A84A]/30 sm:p-4 sm:rounded-2xl";
const OFERTAS_LOCALES_SEARCH_GLOW =
  "pointer-events-none absolute -inset-px rounded-xl bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(201,168,74,0.2),transparent_60%)] sm:rounded-2xl";
const OFERTAS_LOCALES_SEARCH_FIELD =
  "flex min-h-[3rem] min-w-0 items-center rounded-xl border border-[#D6C7AD]/75 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_2px_8px_-6px_rgba(42,36,22,0.12)] sm:min-h-[3.125rem]";
const OFERTAS_LOCALES_SEARCH_INPUT =
  "min-h-[3rem] min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[0.9375rem] text-[#1F241C] outline-none placeholder:text-[#3D3428]/50 focus-visible:ring-0 sm:min-h-[3.125rem] sm:text-base";
const OFERTAS_LOCALES_BTN_PRIMARY =
  "inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[#7A1E2C] px-5 text-sm font-bold text-[#FFFDF7] shadow-[0_6px_20px_-8px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 sm:min-h-[3.125rem] sm:text-[0.9375rem]";
const OFERTAS_LOCALES_BTN_SECONDARY =
  "inline-flex min-h-[3rem] items-center justify-center gap-1.5 rounded-xl border border-[#C9A84A]/60 bg-[#FFFDF7] px-4 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/35 sm:min-h-[3.125rem]";
const OFERTAS_LOCALES_CHIP =
  "inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536] transition hover:border-[#C9A84A]/65 hover:from-[#FFFDF7] hover:to-[#FFF9F0] hover:shadow-[0_4px_14px_-8px_rgba(122,30,44,0.18)]";
const OFERTAS_LOCALES_ACTIVE_FILTER_CHIP =
  "inline-flex max-w-full items-center rounded-full border border-[#D6C7AD]/70 bg-white px-3 py-1 text-xs font-semibold text-[#2A4536] shadow-sm";

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

  return (
    <div className={OFERTAS_LOCALES_SHELL}>
      {/* Rentas/Bienes subtle texture */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_110%_75%_at_50%_-8%,rgba(201,168,74,0.22),transparent_52%),radial-gradient(ellipse_65%_45%_at_100%_0%,rgba(85,107,62,0.1),transparent_48%),radial-gradient(ellipse_60%_40%_at_0%_25%,rgba(122,30,44,0.06),transparent_42%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg,#2A4536 0px,#2A4536 1px,transparent 1px,transparent 52px),repeating-linear-gradient(0deg,#2A4536 0px,#2A4536 1px,transparent 1px,transparent 52px)",
        }}
        aria-hidden
      />

      <div className={`${isResults ? OFERTAS_LOCALES_RESULTS_SHELL : OFERTAS_LOCALES_LANDING_LANE} ${OFERTAS_LOCALES_HEADER_SAFE_TOP} relative`}>
        {isResults ? (
          <Link
            href={`${OFERTAS_LOCALES_LANDING_PATH}?lang=${lang}`}
            className="mb-2 inline-flex text-[11px] font-semibold text-[#556B3E] hover:text-[#7A1E2C] sm:text-sm"
          >
            {lang === "es" ? "← Ofertas Locales" : "← Local Deals"}
          </Link>
        ) : null}

        {/* Rentas/Bienes gateway panel */}
        <section className="mb-4 sm:mb-6" aria-labelledby="ofertas-hero-title">
          <div className="relative w-full overflow-hidden rounded-xl border border-[#C9A84A]/40 bg-[#FFFDF7]/88 shadow-[0_16px_48px_-24px_rgba(42,36,22,0.28)] backdrop-blur-[2px] px-4 py-6 sm:rounded-2xl sm:px-7 sm:py-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#C9A84A]/45 bg-white/90 text-[#2A4536] shadow-[0_8px_28px_-10px_rgba(201,168,74,0.45)]">
                <TagIcon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">{c.heroEyebrow}</p>
                <h1 id="ofertas-hero-title" className="mt-2 font-serif text-[2.1rem] font-bold leading-[1.1] text-[#2A4536] sm:text-[2.5rem] lg:text-[2.65rem]">
                  {c.heroTitle}
                </h1>
                <p className="mt-2 font-serif text-lg font-semibold italic text-[#7A1E2C] sm:text-xl">{c.heroTagline}</p>
                <p className="mt-3 max-w-3xl text-[0.9375rem] leading-relaxed text-[#3D3428] sm:text-base">{c.heroIntro}</p>
                <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#5C5346]">{c.heroHelper}</p>
              </div>
            </div>

            {/* Search shell integrated into gateway */}
            <div className="relative mt-5 min-w-0 sm:mt-6">
              <div className={OFERTAS_LOCALES_SEARCH_SHELL}>
                <div className={OFERTAS_LOCALES_SEARCH_GLOW} aria-hidden />
                <form onSubmit={onSubmit} role="search">
                  <div className="relative grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-12 sm:items-stretch">
                    <label className={`${OFERTAS_LOCALES_SEARCH_FIELD} sm:col-span-5`}>
                      <span className="shrink-0 pl-3.5 text-[#556B3E]" aria-hidden>
                        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx={11} cy={11} r={7} />
                          <path d="M20 20l-3-3" strokeLinecap="round" />
                        </svg>
                      </span>
                      <input
                        className={`${OFERTAS_LOCALES_SEARCH_INPUT} font-medium`}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={c.searchPlaceholderCompact}
                        aria-label={c.mobileSearchLabel}
                        autoComplete="off"
                      />
                    </label>
                    <label className={`${OFERTAS_LOCALES_SEARCH_FIELD} sm:col-span-2`}>
                      <input
                        className={OFERTAS_LOCALES_SEARCH_INPUT}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={c.cityPlaceholder}
                        aria-label={c.cityLabel}
                        autoComplete="address-level2"
                      />
                    </label>
                    <label className={`${OFERTAS_LOCALES_SEARCH_FIELD} sm:col-span-2`}>
                      <OfertaLocalRegionStateInput
                        country={country || OFERTA_LOCAL_DEFAULT_COUNTRY}
                        value={state}
                        onChange={setState}
                        inputClassName={OFERTAS_LOCALES_SEARCH_INPUT}
                        lang={lang}
                        usPlaceholder={c.statePlaceholder}
                        intlPlaceholder={c.statePlaceholder}
                      />
                    </label>
                    <label className={`${OFERTAS_LOCALES_SEARCH_FIELD} sm:col-span-1`}>
                      <OfertaLocalPostalInput
                        value={zip}
                        onChange={setZip}
                        inputClassName={`${OFERTAS_LOCALES_SEARCH_INPUT} px-2 text-center`}
                        placeholder={c.zipPlaceholder}
                        aria-label={c.zipLabel}
                      />
                    </label>
                    <div className="hidden sm:col-span-2 sm:block">
                      <button type="submit" className={`${OFERTAS_LOCALES_BTN_PRIMARY} w-full`} disabled={loading}>
                        {loading ? c.searching : c.searchButton}
                      </button>
                    </div>
                  </div>

                  <div className="relative mt-3 grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-12 sm:items-stretch">
                    <label className={`${OFERTAS_LOCALES_SEARCH_FIELD} sm:col-span-4`}>
                      <span className="sr-only">{c.countryLabel}</span>
                      <span className="hidden shrink-0 pl-3 text-[10px] font-bold uppercase tracking-wide text-[#556B3E]/80 sm:inline" aria-hidden>
                        {c.countryLabel}
                      </span>
                      <input
                        className={OFERTAS_LOCALES_SEARCH_INPUT}
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder={c.countryPlaceholder}
                        aria-label={c.countryLabel}
                        autoComplete="country-name"
                      />
                    </label>
                    <div className="sm:col-span-3">
                      <button type="button" className={`${OFERTAS_LOCALES_BTN_SECONDARY} w-full`} onClick={() => setFiltersOpen(true)}>
                        <svg className="h-4 w-4 shrink-0 text-[#556B3E]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx={12} cy={12} r={3} />
                          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                        </svg>
                        {c.filtersButton}
                      </button>
                    </div>
                    <Link href={browseAllHref} className={`${OFERTAS_LOCALES_BTN_SECONDARY} sm:col-span-5 inline-flex w-full items-center justify-center`}>
                      {c.browseAllDeals}
                    </Link>
                    <button type="submit" className={`${OFERTAS_LOCALES_BTN_PRIMARY} w-full sm:hidden`} disabled={loading}>
                      {loading ? c.searching : c.searchButton}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Sponsor lane - landing only, compact Rentas/Bienes rhythm */}
        {!isResults ? (
          <section
            className="mb-4 rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)] px-4 py-5 sm:mb-6 sm:px-6 sm:py-6"
            aria-labelledby="ofertas-sponsors-title"
          >
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{c.sponsorEyebrow}</p>
            <h2 id="ofertas-sponsors-title" className="mt-2 font-serif text-xl font-bold leading-snug text-[#2A4536] sm:text-2xl">
              {c.sponsorTitle}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{c.sponsorBody}</p>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#5C5346] sm:text-sm">{c.sponsorSupport}</p>

            <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
              {c.sponsorChips.map((chip) => (
                <span
                  key={chip}
                  className={OFERTAS_LOCALES_CHIP}
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link href={publishHref} className={`${OFERTAS_LOCALES_BTN_PRIMARY} w-full sm:w-auto`}>
                {c.sponsorPrimaryCta}
              </Link>
              <Link href={browseAllHref} className={`${OFERTAS_LOCALES_BTN_SECONDARY} w-full sm:w-auto`}>
                {c.sponsorSecondaryCta}
              </Link>
            </div>
          </section>
        ) : null}

        {/* Discovery/shortcut section - landing only, using real offerType fields, Rentas/Bienes section rhythm */}
        {!isResults ? (
          <section
            className="mb-4 rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)] px-4 py-5 sm:mb-6 sm:px-6 sm:py-6"
            aria-labelledby="ofertas-discovery-title"
          >
            <h2 id="ofertas-discovery-title" className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">
              {c.discoveryTitle}
            </h2>
            <p className="mt-1 text-xs text-[#5C5346]/85">{c.discoverySubtitle}</p>
            <div className="mt-3.5 flex flex-wrap gap-2 sm:gap-2.5">
              <Link
                href={`${browseAllHref}&offerType=weekly_flyer`}
                className={OFERTAS_LOCALES_CHIP}
              >
                {lang === "es" ? "Volante semanal" : "Weekly flyer"}
              </Link>
              <Link
                href={`${browseAllHref}&offerType=coupon`}
                className={OFERTAS_LOCALES_CHIP}
              >
                {lang === "es" ? "Cupón" : "Coupon"}
              </Link>
              <Link
                href={`${browseAllHref}&offerType=promotion`}
                className={OFERTAS_LOCALES_CHIP}
              >
                {lang === "es" ? "Promoción" : "Promotion"}
              </Link>
              <Link
                href={`${browseAllHref}&offerType=seasonal_special`}
                className={OFERTAS_LOCALES_CHIP}
              >
                {lang === "es" ? "Especial de temporada" : "Seasonal special"}
              </Link>
              <Link
                href={`${browseAllHref}&offerType=bundle`}
                className={OFERTAS_LOCALES_CHIP}
              >
                {lang === "es" ? "Paquete / combo" : "Bundle"}
              </Link>
              <Link
                href={`${browseAllHref}&offerType=featured_deal`}
                className={OFERTAS_LOCALES_CHIP}
              >
                {lang === "es" ? "Oferta destacada" : "Featured deal"}
              </Link>
            </div>
          </section>
        ) : null}


        {/* Active filters - Rentas/Bienes style */}
        {hasFilters ? (
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-[#C9A84A]/30 bg-[#FFFDF7]/90 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2 sm:px-5">
            {q ? (
              <button type="button" className={OFERTAS_LOCALES_ACTIVE_FILTER_CHIP} onClick={() => pushSearch({ q: "" })}>
                {lang === "es" ? "Quitar palabra clave" : "Remove keyword"} ×
              </button>
            ) : null}
            {city ? (
              <button type="button" className={OFERTAS_LOCALES_ACTIVE_FILTER_CHIP} onClick={() => pushSearch({ city: "" })}>
                {city} ×
              </button>
            ) : null}
            {state ? (
              <button type="button" className={OFERTAS_LOCALES_ACTIVE_FILTER_CHIP} onClick={() => pushSearch({ state: "" })}>
                {state} ×
              </button>
            ) : null}
            {zip ? (
              <button type="button" className={OFERTAS_LOCALES_ACTIVE_FILTER_CHIP} onClick={() => pushSearch({ zip: "" })}>
                {zip} ×
              </button>
            ) : null}
            {country ? (
              <button type="button" className={OFERTAS_LOCALES_ACTIVE_FILTER_CHIP} onClick={() => pushSearch({ country: "" })}>
                {country} ×
              </button>
            ) : null}
            {category ? (
              <button type="button" className={OFERTAS_LOCALES_ACTIVE_FILTER_CHIP} onClick={() => pushSearch({ category: "" })}>
                {category} ×
              </button>
            ) : null}
            {marketType ? (
              <button type="button" className={OFERTAS_LOCALES_ACTIVE_FILTER_CHIP} onClick={() => pushSearch({ marketType: "" })}>
                {marketType} ×
              </button>
            ) : null}
            {offerType ? (
              <button type="button" className={OFERTAS_LOCALES_ACTIVE_FILTER_CHIP} onClick={() => pushSearch({ offerType: "" })}>
                {offerType} ×
              </button>
            ) : null}
            <button type="button" className={OFERTAS_LOCALES_ACTIVE_FILTER_CHIP} onClick={clearFilters}>
              {c.clearFiltersLink}
            </button>
          </div>
        ) : null}

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
            <button type="button" className={`${OFERTAS_LOCALES_BTN_SECONDARY} w-full sm:w-auto`} onClick={clearFilters}>
              {c.clearFiltersLink}
            </button>
            {listHasItems ? (
              <button type="button" className={`${OFERTAS_LOCALES_BTN_SECONDARY} w-full sm:w-auto`} onClick={() => setListOpen(true)}>
                {c.listButton}
                <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-md bg-[#7A1E2C] px-1.5 py-0.5 text-[11px] font-bold text-[#FFFDF7]">
                  {shoppingList.counts.itemCount}
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

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
    </div>
  );
}
