"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { BR_HIGHLIGHT_PRESET_DEFS } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/brHighlightMeta";
import { RentasLocationButton } from "@/app/clasificados/rentas/components/RentasLocationButton";
import { RentasSearchBar } from "@/app/clasificados/rentas/components/RentasSearchBar";
import { useRentasLandingLang } from "@/app/clasificados/rentas/hooks/useRentasLandingLang";
import { useRentasPublicBrowseInventory } from "@/app/clasificados/rentas/hooks/useRentasPublicBrowseInventory";
import {
  rentasCtaPrimaryClass,
  rentasCtaSecondaryClass,
  rentasLandingHeroPanelClass,
  rentasResultsFilterCardClass,
} from "@/app/clasificados/rentas/rentasLandingTheme";
import { RENTAS_LANDING_LANG_QUERY, withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import {
  normalizeRentasBrowseHighlightToken,
  parseRentasBrowseParams,
  RENTAS_QUERY_DEPOSIT_MAX,
  RENTAS_QUERY_DEPOSIT_MIN,
  RENTAS_QUERY_HIGHLIGHTS,
  RENTAS_QUERY_LAT,
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

const RENTAS_HIGHLIGHT_FACET_DEFS = BR_HIGHLIGHT_PRESET_DEFS.slice(0, 12);

export type RentasResultsClientProps = {
  /** Server-fetched live catalog (`listings`); never demo. */
  initialLiveListings: RentasPublicListing[];
  /** Only when `NEXT_PUBLIC_RENTAS_INCLUDE_DEMO_POOL=1`. */
  includeDemoPool: boolean;
};

/** Category-owned results for `/clasificados/rentas/results` — separado de vista previa y del detalle vivo. */
export function RentasResultsClient({ initialLiveListings, includeDemoPool }: RentasResultsClientProps) {
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
  const [halfBathsMinDraft, setHalfBathsMinDraft] = useState("");
  const [rentMinDraft, setRentMinDraft] = useState("");
  const [rentMaxDraft, setRentMaxDraft] = useState("");
  const [amuebladoDraft, setAmuebladoDraft] = useState(false);
  const [mascotasDraft, setMascotasDraft] = useState(false);
  const [depositMinDraft, setDepositMinDraft] = useState("");
  const [depositMaxDraft, setDepositMaxDraft] = useState("");
  const [leaseDraft, setLeaseDraft] = useState("");
  const [parkingMinDraft, setParkingMinDraft] = useState("");
  const [sqftMinDraft, setSqftMinDraft] = useState("");
  const [sqftMaxDraft, setSqftMaxDraft] = useState("");
  const [highlightKeysDraft, setHighlightKeysDraft] = useState<string[]>([]);
  const [poolDraft, setPoolDraft] = useState(false);
  const [subtypeDraft, setSubtypeDraft] = useState("");
  const [kindDraft, setKindDraft] = useState("");
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
    setHalfBathsMinDraft(p.halfBathsMin != null ? String(p.halfBathsMin) : "");
    setRentMinDraft(p.rentMin != null ? String(Math.round(p.rentMin)) : "");
    setRentMaxDraft(p.rentMax != null ? String(Math.round(p.rentMax)) : "");
    setAmuebladoDraft(p.amueblado);
    setMascotasDraft(p.mascotas);
    setDepositMinDraft(p.depositMin != null ? String(Math.round(p.depositMin)) : "");
    setDepositMaxDraft(p.depositMax != null ? String(Math.round(p.depositMax)) : "");
    setLeaseDraft(p.lease);
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
      const zipNorm = normalizeZipForBrowse(zipDraft);
      if (!zipNorm) sp.delete(RENTAS_QUERY_ZIP);
      else sp.set(RENTAS_QUERY_ZIP, zipNorm);
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
    depositMaxDraft,
    depositMinDraft,
    highlightKeysDraft,
    kindDraft,
    leaseDraft,
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
            {includeDemoPool ? (
              <p className="mt-3 text-sm text-[#5C5346]/90">{copy.results.dataSourceNote}</p>
            ) : (
              <p className="mt-3 text-sm text-[#5C5346]/90">
                {lang === "es"
                  ? "Inventario en vivo: solo anuncios publicados en la base de datos (sin ejemplos de demostración)."
                  : "Live inventory: published database listings only (no demo fixtures)."}
              </p>
            )}
            {stagedFromDb.length > 0 ? (
              <p className="mt-1 text-sm font-semibold text-[#2C5F2D]">
                {lang === "es"
                  ? `${stagedFromDb.length} anuncio(s) en el catálogo activo.`
                  : `${stagedFromDb.length} listing(s) in the active catalog.`}
              </p>
            ) : (
              <p className="mt-1 text-sm text-[#5C5346]/90">
                {lang === "es"
                  ? "Aún no hay rentas publicadas visibles en catálogo (o no cumplen filtros de URL)."
                  : "No published rentals are visible in the catalog yet (or URL filters exclude them)."}
              </p>
            )}
            {inventoryError ? (
              <p className="mt-1 text-xs text-amber-900" role="status">
                {lang === "es" ? "Aviso: no se pudo sincronizar el catálogo (" : "Note: could not sync catalog ("}
                {inventoryError}
                {includeDemoPool
                  ? lang === "es"
                    ? ")."
                    : ")."
                  : lang === "es"
                    ? "). Revisa políticas RLS y variables Supabase."
                    : "). Check RLS policies and Supabase env."}
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
              <label className="min-w-0">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.halfBathsMinLabel}</span>
                <select
                  value={halfBathsMinDraft}
                  onChange={(e) => setHalfBathsMinDraft(e.target.value)}
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
              <label className="min-w-0 sm:col-span-2 xl:col-span-1">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.depositMinLabel}</span>
                <input
                  value={depositMinDraft}
                  onChange={(e) => setDepositMinDraft(e.target.value)}
                  inputMode="numeric"
                  className="min-h-[48px] w-full rounded-xl border border-[#D4CBC0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18"
                  placeholder="0"
                />
              </label>
              <label className="min-w-0 sm:col-span-2 xl:col-span-1">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.depositMaxLabel}</span>
                <input
                  value={depositMaxDraft}
                  onChange={(e) => setDepositMaxDraft(e.target.value)}
                  inputMode="numeric"
                  className="min-h-[48px] w-full rounded-xl border border-[#D4CBC0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18"
                  placeholder="—"
                />
              </label>
              <label className="min-w-0 sm:col-span-2 xl:col-span-1">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.leaseLabel}</span>
                <select
                  value={leaseDraft}
                  onChange={(e) => setLeaseDraft(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-[#D4CBC0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18"
                >
                  <option value="">{copy.results.leaseAny}</option>
                  <option value="mes-a-mes">mes-a-mes</option>
                  <option value="6-meses">6-meses</option>
                  <option value="12-meses">12-meses</option>
                  <option value="1-ano">1-ano</option>
                  <option value="2-anos">2-anos</option>
                </select>
              </label>
              <label className="min-w-0 sm:col-span-2 xl:col-span-1">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.parkingMinLabel}</span>
                <input
                  value={parkingMinDraft}
                  onChange={(e) => setParkingMinDraft(e.target.value)}
                  inputMode="numeric"
                  className="min-h-[48px] w-full rounded-xl border border-[#D4CBC0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18"
                  placeholder="0"
                />
              </label>
              <label className="min-w-0 sm:col-span-2 xl:col-span-1">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.sqftMinLabel}</span>
                <input
                  value={sqftMinDraft}
                  onChange={(e) => setSqftMinDraft(e.target.value)}
                  inputMode="numeric"
                  className="min-h-[48px] w-full rounded-xl border border-[#D4CBC0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18"
                  placeholder="0"
                />
              </label>
              <label className="min-w-0 sm:col-span-2 xl:col-span-1">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.sqftMaxLabel}</span>
                <input
                  value={sqftMaxDraft}
                  onChange={(e) => setSqftMaxDraft(e.target.value)}
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

            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5B7C99]/85">{copy.results.highlightsHelp}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {RENTAS_HIGHLIGHT_FACET_DEFS.map((d) => {
                const k = normalizeRentasBrowseHighlightToken(d.key);
                const on = highlightKeysDraft.includes(k);
                return (
                  <button
                    key={d.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setHighlightKeysDraft((prev) => {
                        const set = new Set(prev.map((x) => normalizeRentasBrowseHighlightToken(x)).filter(Boolean));
                        if (set.has(k)) set.delete(k);
                        else set.add(k);
                        return [...set].sort();
                      });
                    }}
                    className={
                      "inline-flex min-h-[40px] items-center rounded-full border px-3 text-xs font-semibold transition " +
                      (on
                        ? "border-[#C45C26]/45 bg-[#C45C26] text-[#FFFBF7]"
                        : "border-[#C9D4E0]/85 bg-white text-[#3D3630] hover:border-[#5B7C99]/35")
                    }
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <button
                type="button"
                aria-pressed={poolDraft}
                onClick={() => setPoolDraft((v) => !v)}
                className={
                  "inline-flex min-h-[48px] w-full items-center justify-center rounded-full border px-5 text-sm font-semibold transition sm:w-auto " +
                  (poolDraft
                    ? "border-[#C45C26]/45 bg-[#C45C26] text-[#FFFBF7]"
                    : "border-[#C9D4E0]/85 bg-white text-[#3D3630] hover:border-[#5B7C99]/35")
                }
              >
                {copy.results.poolToggle}
              </button>
              <label className="min-w-0 flex-1 sm:max-w-[12rem]">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.kindLabel}</span>
                <select
                  value={kindDraft}
                  onChange={(e) => setKindDraft(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-[#D4CBC0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18"
                >
                  <option value="">{copy.results.kindAny}</option>
                  <option value="casa">casa</option>
                  <option value="departamento">departamento</option>
                  <option value="terreno">terreno</option>
                  <option value="comercial">comercial</option>
                </select>
              </label>
              <label className="min-w-0 flex-1 sm:max-w-[16rem]">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.results.subtypeLabel}</span>
                <input
                  value={subtypeDraft}
                  onChange={(e) => setSubtypeDraft(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-[#D4CBC0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18"
                  placeholder="casa · apartamento · oficina"
                  autoComplete="off"
                />
              </label>
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
                <RentasLocationButton
                  lang={lang}
                  copy={{
                    geoSearchDisabledTitle: copy.results.geoSearchDisabledTitle,
                    geoSearchDisabledBody: copy.results.geoSearchDisabledBody,
                  }}
                />
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
              {copy.featured.title}
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
