"use client";

import type { ViajesUi } from "../data/viajesUiCopy";
import { getViajesResultsTripTypeOptions, VIAJES_RESULTS_SOURCE_OPTIONS } from "../lib/viajesResultsTripTypeOptions";
import { VIAJES_LANDING_CTA_ORANGE } from "../lib/viajesLandingVisual";

export type ViajesResultsFiltersState = {
  destination: string;
  departureCity: string;
  budget: string;
  tripType: string;
  duration: string;
  audience: string;
  season: string;
  serviceLanguage: string;
  /** Comma-separated kinds */
  sources: string;
};

type ViajesResultsFilterRailProps = {
  value: ViajesResultsFiltersState;
  onChange: (patch: Partial<ViajesResultsFiltersState>) => void;
  onReset: () => void;
  onApply?: () => void;
  idPrefix: string;
  ui: ViajesUi;
};

export function ViajesResultsFilterRail({ value, onChange, onReset, onApply, idPrefix, ui }: ViajesResultsFilterRailProps) {
  const id = (s: string) => `${idPrefix}-${s}`;
  const f = ui.filterRail;
  const r = ui.results;
  const tripOptions = getViajesResultsTripTypeOptions(ui.lang);
  const selectedSources = new Set(
    value.sources
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  const toggleSource = (kind: string) => {
    const next = new Set(selectedSources);
    if (next.has(kind)) next.delete(kind);
    else next.add(kind);
    onChange({ sources: [...next].join(",") });
  };

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-[color:var(--lx-text)]">
        {ui.lang === "en" ? "Filter trips" : "Filtrar viajes"}
      </h2>
      <div>
        <label htmlFor={id("dest")} className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {f.destination}
        </label>
        <input
          id={id("dest")}
          className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
          value={value.destination}
          onChange={(e) => onChange({ destination: e.target.value })}
          placeholder={f.destPlaceholder}
        />
      </div>
      <div>
        <label htmlFor={id("from")} className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {f.departureCity}
        </label>
        <select
          id={id("from")}
          className="mt-1.5 w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
          value={value.departureCity}
          onChange={(e) => onChange({ departureCity: e.target.value })}
        >
          <option value="">{r.any}</option>
          <option value="san-jose">San José, California (SJC)</option>
          <option value="san-francisco">San Francisco (SFO)</option>
          <option value="oakland">Oakland (OAK)</option>
        </select>
        <p className="mt-1.5 text-[10px] leading-snug text-[color:var(--lx-muted)]">{r.departureFieldNote}</p>
      </div>
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{f.tripType}</legend>
        <ul className="mt-2 space-y-1.5">
          {tripOptions
            .filter((o) => o.value)
            .map((o) => (
              <li key={o.value}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[color:var(--lx-text)]">
                  <input
                    type="radio"
                    name={`${idPrefix}-trip`}
                    checked={value.tripType === o.value}
                    onChange={() => onChange({ tripType: o.value })}
                  />
                  {o.label}
                </label>
              </li>
            ))}
          <li>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[color:var(--lx-muted)]">
              <input
                type="radio"
                name={`${idPrefix}-trip`}
                checked={!value.tripType}
                onChange={() => onChange({ tripType: "" })}
              />
              {tripOptions[0]?.label}
            </label>
          </li>
        </ul>
      </fieldset>
      <div>
        <label htmlFor={id("budget")} className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {f.budget}
        </label>
        <select
          id={id("budget")}
          className="mt-1.5 w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
          value={value.budget}
          onChange={(e) => onChange({ budget: e.target.value })}
        >
          <option value="">{r.flexible}</option>
          <option value="economico">{r.economy}</option>
          <option value="moderado">{r.moderate}</option>
          <option value="premium">{r.premium}</option>
        </select>
      </div>
      <div>
        <label htmlFor={id("dur")} className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {f.duration}
        </label>
        <select
          id={id("dur")}
          className="mt-1.5 w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
          value={value.duration}
          onChange={(e) => onChange({ duration: e.target.value })}
        >
          <option value="">{f.durationAny}</option>
          <option value="short">{f.durationShort}</option>
          <option value="week">{f.durationWeek}</option>
          <option value="long">{f.durationLong}</option>
        </select>
      </div>
      <div>
        <label htmlFor={id("aud")} className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {f.audience}
        </label>
        <select
          id={id("aud")}
          className="mt-1.5 w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
          value={value.audience}
          onChange={(e) => onChange({ audience: e.target.value })}
        >
          <option value="">{r.audienceAll}</option>
          <option value="familias">{r.audienceFamilies}</option>
          <option value="parejas">{r.audienceCouples}</option>
          <option value="grupos">{r.audienceGroups}</option>
        </select>
      </div>
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {ui.lang === "en" ? "Source" : "Fuente"}
        </legend>
        <ul className="mt-2 space-y-1.5">
          {VIAJES_RESULTS_SOURCE_OPTIONS.map((opt) => (
            <li key={opt.value}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[color:var(--lx-text)]">
                <input
                  type="checkbox"
                  checked={selectedSources.has(opt.value)}
                  onChange={() => toggleSource(opt.value)}
                />
                {ui.lang === "en" ? opt.labelEn : opt.labelEs}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <div className="flex flex-col gap-2 pt-1">
        {onApply ? (
          <button
            type="button"
            className="w-full rounded-xl py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: VIAJES_LANDING_CTA_ORANGE }}
            onClick={onApply}
          >
            {ui.lang === "en" ? "Apply filters" : "Aplicar filtros"}
          </button>
        ) : null}
        <button
          type="button"
          className="w-full rounded-xl border border-[color:var(--lx-nav-border)] py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
          onClick={onReset}
        >
          {ui.lang === "en" ? "Clear" : "Limpiar"}
        </button>
      </div>
    </div>
  );
}

export function emptyViajesResultsFilters(): ViajesResultsFiltersState {
  return {
    destination: "",
    departureCity: "",
    budget: "",
    tripType: "",
    duration: "",
    audience: "",
    season: "",
    serviceLanguage: "",
    sources: "",
  };
}
