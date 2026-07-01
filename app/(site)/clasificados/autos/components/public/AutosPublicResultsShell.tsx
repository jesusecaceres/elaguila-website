"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { AUTOS_PUBLIC_BLUEPRINT_COPY } from "../../lib/autosPublicBlueprintCopy";
import type { AutosPublicLang } from "../../lib/autosPublicBlueprintCopy";
import { parseAutosBrowseUrl, serializeAutosBrowseUrl, type AutosBrowseUrlBundle } from "../../filters/autosBrowseFilterContract";
import { emptyAutosPublicFilters } from "../../filters/autosPublicFilterTypes";
import { AutosPublicFeaturedCard } from "./AutosPublicFeaturedCard";
import { AutosPublicStandardCard } from "./AutosPublicStandardCard";
import { useAutosPublicListingsFetch } from "./useAutosPublicListingsFetch";
import {
  applyAutosPublicFilters,
  sortAutosPublicListings,
  type AutosPublicSortKey,
} from "./autosPublicFilters";
import { AutosPublicFilterRail, type AutosPublicFilterOptions } from "./AutosPublicFilterRail";
import { partitionAutosResultsVisibility } from "../../lib/autosPublicResultsVisibility";
import { AutosPublicResultsActiveFilters } from "./AutosPublicResultsActiveFilters";
import { AutosPublicResultsQuickChips } from "./AutosPublicResultsQuickChips";
import { AutosGeolocationButton } from "./AutosGeolocationButton";
import { AutosPublicInventoryNotice } from "./AutosPublicInventoryNotice";
import { AutosMarketPeerCrossLink } from "./AutosMarketPeerCrossLink";
import type { AutosPublicMarket } from "@/app/lib/clasificados/autos/autosPublicMarket";
import {
  autosMarketDefaultSellerType,
  autosMarketLandingPath,
  autosMarketPeerResultsPath,
  autosMarketPublishPath,
  autosMarketResultsPath,
} from "@/app/lib/clasificados/autos/autosPublicMarket";
import { getAutosPublicMarketCopy } from "@/app/lib/clasificados/autos/autosPublicMarketCopy";
import { CategoryStandardResultsPageShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsPageShell";
import { CategoryStandardResultsHeader } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsHeader";
import {
  CAT_STD_DEFAULT_PER_PAGE,
  CAT_STD_PER_PAGE_OPTIONS,
} from "@/app/(site)/clasificados/components/categoryPipeline/catStdPerPage";

function uniqSort(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort((a, b) => a.localeCompare(b));
}

function pageWindow(current: number, total: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(current - 2, total - 4));
  return Array.from({ length: 5 }, (_, i) => start + i);
}

