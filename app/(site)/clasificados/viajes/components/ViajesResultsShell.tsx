"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { getViajesUi } from "../data/viajesUiCopy";
import type { ViajesResultRow } from "../data/viajesResultsSampleData";
import { runViajesBrowseContractSanityCheck } from "../lib/viajesBrowseContractSelfCheck";
import { isViajesPublicInventoryDemoMode } from "../lib/viajesPublicInventory";
import {
  buildViajesBrowseUrl,
  defaultViajesBrowseState,
  parseViajesBrowseFromSearchParams,
  type ViajesBrowseState,
  type ViajesSortKey,
} from "../lib/viajesBrowseContract";
import { sortViajesResultRows } from "../lib/viajesDiscoveryRanking";
import { viajesRowMatchesBrowse } from "../lib/viajesResultsMatch";
import { ViajesLangSwitch } from "./ViajesLangSwitch";
import { ViajesResultsAffiliateCard } from "./ViajesResultsAffiliateCard";
import { ViajesResultsBusinessCard } from "./ViajesResultsBusinessCard";
import { ViajesResultsDiscoveryStrip } from "./ViajesResultsDiscoveryStrip";
import { ViajesResultsEditorialCard } from "./ViajesResultsEditorialCard";
import { ViajesResultsActiveFilters } from "./ViajesResultsActiveFilters";
import { ViajesResultsViewToggle, type ViajesResultsViewMode } from "./ViajesResultsViewToggle";
import { ViajesResultsProviderRail } from "./ViajesResultsProviderRail";
import {
  ViajesResultsFilterRail,
  emptyViajesResultsFilters,
  type ViajesResultsFiltersState,
} from "./ViajesResultsFilterRail";
import { ViajesSearchBar } from "./ViajesSearchBar";

const PAGE_SIZE = 9;

function browseToFilterRail(b: ViajesBrowseState, destDisplay: string): ViajesResultsFiltersState {
  return {
    ...emptyViajesResultsFilters(),
    destination: destDisplay,
    departureCity: b.from,
    budget: b.budget,
    tripType: b.t,
    duration: b.duration,
    audience: b.audience,
    season: b.season,
    serviceLanguage: b.svcLang,
    sources: b.src,
  };
}

function filterRailPatchToBrowse(patch: Partial<ViajesResultsFiltersState>, prev: ViajesBrowseState): ViajesBrowseState {
  const next = { ...prev, page: 1 };
  if (patch.destination !== undefined) {
    next.q = patch.destination.trim();
    next.dest = "";
  }
  if (patch.departureCity !== undefined) next.from = patch.departureCity;
  if (patch.budget !== undefined) next.budget = patch.budget;
  if (patch.tripType !== undefined) next.t = patch.tripType;
  if (patch.duration !== undefined) next.duration = patch.duration;
  if (patch.audience !== undefined) next.audience = patch.audience;
  if (patch.season !== undefined) next.season = patch.season;
  if (patch.serviceLanguage !== undefined) next.svcLang = patch.serviceLanguage;
  if (patch.sources !== undefined) next.src = patch.sources;
  return next;
}

function matchesSource(row: ViajesResultRow, src: string): boolean {
  const selected = src
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!selected.length) return true;
  return selected.includes(row.kind);
}

