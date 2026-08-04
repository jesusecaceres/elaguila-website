"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { getViajesTripTypeHeroOptions } from "../data/viajesTripTypes";
import type { ViajesUi } from "../data/viajesUiCopy";
import { buildViajesResultsUrl } from "../lib/buildViajesResultsUrl";
import { getViajesOriginById, VIAJES_ORIGIN_BUCKETS } from "../lib/viajesOrigins";
import { useBrowserLocationForViajes } from "../lib/useBrowserLocationForViajes";
import { VIAJES_LANDING_CTA_ORANGE } from "../lib/viajesLandingVisual";
import { ViajesDestinationAutocomplete } from "./ViajesDestinationAutocomplete";

type ViajesSearchBarProps = {
  resultsBasePath?: string;
  lang?: Lang;
  ui: ViajesUi;
  /** Compact target gateway: 4 fields + Buscar, no tall helper copy */
  compact?: boolean;
};

const FIELD =
  "w-full min-w-0 cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2.5 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";

const LABEL = "mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";

export function ViajesSearchBar({
  resultsBasePath = "/clasificados/viajes/resultados",
  lang = "es",
  ui,
  compact = true,
}: ViajesSearchBarProps) {
  const router = useRouter();
  const s = ui.search;
  const tripOptions = getViajesTripTypeHeroOptions(lang);
  const [destinationLabel, setDestinationLabel] = useState("");
  const [canonicalDest, setCanonicalDest] = useState<string | null>(null);
  const [departure, setDeparture] = useState("");
  const [tripType, setTripType] = useState("");
  const [budget, setBudget] = useState("");
  const [departureFromGeo, setDepartureFromGeo] = useState(false);
  const { state: geoState, requestLocation } = useBrowserLocationForViajes();

  useEffect(() => {
    if (geoState.status === "ready") {
      setDeparture(geoState.originId);
      setDepartureFromGeo(true);
    }
  }, [geoState]);

  const exploreHref = useMemo(() => {
    const canon = canonicalDest?.trim();
    const label = destinationLabel.trim();
    return buildViajesResultsUrl(
      {
        destination: canon || undefined,
        destinationQuery: !canon && label ? label : undefined,
        departure: departure || undefined,
        tripType: tripType || undefined,
        budget: budget || undefined,
        lang,
        originByGeo: departureFromGeo && Boolean(departure),
      },
      resultsBasePath
    );
  }, [budget, canonicalDest, departure, departureFromGeo, destinationLabel, lang, resultsBasePath, tripType]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push(exploreHref);
  };

  const searchLabel = lang === "en" ? "Search" : "Buscar";

  return (
    <form
      onSubmit={onSubmit}
      aria-label={searchLabel}
      className={
        compact
          ? "max-w-full min-w-0 overflow-hidden rounded-2xl bg-transparent p-0"
          : "max-w-full min-w-0 overflow-hidden rounded-2xl border border-[color:var(--lx-gold-border)]/70 bg-[#fffdf9]/98 p-3 sm:p-4"
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end lg:gap-3">
        <label className="min-w-0">
          <span className={LABEL}>{s.whereTo}</span>
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

        <div className="min-w-0">
          <span className={LABEL}>{s.departureFrom}</span>
          <div className="flex gap-2">
            <select
              className={`${FIELD} min-h-[44px] flex-1`}
              value={departure}
              onChange={(e) => {
                setDeparture(e.target.value);
                setDepartureFromGeo(false);
              }}
              aria-label={s.departureAria}
            >
              <option value="">{s.anyOrigin}</option>
              {VIAJES_ORIGIN_BUCKETS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id === "san-jose" ? "San José, California (SJC)" : `${o.label} · ${o.airportLine}`}
                </option>
              ))}
            </select>
            {!compact ? (
              <button
                type="button"
                onClick={requestLocation}
                disabled={geoState.status === "requesting"}
                className="min-h-[44px] shrink-0 rounded-xl border border-[color:var(--lx-gold-border)] px-3 text-xs font-bold"
              >
                {geoState.status === "requesting" ? s.locationRequesting : s.useMyLocation}
              </button>
            ) : null}
          </div>
          {compact ? (
            <p className="mt-1.5 text-[10px] text-[color:var(--lx-muted)]">
              <button
                type="button"
                onClick={requestLocation}
                disabled={geoState.status === "requesting"}
                className="font-semibold text-[color:var(--lx-burgundy)] underline-offset-2 hover:underline disabled:opacity-60"
              >
                {geoState.status === "requesting" ? s.locationRequesting : s.useMyLocation}
              </button>
              {geoState.status === "ready" ? (
                <span className="ml-2">
                  {s.geoReady(
                    getViajesOriginById(geoState.originId)?.label ?? geoState.originId,
                    getViajesOriginById(geoState.originId)?.airportLine ?? ""
                  )}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>

        <label className="min-w-0">
          <span className={LABEL}>{s.tripType}</span>
          <select className={`${FIELD} min-h-[44px]`} value={tripType} onChange={(e) => setTripType(e.target.value)}>
            {tripOptions.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0">
          <span className={LABEL}>{s.budget}</span>
          <select className={`${FIELD} min-h-[44px]`} value={budget} onChange={(e) => setBudget(e.target.value)}>
            <option value="">{s.budgetFlexible}</option>
            <option value="economico">{s.budgetEconomy}</option>
            <option value="moderado">{s.budgetModerate}</option>
            <option value="premium">{s.budgetPremium}</option>
          </select>
        </label>

        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <button
            type="submit"
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl px-5 text-sm font-bold text-white shadow-[0_10px_24px_-8px_rgba(234,88,12,0.55)] transition hover:brightness-[1.05] lg:min-w-[120px]"
            style={{ backgroundColor: VIAJES_LANDING_CTA_ORANGE }}
          >
            {searchLabel}
          </button>
        </div>
      </div>

    </form>
  );
}
