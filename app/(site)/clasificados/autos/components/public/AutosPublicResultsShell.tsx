"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { AUTOS_PUBLIC_BLUEPRINT_COPY } from "../../lib/autosPublicBlueprintCopy";
import type { AutosPublicLang } from "../../lib/autosPublicBlueprintCopy";
import { parseAutosBrowseUrl, serializeAutosBrowseUrl, type AutosBrowseUrlBundle } from "../../filters/autosBrowseFilterContract";
import { emptyAutosPublicFilters } from "../../filters/autosPublicFilterTypes";
import { getFeaturedDealerListings, getStandardListings } from "../../data/sampleAutosPublicInventory";
import { AutosPublicFeaturedCard } from "./AutosPublicFeaturedCard";
import { AutosPublicStandardCard } from "./AutosPublicStandardCard";
import { useAutosPublicListingsFetch } from "./useAutosPublicListingsFetch";
import {
  applyAutosPublicFilters,
  sortAutosPublicListings,
  type AutosPublicSortKey,
} from "./autosPublicFilters";
import { AutosPublicFilterRail, type AutosPublicFilterOptions } from "./AutosPublicFilterRail";
const RESULTADOS_PATH = "/clasificados/autos/resultados";
const PAGE_SIZE = 9;

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

  const { listings: inventory } = useAutosPublicListingsFetch();

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

  const featuredBand = useMemo(() => getFeaturedDealerListings(sorted), [sorted]);
  const gridListings = useMemo(() => getStandardListings(sorted), [sorted]);

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
    pushBundle({
      ...applied,
      filters: draftFilters,
      q: qDraft.trim(),
      page: 1,
    });
    setMobileFiltersOpen(false);
  }, [applied, draftFilters, qDraft, pushBundle]);

  const resetFiltersUrl = useCallback(() => {
    const empty = emptyAutosPublicFilters();
    setDraftFilters(empty);
    pushBundle({ ...applied, filters: empty, page: 1 });
    setMobileFiltersOpen(false);
  }, [applied, pushBundle]);

  const setSortUrl = useCallback(
    (sort: AutosPublicSortKey) => {
      pushBundle({ ...applied, sort, page: 1 });
    },
    [applied, pushBundle],
  );

  const nearLine = useMemo(() => {
    const cityQ = applied.filters.city.trim();
    const zip5 = applied.filters.zip.replace(/\D/g, "").slice(0, 5);
    if (cityQ) {
      const hit = sorted.find((x) => x.city.toLowerCase().includes(cityQ.toLowerCase()));
      return copy.resultsNear.replace("{city}", hit?.city ?? cityQ).replace("{state}", hit?.state ?? "CA");
    }
    if (zip5.length === 5) {
      const hit = sorted.find((x) => x.zip === zip5);
      return copy.resultsNear.replace("{city}", hit?.city ?? zip5).replace("{state}", hit?.state ?? "CA");
    }
    return copy.resultsNear.replace("{city}", "San Jose").replace("{state}", "CA");
  }, [applied.filters.city, applied.filters.zip, copy.resultsNear, sorted]);

  const pageQs = (page: number) =>
    `${RESULTADOS_PATH}?${serializeAutosBrowseUrl({ ...applied, page })}`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] pb-[calc(6rem+env(safe-area-inset-bottom,0px))] text-[color:var(--lx-text)]">
      <Navbar />
      <div className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
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

      <div className="mx-auto max-w-7xl px-[max(1rem,env(safe-area-inset-left))] py-6 pr-[max(1rem,env(safe-area-inset-right))] sm:px-5 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-3xl">{copy.resultsTitle}</h1>
            <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{nearLine}</p>
            <p className="mt-2 text-sm font-semibold text-[color:var(--lx-text-2)]">
              {copy.resultCount.replace("{n}", String(resultCount))}
            </p>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--lx-muted)]" aria-hidden>
                ⌕
              </span>
              <input
                className="w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] py-2.5 pl-9 pr-3 text-sm outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2"
                value={qDraft}
                onChange={(e) => setQDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    pushBundle({ ...applied, q: qDraft.trim(), page: 1 });
                  }
                }}
                placeholder={copy.searchPlaceholder}
                aria-label={copy.searchPlaceholder}
              />
            </div>
            <label className="flex shrink-0 items-center gap-2 text-sm text-[color:var(--lx-text-2)]">
              <span className="whitespace-nowrap font-medium">{copy.sortLabel}</span>
              <select
                className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
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
              className="flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] px-4 text-sm font-bold text-[color:var(--lx-text)] shadow-sm lg:hidden"
              onClick={() => setMobileFiltersOpen(true)}
            >
              {copy.filtersOpen}
            </button>
          </div>
        </div>

        <div className="flex gap-8 lg:gap-10">
          <aside className="hidden w-[280px] shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-sm">
              <p className="mb-4 text-sm font-bold text-[color:var(--lx-text)]">{copy.filtersTitle}</p>
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

          <div className="min-w-0 flex-1">
            {featuredBand.length > 0 ? (
              <section className="mb-10">
                <h2 className="mb-4 text-lg font-bold text-[color:var(--lx-text)]">{copy.featuredZoneTitle}</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
                  {featuredBand.map((l) => (
                    <AutosPublicFeaturedCard key={l.id} listing={l} copy={copy} lang={lang} />
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <h2 className="sr-only">{copy.resultsTitle}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {pagedGrid.map((l) => (
                  <AutosPublicStandardCard key={l.id} listing={l} copy={copy} lang={lang} />
                ))}
              </div>
              {gridListings.length === 0 ? (
                <p className="mt-8 rounded-2xl border border-dashed border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-10 text-center text-sm text-[color:var(--lx-muted)]">
                  {lang === "es" ? "Sin resultados con estos filtros." : "No results match these filters."}
                </p>
              ) : null}
            </section>

            {gridListings.length > 0 && totalPages > 1 ? (
              <nav
                className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-[color:var(--lx-nav-border)] pt-8"
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
          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-bold">{copy.filtersTitle}</p>
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
  );
}
