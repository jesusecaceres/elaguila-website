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

const RESULTADOS_PATH = "/clasificados/autos/resultados";
const PAGE_SIZE = 12;

function uniqSort(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort((a, b) => a.localeCompare(b));
}

function pageWindow(current: number, total: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(current - 2, total - 4));
  return Array.from({ length: 5 }, (_, i) => start + i);
}

export function AutosPublicResultsShell() {
  const router = useRouter();
  const sp = useSearchParams();
  const spStr = sp?.toString() ?? "";

  const applied = useMemo(() => parseAutosBrowseUrl(new URLSearchParams(spStr)), [spStr]);

  const lang: AutosPublicLang = applied.lang;
  const copy = AUTOS_PUBLIC_BLUEPRINT_COPY[lang];

  const [draftFilters, setDraftFilters] = useState(applied.filters);
  const [qDraft, setQDraft] = useState(applied.q);

  useEffect(() => {
    setDraftFilters(applied.filters);
    setQDraft(applied.q);
  }, [applied]);

  const pushBundle = useCallback((b: AutosBrowseUrlBundle) => {
    router.push(`${RESULTADOS_PATH}?${serializeAutosBrowseUrl(b)}`);
  }, [router]);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { listings: inventory, isDemoInventory, loaded } = useAutosPublicListingsFetch();
  const emptyCatalog = loaded && inventory.length === 0 && !isDemoInventory;

  const filterOptions: AutosPublicFilterOptions = useMemo(() => {
    const rows = inventory;
    return {
      makes: uniqSort(rows.map((r) => r.make)),
      bodyStyles: uniqSort(rows.map((r) => r.bodyStyle)),
      transmissions: uniqSort(rows.map((r) => r.transmission)),
      drivetrains: uniqSort(rows.map((r) => r.drivetrain)),
      fuelTypes: uniqSort(rows.map((r) => r.fuelType)),
      titleStatuses: uniqSort(rows.map((r) => r.titleStatus).filter(Boolean) as string[]),
      conditions: [
        { value: "", label: copy.filterAny },
        { value: "new", label: copy.conditionNew },
        { value: "used", label: copy.conditionUsed },
        { value: "certified", label: copy.conditionCertified },
      ],
    };
  }, [copy, inventory]);

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

  const totalPages = Math.max(1, Math.ceil(gridListings.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, applied.page), totalPages);
  const pagedGrid = useMemo(
    () => gridListings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [gridListings, currentPage],
  );

  const resultCount = sorted.length;
  const L = lang as Lang;
  const autosHome = appendLangToPath("/clasificados/autos", L);
  const publicar = appendLangToPath("/clasificados/publicar", L);

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
    setMobileFiltersOpen(false);
  }, [applied, draftFilters, qDraft, pushBundle]);

  const resetFiltersUrl = useCallback(() => {
    const empty = emptyAutosPublicFilters();
    setDraftFilters(empty);
    setQDraft("");
    pushBundle({ ...applied, filters: empty, q: "", page: 1 });
    setMobileFiltersOpen(false);
  }, [applied, pushBundle]);

  const setSortUrl = useCallback(
    (sort: AutosPublicSortKey) => {
      pushBundle({ ...applied, sort, page: 1 });
    },
    [applied, pushBundle],
  );

  const displayCity = useMemo(() => {
    const raw = applied.filters.city.trim();
    return getCanonicalCityName(raw) || raw || "San Jose";
  }, [applied.filters.city]);

  const nearLine = useMemo(() => {
    const cityQ = applied.filters.city.trim();
    const zip5 = applied.filters.zip.replace(/\D/g, "").slice(0, 5);
    if (cityQ) {
      const canon = getCanonicalCityName(cityQ) || cityQ;
      const hit = sorted.find((x) => listingCityMatchesCanon(x.city, canon));
      return copy.resultsNear.replace("{city}", hit ? getCanonicalCityName(hit.city) || hit.city : canon).replace("{state}", hit?.state ?? "CA");
    }
    if (zip5.length === 5) {
      const hit = sorted.find((x) => x.zip === zip5);
      return copy.resultsNear.replace("{city}", hit?.city ?? zip5).replace("{state}", hit?.state ?? "CA");
    }
    return copy.resultsNear.replace("{city}", "San Jose").replace("{state}", "CA");
  }, [applied.filters.city, applied.filters.zip, copy.resultsNear, sorted]);

  const featuredTitle = useMemo(
    () => copy.featuredZoneTitle.replace("{city}", displayCity).replace("{state}", "CA"),
    [copy.featuredZoneTitle, displayCity],
  );

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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] pb-[calc(6rem+env(safe-area-inset-bottom,0px))] text-[color:var(--lx-text)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 min-h-[min(38vh,420px)] bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,rgba(201,168,74,0.09),transparent_55%),linear-gradient(to_bottom,rgba(243,235,221,0.55),transparent)] sm:min-h-[min(42vh,480px)]"
        aria-hidden
      />
      <div className="relative z-[1]">
      <div className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[min(100%,90rem)] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <nav className="text-[11px] font-medium text-[color:var(--lx-muted)]">
            <Link href={appendLangToPath("/clasificados", L)} className="hover:text-[color:var(--lx-text)]">
              {copy.breadcrumb}
            </Link>
            <span className="mx-1.5 opacity-50">/</span>
            <Link href={autosHome} className="hover:text-[color:var(--lx-text)]">
              Autos
            </Link>
            <span className="mx-1.5 opacity-50">/</span>
            <span className="text-[color:var(--lx-text)]">{copy.resultsTitle}</span>
          </nav>
          <div className="flex flex-wrap gap-2">
            <Link
              href={publicar}
              className="rounded-full bg-[color:var(--lx-cta-dark)] px-4 py-2 text-xs font-bold text-[#FFFCF7] shadow-sm transition hover:bg-[color:var(--lx-cta-dark-hover)]"
            >
              {copy.postAd}
            </Link>
            <Link
              href={autosHome}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold transition hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.hubNote}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[min(100%,90rem)] px-[max(1rem,env(safe-area-inset-left))] py-8 pr-[max(1rem,env(safe-area-inset-right))] sm:px-6 lg:py-11">
        <div className="mb-8 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-[color:var(--lx-text)] sm:text-[2rem] lg:text-[2.15rem]">{copy.resultsTitle}</h1>
            <p className="mt-2 text-base text-[color:var(--lx-muted)]">{nearLine}</p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--lx-text-2)]">
              {copy.resultCount.replace("{n}", String(resultCount))}
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{copy.resultsControlHint}</p>
          </div>
        </div>

        <div className="mb-6 rounded-[22px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/95 p-5 shadow-[0_18px_48px_-28px_rgba(42,36,22,0.28)] backdrop-blur-[2px] sm:p-6 lg:p-7">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:gap-4">
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]" htmlFor="autos-res-q">
                  {copy.heroSearchFieldLabel}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--lx-muted)]" aria-hidden>
                    ⌕
                  </span>
                  <input
                    id="autos-res-q"
                    className="min-h-[44px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] py-2.5 pl-9 pr-3 text-sm outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2"
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
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]" htmlFor="autos-res-city">
                  {copy.cityLabel}
                </label>
                <input
                  id="autos-res-city"
                  className="min-h-[44px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                  value={draftFilters.city}
                  onChange={(e) => patchDraft({ city: e.target.value })}
                  placeholder={copy.cityPlaceholder}
                  autoComplete="address-level2"
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]" htmlFor="autos-res-zip">
                  {copy.zipLabel}
                </label>
                <input
                  id="autos-res-zip"
                  className="min-h-[44px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                  inputMode="numeric"
                  maxLength={5}
                  value={draftFilters.zip}
                  onChange={(e) => patchDraft({ zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                  placeholder={copy.zipPlaceholder}
                  autoComplete="postal-code"
                />
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto xl:shrink-0">
              <AutosGeolocationButton copy={copy} onResolved={onGeoResolved} className="w-full sm:w-auto" />
              <button
                type="button"
                className="min-h-[44px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 text-sm font-semibold text-[color:var(--lx-text)] sm:w-auto"
                onClick={resetFiltersUrl}
              >
                {copy.resultsResetShort}
              </button>
              <button
                type="button"
                className="min-h-[48px] w-full rounded-xl bg-[color:var(--lx-cta-dark)] px-6 text-sm font-bold text-[#FFFCF7] shadow-md sm:w-auto"
                onClick={applyDraftToUrl}
              >
                {copy.searchCta}
              </button>
              <label className="flex w-full min-w-0 shrink-0 items-center gap-2 text-sm text-[color:var(--lx-text-2)] sm:w-auto">
                <span className="whitespace-nowrap font-medium">{copy.sortLabel}</span>
                <select
                  className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                  value={applied.sort}
                  onChange={(e) => setSortUrl(e.target.value as AutosPublicSortKey)}
                >
                  <option value="newest">{copy.sortNewest}</option>
                  <option value="priceAsc">{copy.sortPriceLow}</option>
                  <option value="priceDesc">{copy.sortPriceHigh}</option>
                  <option value="mileage">{copy.sortMileage}</option>
                </select>
              </label>
              <button
                type="button"
                className="flex min-h-[44px] w-full shrink-0 items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] px-4 text-sm font-bold text-[color:var(--lx-text)] shadow-sm lg:hidden"
                onClick={() => setMobileFiltersOpen(true)}
              >
                {copy.filtersOpen}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <AutosPublicInventoryNotice
            copy={copy}
            loaded={loaded}
            isDemoInventory={isDemoInventory}
            hasAnyListings={inventory.length > 0}
          />
        </div>

        <div className="mb-6 rounded-2xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/40 px-4 py-4 sm:px-5">
          <AutosPublicResultsQuickChips bundle={applied} copy={copy} />
        </div>

        <div className="mb-7">
          <AutosPublicResultsActiveFilters bundle={applied} pushBundle={pushBundle} copy={copy} />
        </div>

        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12 xl:gap-14">
          <aside className="hidden w-[300px] shrink-0 lg:block xl:w-[336px]">
            <div className="sticky top-28 rounded-[22px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_12px_36px_-20px_rgba(42,36,22,0.2)]">
              <p className="mb-4 font-serif text-lg font-semibold text-[color:var(--lx-text)]">{copy.filtersTitle}</p>
              <AutosPublicFilterRail
                value={draftFilters}
                onChange={patchDraft}
                onReset={resetFiltersUrl}
                onApply={applyDraftToUrl}
                copy={copy}
                options={filterOptions}
                idPrefix="desk"
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1 lg:min-w-0">
            {featuredDealerBand.length > 0 ? (
              <section className="mb-12 lg:mb-16">
                <h2 className="font-serif text-xl font-semibold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">{featuredTitle}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--lx-muted)]">{copy.resultsLaneFeaturedSubtitle}</p>
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
                  {featuredDealerBand.map((l) => (
                    <AutosPublicFeaturedCard key={l.id} listing={l} copy={copy} lang={lang} />
                  ))}
                </div>
              </section>
            ) : null}

            {recentLane.length > 0 ? (
              <section className="mb-12 lg:mb-14">
                <h2 className="font-serif text-xl font-semibold text-[color:var(--lx-text)] sm:text-2xl">{copy.resultsRecentSection}</h2>
                <p className="mt-2 max-w-3xl text-sm text-[color:var(--lx-muted)]">{copy.resultsLaneRecentSubtitle}</p>
                <div className="-mx-1 mt-6 flex gap-4 overflow-x-auto pb-2 pl-1 pr-2 pt-1 [scrollbar-width:thin]">
                  {recentLane.map((l) => (
                    <div key={l.id} className="w-[min(20rem,calc(100vw-2.5rem))] shrink-0">
                      <AutosPublicStandardCard listing={l} copy={copy} lang={lang} compact />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <h2 className="font-serif text-xl font-semibold text-[color:var(--lx-text)] sm:text-2xl">{copy.resultsMainSection}</h2>
              <p className="mt-2 max-w-3xl text-sm text-[color:var(--lx-muted)]">{copy.resultsLaneMainSubtitle}</p>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-2 2xl:grid-cols-3">
                {pagedGrid.map((l) => (
                  <AutosPublicStandardCard key={l.id} listing={l} copy={copy} lang={lang} />
                ))}
              </div>
              {gridListings.length === 0 && !emptyCatalog ? (
                <p className="mt-8 rounded-2xl border border-dashed border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-10 text-center text-sm text-[color:var(--lx-muted)]">
                  {copy.resultsNoFilterMatches}
                </p>
              ) : null}
            </section>

            {gridListings.length > 0 && totalPages > 1 ? (
              <nav
                className="mt-12 flex flex-wrap items-center justify-center gap-2 border-t border-[color:var(--lx-nav-border)] pt-10"
                aria-label="Pagination"
              >
                {currentPage > 1 ? (
                  <Link
                    href={pageQs(currentPage - 1)}
                    className="rounded-lg border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                  >
                    {copy.paginationPrev}
                  </Link>
                ) : (
                  <span className="rounded-lg border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 py-2 text-sm text-[color:var(--lx-muted)]">
                    {copy.paginationPrev}
                  </span>
                )}
                {pageWindow(currentPage, totalPages).map((p) => (
                  <Link
                    key={p}
                    href={pageQs(p)}
                    className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border px-3 py-2 text-center text-sm font-semibold ${
                      p === currentPage
                        ? "border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-text)]"
                        : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-nav-hover)]"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                {currentPage < totalPages ? (
                  <Link
                    href={pageQs(currentPage + 1)}
                    className="rounded-lg border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                  >
                    {copy.paginationNext}
                  </Link>
                ) : (
                  <span className="rounded-lg border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 py-2 text-sm text-[color:var(--lx-muted)]">
                    {copy.paginationNext}
                  </span>
                )}
              </nav>
            ) : null}

            {gridListings.length > 0 && currentPage < totalPages ? (
              <div className="mt-6 flex justify-center">
                <Link
                  href={pageQs(currentPage + 1)}
                  className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-6 py-3 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                >
                  {copy.loadMore}
                </Link>
              </div>
            ) : null}

            {gridListings.length > 0 ? (
              <p className="mt-4 text-center text-xs text-[color:var(--lx-muted)]">
                {copy.pageOf.replace("{page}", String(currentPage))} · {totalPages}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Close"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[min(92vh,720px)] overflow-y-auto rounded-t-[22px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-serif text-lg font-semibold">{copy.filtersTitle}</p>
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[color:var(--lx-gold)]"
                onClick={() => setMobileFiltersOpen(false)}
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
    </div>
  );
}

function listingCityMatchesCanon(listingCity: string, canon: string): boolean {
  const a = getCanonicalCityName(listingCity) || listingCity.trim();
  return a.toLowerCase() === canon.toLowerCase();
}