export function AutosPublicResultsShell({ market = "private" }: { market?: AutosPublicMarket }) {
  const router = useRouter();
  const sp = useSearchParams();
  const spStr = sp?.toString() ?? "";
  const RESULTADOS_PATH = autosMarketResultsPath(market);
  const marketDefaultSeller = autosMarketDefaultSellerType(market);

  const applied = useMemo(() => parseAutosBrowseUrl(new URLSearchParams(spStr)), [spStr]);

  const lang: AutosPublicLang = applied.lang;
  const copy = AUTOS_PUBLIC_BLUEPRINT_COPY[lang];
  const marketCopy = getAutosPublicMarketCopy(market, lang);

  useEffect(() => {
    const seller = new URLSearchParams(spStr).get("seller");
    if (seller === "dealer" || seller === "private") return;
    const parsed = parseAutosBrowseUrl(new URLSearchParams(spStr));
    router.replace(
      `${RESULTADOS_PATH}?${serializeAutosBrowseUrl({
        ...parsed,
        filters: { ...parsed.filters, sellerType: marketDefaultSeller },
        page: 1,
      })}`,
    );
  }, [spStr, marketDefaultSeller, RESULTADOS_PATH, router]);

  const [draftFilters, setDraftFilters] = useState(applied.filters);
  const [qDraft, setQDraft] = useState(applied.q);

  useEffect(() => {
    setDraftFilters(applied.filters);
    setQDraft(applied.q);
  }, [applied]);

  const pushBundle = useCallback((b: AutosBrowseUrlBundle) => {
    router.push(`${RESULTADOS_PATH}?${serializeAutosBrowseUrl(b)}`);
  }, [router, RESULTADOS_PATH]);

  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
  const perPage = applied.perPage ?? CAT_STD_DEFAULT_PER_PAGE;

  const { listings: inventory, isDemoInventory, loaded } = useAutosPublicListingsFetch();
  const emptyCatalog = loaded && inventory.length === 0 && !isDemoInventory;

  const filterOptions: AutosPublicFilterOptions = useMemo(() => {
    const rows = inventory;
    const selectedMake = draftFilters.make.trim().toLowerCase();
    const modelRows = selectedMake ? rows.filter((r) => r.make.trim().toLowerCase() === selectedMake) : rows;
    return {
      makes: uniqSort(rows.map((r) => r.make)),
      models: uniqSort(modelRows.map((r) => r.model)),
      bodyStyles: uniqSort(rows.map((r) => r.bodyStyle)),
      transmissions: uniqSort(rows.map((r) => r.transmission)),
      drivetrains: uniqSort(rows.map((r) => r.drivetrain)),
      fuelTypes: uniqSort(rows.map((r) => r.fuelType)),
      exteriorColors: uniqSort(rows.map((r) => r.exteriorColor ?? "")),
      interiorColors: uniqSort(rows.map((r) => r.interiorColor ?? "")),
      titleStatuses: uniqSort(rows.map((r) => r.titleStatus).filter(Boolean) as string[]),
      conditions: [
        { value: "", label: copy.filterAny },
        { value: "new", label: copy.conditionNew },
        { value: "used", label: copy.conditionUsed },
        { value: "certified", label: copy.conditionCertified },
      ],
    };
  }, [copy, draftFilters.make, inventory]);

  const filtered = useMemo(
    () => applyAutosPublicFilters(inventory, applied.filters, applied.q),
    [inventory, applied.filters, applied.q],
  );

  const sorted = useMemo(() => sortAutosPublicListings(filtered, applied.sort), [filtered, applied.sort]);

  const { featuredDealerBand, recentLane, mainGridPool } = useMemo(
    () => partitionAutosResultsVisibility(sorted, applied.sort),
    [sorted, applied.sort],
  );

  const gridListings = mainGridPool;

  const totalPages = Math.max(1, Math.ceil(gridListings.length / perPage));
  const currentPage = Math.min(Math.max(1, applied.page), totalPages);
  const pagedGrid = useMemo(
    () => gridListings.slice((currentPage - 1) * perPage, currentPage * perPage),
    [gridListings, currentPage, perPage],
  );

  const resultCount = sorted.length;
  const L = lang as Lang;
  const autosHome = appendLangToPath(autosMarketLandingPath(market), L);
  const publicar = appendLangToPath(autosMarketPublishPath(market), L);

  const patchDraft = (patch: Partial<typeof draftFilters>) => setDraftFilters((f) => ({ ...f, ...patch }));

  const applyDraftToUrl = useCallback(() => {
    const cityRaw = draftFilters.city.trim();
    const canonCity = getCanonicalCityName(cityRaw) || cityRaw;
    const nextFilters = { ...draftFilters, city: canonCity };
    setDraftFilters(nextFilters);
    pushBundle({
      ...applied,
      filters: nextFilters,
      q: qDraft.trim(),
      page: 1,
    });
    setFiltersPanelOpen(false);
  }, [applied, draftFilters, qDraft, pushBundle]);

  const resetFiltersUrl = useCallback(() => {
    const empty = emptyAutosPublicFilters();
    empty.sellerType = marketDefaultSeller;
    setDraftFilters(empty);
    setQDraft("");
    pushBundle({ ...applied, filters: empty, q: "", page: 1, perPage: CAT_STD_DEFAULT_PER_PAGE });
    setFiltersPanelOpen(false);
  }, [applied, pushBundle, marketDefaultSeller]);

  const setSortUrl = useCallback(
    (sort: AutosPublicSortKey) => {
      pushBundle({ ...applied, sort, page: 1 });
    },
    [applied, pushBundle],
  );

  const setPerPageUrl = useCallback(
    (nextPerPage: number) => {
      pushBundle({ ...applied, perPage: nextPerPage, page: 1 });
    },
    [applied, pushBundle],
  );

  const displayCity = useMemo(() => {
    const raw = applied.filters.city.trim();
    if (raw) return getCanonicalCityName(raw) || raw;
    const hit = sorted[0] ?? inventory[0];
    const c = hit?.city?.trim();
    return c ? getCanonicalCityName(c) || c : "";
  }, [applied.filters.city, sorted, inventory]);

  const inferredState = useMemo(() => {
    const cityQ = applied.filters.city.trim();
    const zip5 = applied.filters.zip.replace(/\D/g, "").slice(0, 5);
    if (cityQ) {
      const canon = getCanonicalCityName(cityQ) || cityQ;
      const hit = sorted.find((x) => listingCityMatchesCanon(x.city, canon));
      return (hit?.state ?? sorted.find((x) => x.state?.trim())?.state ?? "").trim();
    }
    if (zip5.length === 5) {
      const hit = sorted.find((x) => x.zip === zip5);
      return (hit?.state ?? "").trim();
    }
    return (sorted[0]?.state ?? inventory[0]?.state ?? "").trim();
  }, [applied.filters.city, applied.filters.zip, sorted, inventory]);

  const nearLine = useMemo(() => {
    const cityQ = applied.filters.city.trim();
    const zip5 = applied.filters.zip.replace(/\D/g, "").slice(0, 5);
    if (cityQ) {
      const canon = getCanonicalCityName(cityQ) || cityQ;
      const hit = sorted.find((x) => listingCityMatchesCanon(x.city, canon));
      const cityDisplay = hit ? getCanonicalCityName(hit.city) || hit.city : canon;
      const st = (hit?.state ?? sorted.find((x) => x.state?.trim())?.state ?? "").trim();
      if (st) return copy.resultsNear.replace("{city}", cityDisplay).replace("{state}", st);
      return copy.resultsNearCity.replace("{city}", cityDisplay);
    }
    if (zip5.length === 5) {
      const hit = sorted.find((x) => x.zip === zip5);
      const cityDisplay = hit?.city ?? zip5;
      const st = (hit?.state ?? "").trim();
      if (st) return copy.resultsNear.replace("{city}", cityDisplay).replace("{state}", st);
      return copy.resultsNearCity.replace("{city}", cityDisplay);
    }
    return copy.resultsSubheadNoGeo;
  }, [applied.filters.city, applied.filters.zip, copy, sorted]);

  const featuredTitle = useMemo(() => {
    const city = displayCity.trim();
    const st = inferredState.trim();
    if (city && st) return copy.featuredZoneTitle.replace("{city}", city).replace("{state}", st);
    if (city) return copy.featuredZoneTitleCityOnly.replace("{city}", city);
    return copy.featuredZoneGeneric;
  }, [copy, displayCity, inferredState]);

  const pageQs = (page: number) => `${RESULTADOS_PATH}?${serializeAutosBrowseUrl({ ...applied, page })}`;

  const onGeoResolved = useCallback(
    (patch: { city: string; zip: string }) => {
      const raw = patch.city.trim();
      const city = getCanonicalCityName(raw) || raw;
      const zip = patch.zip.replace(/\D/g, "").slice(0, 5);
      const nextFilters = { ...applied.filters, city, zip };
      setDraftFilters(nextFilters);
      pushBundle({ ...applied, filters: nextFilters, page: 1 });
    },
    [applied, pushBundle],
  );

  const clearResultsHref = `${RESULTADOS_PATH}?${serializeAutosBrowseUrl({
    filters: { ...emptyAutosPublicFilters(), sellerType: marketDefaultSeller },
    q: "",
    sort: applied.sort,
    page: 1,
    lang,
    routeLang: applied.routeLang,
  })}`;

  const peerResultsHref = `${autosMarketPeerResultsPath(market)}?${serializeAutosBrowseUrl({
    filters: { ...emptyAutosPublicFilters(), sellerType: autosMarketDefaultSellerType(market === "private" ? "dealer" : "private") },
    q: "",
    sort: "newest",
    page: 1,
    lang,
    routeLang: applied.routeLang,
  })}`;

  return (
    <CategoryStandardResultsPageShell>
      <div className="pb-[calc(6rem+env(safe-area-inset-bottom,0px))] text-[#1A1A1A]">
      <div className="mx-auto max-w-[min(100%,90rem)] px-[max(1rem,env(safe-area-inset-left))] py-4 pr-[max(1rem,env(safe-area-inset-right))] sm:px-6 sm:py-5">
        <CategoryStandardResultsHeader
          lang={L}
          title={marketCopy.resultsTitle}
          subtitle={marketCopy.resultsSubtitle}
          backHref={autosHome}
          backLabel={marketCopy.title}
          publishHref={publicar}
          publishLabel={marketCopy.postAd}
          clearHref={clearResultsHref}
          resultCount={loaded ? resultCount : undefined}
          category="autos"
        />
        <p className="mt-2 text-sm text-[#5C5346]">{nearLine}</p>

        <div className="mb-3 mt-3 rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-3 shadow-[0_4px_18px_-14px_rgba(31,36,28,0.1)] sm:p-4">
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-12 sm:items-stretch">
              <div className="relative min-w-0 sm:col-span-5">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7A7A]" aria-hidden>
                    ⌕
                  </span>
                  <input
                    id="autos-res-q"
                    className="min-h-[2.5rem] w-full rounded-lg border border-[#D6C7AD] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#D4A574]/50"
                    value={qDraft}
                    onChange={(e) => setQDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyDraftToUrl();
                      }
                    }}
                    placeholder={copy.searchPlaceholder}
                    aria-label={copy.searchPlaceholder}
                    autoComplete="off"
                  />
              </div>
              <div className="min-w-0 sm:col-span-3">
                <input
                  id="autos-res-city"
                  className="min-h-[2.5rem] w-full rounded-lg border border-[#D6C7AD] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#D4A574]/50"
                  value={draftFilters.city}
                  onChange={(e) => patchDraft({ city: e.target.value })}
                  placeholder={copy.cityPlaceholder}
                  autoComplete="address-level2"
                />
              </div>
              <div className="min-w-0 sm:col-span-2">
                <input
                  id="autos-res-zip"
                  className="min-h-[2.5rem] w-full rounded-lg border border-[#D6C7AD] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#D4A574]/50"
                  inputMode="numeric"
                  maxLength={5}
                  value={draftFilters.zip}
                  onChange={(e) => patchDraft({ zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                  placeholder={copy.zipPlaceholder}
                  autoComplete="postal-code"
                />
              </div>
              <button
                type="button"
                className="min-h-[2.5rem] rounded-lg bg-[#D4A574] px-4 text-sm font-bold text-white shadow-sm sm:col-span-2 hover:bg-[#C19A6B]"
                onClick={applyDraftToUrl}
              >
                {copy.searchCta}
              </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-[36px] items-center rounded-full border border-[#D6C7AD] bg-white px-3 py-2 text-xs font-semibold text-[#1A1A1A] shadow-sm hover:bg-[#FAF6EE]"
              onClick={() => setFiltersPanelOpen(true)}
            >
              {copy.filtersOpen}
            </button>
            <select
              className="min-h-[36px] rounded-full border border-[#D6C7AD] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1A1A]"
              value={applied.sort}
              onChange={(e) => setSortUrl(e.target.value as AutosPublicSortKey)}
              aria-label={copy.sortLabel}
            >
              <option value="newest">{copy.sortNewest}</option>
              <option value="priceAsc">{copy.sortPriceLow}</option>
              <option value="priceDesc">{copy.sortPriceHigh}</option>
              <option value="mileage">{copy.sortMileage}</option>
              <option value="yearDesc">{copy.sortYearNewest}</option>
              <option value="yearAsc">{copy.sortYearOldest}</option>
            </select>
            <select
              className="min-h-[36px] rounded-full border border-[#D6C7AD] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1A1A]"
              value={perPage}
              onChange={(e) => setPerPageUrl(Number(e.target.value))}
              aria-label={lang === "es" ? "Mostrar por página" : "Per page"}
            >
              {CAT_STD_PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <AutosGeolocationButton copy={copy} onResolved={onGeoResolved} className="!min-h-[36px] !rounded-full !px-3 !py-2 !text-xs" />
            <button
              type="button"
              className="inline-flex min-h-[36px] items-center rounded-full border border-[#D6C7AD] bg-white px-3 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-[#FAF6EE]"
              onClick={resetFiltersUrl}
            >
              {copy.resultsResetShort}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <AutosMarketPeerCrossLink copy={marketCopy} href={peerResultsHref} compact />
        </div>

        <div className="mb-5">
          <AutosPublicInventoryNotice
            copy={copy}
            loaded={loaded}
            isDemoInventory={isDemoInventory}
            hasAnyListings={inventory.length > 0}
          />
        </div>

        <div className="mb-3 rounded-xl border border-[#D6C7AD]/60 bg-[#FFFDF7] px-3 py-2">
          <AutosPublicResultsQuickChips bundle={applied} copy={copy} market={market} resultsPath={RESULTADOS_PATH} />
        </div>

        <div className="mb-3">
          <AutosPublicResultsActiveFilters bundle={applied} pushBundle={pushBundle} copy={copy} />
        </div>

          <div className="min-w-0 flex-1">
            {!loaded ? (
              <div
                className="rounded-2xl border border-dashed border-[#D4A574]/40 bg-[#FFFAF0] px-6 py-14 text-center"
                aria-busy="true"
              >
                <p className="text-sm font-semibold text-[#4A4A4A]">{copy.resultsStatusLoading}</p>
              </div>
            ) : null}

            {loaded && featuredDealerBand.length > 0 ? (
              <section className="mb-6 lg:mb-8">
                <h2 className="font-serif text-xl font-semibold tracking-tight text-[#1A1A1A] sm:text-2xl">{featuredTitle}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#7A7A7A]">{copy.resultsLaneFeaturedSubtitle}</p>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {featuredDealerBand.map((l) => (
                    <AutosPublicFeaturedCard key={l.id} listing={l} copy={copy} lang={lang} />
                  ))}
                </div>
              </section>
            ) : null}

            {recentLane.length > 0 ? (
              <section className="mb-8 lg:mb-10">
                <h2 className="font-serif text-xl font-semibold tracking-tight text-[#1A1A1A] sm:text-2xl">{copy.resultsRecentSection}</h2>
                <p className="mt-2 max-w-3xl text-sm text-[#7A7A7A]">{copy.resultsLaneRecentSubtitle}</p>
                <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto pb-2 pl-1 pr-2 pt-1 [scrollbar-width:thin]">
                  {recentLane.map((l) => (
                    <div key={l.id} className="w-[min(20rem,calc(100vw-2.5rem))] shrink-0">
                      <AutosPublicStandardCard listing={l} copy={copy} lang={lang} compact />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {loaded ? (
            <section>
              <h2 className="font-serif text-xl font-semibold tracking-tight text-[#1A1A1A] sm:text-2xl">{copy.resultsMainSection}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#7A7A7A]">{copy.resultsLaneMainSubtitle}</p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                {pagedGrid.map((l) => (
                  <AutosPublicStandardCard key={l.id} listing={l} copy={copy} lang={lang} />
                ))}
              </div>
              {gridListings.length === 0 && !emptyCatalog ? (
                <div className="mt-8 rounded-2xl border border-dashed border-[#D4A574]/40 bg-[#FFFAF0] px-5 py-12 text-center">
                  <p className="text-sm font-semibold text-[#4A4A4A]">{copy.resultsNoFilterMatches}</p>
                  <p className="mt-2 text-xs leading-relaxed text-[#7A7A7A]">{copy.resultsNextStepHint}</p>
                  <button
                    type="button"
                    className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#D4A574]/45 bg-[#FFFEF7] px-5 text-sm font-bold text-[#1A1A1A] transition hover:bg-[#F5F0E8]"
                    onClick={resetFiltersUrl}
                  >
                    {copy.resultsResetShort}
                  </button>
                </div>
              ) : null}
            </section>
            ) : null}

            {gridListings.length > 0 && totalPages > 1 ? (
              <nav
                className="mt-12 flex flex-wrap items-center justify-center gap-2 border-t border-[#E5E5E5] pt-10"
                aria-label="Pagination"
              >
                {currentPage > 1 ? (
                  <Link
                    href={pageQs(currentPage - 1)}
                    className="rounded-lg border border-[#E5E5E5] bg-[#FFFAF0] px-3 py-2 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#F5F0E8]"
                  >
                    {copy.paginationPrev}
                  </Link>
                ) : (
                  <span className="rounded-lg border border-[#E5E5E5] bg-[#FFFEF7] px-3 py-2 text-sm text-[#7A7A7A]">
                    {copy.paginationPrev}
                  </span>
                )}
                {pageWindow(currentPage, totalPages).map((p) => (
                  <Link
                    key={p}
                    href={pageQs(p)}
                    className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border px-3 py-2 text-center text-sm font-semibold ${
                      p === currentPage
                        ? "border-[#D4A574]/50 bg-[#FFFAF0] text-[#1A1A1A]"
                        : "border-[#E5E5E5] bg-[#FFFAF0] text-[#4A4A4A] hover:bg-[#F5F0E8]"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                {currentPage < totalPages ? (
                  <Link
                    href={pageQs(currentPage + 1)}
                    className="rounded-lg border border-[#E5E5E5] bg-[#FFFAF0] px-3 py-2 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#F5F0E8]"
                  >
                    {copy.paginationNext}
                  </Link>
                ) : (
                  <span className="rounded-lg border border-[#E5E5E5] bg-[#FFFEF7] px-3 py-2 text-sm text-[#7A7A7A]">
                    {copy.paginationNext}
                  </span>
                )}
              </nav>
            ) : null}

            {gridListings.length > 0 && currentPage < totalPages ? (
              <div className="mt-6 flex justify-center">
                <Link
                  href={pageQs(currentPage + 1)}
                  className="rounded-xl border border-[#E5E5E5] bg-[#FFFAF0] px-6 py-3 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#F5F0E8]"
                >
                  {copy.loadMore}
                </Link>
              </div>
            ) : null}

            {gridListings.length > 0 ? (
              <p className="mt-4 text-center text-xs text-[#7A7A7A]">
                {copy.pageOf.replace("{page}", String(currentPage))} · {totalPages}
              </p>
            ) : null}
          </div>
      </div>

      {filtersPanelOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Close"
            onClick={() => setFiltersPanelOpen(false)}
          />
          <div className="relative z-[71] max-h-[min(92vh,720px)] w-full overflow-y-auto rounded-t-[22px] border border-[#D4A574]/30 bg-[#FFFAF0] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:pb-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-serif text-lg font-semibold text-[#1A1A1A]">{copy.filtersTitle}</p>
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[#D4A574]"
                onClick={() => setFiltersPanelOpen(false)}
              >
                {lang === "es" ? "Cerrar" : "Close"}
              </button>
            </div>
            <AutosPublicFilterRail
              value={draftFilters}
              onChange={patchDraft}
              onReset={resetFiltersUrl}
              onApply={applyDraftToUrl}
              copy={copy}
              options={filterOptions}
              idPrefix="mob"
            />
          </div>
        </div>
      ) : null}
      </div>
    </CategoryStandardResultsPageShell>
  );
}

function listingCityMatchesCanon(listingCity: string, canon: string): boolean {
  const a = getCanonicalCityName(listingCity) || listingCity.trim();
  return a.toLowerCase() === canon.toLowerCase();
}
