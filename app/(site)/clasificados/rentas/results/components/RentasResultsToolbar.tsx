"use client";

import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import type { RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";

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
  /** Inside refine panel — no outer border/margin. */
  integrated?: boolean;
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

/** Rentas-only toolbar — sort & view; Leonix visual contract. */
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
  integrated = false,
}: Props) {
  const locale = lang === "en" ? "en-US" : "es-MX";

  return (
    <div className={integrated ? "" : "mt-6 border-t border-[#D6C7AD]/50 pt-4"}>
      <div className={integrated ? "" : "rounded-xl border border-[#D6C7AD]/45 bg-[#FFFDF7]/90 px-4 py-3 sm:px-5"}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-snug text-[#4A4338]">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#556B3E]">{copy.topBarResults}</span>
            <span className="mx-2 text-[#D6C7AD]" aria-hidden>
              ·
            </span>
            {copy.countShowing}{" "}
            <span className="font-semibold text-[#2A4536]">
              {showingFrom} – {showingTo}
            </span>{" "}
            {copy.countOf} <span className="font-semibold text-[#2A4536]">{total.toLocaleString(locale)}</span>{" "}
            {copy.countResults}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex min-h-[44px] items-center gap-2 text-sm text-[#4A4338] sm:min-h-0">
              <span className="sr-only">{copy.sortLabel}</span>
              <span className="hidden font-semibold sm:inline">{copy.sortLabel}</span>
              <select
                value={sort}
                onChange={(e) => onSort(e.target.value)}
                className="min-h-[44px] rounded-lg border border-[#C9A84A]/50 bg-white px-4 py-2 text-sm font-semibold text-[#2A4536] shadow-sm outline-none focus:border-[#7A1E2C]/35 focus:ring-2 focus:ring-[#C9A84A]/25 sm:min-h-0"
              >
                <option value="reciente">{copy.sortRecent}</option>
                <option value="precio_asc">{copy.sortPriceAsc}</option>
                <option value="precio_desc">{copy.sortPriceDesc}</option>
              </select>
            </label>
            <div
              className="flex rounded-lg border border-[#C9A84A]/45 bg-[#FAF6EE] p-1"
              role="group"
              aria-label={`${copy.viewGridAria} / ${copy.viewListAria}`}
            >
              <button
                type="button"
                aria-pressed={view === "grid"}
                onClick={() => onView("grid")}
                className={
                  "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-2 transition sm:min-h-0 sm:min-w-0 " +
                  (view === "grid" ? "bg-white text-[#2A4536] shadow-sm" : "text-[#5C5346] hover:text-[#2A4536]")
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
                  "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-2 transition sm:min-h-0 sm:min-w-0 " +
                  (view === "list" ? "bg-white text-[#2A4536] shadow-sm" : "text-[#5C5346] hover:text-[#2A4536]")
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
