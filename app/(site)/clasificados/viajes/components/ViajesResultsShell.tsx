"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import { VIAJES_RESULTS_SAMPLE, type ViajesResultRow } from "../data/viajesResultsSampleData";
import { VIAJES_TRIP_TYPE_HERO_OPTIONS, viajesRowMatchesTripParam } from "../data/viajesTripTypes";
import { ViajesResultsAffiliateCard } from "./ViajesResultsAffiliateCard";
import { ViajesResultsBusinessCard } from "./ViajesResultsBusinessCard";
import {
  ViajesResultsFilterRail,
  emptyViajesResultsFilters,
  type ViajesResultsFiltersState,
} from "./ViajesResultsFilterRail";

function seedFiltersFromParams(sp: URLSearchParams | null): ViajesResultsFiltersState {
  const base = emptyViajesResultsFilters();
  if (!sp) return base;
  const dest = sp.get("dest") ?? sp.get("q") ?? "";
  const from = sp.get("from") ?? "";
  const t = sp.get("t") ?? "";
  const budget = sp.get("budget") ?? "";
  const audience = sp.get("audience") ?? "";
  return {
    ...base,
    destination: dest,
    departureCity: from,
    tripType: t,
    budget,
    audience,
  };
}

function matchesFilters(row: ViajesResultRow, f: ViajesResultsFiltersState, topDest: string): boolean {
  const destQ = (topDest || f.destination).trim().toLowerCase();
  if (destQ) {
    const hay =
      row.kind === "affiliate"
        ? `${row.title} ${row.destination}`.toLowerCase()
        : `${row.offerTitle} ${row.destination}`.toLowerCase();
    if (!hay.includes(destQ)) return false;
  }
  if (f.departureCity) {
    const dep = row.kind === "affiliate" ? row.departureContext.toLowerCase() : row.departureCity.toLowerCase();
    const map: Record<string, string[]> = {
      "san-jose": ["sjo", "san josé", "san jose", "sjc"],
      "san-francisco": ["san francisco", "sfo"],
      oakland: ["oakland", "oak"],
    };
    const needles = map[f.departureCity] ?? [f.departureCity.replace(/-/g, " ")];
    if (!needles.some((n) => dep.includes(n))) return false;
  }
  if (f.tripType && !viajesRowMatchesTripParam(row.tripTypeKeys, f.tripType)) return false;
  return true;
}

export type ViajesSortKey = "featured" | "priceAsc" | "priceDesc";

