"use client";

import Link from "next/link";
import { LEONIX_LB_CITY_PRESETS } from "@/app/clasificados/shared/constants/leonixLocalBusinessCityPresets";
import {
  LEONIX_LB_DEFAULT_COUNTRY,
  LEONIX_LB_DEFAULT_STATE,
  US_STATE_OPTIONS,
} from "@/app/clasificados/shared/constants/leonixPropertyLocationContract";
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
  state: string;
  zip: string;
  country: string;
  onQuery: (v: string) => void;
  onCity: (v: string) => void;
  onState: (v: string) => void;
  onZip: (v: string) => void;
  onCountry: (v: string) => void;
  onSearch: () => void;
  onOpenFilters: () => void;
  browseAllHref?: string;
  searchButtonLabel: string;
  filtersButtonLabel: string;
};

export function BienesRaicesCompactSearchCanvas({
  lang,
  query,
  city,
  state,
  zip,
  country,
  onQuery,
  onCity,
  onState,
  onZip,
  onCountry,
  onSearch,
  onOpenFilters,
  browseAllHref,
  searchButtonLabel,
  filtersButtonLabel,
}: Props) {
  const ph = brBrowseSearchPlaceholder(lang);
  const cityPh = lang === "es" ? "Ciudad" : "City";
  const statePh = lang === "es" ? "Estado" : "State";
  const zipPh = "ZIP";
  const countryPh = lang === "es" ? "País" : "Country";
  const browseLabel = lang === "es" ? "Ver todos los anuncios" : "View all listings";

  return (
    <div className={BR_SEARCH_CANVAS}>
      <div className="flex flex-col sm:grid sm:grid-cols-12 sm:items-stretch">
        <label className="flex min-h-[2.625rem] min-w-0 items-center border-b border-[#D6C7AD]/80 sm:col-span-4 sm:border-b-0 sm:border-r">
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
            className={`${BR_SEARCH_INPUT} px-2`}
            autoComplete="off"
          />
        </label>
        <label className="flex min-h-[2.625rem] min-w-0 border-b border-[#D6C7AD]/80 sm:col-span-2 sm:border-b-0 sm:border-r">
          <input
            type="text"
            value={city}
            onChange={(e) => onCity(e.target.value)}
            list="br-city-presets"
            placeholder={cityPh}
            aria-label={cityPh}
            className={BR_SEARCH_INPUT}
            autoComplete="address-level2"
          />
          <datalist id="br-city-presets">
            {LEONIX_LB_CITY_PRESETS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="flex min-h-[2.625rem] min-w-0 border-b border-[#D6C7AD]/80 sm:col-span-2 sm:border-b-0 sm:border-r">
          <select
            value={state || LEONIX_LB_DEFAULT_STATE}
            onChange={(e) => onState(e.target.value)}
            aria-label={statePh}
            className={`${BR_SEARCH_INPUT} appearance-none`}
          >
            {US_STATE_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.code}
              </option>
            ))}
          </select>
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
        <div className="hidden p-1.5 sm:col-span-2 sm:block">
          <button type="button" className={`${BR_BTN_PRIMARY} w-full`} onClick={onSearch}>
            {searchButtonLabel}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 p-1.5 sm:grid sm:grid-cols-12 sm:items-center">
        <label className="order-1 flex min-h-[2.625rem] min-w-0 items-center sm:order-none sm:col-span-3">
          <input
            type="text"
            value={country}
            onChange={(e) => onCountry(e.target.value)}
            placeholder={countryPh}
            aria-label={countryPh}
            className={BR_SEARCH_INPUT}
            autoComplete="country-name"
          />
        </label>
        <div className="order-2 flex flex-wrap items-center gap-1.5 sm:order-none sm:col-span-4">
          <button type="button" className={BR_BTN_SECONDARY} onClick={onOpenFilters}>
            {filtersButtonLabel}
          </button>
        </div>
        {browseAllHref ? (
          <Link
            href={browseAllHref}
            className={`${BR_BTN_SECONDARY} order-4 inline-flex w-full items-center justify-center sm:order-none sm:col-span-3 sm:w-auto`}
          >
            {browseLabel}
          </Link>
        ) : null}
        <button type="button" className={`${BR_BTN_PRIMARY} order-3 w-full sm:hidden`} onClick={onSearch}>
          {searchButtonLabel}
        </button>
      </div>
    </div>
  );
}
