"use client";

import {
  BR_BTN_PRIMARY,
  BR_BTN_SECONDARY,
  BR_SEARCH_CANVAS,
  BR_SEARCH_INPUT,
  brBrowseSearchPlaceholder,
} from "../shared/bienesRaicesLeonixPublicUi";

type Props = {
  lang: "es" | "en";
  query: string;
  city: string;
  zip: string;
  onQuery: (v: string) => void;
  onCity: (v: string) => void;
  onZip: (v: string) => void;
  onSearch: () => void;
  onOpenFilters: () => void;
  searchLabel?: string;
  searchButtonLabel: string;
  filtersButtonLabel: string;
};

export function BienesRaicesCompactSearchCanvas({
  lang,
  query,
  city,
  zip,
  onQuery,
  onCity,
  onZip,
  onSearch,
  onOpenFilters,
  searchLabel,
  searchButtonLabel,
  filtersButtonLabel,
}: Props) {
  const ph = searchLabel ?? brBrowseSearchPlaceholder(lang);
  const cityPh = lang === "es" ? "Ciudad" : "City";
  const zipPh = lang === "es" ? "CP / ZIP" : "ZIP";

  return (
    <div className={BR_SEARCH_CANVAS}>
      <div className="flex flex-col sm:grid sm:grid-cols-12 sm:items-stretch">
        <label className="flex min-h-[2.625rem] min-w-0 items-center border-b border-[#D6C7AD]/80 sm:col-span-5 sm:border-b-0 sm:border-r">
          <span className="shrink-0 pl-3 text-[#556B3E]" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={ph}
            aria-label={ph}
            className={BR_SEARCH_INPUT}
            autoComplete="off"
          />
        </label>
        <label className="flex min-h-[2.625rem] min-w-0 border-b border-[#D6C7AD]/80 sm:col-span-2 sm:border-b-0 sm:border-r">
          <input
            type="text"
            value={city}
            onChange={(e) => onCity(e.target.value)}
            placeholder={cityPh}
            aria-label={cityPh}
            className={BR_SEARCH_INPUT}
            autoComplete="address-level2"
          />
        </label>
        <label className="flex min-h-[2.625rem] min-w-0 border-b border-[#D6C7AD]/80 sm:col-span-2 sm:border-b-0 sm:border-r">
          <input
            type="text"
            value={zip}
            onChange={(e) => onZip(e.target.value)}
            placeholder={zipPh}
            aria-label={zipPh}
            inputMode="numeric"
            maxLength={5}
            className={BR_SEARCH_INPUT}
            autoComplete="postal-code"
          />
        </label>
        <div className="flex gap-1.5 p-1.5 sm:col-span-3">
          <button type="button" className={`${BR_BTN_SECONDARY} flex-1`} onClick={onOpenFilters}>
            {filtersButtonLabel}
          </button>
          <button type="button" className={`${BR_BTN_PRIMARY} flex-[1.2]`} onClick={onSearch}>
            {searchButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
