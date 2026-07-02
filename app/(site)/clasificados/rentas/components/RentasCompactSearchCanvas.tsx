"use client";

import Link from "next/link";
import { FiSliders } from "react-icons/fi";
import { LEONIX_LB_CITY_PRESETS } from "@/app/clasificados/shared/constants/leonixLocalBusinessCityPresets";
import {
  LEONIX_LB_DEFAULT_STATE,
  US_STATE_OPTIONS,
} from "@/app/clasificados/shared/constants/leonixPropertyLocationContract";
import {
  RENTAS_BTN_PRIMARY,
  RENTAS_BTN_PRIMARY_LANDING,
  RENTAS_BTN_SECONDARY,
  RENTAS_BTN_SECONDARY_LANDING,
  RENTAS_SEARCH_FIELD,
  RENTAS_SEARCH_FIELD_LANDING,
  RENTAS_SEARCH_INPUT,
  RENTAS_SEARCH_INPUT_LANDING,
  RENTAS_SEARCH_SHELL,
  RENTAS_SEARCH_SHELL_GLOW,
  RENTAS_SEARCH_SHELL_GLOW_LANDING,
  RENTAS_SEARCH_SHELL_LANDING,
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

function SearchIcon({ large }: { large?: boolean }) {
  return (
    <span className={`shrink-0 text-[#556B3E] ${large ? "pl-3.5" : "pl-3"}`} aria-hidden>
      <svg width={large ? 18 : 16} height={large ? 18 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
  const shellClass = isLanding ? RENTAS_SEARCH_SHELL_LANDING : RENTAS_SEARCH_SHELL;
  const glowClass = isLanding ? RENTAS_SEARCH_SHELL_GLOW_LANDING : RENTAS_SEARCH_SHELL_GLOW;
  const fieldClass = isLanding ? RENTAS_SEARCH_FIELD_LANDING : RENTAS_SEARCH_FIELD;
  const inputClass = isLanding ? RENTAS_SEARCH_INPUT_LANDING : RENTAS_SEARCH_INPUT;
  const btnPrimary = isLanding ? RENTAS_BTN_PRIMARY_LANDING : RENTAS_BTN_PRIMARY;
  const btnSecondary = isLanding ? RENTAS_BTN_SECONDARY_LANDING : RENTAS_BTN_SECONDARY;
  const gridGap = "gap-2.5 sm:gap-3";

  return (
    <div className={shellClass}>
      <div className={glowClass} aria-hidden />

      <div className={`relative grid grid-cols-1 ${gridGap} sm:grid-cols-12 sm:items-stretch`}>
        <label className={`${fieldClass} ${isLanding ? "sm:col-span-5" : "sm:col-span-4"}`}>
          <SearchIcon large={isLanding} />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={ph}
            aria-label={ph}
            className={`${inputClass} ${isLanding ? "font-medium" : ""}`}
            autoComplete="off"
          />
        </label>
        <label className={`${fieldClass} sm:col-span-2`}>
          <input
            type="text"
            value={city}
            onChange={(e) => onCity(e.target.value)}
            list={datalistId}
            placeholder={cityPh}
            aria-label={cityPh}
            className={inputClass}
            autoComplete="address-level2"
          />
          <datalist id={datalistId}>
            {LEONIX_LB_CITY_PRESETS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className={`${fieldClass} sm:col-span-2`}>
          <select
            value={state || LEONIX_LB_DEFAULT_STATE}
            onChange={(e) => onState(e.target.value)}
            aria-label={statePh}
            className={`${inputClass} appearance-none`}
          >
            {US_STATE_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.code}
              </option>
            ))}
          </select>
        </label>
        <label className={`${fieldClass} sm:col-span-1`}>
          <input
            type="text"
            value={zip}
            onChange={(e) => onZip(e.target.value)}
            placeholder={zipPh}
            aria-label={zipPh}
            inputMode="numeric"
            maxLength={5}
            className={`${inputClass} px-2 text-center`}
            autoComplete="postal-code"
          />
        </label>
        <div className="hidden sm:col-span-2 sm:block">
          <button type="button" className={`${btnPrimary} w-full`} onClick={onSearch}>
            {searchButtonLabel}
          </button>
        </div>
      </div>

      <div className={`relative mt-3 grid grid-cols-1 ${gridGap} sm:grid-cols-12 sm:items-stretch`}>
        <label className={`${fieldClass} sm:col-span-4`}>
          <span className="sr-only">{countryPh}</span>
          <span className="hidden shrink-0 pl-3 text-[10px] font-bold uppercase tracking-wide text-[#556B3E]/80 sm:inline" aria-hidden>
            {countryPh}
          </span>
          <input
            type="text"
            value={country}
            onChange={(e) => onCountry(e.target.value)}
            placeholder={countryPh}
            aria-label={countryPh}
            className={inputClass}
            autoComplete="country-name"
          />
        </label>
        <div className="sm:col-span-3">
          <button type="button" className={`${btnSecondary} w-full`} onClick={onOpenFilters}>
            <FiSliders className="h-4 w-4 shrink-0 text-[#556B3E]" aria-hidden />
            {filtersButtonLabel}
          </button>
        </div>
        {browseAllHref ? (
          <Link href={browseAllHref} className={`${btnSecondary} sm:col-span-5 inline-flex w-full items-center justify-center`}>
            {browseLabel}
          </Link>
        ) : (
          <div className="hidden sm:col-span-5 sm:block" aria-hidden />
        )}
        <button type="button" className={`${btnPrimary} w-full sm:hidden`} onClick={onSearch}>
          {searchButtonLabel}
        </button>
      </div>
    </div>
  );
}
