"use client";

import { getViajesTripTypeHeroOptions } from "../data/viajesTripTypes";
import type { ViajesUi } from "../data/viajesUiCopy";

export type ViajesResultsFiltersState = {
  destination: string;
  departureCity: string;
  budget: string;
  tripType: string;
  duration: string;
  audience: string;
  season: string;
};

type ViajesResultsFilterRailProps = {
  value: ViajesResultsFiltersState;
  onChange: (patch: Partial<ViajesResultsFiltersState>) => void;
  onReset: () => void;
  idPrefix: string;
  ui: ViajesUi;
};

export function ViajesResultsFilterRail({ value, onChange, onReset, idPrefix, ui }: ViajesResultsFilterRailProps) {
  const id = (s: string) => `${idPrefix}-${s}`;
  const f = ui.filterRail;
  const r = ui.results;
  const tripOptions = getViajesTripTypeHeroOptions(ui.lang);

  return (
    <div className="space-y-6">
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
          <option value="san-jose">San José, CA (SJC)</option>
          <option value="san-francisco">San Francisco (SFO)</option>
          <option value="oakland">Oakland (OAK)</option>
        </select>
      </div>
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
        <label htmlFor={id("trip")} className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {f.tripType}
        </label>
        <select
          id={id("trip")}
          className="mt-1.5 w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
          value={value.tripType}
          onChange={(e) => onChange({ tripType: e.target.value })}
        >
          {tripOptions.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
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
      <div>
        <label htmlFor={id("season")} className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {f.season}
        </label>
        <select
          id={id("season")}
          className="mt-1.5 w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
          value={value.season}
          onChange={(e) => onChange({ season: e.target.value })}
        >
          <option value="">{r.flexible}</option>
          <option value="spring">{r.spring}</option>
          <option value="summer">{r.summer}</option>
          <option value="fall">{r.fall}</option>
          <option value="winter">{r.winter}</option>
          <option value="holidays">{r.holidays}</option>
        </select>
      </div>
      <button
        type="button"
        className="w-full rounded-xl border border-[color:var(--lx-nav-border)] py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
        onClick={onReset}
      >
        {f.reset}
      </button>
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
  };
}
