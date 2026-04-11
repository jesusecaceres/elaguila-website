"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import { getViajesUi } from "../data/viajesUiCopy";
import type { ViajesUi } from "../data/viajesUiCopy";
import { VIAJES_RESULTS_SAMPLE, type ViajesResultRow } from "../data/viajesResultsSampleData";
import { getViajesTripTypeHeroOptions } from "../data/viajesTripTypes";
import {
  buildViajesBrowseUrl,
  defaultViajesBrowseState,
  parseViajesBrowseFromSearchParams,
  type ViajesBrowseState,
  type ViajesSortKey,
} from "../lib/viajesBrowseContract";
import { sortViajesResultRows } from "../lib/viajesDiscoveryRanking";
import { viajesRowMatchesBrowse } from "../lib/viajesResultsMatch";
import { ViajesLandingAmbience } from "./ViajesLandingAmbience";
import { ViajesLangSwitch } from "./ViajesLangSwitch";
import { ViajesTrustStrip } from "./ViajesTrustStrip";
import { ViajesResultsAffiliateCard } from "./ViajesResultsAffiliateCard";
import { ViajesResultsBusinessCard } from "./ViajesResultsBusinessCard";
import { ViajesResultsDiscoveryStrip } from "./ViajesResultsDiscoveryStrip";
import { ViajesResultsEditorialCard } from "./ViajesResultsEditorialCard";
import {
  ViajesResultsFilterRail,
  emptyViajesResultsFilters,
  type ViajesResultsFiltersState,
} from "./ViajesResultsFilterRail";

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
  return next;
}

function activeSummaryLine(browse: ViajesBrowseState, ui: ViajesUi, tripTypeLabel: (slug: string) => string): string | null {
  const R = ui.results;
  const hub: Record<string, string> = {
    "san-jose": "SJC",
    "san-francisco": "SFO",
    oakland: "OAK",
  };
  const parts: string[] = [];
  const destPart = browse.q.trim() || browse.dest.trim();
  if (destPart) parts.push(destPart);
  if (browse.from.trim()) parts.push(`${R.departurePrefix} ${hub[browse.from] ?? browse.from}`);
  if (browse.t.trim()) parts.push(tripTypeLabel(browse.t));
  if (browse.budget.trim()) parts.push(browse.budget);
  if (browse.audience.trim()) parts.push(browse.audience);
  if (browse.season.trim()) parts.push(browse.season);
  if (browse.duration.trim()) parts.push(browse.duration);
  if (parts.length === 0) return null;
  return `${R.activeSearchLabel}: ${parts.join(" · ")}`;
}

export type { ViajesSortKey };

