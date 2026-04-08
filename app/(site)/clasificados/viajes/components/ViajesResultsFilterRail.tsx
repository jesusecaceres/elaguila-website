"use client";

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
};

export function ViajesResultsFilterRail({ value, onChange, onReset, idPrefix }: ViajesResultsFilterRailProps) {
  const id = (s: string) => `${idPrefix}-${s}`;

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor={id("dest")} className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          Destino
        </label>
        <input
          id={id("dest")}
          className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
          value={value.destination}
          onChange={(e) => onChange({ destination: e.target.value })}
          placeholder="Ciudad o país"
        />
      </div>
      <div>
        <label htmlFor={id("from")} className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          Ciudad de salida
        </label>
        <select
          id={id("from")}
          className="mt-1.5 w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
          value={value.departureCity}
          onChange={(e) => onChange({ departureCity: e.target.value })}
        >
          <option value="">Cualquiera</option>
          <option value="san-jose">San José (SJO)</option>
          <option value="san-francisco">San Francisco</option>
          <option value="oakland">Oakland</option>
        </select>
      </div>
      <div>
        <label htmlFor={id("budget")} className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          Presupuesto
        </label>
        <select
          id={id("budget")}
          className="mt-1.5 w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
          value={value.budget}
          onChange={(e) => onChange({ budget: e.target.value })}
        >
          <option value="">Flexible</option>
          <option value="economico">Económico</option>
          <option value="moderado">Moderado</option>
          <option value="premium">Premium</option>
        </select>
      </div>
      <div>
        <label htmlFor={id("trip")} className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          Tipo de viaje
        </label>
        <select
          id={id("trip")}
          className="mt-1.5 w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
          value={value.tripType}
          onChange={(e) => onChange({ tripType: e.target.value })}
        >
          <option value="">Todos</option>
          <option value="resort">Resort / paquete</option>
          <option value="tour">Tour / excursión</option>
          <option value="crucero">Crucero</option>
        </select>
      </div>
      <div>
        <label htmlFor={id("dur")} className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          Duración
        </label>
        <select
          id={id("dur")}
          className="mt-1.5 w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
          value={value.duration}
          onChange={(e) => onChange({ duration: e.target.value })}
        >
          <option value="">Cualquiera</option>
          <option value="short">1–4 noches</option>
          <option value="week">5–7 noches</option>
          <option value="long">8+ noches</option>
        </select>
      </div>
      <div>
        <label htmlFor={id("aud")} className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          Público
        </label>
        <select
          id={id("aud")}
          className="mt-1.5 w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
          value={value.audience}
          onChange={(e) => onChange({ audience: e.target.value })}
        >
          <option value="">Todos</option>
          <option value="familias">Familias</option>
          <option value="parejas">Parejas</option>
          <option value="grupos">Grupos</option>
        </select>
      </div>
      <div>
        <label htmlFor={id("season")} className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          Fechas / temporada
        </label>
        <select
          id={id("season")}
          className="mt-1.5 w-full cursor-pointer rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
          value={value.season}
          onChange={(e) => onChange({ season: e.target.value })}
        >
          <option value="">Flexible</option>
          <option value="spring">Primavera</option>
          <option value="summer">Verano</option>
          <option value="fall">Otoño</option>
          <option value="winter">Invierno</option>
          <option value="holidays">Festividades</option>
        </select>
      </div>
      <button
        type="button"
        className="w-full rounded-xl border border-[color:var(--lx-nav-border)] py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
        onClick={onReset}
      >
        Limpiar filtros
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