export function ViajesResultsShell({
  initialRows,
  stagedApprovedCount = 0,
}: {
  initialRows: ViajesResultRow[];
  stagedApprovedCount?: number;
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/clasificados/viajes/resultados";
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const ui = getViajesUi(lang);
  const R = ui.results;

  const browse = useMemo(() => parseViajesBrowseFromSearchParams(sp, lang), [sp, lang]);
  const browseRef = useRef(browse);
  browseRef.current = browse;

  const [destInput, setDestInput] = useState(() => browse.q || browse.dest);
  const [viewMode, setViewMode] = useState<ViajesResultsViewMode>("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setDestInput(browse.q || browse.dest);
  }, [browse.q, browse.dest]);

  useEffect(() => {
    runViajesBrowseContractSanityCheck();
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const b = browseRef.current;
      const v = destInput.trim();
      if (v === (b.q || b.dest)) return;
      router.replace(
        buildViajesBrowseUrl(
          {
            ...b,
            q: v,
            dest: "",
            page: 1,
          },
          pathname
        )
      );
    }, 450);
    return () => window.clearTimeout(id);
  }, [destInput, pathname, router]);

  const replaceBrowse = useCallback(
    (next: ViajesBrowseState) => {
      router.replace(buildViajesBrowseUrl(next, pathname));
    },
    [pathname, router]
  );

  const patchBrowse = useCallback(
    (patch: Partial<ViajesBrowseState>) => {
      replaceBrowse({ ...browseRef.current, ...patch, page: patch.page ?? 1 });
    },
    [replaceBrowse]
  );

  const filterRailValue = useMemo(() => browseToFilterRail(browse, destInput), [browse, destInput]);

  const publicRows = useMemo(() => initialRows, [initialRows]);
  const filtered = useMemo(
    () => publicRows.filter((row) => viajesRowMatchesBrowse(row, browse) && matchesSource(row, browse.src)),
    [browse, publicRows]
  );

  const sorted = useMemo(() => sortViajesResultRows(filtered, browse.sort), [filtered, browse.sort]);
  const visibleCount = Math.min(sorted.length, browse.page * PAGE_SIZE);
  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  const L = lang;
  const viajesHome = appendLangToPath("/clasificados/viajes", L);
  const publicar = appendLangToPath("/publicar/viajes", L);
  const clearHref = buildViajesBrowseUrl(defaultViajesBrowseState(lang), pathname);
  const sortLabel =
    browse.sort === "newest"
      ? R.sortNewest
      : browse.sort === "priceAsc"
        ? R.sortPriceAsc
        : browse.sort === "priceDesc"
          ? R.sortPriceDesc
          : R.sortFeatured;

  const onRailChange = (patch: Partial<ViajesResultsFiltersState>) => {
    if (patch.destination !== undefined) {
      setDestInput(patch.destination);
      return;
    }
    replaceBrowse(filterRailPatchToBrowse(patch, browseRef.current));
  };

  const onRailReset = () => {
    setDestInput("");
    replaceBrowse(defaultViajesBrowseState(lang));
  };

  const filterPanel = (
    <ViajesResultsFilterRail
      value={filterRailValue}
      onChange={onRailChange}
      onReset={onRailReset}
      onApply={() => setMobileFiltersOpen(false)}
      idPrefix="viajes"
      ui={ui}
    />
  );

  const renderCard = (row: ViajesResultRow) => {
    if (row.kind === "affiliate") return <ViajesResultsAffiliateCard key={row.id} row={row} ui={ui} />;
    if (row.kind === "business") return <ViajesResultsBusinessCard key={row.id} row={row} ui={ui} />;
    return <ViajesResultsEditorialCard key={row.id} row={row} ui={ui} />;
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] pb-24 text-[color:var(--lx-text)] sm:pb-28">
      <div className="border-b border-[color:var(--lx-gold-border)]/50 bg-[#fffdf9]">
        <div className="mx-auto flex min-w-0 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-6">
          <nav className="min-w-0 flex-1 break-words text-[11px] font-medium text-[color:var(--lx-muted)]">
            <Link href={viajesHome} className="hover:text-[color:var(--lx-text)]">
              {R.breadcrumbViajes}
            </Link>
            <span className="mx-1.5 opacity-50">/</span>
            <span className="text-[color:var(--lx-text)]">{R.breadcrumbResults}</span>
          </nav>
          <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2">
            <ViajesLangSwitch compact />
            <Link
              href={publicar}
              className="whitespace-nowrap rounded-full bg-[color:var(--lx-cta-dark)] px-3 py-2 text-xs font-bold text-[#FFFCF7] shadow-sm transition hover:bg-[color:var(--lx-cta-dark-hover)] sm:px-4"
            >
              {R.post}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl min-w-0 px-4 py-6 sm:px-5 lg:px-6 lg:py-8">
        <header className="mb-4 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{R.compactTitle}</h1>
          <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{R.compactSubtitle}</p>
        </header>

        <div className="mb-3 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-3 shadow-sm sm:p-4">
          <ViajesSearchBar ui={ui} lang={lang} resultsBasePath={pathname} />
          <ViajesResultsActiveFilters browse={browse} ui={ui} pathname={pathname} />
        </div>

        {isViajesPublicInventoryDemoMode() ? (
          <p className="mb-4 text-[11px] leading-snug text-[color:var(--lx-muted)]" role="status">
            {R.inventoryDemoBanner}
            {stagedApprovedCount > 0
              ? ` · ${stagedApprovedCount} ${lang === "en" ? "approved submissions included" : "envíos aprobados incluidos"}.`
              : ""}
          </p>
        ) : null}

        <div className="flex min-w-0 gap-8 lg:gap-10">
          <aside className="hidden w-[250px] shrink-0 lg:block">
            <div className="sticky top-4 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-sm">
              {filterPanel}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[color:var(--lx-text)]">
                  {lang === "en" ? "Trips found" : "Viajes encontrados"}
                </h2>
                <p className="text-sm font-semibold text-[color:var(--lx-text-2)]">
                  {sorted.length} {R.resultsWord}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ViajesResultsViewToggle
                  value={viewMode}
                  onChange={setViewMode}
                  gridLabel={R.viewGrid}
                  listLabel={R.viewList}
                />
                <label className="min-w-0">
                  <span className="sr-only">{R.sort}</span>
                  <select
                    className="min-h-[40px] cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                    value={browse.sort}
                    onChange={(e) => patchBrowse({ sort: e.target.value as ViajesSortKey, page: 1 })}
                    aria-label={R.sortLabel(sortLabel)}
                  >
                    <option value="featured">{R.sortLabel(R.sortFeatured)}</option>
                    <option value="newest">{R.sortLabel(R.sortNewest)}</option>
                    <option value="priceAsc">{R.sortLabel(R.sortPriceAsc)}</option>
                    <option value="priceDesc">{R.sortLabel(R.sortPriceDesc)}</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] px-4 text-sm font-bold lg:hidden"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  {R.filters}
                </button>
                <Link
                  href={clearHref}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-4 text-sm font-semibold lg:hidden"
                >
                  {ui.filterRail.reset}
                </Link>
              </div>
            </div>

            <div
              className={
                viewMode === "list"
                  ? "grid grid-cols-1 gap-3"
                  : "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
              }
            >
              {visible.map(renderCard)}
            </div>

            {sorted.length === 0 ? (
              <div className="mt-8 space-y-4 rounded-2xl border border-dashed border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-10 text-center">
                <p className="text-sm text-[color:var(--lx-muted)]">{R.noResults}</p>
                <p className="text-sm text-[color:var(--lx-text-2)]">{R.emptyRecoveryHint}</p>
                <Link
                  href={clearHref}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-6 text-sm font-bold text-[#FFFCF7] hover:bg-[color:var(--lx-cta-dark-hover)]"
                >
                  {ui.filterRail.reset}
                </Link>
              </div>
            ) : null}

            {hasMore ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-6 text-sm font-bold"
                  onClick={() => patchBrowse({ page: browse.page + 1 })}
                >
                  {R.loadMore}
                </button>
              </div>
            ) : null}

            <ViajesResultsDiscoveryStrip ui={ui} browse={browse} />
            <ViajesResultsProviderRail rows={sorted} ui={ui} />
          </div>
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={R.filtersDialog}>
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={R.closeOverlay}
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(100%,380px)] min-w-0 flex-col border-l border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] pb-[env(safe-area-inset-bottom)] shadow-xl">
            <div className="flex min-h-[52px] items-center justify-between border-b border-[color:var(--lx-nav-border)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <span className="text-sm font-bold">{R.filters}</span>
              <button type="button" className="text-sm font-semibold text-[color:var(--lx-muted)]" onClick={() => setMobileFiltersOpen(false)}>
                {R.close}
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4">{filterPanel}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