export function ViajesResultsShell() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/clasificados/viajes/resultados";
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const ui = getViajesUi(lang);
  const R = ui.results;
  const tripOptions = getViajesTripTypeHeroOptions(lang);

  const browse = useMemo(() => parseViajesBrowseFromSearchParams(sp, lang), [sp, lang]);
  const browseRef = useRef(browse);
  browseRef.current = browse;

  const [destInput, setDestInput] = useState(() => browse.q || browse.dest);
  useEffect(() => {
    setDestInput(browse.q || browse.dest);
  }, [browse.q, browse.dest]);

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
      replaceBrowse({ ...browseRef.current, ...patch, page: 1 });
    },
    [replaceBrowse]
  );

  const filterRailValue = useMemo(() => browseToFilterRail(browse, destInput), [browse, destInput]);

  const filtered = useMemo(
    () => VIAJES_RESULTS_SAMPLE.filter((row) => viajesRowMatchesBrowse(row, browse)),
    [browse]
  );

  const sorted = useMemo(() => sortViajesResultRows(filtered, browse.sort), [filtered, browse.sort]);

  const tripTypeLabel = useCallback(
    (slug: string) => tripOptions.find((o) => o.value === slug)?.label ?? slug,
    [tripOptions]
  );
  const summary = useMemo(() => activeSummaryLine(browse, ui, tripTypeLabel), [browse, ui, tripTypeLabel]);

  const L = lang;
  const viajesHome = appendLangToPath("/clasificados/viajes", L);
  const publicar = appendLangToPath("/clasificados/publicar", L);
  const clearHref = buildViajesBrowseUrl(defaultViajesBrowseState(lang), pathname);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
    <div className="relative min-h-screen overflow-x-hidden pb-24 text-[color:var(--lx-text)] sm:pb-28">
      <ViajesLandingAmbience />
      <div className="relative z-[2] min-w-0">
      <Navbar />
      <div className="border-b border-[color:var(--lx-gold-border)]/50 bg-[#fffdf9]/90 backdrop-blur-md">
        <div className="mx-auto flex min-w-0 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-6">
          <nav className="min-w-0 flex-1 break-words text-[11px] font-medium text-[color:var(--lx-muted)]">
            <Link href={appendLangToPath("/clasificados", L)} className="hover:text-[color:var(--lx-text)]">
              {ui.breadcrumbClassifieds}
            </Link>
            <span className="mx-1.5 opacity-50">/</span>
            <Link href={viajesHome} className="hover:text-[color:var(--lx-text)]">
              {ui.categoryViajes}
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
            <Link
              href={viajesHome}
              className="whitespace-nowrap rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-xs font-semibold transition hover:bg-[color:var(--lx-nav-hover)] sm:px-4"
            >
              {R.viajesHome}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl min-w-0 px-4 py-6 sm:px-5 lg:px-6 lg:py-8">
        <header className="mb-6 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{R.title}</h1>
          <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{summary ?? R.subtitle}</p>
          <p className="mt-2 text-sm font-semibold text-[color:var(--lx-text-2)]">
            {sorted.length} {R.resultsWord}
          </p>
        </header>

        <ViajesTrustStrip ui={ui} className="mt-3 mb-6 sm:mt-4 sm:mb-7" />

        <section className="mb-6 rounded-2xl border-2 border-[color:var(--lx-gold-border)]/40 bg-[#fffdf9]/95 p-4 shadow-[0_20px_48px_-28px_rgba(25,50,70,0.12)] backdrop-blur-sm sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-3">
            <label className="min-w-0 sm:col-span-1 lg:col-span-2">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{R.destination}</span>
              <input
                className="w-full min-w-0 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
                placeholder={R.destPlaceholder}
                autoComplete="off"
              />
            </label>
            <label className="min-w-0 sm:col-span-1 lg:col-span-2">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{R.departureCity}</span>
              <select
                className="w-full min-w-0 cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                value={browse.from}
                onChange={(e) => patchBrowse({ from: e.target.value })}
              >
                <option value="">{R.any}</option>
                <option value="san-jose">San José, CA (SJC)</option>
                <option value="san-francisco">San Francisco (SFO)</option>
                <option value="oakland">Oakland (OAK)</option>
              </select>
            </label>
            <label className="min-w-0 sm:col-span-1 lg:col-span-2">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{R.datesSeason}</span>
              <select
                className="w-full min-w-0 cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                value={browse.season}
                onChange={(e) => patchBrowse({ season: e.target.value })}
              >
                <option value="">{R.flexible}</option>
                <option value="spring">{R.spring}</option>
                <option value="summer">{R.summer}</option>
                <option value="fall">{R.fall}</option>
                <option value="winter">{R.winter}</option>
              </select>
            </label>
            <label className="min-w-0 sm:col-span-1 lg:col-span-2">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{R.tripType}</span>
              <select
                className="w-full min-w-0 cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                value={browse.t}
                onChange={(e) => patchBrowse({ t: e.target.value })}
              >
                {tripOptions.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 sm:col-span-1 lg:col-span-2">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{R.budget}</span>
              <select
                className="w-full min-w-0 cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                value={browse.budget}
                onChange={(e) => patchBrowse({ budget: e.target.value })}
              >
                <option value="">{R.flexible}</option>
                <option value="economico">{R.economy}</option>
                <option value="moderado">{R.moderate}</option>
                <option value="premium">{R.premium}</option>
              </select>
            </label>
            <label className="min-w-0 sm:col-span-1 lg:col-span-1">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{R.audience}</span>
              <select
                className="w-full min-w-0 cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                value={browse.audience}
                onChange={(e) => patchBrowse({ audience: e.target.value })}
              >
                <option value="">{R.audienceAll}</option>
                <option value="familias">{R.audienceFamilies}</option>
                <option value="parejas">{R.audienceCouples}</option>
                <option value="grupos">{R.audienceGroups}</option>
              </select>
            </label>
            <label className="min-w-0 sm:col-span-1 lg:col-span-1">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{R.sort}</span>
              <select
                className="w-full min-w-0 cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                value={browse.sort}
                onChange={(e) => patchBrowse({ sort: e.target.value as ViajesSortKey })}
              >
                <option value="featured">{R.sortFeatured}</option>
                <option value="newest">{R.sortNewest}</option>
                <option value="priceAsc">{R.sortPriceAsc}</option>
                <option value="priceDesc">{R.sortPriceDesc}</option>
              </select>
            </label>
          </div>
        </section>

        <div className="flex min-w-0 gap-8 lg:gap-10">
          <aside className="hidden w-[280px] min-w-0 shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-sm">
              <p className="mb-4 text-sm font-bold text-[color:var(--lx-text)]">{R.refine}</p>
              {filterPanel}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <button
              type="button"
              className="mb-4 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] px-4 text-sm font-bold text-[color:var(--lx-text)] shadow-sm lg:hidden"
              onClick={() => setMobileFiltersOpen(true)}
            >
              {R.filters}
            </button>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{sorted.map(renderCard)}</div>

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

            <ViajesResultsDiscoveryStrip ui={ui} browse={browse} />
          </div>
        </div>
      </div>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={R.filtersDialog}>
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
