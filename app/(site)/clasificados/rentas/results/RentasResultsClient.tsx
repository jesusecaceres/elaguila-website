"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { RentasCompactSearchCanvas } from "@/app/clasificados/rentas/components/RentasCompactSearchCanvas";
import { RentasFiltersDrawer } from "@/app/clasificados/rentas/components/RentasFiltersDrawer";
import { useRentasLandingLang } from "@/app/clasificados/rentas/hooks/useRentasLandingLang";
import { useRentasPublicBrowseInventory } from "@/app/clasificados/rentas/hooks/useRentasPublicBrowseInventory";
import { rentasCtaPrimaryClass } from "@/app/clasificados/rentas/rentasLandingTheme";
import { RENTAS_BTN_PRIMARY } from "@/app/clasificados/rentas/shared/rentasLeonixPublicUi";
import { RENTAS_LANDING_LANG_QUERY, withRentasLandingLang } from "@/app/(site)/clasificados/rentas/rentasLandingLang";
import {
  normalizeRentasBrowseHighlightToken,
  parseRentasBrowseParams,
  RENTAS_QUERY_DEPOSIT_MAX,
  RENTAS_QUERY_DEPOSIT_MIN,
  RENTAS_QUERY_HIGHLIGHTS,
  RENTAS_QUERY_LAT,
  RENTAS_QUERY_ESTADO,
  RENTAS_QUERY_LEASE,
  RENTAS_QUERY_LNG,
  RENTAS_QUERY_PARKING_MIN,
  RENTAS_QUERY_RADIUS_KM,
  RENTAS_QUERY_SQFT_MAX,
  RENTAS_QUERY_SQFT_MIN,
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
  RENTAS_QUERY_HALF_BATHS_MIN,
  RENTAS_QUERY_CITY,
  RENTAS_QUERY_KIND,
  RENTAS_QUERY_MASCOTAS,
  RENTAS_QUERY_PAGE,
  RENTAS_QUERY_POOL,
  RENTAS_QUERY_PRECIO,
  RENTAS_QUERY_SUBTYPE,
  RENTAS_QUERY_Q,
  RENTAS_QUERY_RECS,
  RENTAS_QUERY_RENT_MAX,
  RENTAS_QUERY_RENT_MIN,
  RENTAS_QUERY_SORT,
  RENTAS_QUERY_COUNTRY,
  RENTAS_QUERY_STATE,
  RENTAS_QUERY_TIPO,
  RENTAS_QUERY_ZIP,
} from "@/app/clasificados/rentas/shared/rentasResultsQueryKeys";
import {
  RENTAS_LANDING,
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
import { CategoryVisibilityCta } from "@/app/(site)/clasificados/components/categoryStandard/CategoryVisibilityCta";

export type RentasResultsClientProps = {
  /** Server-fetched live catalog (`listings`); never demo. */
  initialLiveListings: RentasPublicListing[];
  /** Only when `NEXT_PUBLIC_RENTAS_INCLUDE_DEMO_POOL=1`. */
  includeDemoPool: boolean;
};

/** Category-owned results for `/clasificados/rentas/results` — separado de vista previa y del detalle vivo. */
export function RentasResultsClient({ initialLiveListings, includeDemoPool }: RentasResultsClientProps) {
  const router = useRouter();
  const { copy, lang, routeLang } = useRentasLandingLang();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceBand, setPriceBand] = useState("");
  const [beds, setBeds] = useState("");
  const [cityDraft, setCityDraft] = useState("");
  const [stateDraft, setStateDraft] = useState("CA");
  const [zipDraft, setZipDraft] = useState("");
  const [countryDraft, setCountryDraft] = useState("United States");
  const [bathsMinDraft, setBathsMinDraft] = useState("");
  const [halfBathsMinDraft, setHalfBathsMinDraft] = useState("");
  const [rentMinDraft, setRentMinDraft] = useState("");
  const [rentMaxDraft, setRentMaxDraft] = useState("");
  const [amuebladoDraft, setAmuebladoDraft] = useState(false);
  const [mascotasDraft, setMascotasDraft] = useState(false);
  const [depositMinDraft, setDepositMinDraft] = useState("");
  const [depositMaxDraft, setDepositMaxDraft] = useState("");
  const [leaseDraft, setLeaseDraft] = useState("");
  const [estadoDraft, setEstadoDraft] = useState("");
  const [parkingMinDraft, setParkingMinDraft] = useState("");
  const [sqftMinDraft, setSqftMinDraft] = useState("");
  const [sqftMaxDraft, setSqftMaxDraft] = useState("");
  const [highlightKeysDraft, setHighlightKeysDraft] = useState<string[]>([]);
  const [poolDraft, setPoolDraft] = useState(false);
  const [subtypeDraft, setSubtypeDraft] = useState("");
  const [kindDraft, setKindDraft] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const resultsQueryString = searchParams?.toString() ?? "";

  const parsed = useMemo(() => parseRentasBrowseParams(searchParams), [searchParams]);

  useEffect(() => {
    const p = parseRentasBrowseParams(searchParams);
    setQuery(p.q);
    setPropertyType(p.tipo);
    setPriceBand(p.precio);
    setBeds(p.recs);
    setCityDraft(p.city);
    setStateDraft(p.state || "CA");
    setZipDraft(p.zip);
    setCountryDraft(p.country || "United States");
    setBathsMinDraft(p.bathsMin != null ? String(p.bathsMin) : "");
    setHalfBathsMinDraft(p.halfBathsMin != null ? String(p.halfBathsMin) : "");
    setRentMinDraft(p.rentMin != null ? String(Math.round(p.rentMin)) : "");
    setRentMaxDraft(p.rentMax != null ? String(Math.round(p.rentMax)) : "");
    setAmuebladoDraft(p.amueblado);
    setMascotasDraft(p.mascotas);
    setDepositMinDraft(p.depositMin != null ? String(Math.round(p.depositMin)) : "");
    setDepositMaxDraft(p.depositMax != null ? String(Math.round(p.depositMax)) : "");
    setLeaseDraft(p.lease);
    setEstadoDraft(p.estado);
    setParkingMinDraft(p.parkingMin != null ? String(p.parkingMin) : "");
    setSqftMinDraft(p.sqftMin != null ? String(Math.round(p.sqftMin)) : "");
    setSqftMaxDraft(p.sqftMax != null ? String(Math.round(p.sqftMax)) : "");
    setHighlightKeysDraft([...p.highlightsAll]);
    setPoolDraft(p.wantsPool);
    setSubtypeDraft(p.subtype);
    setKindDraft(p.kind ?? "");
  }, [searchParams]);

  const { mergedPool: resultsGrid, staged: stagedFromDb, loading: inventoryLoading, error: inventoryError } =
    useRentasPublicBrowseInventory({ initialLiveListings, lang, includeDemoPool });

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
      sp.set(RENTAS_LANDING_LANG_QUERY, routeLang);
      mutate(sp);
      const qs = sp.toString();
      router.replace(qs ? `${RENTAS_RESULTS}?${qs}` : `${RENTAS_RESULTS}?${RENTAS_LANDING_LANG_QUERY}=${routeLang}`);
    },
    [routeLang, router, searchParams]
  );

  useEffect(() => {
    if (parsed.page !== safePage) {
      pushUrl((sp) => {
        if (safePage <= 1) sp.delete(RENTAS_QUERY_PAGE);
        else sp.set(RENTAS_QUERY_PAGE, String(safePage));
      });
    }
  }, [parsed.page, pushUrl, safePage]);

  /** Remove legacy geo scaffold params from the URL (no per-listing coordinates yet). */
  useEffect(() => {
    const p = parseRentasBrowseParams(searchParams);
    if (p.lat == null && p.lng == null && p.radiusKm == null) return;
    pushUrl((sp) => {
      sp.delete(RENTAS_QUERY_LAT);
      sp.delete(RENTAS_QUERY_LNG);
      sp.delete(RENTAS_QUERY_RADIUS_KM);
    });
  }, [pushUrl, searchParams]);

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
      const stateNorm = stateDraft.trim().toUpperCase().slice(0, 2);
      if (!stateNorm) sp.delete(RENTAS_QUERY_STATE);
      else sp.set(RENTAS_QUERY_STATE, stateNorm);
      const zipNorm = normalizeZipForBrowse(zipDraft);
      if (!zipNorm) sp.delete(RENTAS_QUERY_ZIP);
      else sp.set(RENTAS_QUERY_ZIP, zipNorm);
      const countryNorm = countryDraft.trim();
      if (!countryNorm || countryNorm.toLowerCase() === "united states") sp.delete(RENTAS_QUERY_COUNTRY);
      else sp.set(RENTAS_QUERY_COUNTRY, countryNorm);
      const bm = bathsMinDraft.trim();
      if (!bm) sp.delete(RENTAS_QUERY_BATHS_MIN);
      else if (Number.isFinite(Number(bm))) sp.set(RENTAS_QUERY_BATHS_MIN, bm);
      const hm = halfBathsMinDraft.trim();
      if (!hm) sp.delete(RENTAS_QUERY_HALF_BATHS_MIN);
      else if (Number.isFinite(Number(hm))) sp.set(RENTAS_QUERY_HALF_BATHS_MIN, hm);

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

      const dMin = depositMinDraft.replace(/\D/g, "");
      const dMax = depositMaxDraft.replace(/\D/g, "");
      if (!dMin) sp.delete(RENTAS_QUERY_DEPOSIT_MIN);
      else sp.set(RENTAS_QUERY_DEPOSIT_MIN, dMin);
      if (!dMax) sp.delete(RENTAS_QUERY_DEPOSIT_MAX);
      else sp.set(RENTAS_QUERY_DEPOSIT_MAX, dMax);
      if (!leaseDraft.trim()) sp.delete(RENTAS_QUERY_LEASE);
      else sp.set(RENTAS_QUERY_LEASE, leaseDraft.trim());
      if (!estadoDraft.trim()) sp.delete(RENTAS_QUERY_ESTADO);
      else sp.set(RENTAS_QUERY_ESTADO, estadoDraft.trim());

      const pk = parkingMinDraft.replace(/\D/g, "");
      if (!pk) sp.delete(RENTAS_QUERY_PARKING_MIN);
      else sp.set(RENTAS_QUERY_PARKING_MIN, pk);

      const sqMin = sqftMinDraft.replace(/\D/g, "");
      const sqMax = sqftMaxDraft.replace(/\D/g, "");
      if (!sqMin) sp.delete(RENTAS_QUERY_SQFT_MIN);
      else sp.set(RENTAS_QUERY_SQFT_MIN, sqMin);
      if (!sqMax) sp.delete(RENTAS_QUERY_SQFT_MAX);
      else sp.set(RENTAS_QUERY_SQFT_MAX, sqMax);

      const hl = [...highlightKeysDraft].map(normalizeRentasBrowseHighlightToken).filter(Boolean).sort();
      if (!hl.length) sp.delete(RENTAS_QUERY_HIGHLIGHTS);
      else sp.set(RENTAS_QUERY_HIGHLIGHTS, [...new Set(hl)].join(","));

      if (poolDraft) sp.set(RENTAS_QUERY_POOL, "1");
      else sp.delete(RENTAS_QUERY_POOL);

      const sub = subtypeDraft.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64);
      if (!sub) sp.delete(RENTAS_QUERY_SUBTYPE);
      else sp.set(RENTAS_QUERY_SUBTYPE, sub);

      const kd = kindDraft.trim().toLowerCase();
      if (!kd || !["casa", "departamento", "terreno", "comercial"].includes(kd)) sp.delete(RENTAS_QUERY_KIND);
      else sp.set(RENTAS_QUERY_KIND, kd);
    });
  }, [
    amuebladoDraft,
    bathsMinDraft,
    halfBathsMinDraft,
    beds,
    cityDraft,
    stateDraft,
    depositMaxDraft,
    depositMinDraft,
    highlightKeysDraft,
    kindDraft,
    leaseDraft,
    estadoDraft,
    mascotasDraft,
    parkingMinDraft,
    poolDraft,
    priceBand,
    propertyType,
    pushUrl,
    query,
    rentMaxDraft,
    rentMinDraft,
    sqftMaxDraft,
    sqftMinDraft,
    subtypeDraft,
    zipDraft,
    countryDraft,
  ]);

  const clearFilters = useCallback(() => {
    router.replace(withRentasLandingLang(RENTAS_RESULTS, routeLang));
  }, [routeLang, router]);

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

  const displayedListings = useMemo(() => {
    if (view === "list") return pageSlice.map((l) => ({ ...l, layout: "horizontal" as const }));
    return pageSlice.map((l) => ({ ...l, layout: l.layout ?? ("vertical" as const) }));
  }, [pageSlice, view]);

  const totalLabel = totalCount;
  const showingFrom = totalCount === 0 ? 0 : (safePage - 1) * RENTAS_RESULTS_PAGE_SIZE + 1;
  const showingTo = totalCount === 0 ? 0 : Math.min(safePage * RENTAS_RESULTS_PAGE_SIZE, totalCount);

  const sortValue = parsed.sort || "reciente";
  const filtersLabel = lang === "es" ? "Filtros" : "Filters";
  const searchLabel = lang === "es" ? "Buscar" : "Search";
  const countLine =
    totalCount === 0
      ? lang === "es"
        ? "0 resultados"
        : "0 results"
      : lang === "es"
        ? `${showingFrom}–${showingTo} de ${totalLabel}`
        : `${showingFrom}–${showingTo} of ${totalLabel}`;

  return (
    <RentasResultsShell>
      <RentasResultsTopBar copy={copy} lang={lang} routeLang={routeLang} />

      <div className="space-y-3 pb-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">{copy.title}</h1>
            <p className="mt-0.5 text-xs text-[#3D3428]/80">{countLine}</p>
          </div>
          <Link href={withRentasLandingLang(RENTAS_PUBLICAR_PRIVADO, routeLang)} className={`${rentasCtaPrimaryClass} shrink-0`}>
            {lang === "es" ? "Publicar renta" : "Post a rental"}
          </Link>
        </div>

        <RentasCompactSearchCanvas
          lang={lang}
          query={query}
          city={cityDraft}
          state={stateDraft}
          zip={zipDraft}
          country={countryDraft}
          onQuery={setQuery}
          onCity={setCityDraft}
          onState={setStateDraft}
          onZip={setZipDraft}
          onCountry={setCountryDraft}
          onSearch={applySearchAndRefine}
          onOpenFilters={() => setFiltersOpen(true)}
          browseAllHref={withRentasLandingLang(RENTAS_RESULTS, routeLang)}
          searchButtonLabel={searchLabel}
          filtersButtonLabel={filtersLabel}
        />

        <RentasResultsActiveFilters parsed={parsed} copy={copy} priceBandLabel={priceBandLabel} />

        <RentasPropiedadFilterChips active={propiedadFilter} lang={lang} copy={copy} queryString={resultsQueryString} />

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all" as const, label: copy.results.branchAll },
              { id: "privado" as const, label: copy.results.branchPrivado },
              { id: "negocio" as const, label: copy.results.branchNegocio },
            ] as const
          ).map((opt) => {
            const isOn = branchFilter === opt.id;
            const sp = new URLSearchParams(searchParams?.toString() ?? "");
            sp.set(RENTAS_LANDING_LANG_QUERY, routeLang);
            if (opt.id === "all") sp.delete("branch");
            else sp.set("branch", opt.id);
            const href = `${RENTAS_RESULTS}?${sp.toString()}`;
            return (
              <Link
                key={opt.id}
                href={href}
                scroll={false}
                className={
                  "inline-flex h-[30px] items-center rounded-md border px-2.5 text-[11px] font-semibold transition sm:text-xs " +
                  (isOn
                    ? "border-[#7A1E2C]/50 bg-[#7A1E2C] text-[#FFFDF7]"
                    : "border-[#C9A84A]/45 bg-[#FBF7EF] text-[#3D3428] hover:border-[#C9A84A]/70")
                }
              >
                {opt.label}
              </Link>
            );
          })}
        </div>

        <CategoryVisibilityCta lang={lang} category="rentas" surface="results" compact />
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

      <section className="mt-4" aria-labelledby="rentas-grid-heading">
        <h2 id="rentas-grid-heading" className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">
          {copy.results.moreRentals}
        </h2>
        {displayedListings.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-[#E8DFD0] bg-[#FDFBF7]/90 p-6 text-center text-sm text-[#5C5346]">
            {copy.results.noMatches}{" "}
            <Link href={withRentasLandingLang(RENTAS_RESULTS, routeLang)} className="font-semibold text-[#B8954A] underline">
              {copy.results.clearFiltersDemo}
            </Link>
          </p>
        ) : view === "list" ? (
          <div className="mt-4 flex flex-col gap-3">
            {displayedListings.map((l) => (
              <RentasResultCard key={l.id} listing={l} copy={copy} lang={lang} />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    sp.set(RENTAS_LANDING_LANG_QUERY, routeLang);
                    if (safePage - 1 <= 1) sp.delete(RENTAS_QUERY_PAGE);
                    else sp.set(RENTAS_QUERY_PAGE, String(safePage - 1));
                    return `${RENTAS_RESULTS}?${sp.toString()}`;
                  })()}
                  scroll={false}
                  className="inline-flex min-h-[2.625rem] items-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-4 text-sm font-semibold text-[#3D3428] hover:bg-[#FBF7EF] disabled:opacity-40"
                >
                  {copy.results.paginationPrev}
                </Link>
              ) : (
                <span className="inline-flex min-h-[2.625rem] cursor-not-allowed items-center rounded-lg border border-[#E8DFD0] px-4 text-sm font-semibold text-[#A89888]">
                  {copy.results.paginationPrev}
                </span>
              )}
              {safePage < totalPages ? (
                <Link
                  href={(() => {
                    const sp = new URLSearchParams(searchParams?.toString() ?? "");
                    sp.set(RENTAS_LANDING_LANG_QUERY, routeLang);
                    sp.set(RENTAS_QUERY_PAGE, String(safePage + 1));
                    return `${RENTAS_RESULTS}?${sp.toString()}`;
                  })()}
                  scroll={false}
                  className={`${RENTAS_BTN_PRIMARY} px-4 disabled:opacity-40`}
                >
                  {copy.results.paginationNext}
                </Link>
              ) : (
                <span className="inline-flex min-h-[2.625rem] cursor-not-allowed items-center rounded-lg border border-[#E8DFD0] px-4 text-sm font-semibold text-[#A89888]">
                  {copy.results.paginationNext}
                </span>
              )}
            </div>
          </nav>
        ) : null}
      </section>

      <footer className="mt-14 border-t border-[#D4C4A8]/50 pt-8 text-center text-sm text-[#4A4338]/88">
        <Link href={withRentasLandingLang(RENTAS_LANDING, routeLang)} className="font-semibold text-[#7A1E2C] underline decoration-[#C9A84A]/35">
          {copy.results.backToHub}
        </Link>
      </footer>

      <RentasFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={applySearchAndRefine}
        onClear={clearFilters}
        lang={lang}
        copy={copy}
        variant="results"
        propertyType={propertyType}
        onPropertyType={setPropertyType}
        priceBand={priceBand}
        onPriceBand={setPriceBand}
        beds={beds}
        onBeds={setBeds}
        cityDraft={cityDraft}
        onCityDraft={setCityDraft}
        stateDraft={stateDraft}
        onStateDraft={setStateDraft}
        zipDraft={zipDraft}
        onZipDraft={setZipDraft}
        countryDraft={countryDraft}
        onCountryDraft={setCountryDraft}
        bathsMinDraft={bathsMinDraft}
        onBathsMinDraft={setBathsMinDraft}
        halfBathsMinDraft={halfBathsMinDraft}
        onHalfBathsMinDraft={setHalfBathsMinDraft}
        rentMinDraft={rentMinDraft}
        onRentMinDraft={setRentMinDraft}
        rentMaxDraft={rentMaxDraft}
        onRentMaxDraft={setRentMaxDraft}
        depositMinDraft={depositMinDraft}
        onDepositMinDraft={setDepositMinDraft}
        depositMaxDraft={depositMaxDraft}
        onDepositMaxDraft={setDepositMaxDraft}
        leaseDraft={leaseDraft}
        onLeaseDraft={setLeaseDraft}
        estadoDraft={estadoDraft}
        onEstadoDraft={setEstadoDraft}
        parkingMinDraft={parkingMinDraft}
        onParkingMinDraft={setParkingMinDraft}
        sqftMinDraft={sqftMinDraft}
        onSqftMinDraft={setSqftMinDraft}
        sqftMaxDraft={sqftMaxDraft}
        onSqftMaxDraft={setSqftMaxDraft}
        amuebladoDraft={amuebladoDraft}
        onAmuebladoDraft={setAmuebladoDraft}
        mascotasDraft={mascotasDraft}
        onMascotasDraft={setMascotasDraft}
        highlightKeysDraft={highlightKeysDraft}
        onHighlightKeysDraft={setHighlightKeysDraft}
        poolDraft={poolDraft}
        onPoolDraft={setPoolDraft}
        kindDraft={kindDraft}
        onKindDraft={setKindDraft}
        subtypeDraft={subtypeDraft}
        onSubtypeDraft={setSubtypeDraft}
        priceOptions={copy.priceOptions}
      />
    </RentasResultsShell>
  );
}
