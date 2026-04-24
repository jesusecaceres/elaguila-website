"use client";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { BienesRaicesMapToggle } from "../map/BienesRaicesMapToggle";
import type { BrResultsCopy } from "../bienesRaicesResultsCopy";

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
  copy: BrResultsCopy;
  lang: Lang;
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
  copy,
  lang,
}: Props) {
  const loc = lang === "en" ? "en-US" : "es-MX";
  return (
    <div className="mt-8 flex flex-col gap-4 rounded-[20px] border border-[#E8DFD0]/75 bg-[#FDFBF7]/90 px-4 py-4 shadow-[0_14px_44px_-28px_rgba(42,36,22,0.18)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm text-[#5C5346]">
        {copy.resultsCountLine}{" "}
        <span className="font-semibold text-[#1E1810]">
          {showingFrom} – {showingTo}
        </span>{" "}
        {copy.resultsCountOf} <span className="font-semibold text-[#1E1810]">{total.toLocaleString(loc)}</span>{" "}
        {copy.resultsWord}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 items-center gap-2 text-sm text-[#5C5346]">
          <span className="sr-only">{copy.sortLabel}</span>
          <span className="hidden sm:inline">{copy.sortLabel}</span>
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            className="max-w-[min(100vw-2rem,220px)] rounded-xl border border-[#E8DFD0]/90 bg-white/95 px-3 py-2 text-sm font-medium text-[#1E1810] shadow-sm outline-none focus:border-[#C9B46A]/65"
          >
            <option value="reciente">{copy.sortRecent}</option>
            <option value="precio_asc">{copy.sortPriceAsc}</option>
            <option value="precio_desc">{copy.sortPriceDesc}</option>
          </select>
        </label>
        <div className="flex rounded-xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-1 shadow-inner">
          <button
            type="button"
            aria-pressed={view === "grid"}
            onClick={() => onView("grid")}
            className={
              "rounded-lg p-2 transition " +
              (view === "grid" ? "bg-white text-[#1E1810] shadow-sm" : "text-[#5C5346] hover:text-[#1E1810]")
            }
            aria-label={copy.viewGridAria}
          >
            <IconGrid />
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => onView("list")}
            className={
              "rounded-lg p-2 transition " +
              (view === "list" ? "bg-white text-[#1E1810] shadow-sm" : "text-[#5C5346] hover:text-[#1E1810]")
            }
            aria-label={copy.viewListAria}
          >
            <IconList />
          </button>
        </div>
        <BienesRaicesMapToggle active={mapOn} onChange={onMapOn} label={copy.mapToggle} />
      </div>
    </div>
  );
}
