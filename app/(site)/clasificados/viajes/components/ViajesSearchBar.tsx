"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { getViajesTripTypeHeroOptions } from "../data/viajesTripTypes";
import type { ViajesUi } from "../data/viajesUiCopy";
import { buildViajesResultsUrl } from "../lib/buildViajesResultsUrl";
import { getViajesOriginById, VIAJES_ORIGIN_BUCKETS } from "../lib/viajesOrigins";
import { useBrowserLocationForViajes } from "../lib/useBrowserLocationForViajes";
import { ViajesDestinationAutocomplete } from "./ViajesDestinationAutocomplete";

const VIAJES_ACCENT = "#D97706";

type ViajesSearchBarProps = {
  resultsBasePath?: string;
  lang?: Lang;
  ui: ViajesUi;
};

export function ViajesSearchBar({ resultsBasePath = "/clasificados/viajes/resultados", lang = "es", ui }: ViajesSearchBarProps) {
  const router = useRouter();
  const s = ui.search;
  const tripOptions = getViajesTripTypeHeroOptions(lang);
  const [destinationLabel, setDestinationLabel] = useState("");
  /** When user picks autocomplete, search uses canonical slug; cleared when typing freely. */
  const [canonicalDest, setCanonicalDest] = useState<string | null>(null);
  const [departure, setDeparture] = useState("");
  const [tripType, setTripType] = useState("");
  const [budget, setBudget] = useState("");
  const { state: geoState, requestLocation } = useBrowserLocationForViajes();

  useEffect(() => {
    if (geoState.status === "ready") setDeparture(geoState.originId);
  }, [geoState]);

  const exploreHref = useMemo(() => {
    const dest = (canonicalDest ?? destinationLabel).trim();
    return buildViajesResultsUrl(
      {
        destination: dest || undefined,
        departure: departure || undefined,
        tripType: tripType || undefined,
        budget: budget || undefined,
        lang,
      },
      resultsBasePath
    );
  }, [budget, canonicalDest, departure, destinationLabel, lang, resultsBasePath, tripType]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push(exploreHref);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_20px_50px_-20px_rgba(42,36,22,0.25)] backdrop-blur-md sm:p-5 md:p-6"
      style={{ boxShadow: "0 24px 48px -12px rgba(42, 36, 22, 0.18), 0 0 0 1px rgba(201, 180, 106, 0.12)" }}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end md:gap-4">
        <label className="md:col-span-3">
          <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">
            <span aria-hidden>⌕</span>
            {s.whereTo}
          </span>
          <ViajesDestinationAutocomplete
            value={destinationLabel}
            onChange={(v) => {
              setDestinationLabel(v);
              setCanonicalDest(null);
            }}
            onSelectCanonical={(destParam, displayLabel) => {
              setCanonicalDest(destParam);
              setDestinationLabel(displayLabel);
            }}
            placeholder={s.destPlaceholder}
          />
        </label>
        <div className="md:col-span-3">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">{s.departureFrom}</span>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
            <select
              className="w-full min-h-[48px] min-w-0 flex-1 cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              aria-label={s.departureAria}
            >
              <option value="">{s.anyOrigin}</option>
              {VIAJES_ORIGIN_BUCKETS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label} · {o.airportLine}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={requestLocation}
              disabled={geoState.status === "requesting"}
              className="min-h-[48px] shrink-0 touch-manipulation rounded-xl border border-[color:var(--lx-gold-border)] bg-[rgba(212,188,106,0.14)] px-3 py-2.5 text-xs font-bold text-[color:var(--lx-text)] transition hover:bg-[rgba(212,188,106,0.24)] disabled:opacity-60 sm:min-h-0 sm:min-w-[140px]"
            >
              {geoState.status === "requesting" ? s.locationRequesting : s.useMyLocation}
            </button>
          </div>
          {geoState.status === "ready" ? (
            <p className="mt-1 text-[11px] text-[color:var(--lx-muted)]">
              {s.geoReady(
                getViajesOriginById(geoState.originId)?.label ?? geoState.originId,
                getViajesOriginById(geoState.originId)?.airportLine ?? ""
              )}
            </p>
          ) : null}
          {geoState.status === "denied" ? (
            <p className="mt-1 text-[11px] text-amber-800/90">{s.geoDenied}</p>
          ) : null}
          {geoState.status === "unavailable" ? (
            <p className="mt-1 text-[11px] text-[color:var(--lx-muted)]">{s.geoUnavailable}</p>
          ) : null}
        </div>
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">{s.tripType}</span>
          <select
            className="w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2"
            value={tripType}
            onChange={(e) => setTripType(e.target.value)}
          >
            {tripOptions.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">{s.budget}</span>
          <select
            className="w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          >
            <option value="">{s.budgetFlexible}</option>
            <option value="economico">{s.budgetEconomy}</option>
            <option value="moderado">{s.budgetModerate}</option>
            <option value="premium">{s.budgetPremium}</option>
          </select>
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-[1.05] active:brightness-95"
            style={{ backgroundColor: VIAJES_ACCENT }}
          >
            {s.exploreCta}
          </button>
        </div>
      </div>
    </form>
  );
}
