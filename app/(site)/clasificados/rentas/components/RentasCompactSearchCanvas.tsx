"use client";

import Link from "next/link";
import { LEONIX_LB_CITY_PRESETS } from "@/app/clasificados/shared/constants/leonixLocalBusinessCityPresets";
import {
  LEONIX_LB_DEFAULT_STATE,
  US_STATE_OPTIONS,
} from "@/app/clasificados/shared/constants/leonixPropertyLocationContract";
import {
  RENTAS_BTN_PRIMARY,
  RENTAS_BTN_SECONDARY,
  RENTAS_SEARCH_FIELD,
  RENTAS_SEARCH_INPUT,
  RENTAS_SEARCH_SHELL,
  RENTAS_SEARCH_SHELL_GLOW,
  rentasBrowseSearchPlaceholder,
} from "../shared/rentasLeonixPublicUi";

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
  layout?: "default" | "landing";
};

function SearchIcon() {
  return (
    <span className="shrink-0 pl-3 text-[#556B3E]" aria-hidden>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3-3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function RentasCompactSearchCanvas({
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
  layout = "default",
}: Props) {
  const ph = rentasBrowseSearchPlaceholder(lang);
  const cityPh = lang === "es" ? "Ciudad" : "City";
  const statePh = lang === "es" ? "Estado" : "State";
  const zipPh = "ZIP";
  const countryPh = lang === "es" ? "País" : "Country";
  const browseLabel = lang === "es" ? "Ver todos los anuncios" : "View all listings";
  const isLanding = layout === "landing";
  const datalistId = isLanding ? "rentas-city-presets-landing" : "rentas-city-presets";

  return (
    <div className={RENTAS_SEARCH_SHELL}>
      <div className={RENTAS_SEARCH_SHELL_GLOW} aria-hidden />

      <div className="relative grid grid-cols-1 gap-2 sm:grid-cols-12 sm:gap-2.5">
        <label className={`${RENTAS_SEARCH_FIELD} ${isLanding ? "sm:col-span-5" : "sm:col-span-4"}`}>
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={ph}
            aria-label={ph}
            className={`${RENTAS_SEARCH_INPUT} px-2`}
            autoComplete="off"
          />
        </label>
        <label className={`${RENTAS_SEARCH_FIELD} sm:col-span-2`}>
          <input
            type="text"
            value={city}
            onChange={(e) => onCity(e.target.value)}
            list={datalistId}
            placeholder={cityPh}
            aria-label={cityPh}
            className={RENTAS_SEARCH_INPUT}
            autoComplete="address-level2"
          />
          <datalist id={datalistId}>
            {LEONIX_LB_CITY_PRESETS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className={`${RENTAS_SEARCH_FIELD} sm:col-span-2`}>
          <select
            value={state || LEONIX_LB_DEFAULT_STATE}
            onChange={(e) => onState(e.target.value)}
            aria-label={statePh}
            className={`${RENTAS_SEARCH_INPUT} appearance-none`}
          >
            {US_STATE_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.code}
              </option>
            ))}
          </select>
        </label>
        <label className={`${RENTAS_SEARCH_FIELD} sm:col-span-1`}>
          <input
            type="text"
            value={zip}
            onChange={(e) => onZip(e.target.value)}
            placeholder={zipPh}
            aria-label={zipPh}
            inputMode="numeric"
            maxLength={5}
            className={`${RENTAS_SEARCH_INPUT} px-2 text-center`}
            autoComplete="postal-code"
          />
        </label>
        <div className="hidden sm:col-span-2 sm:block">
          <button type="button" className={`${RENTAS_BTN_PRIMARY} w-full`} onClick={onSearch}>
            {searchButtonLabel}
          </button>
        </div>
      </div>

      <div className="relative mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-stretch sm:gap-2.5">
        <label className={`${RENTAS_SEARCH_FIELD} sm:col-span-4`}>
          <input
            type="text"
            value={country}
            onChange={(e) => onCountry(e.target.value)}
            placeholder={countryPh}
            aria-label={countryPh}
            className={RENTAS_SEARCH_INPUT}
            autoComplete="country-name"
          />
        </label>
        <div className="sm:col-span-3">
          <button type="button" className={`${RENTAS_BTN_SECONDARY} w-full`} onClick={onOpenFilters}>
            {filtersButtonLabel}
          </button>
        </div>
        {browseAllHref ? (
          <Link href={browseAllHref} className={`${RENTAS_BTN_SECONDARY} sm:col-span-5 inline-flex w-full items-center justify-center`}>
            {browseLabel}
          </Link>
        ) : (
          <div className="hidden sm:col-span-5 sm:block" aria-hidden />
        )}
        <button type="button" className={`${RENTAS_BTN_PRIMARY} w-full sm:hidden`} onClick={onSearch}>
          {searchButtonLabel}
        </button>
      </div>
    </div>
  );
}
