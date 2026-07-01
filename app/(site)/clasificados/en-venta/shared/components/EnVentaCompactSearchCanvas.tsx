import type { ReactNode } from "react";
import { EN_VENTA_HUB_CITY_PRESETS } from "../../enVentaHubCityPresets";
import {
  EV_BTN_PRIMARY,
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
  defaultZip?: string;
  searchLabel?: string;
  cityLabel?: string;
  zipLabel?: string;
  searchButtonLabel: string;
  /** Slot below canvas — e.g. chips + filters button */
  footer?: ReactNode;
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
  defaultZip = "",
  searchLabel,
  cityLabel,
  zipLabel,
  searchButtonLabel,
  footer,
}: Props) {
  const ph = searchLabel ?? enVentaBrowseSearchPlaceholder(lang);
  const cityPh = cityLabel ?? (lang === "es" ? "Ciudad" : "City");
  const zipPh = zipLabel ?? "ZIP";

  return (
    <div className="w-full min-w-0 space-y-2">
      <form
        id={formId}
        action={action}
        method={method}
        role="search"
        onSubmit={onSubmit}
        className={EV_SEARCH_CANVAS}
      >
        <input type="hidden" name="lang" value={routeLang} />
        <div className="flex flex-col sm:grid sm:grid-cols-12 sm:items-stretch">
          <label className={`${EV_SEARCH_CELL} sm:col-span-5 sm:border-r`}>
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
              placeholder={ph}
              aria-label={ph}
              className={EV_SEARCH_INPUT}
            />
          </label>
          <label className={`${EV_SEARCH_CELL} border-t sm:col-span-2 sm:border-t-0 sm:border-r`}>
            <input
              name="city"
              type="text"
              list="en-venta-city-presets"
              defaultValue={defaultCity}
              placeholder={cityPh}
              aria-label={cityPh}
              className={EV_SEARCH_INPUT}
            />
            <datalist id="en-venta-city-presets">
              {EN_VENTA_HUB_CITY_PRESETS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className={`${EV_SEARCH_CELL} border-t sm:col-span-2 sm:border-t-0 sm:border-r`}>
            <span className="shrink-0 pl-3 text-[#3D3428]/50" aria-hidden>
              #
            </span>
            <input
              name="zip"
              type="text"
              inputMode="numeric"
              maxLength={5}
              defaultValue={defaultZip}
              placeholder={zipPh}
              aria-label={zipPh}
              className={EV_SEARCH_INPUT}
            />
          </label>
          <div className="border-t border-[#D6C7AD]/80 p-1.5 sm:col-span-3 sm:border-t-0">
            <button type="submit" className={`${EV_BTN_PRIMARY} w-full`}>
              {searchButtonLabel}
            </button>
          </div>
        </div>
      </form>
      {footer ? <div className="min-w-0">{footer}</div> : null}
    </div>
  );
}
