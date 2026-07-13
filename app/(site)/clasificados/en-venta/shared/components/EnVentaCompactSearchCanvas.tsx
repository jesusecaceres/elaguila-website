import type { ReactNode } from "react";
import Link from "next/link";
import { EN_VENTA_HUB_CITY_PRESETS } from "../../enVentaHubCityPresets";
import { US_STATE_OPTIONS } from "../constants/enVentaLocationContract";
import {
  EV_BTN_PRIMARY,
  EV_BTN_SECONDARY,
  EV_SEARCH_CANVAS,
  EV_SEARCH_CELL,
  EV_SEARCH_INPUT,
  enVentaBrowseSearchPlaceholder,
} from "../styles/enVentaLeonixPublicUi";

type Props = {
  lang: "es" | "en";
  routeLang: string;
  action: string;
  method?: "get" | "post";
  formId?: string;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  defaultQ?: string;
  defaultCity?: string;
  defaultState?: string;
  defaultZip?: string;
  defaultCountry?: string;
  searchLabel?: string;
  cityLabel?: string;
  stateLabel?: string;
  zipLabel?: string;
  countryLabel?: string;
  searchButtonLabel: string;
  browseAllHref?: string;
  browseAllLabel?: string;
  /** Row 2 — Filters button slot */
  secondRow?: ReactNode;
  onStateChange?: () => void;
  onCountryChange?: () => void;
  /** Remount inputs when URL-driven defaults change */
  remountKey?: string;
};

export function EnVentaCompactSearchCanvas({
  lang,
  routeLang,
  action,
  method = "get",
  formId,
  onSubmit,
  defaultQ = "",
  defaultCity = "",
  defaultState = "CA",
  defaultZip = "",
  defaultCountry = "United States",
  searchLabel,
  cityLabel,
  stateLabel,
  zipLabel,
  countryLabel,
  searchButtonLabel,
  browseAllHref,
  browseAllLabel,
  secondRow,
  onStateChange,
  onCountryChange,
  remountKey,
}: Props) {
  const ph = searchLabel ?? enVentaBrowseSearchPlaceholder(lang);
  const cityPh = cityLabel ?? (lang === "es" ? "Ciudad" : "City");
  const statePh = stateLabel ?? (lang === "es" ? "Estado" : "State");
  const zipPh = zipLabel ?? "ZIP";
  const countryPh = countryLabel ?? (lang === "es" ? "País" : "Country");
  const browseLabel =
    browseAllLabel ?? (lang === "es" ? "Ver todos los anuncios" : "Browse all listings");

  return (
    <div className="w-full min-w-0">
      <form
        id={formId}
        action={action}
        method={method}
        role="search"
        onSubmit={onSubmit}
        className={EV_SEARCH_CANVAS}
      >
        <input type="hidden" name="lang" value={routeLang} />
        <div className="flex flex-col border-b border-[#D6C7AD]/80 sm:grid sm:grid-cols-12 sm:items-stretch">
          <label className={`${EV_SEARCH_CELL} border-b sm:col-span-4 sm:border-b-0 sm:border-r`}>
            <span className="shrink-0 pl-3 text-[#556B3E]" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              key={remountKey ? `q-${remountKey}` : undefined}
              name="q"
              type="search"
              autoComplete="off"
              defaultValue={defaultQ}
              placeholder={ph}
              aria-label={ph}
              className={EV_SEARCH_INPUT}
            />
          </label>
          <label className={`${EV_SEARCH_CELL} border-b sm:col-span-2 sm:border-b-0 sm:border-r`}>
            <input
              key={remountKey ? `city-${remountKey}` : undefined}
              name="city"
              type="text"
              list="en-venta-city-presets"
              defaultValue={defaultCity}
              placeholder={cityPh}
              aria-label={cityPh}
              autoComplete="address-level2"
              className={EV_SEARCH_INPUT}
            />
            <datalist id="en-venta-city-presets">
              {EN_VENTA_HUB_CITY_PRESETS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className={`${EV_SEARCH_CELL} border-b sm:col-span-2 sm:border-b-0 sm:border-r`}>
            <select
              key={remountKey ? `state-${remountKey}` : undefined}
              name="state"
              defaultValue={defaultState || "CA"}
              aria-label={statePh}
              className={`${EV_SEARCH_INPUT} appearance-none`}
              onChange={() => onStateChange?.()}
            >
              {US_STATE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.code}
                </option>
              ))}
            </select>
          </label>
          <label className={`${EV_SEARCH_CELL} border-b sm:col-span-2 sm:border-b-0 sm:border-r`}>
            <input
              key={remountKey ? `zip-${remountKey}` : undefined}
              name="zip"
              type="text"
              inputMode="numeric"
              maxLength={5}
              defaultValue={defaultZip}
              placeholder={zipPh}
              aria-label={zipPh}
              autoComplete="postal-code"
              className={EV_SEARCH_INPUT}
            />
          </label>
          <div className="hidden border-b p-1.5 sm:col-span-2 sm:block sm:border-b-0">
            <button type="submit" className={`${EV_BTN_PRIMARY} w-full`}>
              {searchButtonLabel}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 p-1.5 sm:grid sm:grid-cols-12 sm:items-center">
          <label className={`${EV_SEARCH_CELL} order-1 sm:order-none sm:col-span-3`}>
            <input
              key={remountKey ? `country-${remountKey}` : undefined}
              name="country"
              type="text"
              defaultValue={defaultCountry}
              placeholder={countryPh}
              aria-label={countryPh}
              autoComplete="country-name"
              className={EV_SEARCH_INPUT}
              onChange={() => onCountryChange?.()}
            />
          </label>
          <div className="order-2 flex flex-wrap items-center gap-1.5 sm:order-none sm:col-span-5">
            {secondRow}
          </div>
          {browseAllHref ? (
            <Link
              href={browseAllHref}
              className={`${EV_BTN_SECONDARY} order-4 inline-flex min-h-[2.625rem] w-full items-center justify-center sm:order-none sm:col-span-2 sm:w-auto`}
            >
              {browseLabel}
            </Link>
          ) : null}
          <button
            type="submit"
            className={`${EV_BTN_PRIMARY} order-3 w-full sm:hidden`}
          >
            {searchButtonLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
