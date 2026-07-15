import type { FormEventHandler, ReactNode } from "react";
import Link from "next/link";
import { LEONIX_LB_CITY_PRESETS } from "../constants/leonixLocalBusinessCityPresets";
import {
  LEONIX_LB_DEFAULT_COUNTRY,
  LEONIX_LB_DEFAULT_STATE,
  US_STATE_OPTIONS,
} from "../constants/leonixLocalBusinessLocationContract";
export const LX_LB_SEARCH_CANVAS =
  "overflow-hidden rounded-xl border border-[#D6C7AD]/90 bg-[#FFFDF7] shadow-[0_6px_22px_-16px_rgba(31,36,28,0.16)]";
export const LX_LB_BTN_PRIMARY =
  "inline-flex min-h-[2.625rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721]";
export const LX_LB_BTN_SECONDARY =
  "inline-flex min-h-[2.625rem] items-center justify-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3.5 text-sm font-semibold text-[#3D3428] hover:border-[#C9A84A] hover:bg-[#FBF7EF]";
export const LX_LB_SEARCH_CELL =
  "flex min-h-[2.625rem] min-w-0 items-center border-b border-[#D6C7AD]/80 sm:border-b-0 sm:border-r";
export const LX_LB_SEARCH_INPUT =
  "min-h-[2.625rem] w-full min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#3D3428]/45";

type Props = {
  lang: "es" | "en";
  routeLang: string;
  action: string;
  method?: "get" | "post";
  formId?: string;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  onSubmitCapture?: FormEventHandler<HTMLFormElement>;
  defaultQ?: string;
  defaultCity?: string;
  defaultState?: string;
  defaultZip?: string;
  defaultCountry?: string;
  keywordPlaceholder?: string;
  searchButtonLabel: string;
  filtersHref?: string;
  filtersLabel?: string;
  browseAllHref?: string;
  browseAllLabel?: string;
  /** Row 2 slot after country (sort/per-page on results). */
  secondRow?: ReactNode;
  cityDatalistId?: string;
  showFiltersButton?: boolean;
  onStateChange?: () => void;
  onCountryChange?: () => void;
};

export function LeonixLocalBusinessCompactSearchCanvas({
  lang,
  routeLang,
  action,
  method = "get",
  formId,
  onSubmit,
  onSubmitCapture,
  defaultQ = "",
  defaultCity = "",
  defaultState = LEONIX_LB_DEFAULT_STATE,
  defaultZip = "",
  defaultCountry = LEONIX_LB_DEFAULT_COUNTRY,
  keywordPlaceholder,
  searchButtonLabel,
  filtersHref,
  filtersLabel,
  browseAllHref,
  browseAllLabel,
  secondRow,
  cityDatalistId = "leonix-lb-city-presets",
  showFiltersButton = true,
  onStateChange,
  onCountryChange,
}: Props) {
  const kwPh =
    keywordPlaceholder ??
    (lang === "es" ? "Servicio, oficio o negocio…" : "Service, trade, or business…");
  const cityPh = lang === "es" ? "Ciudad" : "City";
  const statePh = lang === "es" ? "Estado" : "State";
  const zipPh = "ZIP";
  const countryPh = lang === "es" ? "País" : "Country";
  const filtersText = filtersLabel ?? (lang === "es" ? "Filtros" : "Filters");
  const browseText =
    browseAllLabel ?? (lang === "es" ? "Ver todos los anuncios" : "View all listings");

  return (
    <div className="w-full min-w-0">
      <form
        id={formId}
        action={action}
        method={method}
        role="search"
        onSubmit={onSubmit}
        onSubmitCapture={onSubmitCapture}
        className={LX_LB_SEARCH_CANVAS}
      >
        <input type="hidden" name="lang" value={routeLang} />
        <div className="flex flex-col border-b border-[#D6C7AD]/80 sm:grid sm:grid-cols-12 sm:items-stretch">
          <label className={`${LX_LB_SEARCH_CELL} sm:col-span-4`}>
            <span className="shrink-0 pl-3 text-[#556B3E]" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              name="q"
              type="search"
              autoComplete="off"
              defaultValue={defaultQ}
              placeholder={kwPh}
              aria-label={kwPh}
              className={`${LX_LB_SEARCH_INPUT} px-2`}
            />
          </label>
          <label className={`${LX_LB_SEARCH_CELL} sm:col-span-2`}>
            <input
              name="city"
              type="text"
              list={cityDatalistId}
              defaultValue={defaultCity}
              placeholder={cityPh}
              aria-label={cityPh}
              autoComplete="address-level2"
              className={LX_LB_SEARCH_INPUT}
            />
            <datalist id={cityDatalistId}>
              {LEONIX_LB_CITY_PRESETS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className={`${LX_LB_SEARCH_CELL} sm:col-span-2`}>
            <select
              name="state"
              defaultValue={defaultState || LEONIX_LB_DEFAULT_STATE}
              aria-label={statePh}
              className={`${LX_LB_SEARCH_INPUT} appearance-none`}
              onChange={() => onStateChange?.()}
            >
              {US_STATE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.code}
                </option>
              ))}
            </select>
          </label>
          <label className={`${LX_LB_SEARCH_CELL} sm:col-span-2`}>
            <input
              name="zip"
              type="text"
              inputMode="numeric"
              defaultValue={defaultZip}
              placeholder={zipPh}
              aria-label={zipPh}
              autoComplete="postal-code"
              className={LX_LB_SEARCH_INPUT}
            />
          </label>
          <div className="hidden p-1.5 sm:col-span-2 sm:block">
            <button type="submit" className={`${LX_LB_BTN_PRIMARY} w-full`}>
              {searchButtonLabel}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 p-1.5 sm:grid sm:grid-cols-12 sm:items-center">
          <label className={`${LX_LB_SEARCH_CELL} order-1 border-b-0 sm:order-none sm:col-span-3 sm:border-r-0`}>
            <input
              name="country"
              type="text"
              defaultValue={defaultCountry}
              placeholder={countryPh}
              aria-label={countryPh}
              autoComplete="country-name"
              className={LX_LB_SEARCH_INPUT}
              onChange={() => onCountryChange?.()}
            />
          </label>
          <div className="order-2 flex flex-wrap items-center gap-1.5 sm:order-none sm:col-span-4">
            {showFiltersButton && filtersHref ? (
              <Link href={filtersHref} className={`${LX_LB_BTN_SECONDARY} min-w-[5rem] text-center`}>
                {filtersText}
              </Link>
            ) : null}
            {secondRow}
          </div>
          {browseAllHref ? (
            <Link
              href={browseAllHref}
              className={`${LX_LB_BTN_SECONDARY} order-4 inline-flex w-full items-center justify-center sm:order-none sm:col-span-3 sm:w-auto`}
            >
              {browseText}
            </Link>
          ) : null}
          <button type="submit" className={`${LX_LB_BTN_PRIMARY} order-3 w-full sm:hidden`}>
            {searchButtonLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