export function ViajesResultsShell() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const [filters, setFilters] = useState<ViajesResultsFiltersState>(emptyViajesResultsFilters);
  useEffect(() => {
    setFilters(seedFiltersFromParams(sp));
  }, [sp]);

  const [topDestination, setTopDestination] = useState("");
  const [topDeparture, setTopDeparture] = useState("");
  const [topSeason, setTopSeason] = useState("");
  const [topTripType, setTopTripType] = useState("");
  const [topBudget, setTopBudget] = useState("");
  const [topAudience, setTopAudience] = useState("");
  const [sort, setSort] = useState<ViajesSortKey>("featured");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const d = sp?.get("dest") ?? "";
    const from = sp?.get("from") ?? "";
    const t = sp?.get("t") ?? "";
    const b = sp?.get("budget") ?? "";
    const a = sp?.get("audience") ?? "";
    setTopDestination(d);
    setTopDeparture(from);
    setTopTripType(t);
    setTopBudget(b);
    setTopAudience(a);
  }, [sp]);

  const patchFilters = (patch: Partial<ViajesResultsFiltersState>) => setFilters((prev) => ({ ...prev, ...patch }));

  const mergedForMatch = useMemo(
    () => ({
      ...filters,
      destination: topDestination || filters.destination,
      departureCity: topDeparture || filters.departureCity,
      tripType: topTripType || filters.tripType,
      budget: topBudget || filters.budget,
      audience: topAudience || filters.audience,
      season: topSeason || filters.season,
    }),
    [filters, topAudience, topBudget, topDeparture, topDestination, topSeason, topTripType]
  );

  const filtered = useMemo(() => {
    return VIAJES_RESULTS_SAMPLE.filter((row) => matchesFilters(row, mergedForMatch, topDestination));
  }, [mergedForMatch, topDestination]);

  const sorted = useMemo(() => {
    const out = [...filtered];
    if (sort === "priceAsc" || sort === "priceDesc") {
      const priceKey = (row: ViajesResultRow) => {
        const s = row.kind === "affiliate" ? row.priceFrom : row.price;
        const n = parseInt(s.replace(/\D/g, ""), 10);
        return Number.isFinite(n) ? n : sort === "priceAsc" ? 999999 : 0;
      };
      out.sort((a, b) => (sort === "priceAsc" ? priceKey(a) - priceKey(b) : priceKey(b) - priceKey(a)));
    }
    return out;
  }, [filtered, sort]);

  const L = lang;
  const viajesHome = appendLangToPath("/clasificados/viajes", L);
  const publicar = appendLangToPath("/clasificados/publicar", L);

  const filterPanel = (
    <ViajesResultsFilterRail
      value={filters}
      onChange={patchFilters}
      onReset={() => setFilters(emptyViajesResultsFilters())}
      idPrefix="viajes"
    />
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] pb-24 text-[color:var(--lx-text)]">
      <Navbar />
      <div className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-6">
          <nav className="text-[11px] font-medium text-[color:var(--lx-muted)]">
            <Link href={appendLangToPath("/clasificados", L)} className="hover:text-[color:var(--lx-text)]">
              {lang === "en" ? "Classifieds" : "Clasificados"}
            </Link>
            <span className="mx-1.5 opacity-50">/</span>
            <Link href={viajesHome} className="hover:text-[color:var(--lx-text)]">
              Viajes
            </Link>
            <span className="mx-1.5 opacity-50">/</span>
            <span className="text-[color:var(--lx-text)]">{lang === "en" ? "Results" : "Resultados"}</span>
          </nav>
          <div className="flex flex-wrap gap-2">
            <Link
              href={publicar}
              className="rounded-full bg-[color:var(--lx-cta-dark)] px-4 py-2 text-xs font-bold text-[#FFFCF7] shadow-sm transition hover:bg-[color:var(--lx-cta-dark-hover)]"
            >
              {lang === "en" ? "Post" : "Publicar"}
            </Link>
            <Link
              href={viajesHome}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold transition hover:bg-[color:var(--lx-nav-hover)]"
            >
              {lang === "en" ? "Viajes home" : "Inicio Viajes"}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-5 lg:px-6 lg:py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {lang === "en" ? "Discover trips" : "Descubre viajes"}
          </h1>
          <p className="mt-1 text-sm text-[color:var(--lx-muted)]">
            {lang === "en"
              ? "Mix of partner offers and local agencies — labels show the source."
              : "Mezcla de ofertas de socios y agencias locales — las etiquetas indican el origen."}
          </p>
          <p className="mt-2 text-sm font-semibold text-[color:var(--lx-text-2)]">
            {sorted.length} {lang === "en" ? "results" : "resultados"}
          </p>
        </header>

        {/* Top filter / search bar */}
        <section className="mb-6 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end md:gap-3">
            <label className="md:col-span-2">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
                {lang === "en" ? "Destination" : "Destino"}
              </span>
              <input
                className="w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                value={topDestination}
                onChange={(e) => {
                  setTopDestination(e.target.value);
                  patchFilters({ destination: e.target.value });
                }}
                placeholder={lang === "en" ? "City, country…" : "Ciudad, país…"}
              />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
                {lang === "en" ? "Departure city" : "Ciudad de salida"}
              </span>
              <select
                className="w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                value={topDeparture}
                onChange={(e) => {
                  setTopDeparture(e.target.value);
                  patchFilters({ departureCity: e.target.value });
                }}
              >
                <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
                <option value="san-jose">San José, CA (SJC)</option>
                <option value="san-francisco">San Francisco (SFO)</option>
                <option value="oakland">Oakland (OAK)</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
                {lang === "en" ? "Dates / season" : "Fechas / temporada"}
              </span>
              <select
                className="w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                value={topSeason}
                onChange={(e) => {
                  setTopSeason(e.target.value);
                  patchFilters({ season: e.target.value });
                }}
              >
                <option value="">{lang === "en" ? "Flexible" : "Flexible"}</option>
                <option value="spring">{lang === "en" ? "Spring" : "Primavera"}</option>
                <option value="summer">{lang === "en" ? "Summer" : "Verano"}</option>
                <option value="fall">{lang === "en" ? "Fall" : "Otoño"}</option>
                <option value="winter">{lang === "en" ? "Winter" : "Invierno"}</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
                {lang === "en" ? "Trip type" : "Tipo de viaje"}
              </span>
              <select
                className="w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                value={topTripType}
                onChange={(e) => {
                  setTopTripType(e.target.value);
                  patchFilters({ tripType: e.target.value });
                }}
              >
                {VIAJES_TRIP_TYPE_HERO_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
                {lang === "en" ? "Budget" : "Presupuesto"}
              </span>
              <select
                className="w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                value={topBudget}
                onChange={(e) => {
                  setTopBudget(e.target.value);
                  patchFilters({ budget: e.target.value });
                }}
              >
                <option value="">{lang === "en" ? "Flexible" : "Flexible"}</option>
                <option value="economico">{lang === "en" ? "Economy" : "Económico"}</option>
                <option value="moderado">{lang === "en" ? "Moderate" : "Moderado"}</option>
                <option value="premium">Premium</option>
              </select>
            </label>
            <label className="md:col-span-1">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
                {lang === "en" ? "Audience" : "Público"}
              </span>
              <select
                className="w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                value={topAudience}
                onChange={(e) => {
                  setTopAudience(e.target.value);
                  patchFilters({ audience: e.target.value });
                }}
              >
                <option value="">{lang === "en" ? "All" : "Todos"}</option>
                <option value="familias">{lang === "en" ? "Families" : "Familias"}</option>
                <option value="parejas">{lang === "en" ? "Couples" : "Parejas"}</option>
                <option value="grupos">{lang === "en" ? "Groups" : "Grupos"}</option>
              </select>
            </label>
            <label className="md:col-span-1">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
                {lang === "en" ? "Sort" : "Orden"}
              </span>
              <select
                className="w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                value={sort}
                onChange={(e) => setSort(e.target.value as ViajesSortKey)}
              >
                <option value="featured">{lang === "en" ? "Featured" : "Destacado"}</option>
                <option value="priceAsc">{lang === "en" ? "Price ↑" : "Precio ↑"}</option>
                <option value="priceDesc">{lang === "en" ? "Price ↓" : "Precio ↓"}</option>
              </select>
            </label>
          </div>
        </section>

        <div className="flex gap-8 lg:gap-10">
          <aside className="hidden w-[280px] shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-sm">
              <p className="mb-4 text-sm font-bold text-[color:var(--lx-text)]">
                {lang === "en" ? "Refine" : "Refinar"}
              </p>
              {filterPanel}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <button
              type="button"
              className="mb-4 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] px-4 text-sm font-bold text-[color:var(--lx-text)] shadow-sm lg:hidden"
              onClick={() => setMobileFiltersOpen(true)}
            >
              {lang === "en" ? "Filters" : "Filtros"}
            </button>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {sorted.map((row) =>
                row.kind === "affiliate" ? (
                  <ViajesResultsAffiliateCard key={row.id} row={row} />
                ) : (
                  <ViajesResultsBusinessCard key={row.id} row={row} />
                )
              )}
            </div>

            {sorted.length === 0 ? (
              <p className="mt-8 rounded-2xl border border-dashed border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-10 text-center text-sm text-[color:var(--lx-muted)]">
                {lang === "en" ? "No results for these filters." : "Sin resultados con estos filtros."}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(100%,380px)] flex-col border-l border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[color:var(--lx-nav-border)] px-4 py-3">
              <span className="text-sm font-bold">{lang === "en" ? "Filters" : "Filtros"}</span>
              <button type="button" className="text-sm font-semibold text-[color:var(--lx-muted)]" onClick={() => setMobileFiltersOpen(false)}>
                {lang === "en" ? "Close" : "Cerrar"}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{filterPanel}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
