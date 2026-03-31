"use client";

import { BienesRaicesMapToggle } from "../map/BienesRaicesMapToggle";

type Props = {
  showingFrom: number;
  showingTo: number;
  total: number;
  sort: string;
  onSort: (v: string) => void;
  view: "grid" | "list";
  onView: (v: "grid" | "list") => void;
  mapOn: boolean;
  onMapOn: (v: boolean) => void;
};

function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconList({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 7h12M8 12h12M8 17h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="5" cy="7" r="1.2" fill="currentColor" />
      <circle cx="5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="5" cy="17" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function BienesRaicesResultsHeader({
  showingFrom,
  showingTo,
  total,
  sort,
  onSort,
  view,
  onView,
  mapOn,
  onMapOn,
}: Props) {
  return (
    <div className="mt-8 flex flex-col gap-4 border-b border-[#E8DFD0]/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[#5C5346]">
        Mostrando{" "}
        <span className="font-semibold text-[#1E1810]">
          {showingFrom} – {showingTo}
        </span>{" "}
        de <span className="font-semibold text-[#1E1810]">{total.toLocaleString("es-MX")}</span> resultados
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[#5C5346]">
          <span className="sr-only">Ordenar</span>
          <span className="hidden sm:inline">Orden</span>
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            className="rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm font-medium text-[#1E1810] outline-none focus:border-[#C9B46A]/65"
          >
            <option value="reciente">Más reciente</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-[#5C5346]">
          <span className="sr-only">Precio</span>
          <span className="hidden sm:inline">Precio</span>
          <select className="rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm font-medium text-[#1E1810] outline-none focus:border-[#C9B46A]/65">
            <option>Lista</option>
            <option>Por m²</option>
          </select>
        </label>
        <div className="flex rounded-lg border border-[#E8DFD0] bg-[#FFFCF7] p-0.5">
          <button
            type="button"
            aria-pressed={view === "grid"}
            onClick={() => onView("grid")}
            className={
              "rounded-md p-2 " +
              (view === "grid" ? "bg-white text-[#1E1810] shadow-sm" : "text-[#5C5346] hover:text-[#1E1810]")
            }
            aria-label="Vista cuadrícula"
          >
            <IconGrid />
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => onView("list")}
            className={
              "rounded-md p-2 " +
              (view === "list" ? "bg-white text-[#1E1810] shadow-sm" : "text-[#5C5346] hover:text-[#1E1810]")
            }
            aria-label="Vista lista"
          >
            <IconList />
          </button>
        </div>
        <BienesRaicesMapToggle active={mapOn} onChange={onMapOn} />
      </div>
    </div>
  );
}
