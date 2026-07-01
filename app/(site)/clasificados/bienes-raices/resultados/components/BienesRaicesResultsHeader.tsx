"use client";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { BrResultsCopy } from "../bienesRaicesResultsCopy";

type Props = {
  showingFrom: number;
  showingTo: number;
  total: number;
  sort: string;
  onSort: (v: string) => void;
  view: "grid" | "list";
  onView: (v: "grid" | "list") => void;
  copy: BrResultsCopy;
  lang: Lang;
  showMapToggle?: boolean;
  mapOn?: boolean;
  onMapOn?: (v: boolean) => void;
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
  copy,
  lang,
  showMapToggle = false,
  mapOn = false,
  onMapOn,
}: Props) {
  const loc = lang === "en" ? "en-US" : "es-MX";
  return (
    <div className="mt-3 flex flex-col gap-3 rounded-lg border border-[#D6C7AD]/80 bg-[#FFFDF7] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-[#5C5346]">
        {copy.resultsCountLine}{" "}
        <span className="font-semibold text-[#1F241C]">
          {showingFrom} – {showingTo}
        </span>{" "}
        {copy.resultsCountOf} <span className="font-semibold text-[#1F241C]">{total.toLocaleString(loc)}</span>{" "}
        {copy.resultsWord}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-0 items-center gap-2 text-xs text-[#5C5346]">
          <span className="sr-only">{copy.sortLabel}</span>
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            className="max-w-[min(100vw-2rem,200px)] rounded-lg border border-[#D6C7AD]/90 bg-white px-2 py-1.5 text-xs font-medium text-[#1F241C] outline-none focus:border-[#C9A84A]/65"
          >
            <option value="reciente">{copy.sortRecent}</option>
            <option value="precio_asc">{copy.sortPriceAsc}</option>
            <option value="precio_desc">{copy.sortPriceDesc}</option>
          </select>
        </label>
        <div className="flex rounded-lg border border-[#D6C7AD]/90 bg-[#FBF7EF] p-0.5">
          <button
            type="button"
            aria-pressed={view === "grid"}
            onClick={() => onView("grid")}
            className={
              "rounded-md p-1.5 transition " +
              (view === "grid" ? "bg-white text-[#1F241C] shadow-sm" : "text-[#5C5346] hover:text-[#1F241C]")
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
              "rounded-md p-1.5 transition " +
              (view === "list" ? "bg-white text-[#1F241C] shadow-sm" : "text-[#5C5346] hover:text-[#1F241C]")
            }
            aria-label={copy.viewListAria}
          >
            <IconList />
          </button>
        </div>
        {showMapToggle && onMapOn ? (
          <button
            type="button"
            aria-pressed={mapOn}
            onClick={() => onMapOn(!mapOn)}
            className="rounded-lg border border-[#D6C7AD]/90 px-2 py-1 text-xs font-semibold text-[#3D3428]"
          >
            {copy.mapToggle}
          </button>
        ) : null}
      </div>
    </div>
  );
}
