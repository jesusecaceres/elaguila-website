"use client";

import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import type { RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { rentasResultsToolbarPanelClass } from "@/app/clasificados/rentas/rentasLandingTheme";

type Props = {
  copy: RentasLandingCopy["results"];
  lang: RentasLandingLang;
  showingFrom: number;
  showingTo: number;
  total: number;
  sort: string;
  onSort: (v: string) => void;
  view: "grid" | "list";
  onView: (v: "grid" | "list") => void;
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

/** Rentas-only toolbar — sort & view; no map (out of scope for this category phase). */
export function RentasResultsToolbar({
  copy,
  lang,
  showingFrom,
  showingTo,
  total,
  sort,
  onSort,
  view,
  onView,
}: Props) {
  const locale = lang === "en" ? "en-US" : "es-MX";

  return (
    <div className="mt-10 border-t border-[#E4D9C8]/80 pt-2">
      <div className={rentasResultsToolbarPanelClass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-snug text-[#4A4338]/92">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#5B7C99]/85">{copy.topBarResults}</span>
        <span className="mx-2 text-[#D4C4A8]" aria-hidden>
          ·
        </span>
        {copy.countShowing}{" "}
        <span className="font-semibold text-[#1E1810]">
          {showingFrom} – {showingTo}
        </span>{" "}
        {copy.countOf} <span className="font-semibold text-[#1E1810]">{total.toLocaleString(locale)}</span>{" "}
        {copy.countResults}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-[44px] items-center gap-2 text-sm text-[#4A4338]/92 sm:min-h-0">
          <span className="sr-only">{copy.sortLabel}</span>
          <span className="hidden font-semibold sm:inline">{copy.sortLabel}</span>
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            className="min-h-[44px] rounded-full border-2 border-[#C9D4E0]/85 bg-white px-4 py-2 text-sm font-semibold text-[#1E1810] shadow-sm outline-none focus:border-[#C45C26]/35 focus:ring-2 focus:ring-[#C45C26]/12 sm:min-h-0"
          >
            <option value="reciente">{copy.sortRecent}</option>
            <option value="precio_asc">{copy.sortPriceAsc}</option>
            <option value="precio_desc">{copy.sortPriceDesc}</option>
          </select>
        </label>
        <div
          className="flex rounded-full border-2 border-[#C9D4E0]/75 bg-[#FFFCF7]/95 p-1 shadow-sm"
          role="group"
          aria-label={`${copy.viewGridAria} / ${copy.viewListAria}`}
        >
          <button
            type="button"
            aria-pressed={view === "grid"}
            onClick={() => onView("grid")}
            className={
              "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-2 transition sm:min-h-0 sm:min-w-0 " +
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
              "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-2 transition sm:min-h-0 sm:min-w-0 " +
              (view === "list" ? "bg-white text-[#1E1810] shadow-sm" : "text-[#5C5346] hover:text-[#1E1810]")
            }
            aria-label={copy.viewListAria}
          >
            <IconList />
          </button>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
