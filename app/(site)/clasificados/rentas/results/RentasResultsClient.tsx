"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { RentasLocationButton } from "@/app/clasificados/rentas/components/RentasLocationButton";
import { RentasSearchBar } from "@/app/clasificados/rentas/components/RentasSearchBar";
import {
  getRentasResultsDemoTotal,
  getRentasResultsGridListings,
} from "@/app/clasificados/rentas/data/rentasPublicData";
import { useRentasLandingLang } from "@/app/clasificados/rentas/hooks/useRentasLandingLang";
import {
  rentasCtaPrimaryClass,
  rentasCtaSecondaryClass,
  rentasLandingHeroPanelClass,
} from "@/app/clasificados/rentas/rentasLandingTheme";
import { RENTAS_LANDING_LANG_QUERY, withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import {
  parseRentasBrowseParams,
  rentasBrowseHasActiveFilters,
} from "@/app/clasificados/rentas/shared/rentasBrowseContract";
import {
  filterRentasPublicListings,
  sortRentasPublicListings,
} from "@/app/clasificados/rentas/shared/rentasBrowseFilters";
import {
  RENTAS_QUERY_BATHS_MIN,
  RENTAS_QUERY_CITY,
  RENTAS_QUERY_PRECIO,
  RENTAS_QUERY_Q,
  RENTAS_QUERY_RECS,
  RENTAS_QUERY_SORT,
  RENTAS_QUERY_TIPO,
  RENTAS_QUERY_ZIP,
} from "@/app/clasificados/rentas/shared/rentasResultsQueryKeys";
import {
  RENTAS_LANDING,
  RENTAS_PREVIEW_NEGOCIO,
  RENTAS_PREVIEW_PRIVADO,
  RENTAS_PUBLICAR_NEGOCIO,
  RENTAS_PUBLICAR_PRIVADO,
  RENTAS_RESULTS,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import { RentasResultCard } from "./cards/RentasResultCard";
import { RentasPropiedadFilterChips } from "./components/RentasPropiedadFilterChips";
import { RentasResultsShell } from "./components/RentasResultsShell";
import { RentasResultsToolbar } from "./components/RentasResultsToolbar";
import { RentasResultsTopBar } from "./components/RentasResultsTopBar";

/** Category-owned results for `/clasificados/rentas/results` — separado de vista previa y del detalle vivo. */
export function RentasResultsClient() {
  const router = useRouter();
  const { copy, lang } = useRentasLandingLang();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceBand, setPriceBand] = useState("");
  const [beds, setBeds] = useState("");
  const [cityDraft, setCityDraft] = useState("");
  const [zipDraft, setZipDraft] = useState("");
  const [bathsMinDraft, setBathsMinDraft] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const resultsQueryString = searchParams?.toString() ?? "";

  const parsed = useMemo(() => parseRentasBrowseParams(searchParams), [searchParams]);

  useEffect(() => {
    const p = parseRentasBrowseParams(searchParams);
    setQuery(p.q);
    setPropertyType(p.tipo);
    setPriceBand(p.precio);
    setBeds(p.recs);
    setCityDraft(p.city);
    setZipDraft(p.zip);
    setBathsMinDraft(p.bathsMin != null ? String(p.bathsMin) : "");
  }, [searchParams]);

  const resultsGrid = useMemo(() => getRentasResultsGridListings(), []);
  const resultsDemoTotal = useMemo(() => getRentasResultsDemoTotal(), []);

  const filteredSorted = useMemo(() => {
    const filtered = filterRentasPublicListings(resultsGrid, parsed);
    return sortRentasPublicListings(filtered, parsed.sort);
  }, [parsed, resultsGrid]);

  const branchFilter = parsed.branch;
  const propiedadFilter: BrNegocioCategoriaPropiedad | null = parsed.propiedad;

  const pushUrl = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(searchParams?.toString() ?? "");
      sp.set(RENTAS_LANDING_LANG_QUERY, lang);
      mutate(sp);
      const qs = sp.toString();
      router.replace(qs ? `${RENTAS_RESULTS}?${qs}` : `${RENTAS_RESULTS}?${RENTAS_LANDING_LANG_QUERY}=${lang}`);
    },
    [lang, router, searchParams]
  );

  const applySearchAndRefine = useCallback(() => {
    pushUrl((sp) => {
      const setOrDel = (k: string, v: string) => {
        if (!v.trim()) sp.delete(k);
        else sp.set(k, v.trim());
      };
      setOrDel(RENTAS_QUERY_Q, query);
      setOrDel(RENTAS_QUERY_TIPO, propertyType);
      setOrDel(RENTAS_QUERY_PRECIO, priceBand);
      setOrDel(RENTAS_QUERY_RECS, beds);
      setOrDel(RENTAS_QUERY_CITY, cityDraft);
      const zipNorm = zipDraft.replace(/\D/g, "").slice(0, 10);
      if (!zipNorm) sp.delete(RENTAS_QUERY_ZIP);
      else sp.set(RENTAS_QUERY_ZIP, zipNorm);
      const bm = bathsMinDraft.trim();
      if (!bm) sp.delete(RENTAS_QUERY_BATHS_MIN);
      else if (Number.isFinite(Number(bm))) sp.set(RENTAS_QUERY_BATHS_MIN, bm);
    });
  }, [bathsMinDraft, beds, cityDraft, priceBand, propertyType, pushUrl, query, zipDraft]);

  const onSort = useCallback(
    (v: string) => {
      pushUrl((sp) => {
        if (!v || v === "reciente") sp.delete(RENTAS_QUERY_SORT);
        else sp.set(RENTAS_QUERY_SORT, v);
      });
    },
    [pushUrl]
  );

  const featuredListing = useMemo((): RentasPublicListing | null => {
    if (!filteredSorted.length) return null;
    const promoted = filteredSorted.find((l) => l.promoted);
    return promoted ?? filteredSorted[0];
  }, [filteredSorted]);

  const displayedListings = useMemo(() => {
    if (view === "list") return filteredSorted.map((l) => ({ ...l, layout: "horizontal" as const }));
    return filteredSorted.map((l) => ({ ...l, layout: l.layout ?? ("vertical" as const) }));
  }, [filteredSorted, view]);

  const hasActiveBrowse = rentasBrowseHasActiveFilters(parsed);
  const totalLabel = hasActiveBrowse ? filteredSorted.length : resultsDemoTotal;
  const showingTo = displayedListings.length ? Math.min(20, displayedListings.length) : 0;

  const propiedadLabel =
    propiedadFilter === "residencial"
      ? copy.quickExplore.chipResidencial
      : propiedadFilter === "comercial"
        ? copy.quickExplore.chipComercial
        : propiedadFilter === "terreno_lote"
          ? copy.quickExplore.chipTerreno
          : null;

  const sortValue = parsed.sort || "reciente";

  return (
    <RentasResultsShell>
      <RentasResultsTopBar copy={copy} lang={lang} />

      <div className={rentasLandingHeroPanelClass}>
        <div className="max-w-3xl">
          <h1 className="font-serif text-[2.1rem] font-semibold leading-tight tracking-tight text-[#1E1810] sm:text-[2.65rem]">
            {copy.title}
          </h1>
          <p className="mt-3 text-base text-[#3D3830]/92 sm:text-lg">
            {copy.results.introPart1}
            {copy.results.introPart2}
            <Link href={withRentasLandingLang(RENTAS_PREVIEW_PRIVADO, lang)} className="font-semibold text-[#C45C26] underline decoration-[#C45C26]/35">
              {copy.card.sellerPrivado}
            </Link>{" "}
            /{" "}
            <Link href={withRentasLandingLang(RENTAS_PREVIEW_NEGOCIO, lang)} className="font-semibold text-[#C45C26] underline decoration-[#C45C26]/35">
              {copy.card.sellerNegocio}
            </Link>
            .
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link href={withRentasLandingLang(RENTAS_PUBLICAR_PRIVADO, lang)} className={rentasCtaPrimaryClass}>
            {copy.publishPrivado}
          </Link>
          <Link href={withRentasLandingLang(RENTAS_PUBLICAR_NEGOCIO, lang)} className={rentasCtaSecondaryClass}>
            {copy.publishNegocio}
          </Link>
        </div>
      </div>

      <div className="relative z-[2] mx-auto mt-2 w-full max-w-[min(100%,1200px)] sm:-mt-6 lg:-mt-8 xl:max-w-[min(100%,1280px)]">
        <RentasSearchBar
          query={query}
          onQuery={setQuery}
          propertyType={propertyType}
          onPropertyType={setPropertyType}
          priceBand={priceBand}
          onPriceBand={setPriceBand}
          beds={beds}
          onBeds={setBeds}
          onSearch={applySearchAndRefine}
          copy={copy.search}
          priceOptions={copy.priceOptions}
        />

        <div className="mt-5 rounded-2xl border border-[#E4D9C8]/90 bg-[#FDFBF7]/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5B7C99]/85">{copy.results.filterRefine}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="min-w-0">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.cityLabel}</span>
              <input
                value={cityDraft}
                onChange={(e) => setCityDraft(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[#D4CBC0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18"
                autoComplete="address-level2"
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.zipLabel}</span>
              <input
                value={zipDraft}
                onChange={(e) => setZipDraft(e.target.value)}
                inputMode="numeric"
                className="min-h-[44px] w-full rounded-xl border border-[#D4CBC0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18"
                autoComplete="postal-code"
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.bathsMinLabel}</span>
              <select
                value={bathsMinDraft}
                onChange={(e) => setBathsMinDraft(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[#D4CBC0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18"
              >
                <option value="">{copy.results.bathsAny}</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
            </label>
            <div className="flex min-h-[44px] items-end">
              <button
                type="button"
                onClick={applySearchAndRefine}
                className="w-full rounded-full border-2 border-[#C45C26]/40 bg-[#C45C26] px-4 py-2.5 text-sm font-semibold text-[#FFFBF7] shadow-[0_6px_18px_-8px_rgba(196,92,38,0.45)] transition hover:border-[#C45C26]/55"
              >
                {copy.results.applyFilters}
              </button>
            </div>
          </div>
          <div className="mt-4">
            <RentasLocationButton lang={lang} copy={copy.results} baseQueryString={resultsQueryString} />
          </div>
        </div>

        <RentasPropiedadFilterChips active={propiedadFilter} lang={lang} copy={copy} queryString={resultsQueryString} />
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="w-full text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">
            {copy.results.branchLabel}
          </span>
          {(
            [
              { id: "all" as const, label: copy.results.branchAll },
              { id: "privado" as const, label: copy.results.branchPrivado },
              { id: "negocio" as const, label: copy.results.branchNegocio },
            ] as const
          ).map((opt) => {
            const isOn = branchFilter === opt.id;
            const sp = new URLSearchParams(searchParams?.toString() ?? "");
            sp.set(RENTAS_LANDING_LANG_QUERY, lang);
            if (opt.id === "all") sp.delete("branch");
            else sp.set("branch", opt.id);
            const href = `${RENTAS_RESULTS}?${sp.toString()}`;
            return (
              <Link
                key={opt.id}
                href={href}
                scroll={false}
                className={
                  "inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-xs font-semibold transition sm:min-h-0 sm:text-sm " +
                  (isOn
                    ? "border-[#C45C26]/45 bg-[#C45C26] text-[#FFFBF7] shadow-[0_6px_18px_-8px_rgba(196,92,38,0.5)]"
                    : "border-[#C9D4E0]/85 bg-gradient-to-b from-[#FBFCFE] to-[#F4F7FA] text-[#3D3630] hover:border-[#5B7C99]/35")
                }
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      </div>

      <RentasResultsToolbar
        copy={copy.results}
        lang={lang}
        showingFrom={displayedListings.length ? 1 : 0}
        showingTo={showingTo}
        total={totalLabel}
        sort={sortValue}
        onSort={onSort}
        view={view}
        onView={setView}
      />

      {featuredListing ? (
        <section className="mt-10" aria-labelledby="rentas-feat-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[#E4D9C8]/80 pb-3">
            <h2 id="rentas-feat-heading" className="font-serif text-xl font-semibold tracking-tight text-[#1E1810] sm:text-2xl">
              {copy.results.featuredHeadingDemo}
            </h2>
            {propiedadFilter ? <p className="text-xs text-[#5C5346]/75">{propiedadLabel}</p> : null}
          </div>
          <RentasResultCard listing={{ ...featuredListing, layout: "horizontal" }} copy={copy} lang={lang} />
        </section>
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-[#E8DFD0] bg-[#FDFBF7]/80 p-6 text-center text-sm text-[#5C5346]">
          {copy.results.noFeatured}
        </p>
      )}

      <section className="mt-14 border-t border-[#E8DFD0]/90 pt-10" aria-labelledby="rentas-grid-heading">
        <h2 id="rentas-grid-heading" className="font-serif text-xl font-semibold tracking-tight text-[#1E1810] sm:text-2xl">
          {copy.results.moreRentals}
        </h2>
        {displayedListings.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-[#E8DFD0] bg-[#FDFBF7]/90 p-6 text-center text-sm text-[#5C5346]">
            {copy.results.noMatches}{" "}
            <Link href={withRentasLandingLang(RENTAS_RESULTS, lang)} className="font-semibold text-[#B8954A] underline">
              {copy.results.clearFiltersDemo}
            </Link>
          </p>
        ) : view === "list" ? (
          <div className="mt-7 flex flex-col gap-6">
            {displayedListings.map((l) => (
              <RentasResultCard key={l.id} listing={l} copy={copy} lang={lang} />
            ))}
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-8 xl:grid-cols-3">
            {displayedListings.map((l) => (
              <RentasResultCard key={l.id} listing={l} copy={copy} lang={lang} />
            ))}
          </div>
        )}
      </section>

      <footer className="mt-14 border-t border-[#D4C4A8]/50 pt-8 text-center text-sm text-[#4A4338]/88">
        <Link href={withRentasLandingLang(RENTAS_LANDING, lang)} className="font-semibold text-[#C45C26] underline decoration-[#C45C26]/35">
          {copy.results.backToHub}
        </Link>
      </footer>
    </RentasResultsShell>
  );
}
