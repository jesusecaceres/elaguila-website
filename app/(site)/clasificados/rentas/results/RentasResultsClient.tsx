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
import { useRentasLandingLang } from "@/app/clasificados/rentas/hooks/useRentasLandingLang";
import { useRentasStagedInventory } from "@/app/clasificados/rentas/hooks/useRentasStagedInventory";
import {
  rentasCtaPrimaryClass,
  rentasCtaSecondaryClass,
  rentasLandingHeroPanelClass,
  rentasResultsFilterCardClass,
} from "@/app/clasificados/rentas/rentasLandingTheme";
import { RENTAS_LANDING_LANG_QUERY, withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import {
  parseRentasBrowseParams,
  RENTAS_RESULTS_PAGE_SIZE,
} from "@/app/clasificados/rentas/shared/rentasBrowseContract";
import { normalizeCityForBrowse, normalizeZipForBrowse } from "@/app/clasificados/rentas/shared/rentasLocationNormalize";
import {
  filterRentasPublicListings,
  sortRentasPublicListings,
} from "@/app/clasificados/rentas/shared/rentasBrowseFilters";
import {
  RENTAS_QUERY_AMUEBLADO,
  RENTAS_QUERY_BATHS_MIN,
  RENTAS_QUERY_CITY,
  RENTAS_QUERY_MASCOTAS,
  RENTAS_QUERY_PAGE,
  RENTAS_QUERY_PRECIO,
  RENTAS_QUERY_Q,
  RENTAS_QUERY_RECS,
  RENTAS_QUERY_RENT_MAX,
  RENTAS_QUERY_RENT_MIN,
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
import { RentasResultsActiveFilters } from "./components/RentasResultsActiveFilters";
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
  const [rentMinDraft, setRentMinDraft] = useState("");
  const [rentMaxDraft, setRentMaxDraft] = useState("");
  const [amuebladoDraft, setAmuebladoDraft] = useState(false);
  const [mascotasDraft, setMascotasDraft] = useState(false);
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
    setRentMinDraft(p.rentMin != null ? String(Math.round(p.rentMin)) : "");
    setRentMaxDraft(p.rentMax != null ? String(Math.round(p.rentMax)) : "");
    setAmuebladoDraft(p.amueblado);
    setMascotasDraft(p.mascotas);
  }, [searchParams]);

  const { mergedPool: resultsGrid, staged: stagedFromDb, loading: inventoryLoading, error: inventoryError } =
    useRentasStagedInventory(lang);

  const filteredSorted = useMemo(() => {
    const filtered = filterRentasPublicListings(resultsGrid, parsed);
    return sortRentasPublicListings(filtered, parsed.sort);
  }, [parsed, resultsGrid]);

  const totalCount = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / RENTAS_RESULTS_PAGE_SIZE) || 1);
  const safePage = Math.min(Math.max(1, parsed.page), totalPages);

  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * RENTAS_RESULTS_PAGE_SIZE;
    return filteredSorted.slice(start, start + RENTAS_RESULTS_PAGE_SIZE);
  }, [filteredSorted, safePage]);

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

  useEffect(() => {
    if (parsed.page !== safePage) {
      pushUrl((sp) => {
        if (safePage <= 1) sp.delete(RENTAS_QUERY_PAGE);
        else sp.set(RENTAS_QUERY_PAGE, String(safePage));
      });
    }
  }, [parsed.page, pushUrl, safePage]);

  const applySearchAndRefine = useCallback(() => {
    pushUrl((sp) => {
      sp.delete(RENTAS_QUERY_PAGE);
      const setOrDel = (k: string, v: string) => {
        if (!v.trim()) sp.delete(k);
        else sp.set(k, v.trim());
      };
      setOrDel(RENTAS_QUERY_Q, query);
      setOrDel(RENTAS_QUERY_TIPO, propertyType);
      setOrDel(RENTAS_QUERY_PRECIO, priceBand);
      setOrDel(RENTAS_QUERY_RECS, beds);
      const cityNorm = normalizeCityForBrowse(cityDraft);
      if (!cityNorm) sp.delete(RENTAS_QUERY_CITY);
      else sp.set(RENTAS_QUERY_CITY, cityNorm);
      const zipNorm = normalizeZipForBrowse(zipDraft);
      if (!zipNorm) sp.delete(RENTAS_QUERY_ZIP);
      else sp.set(RENTAS_QUERY_ZIP, zipNorm);
      const bm = bathsMinDraft.trim();
      if (!bm) sp.delete(RENTAS_QUERY_BATHS_MIN);
      else if (Number.isFinite(Number(bm))) sp.set(RENTAS_QUERY_BATHS_MIN, bm);

      const rMin = rentMinDraft.replace(/\D/g, "");
      const rMax = rentMaxDraft.replace(/\D/g, "");
      if (!rMin) sp.delete(RENTAS_QUERY_RENT_MIN);
      else sp.set(RENTAS_QUERY_RENT_MIN, rMin);
      if (!rMax) sp.delete(RENTAS_QUERY_RENT_MAX);
      else sp.set(RENTAS_QUERY_RENT_MAX, rMax);

      if (amuebladoDraft) sp.set(RENTAS_QUERY_AMUEBLADO, "1");
      else sp.delete(RENTAS_QUERY_AMUEBLADO);
      if (mascotasDraft) sp.set(RENTAS_QUERY_MASCOTAS, "1");
      else sp.delete(RENTAS_QUERY_MASCOTAS);
    });
  }, [
    amuebladoDraft,
    bathsMinDraft,
    beds,
    cityDraft,
    mascotasDraft,
    priceBand,
    propertyType,
    pushUrl,
    query,
    rentMaxDraft,
    rentMinDraft,
    zipDraft,
  ]);

  const priceBandLabel = useCallback(
    (value: string) => copy.priceOptions.find((o) => o.value === value)?.label ?? null,
    [copy.priceOptions]
  );

  const onSort = useCallback(
    (v: string) => {
      pushUrl((sp) => {
        sp.delete(RENTAS_QUERY_PAGE);
        if (!v || v === "reciente") sp.delete(RENTAS_QUERY_SORT);
        else sp.set(RENTAS_QUERY_SORT, v);
      });
    },
    [pushUrl]
  );

  const featuredListing = useMemo((): RentasPublicListing | null => {
    if (safePage !== 1 || !filteredSorted.length) return null;
    const promoted = filteredSorted.find((l) => l.promoted);
    return promoted ?? filteredSorted[0];
  }, [filteredSorted, safePage]);

  const displayedListings = useMemo(() => {
    if (view === "list") return pageSlice.map((l) => ({ ...l, layout: "horizontal" as const }));
    return pageSlice.map((l) => ({ ...l, layout: l.layout ?? ("vertical" as const) }));
  }, [pageSlice, view]);

  const totalLabel = totalCount;
  const showingFrom = totalCount === 0 ? 0 : (safePage - 1) * RENTAS_RESULTS_PAGE_SIZE + 1;
  const showingTo = totalCount === 0 ? 0 : Math.min(safePage * RENTAS_RESULTS_PAGE_SIZE, totalCount);

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
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="min-w-0 max-w-3xl">
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
            <p className="mt-3 text-sm text-[#5C5346]/90">{copy.results.dataSourceNote}</p>
            {stagedFromDb.length > 0 ? (
              <p className="mt-1 text-sm font-semibold text-[#2C5F2D]">
                {lang === "es"
                  ? `Incluye ${stagedFromDb.length} anuncio(s) reciente(s) desde la base de prueba (listings), mezclados con ejemplos.`
                  : `Includes ${stagedFromDb.length} recent listing(s) from the test database (listings), merged with samples.`}
              </p>
            ) : null}
            {inventoryError ? (
              <p className="mt-1 text-xs text-amber-900" role="status">
                {lang === "es" ? "Aviso: no se pudieron cargar anuncios publicados (" : "Note: could not load published listings ("}
                {inventoryError}
                {lang === "es" ? "). Solo verás ejemplos." : "). Sample rows only."}
              </p>
            ) : null}
            {inventoryLoading ? (
              <p className="mt-1 text-xs text-[#5B7C99]">{lang === "es" ? "Sincronizando inventario…" : "Syncing inventory…"}</p>
            ) : null}
          </div>
          <aside
            className="flex w-full min-w-0 flex-shrink-0 flex-col gap-3 rounded-[1.25rem] border border-[#C9D4E0]/55 bg-gradient-to-br from-white/95 via-[#FFFCF7]/92 to-[#EEF3F7]/55 p-4 shadow-[0_18px_48px_-34px_rgba(44,36,28,0.22)] ring-1 ring-white/80 sm:p-5 lg:max-w-[min(100%,26rem)]"
            aria-label={copy.publishEyebrow}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5B7C99]/90">{copy.publishEyebrow}</p>
              <p className="mt-1.5 text-sm leading-snug text-[#4A4338]/92">{copy.publishHint}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
              <Link href={withRentasLandingLang(RENTAS_PUBLICAR_PRIVADO, lang)} className={`${rentasCtaPrimaryClass} w-full min-w-0 flex-1 text-center`}>
                {copy.publishPrivado}
              </Link>
              <Link href={withRentasLandingLang(RENTAS_PUBLICAR_NEGOCIO, lang)} className={`${rentasCtaSecondaryClass} w-full min-w-0 flex-1 text-center`}>
                {copy.publishNegocio}
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <div className="relative z-[2] mx-auto mt-2 w-full max-w-[min(100%,1200px)] space-y-5 sm:-mt-6 lg:-mt-8 xl:max-w-[min(100%,1280px)]">
        <div className={rentasResultsFilterCardClass}>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/92">{copy.results.filterZoneTitle}</p>
          <div className="mt-4 border-b border-dashed border-[#D4C4A8]/55 pb-6">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5C5346]/75">{copy.search.moduleHeadline}</p>
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
              showModuleHeadline={false}
              copy={copy.search}
              priceOptions={copy.priceOptions}
            />
          </div>

          <div className="pt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#5B7C99]/85">{copy.results.filterRefine}</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <label className="min-w-0">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.cityLabel}</span>
                <input
                  value={cityDraft}
                  onChange={(e) => setCityDraft(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-[#D4CBC0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18"
                  autoComplete="address-level2"
                />
              </label>
              <label className="min-w-0">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.zipLabel}</span>
                <input
                  value={zipDraft}
                  onChange={(e) => setZipDraft(e.target.value)}
                  inputMode="numeric"
                  className="min-h-[48px] w-full rounded-xl border border-[#D4CBC0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18"
                  autoComplete="postal-code"
                />
              </label>
              <label className="min-w-0">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.bathsMinLabel}</span>
                <select
                  value={bathsMinDraft}
                  onChange={(e) => setBathsMinDraft(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-[#D4CBC0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18"
                >
                  <option value="">{copy.results.bathsAny}</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                </select>
              </label>
              <label className="min-w-0 sm:col-span-2 xl:col-span-1">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.rentMinLabel}</span>
                <input
                  value={rentMinDraft}
                  onChange={(e) => setRentMinDraft(e.target.value)}
                  inputMode="numeric"
                  className="min-h-[48px] w-full rounded-xl border border-[#D4CBC0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18"
                  placeholder="0"
                />
              </label>
              <label className="min-w-0 sm:col-span-2 xl:col-span-1">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.rentMaxLabel}</span>
                <input
                  value={rentMaxDraft}
                  onChange={(e) => setRentMaxDraft(e.target.value)}
                  inputMode="numeric"
                  className="min-h-[48px] w-full rounded-xl border border-[#D4CBC0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18"
                  placeholder="—"
                />
              </label>
            </div>

            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5B7C99]/85">{copy.results.filterAmenities}</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                aria-pressed={amuebladoDraft}
                onClick={() => setAmuebladoDraft((v) => !v)}
                className={
                  "inline-flex min-h-[48px] w-full items-center justify-center rounded-full border px-5 text-sm font-semibold transition sm:w-auto " +
                  (amuebladoDraft
                    ? "border-[#C45C26]/45 bg-[#C45C26] text-[#FFFBF7] shadow-[0_6px_18px_-8px_rgba(196,92,38,0.45)]"
                    : "border-[#C9D4E0]/85 bg-white text-[#3D3630] hover:border-[#5B7C99]/35")
                }
              >
                {copy.results.furnishedToggle}
              </button>
              <button
                type="button"
                aria-pressed={mascotasDraft}
                onClick={() => setMascotasDraft((v) => !v)}
                className={
                  "inline-flex min-h-[48px] w-full items-center justify-center rounded-full border px-5 text-sm font-semibold transition sm:w-auto " +
                  (mascotasDraft
                    ? "border-[#C45C26]/45 bg-[#C45C26] text-[#FFFBF7] shadow-[0_6px_18px_-8px_rgba(196,92,38,0.45)]"
                    : "border-[#C9D4E0]/85 bg-white text-[#3D3630] hover:border-[#5B7C99]/35")
                }
              >
                {copy.results.petsToggle}
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-[#E8DFD0]/80 pt-5 sm:flex-row sm:items-end sm:justify-between">
              <button
                type="button"
                onClick={applySearchAndRefine}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border-2 border-[#C45C26]/40 bg-[#C45C26] px-6 text-sm font-semibold text-[#FFFBF7] shadow-[0_8px_22px_-10px_rgba(196,92,38,0.5)] transition hover:border-[#C45C26]/55 sm:w-auto sm:min-w-[12rem]"
              >
                {copy.results.applyFilters}
              </button>
              <div className="min-w-0 sm:max-w-md sm:flex-1">
                <RentasLocationButton lang={lang} copy={copy.results} baseQueryString={resultsQueryString} />
              </div>
            </div>
          </div>
        </div>

        <RentasResultsActiveFilters parsed={parsed} copy={copy} priceBandLabel={priceBandLabel} />

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
        showingFrom={showingFrom}
        showingTo={showingTo}
        total={totalLabel}
        sort={sortValue}
        onSort={onSort}
        view={view}
        onView={setView}
      />

      {safePage === 1 && featuredListing ? (
        <section className="mt-10" aria-labelledby="rentas-feat-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[#E4D9C8]/80 pb-3">
            <h2 id="rentas-feat-heading" className="font-serif text-xl font-semibold tracking-tight text-[#1E1810] sm:text-2xl">
              {copy.results.featuredHeadingDemo}
            </h2>
            {propiedadFilter ? <p className="text-xs text-[#5C5346]/75">{propiedadLabel}</p> : null}
          </div>
          <RentasResultCard listing={{ ...featuredListing, layout: "horizontal" }} copy={copy} lang={lang} />
        </section>
      ) : null}

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
        {totalPages > 1 ? (
          <nav
            className="mt-10 flex flex-col items-center justify-center gap-4 border-t border-[#E8DFD0]/80 pt-8 sm:flex-row sm:justify-between"
            aria-label="Pagination"
          >
            <p className="text-sm text-[#4A4338]/88">
              {copy.results.paginationPageOf.replace("{current}", String(safePage)).replace("{total}", String(totalPages))}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {safePage > 1 ? (
                <Link
                  href={(() => {
                    const sp = new URLSearchParams(searchParams?.toString() ?? "");
                    sp.set(RENTAS_LANDING_LANG_QUERY, lang);
                    if (safePage - 1 <= 1) sp.delete(RENTAS_QUERY_PAGE);
                    else sp.set(RENTAS_QUERY_PAGE, String(safePage - 1));
                    return `${RENTAS_RESULTS}?${sp.toString()}`;
                  })()}
                  scroll={false}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-[#C9D4E0]/85 bg-white px-5 text-sm font-semibold text-[#1E1810] hover:border-[#5B7C99]/35"
                >
                  {copy.results.paginationPrev}
                </Link>
              ) : (
                <span className="inline-flex min-h-[44px] cursor-not-allowed items-center rounded-full border border-[#E8DFD0] px-5 text-sm font-semibold text-[#A89888]">
                  {copy.results.paginationPrev}
                </span>
              )}
              {safePage < totalPages ? (
                <Link
                  href={(() => {
                    const sp = new URLSearchParams(searchParams?.toString() ?? "");
                    sp.set(RENTAS_LANDING_LANG_QUERY, lang);
                    sp.set(RENTAS_QUERY_PAGE, String(safePage + 1));
                    return `${RENTAS_RESULTS}?${sp.toString()}`;
                  })()}
                  scroll={false}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-[#C45C26]/40 bg-[#C45C26] px-5 text-sm font-semibold text-[#FFFBF7] shadow-sm hover:border-[#C45C26]/55"
                >
                  {copy.results.paginationNext}
                </Link>
              ) : (
                <span className="inline-flex min-h-[44px] cursor-not-allowed items-center rounded-full border border-[#E8DFD0] px-5 text-sm font-semibold text-[#A89888]">
                  {copy.results.paginationNext}
                </span>
              )}
            </div>
          </nav>
        ) : null}
      </section>

      <footer className="mt-14 border-t border-[#D4C4A8]/50 pt-8 text-center text-sm text-[#4A4338]/88">
        <Link href={withRentasLandingLang(RENTAS_LANDING, lang)} className="font-semibold text-[#C45C26] underline decoration-[#C45C26]/35">
          {copy.results.backToHub}
        </Link>
      </footer>
    </RentasResultsShell>
  );
}
