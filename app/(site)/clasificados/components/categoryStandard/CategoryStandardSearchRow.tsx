import type { ReactNode } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  CAT_STD_BTN_PRIMARY,
  CAT_STD_FORM_PANEL,
} from "./categoryStandardStyles";
import { categoryStandardUi } from "./categoryStandardTheme";

export type CategoryStandardSearchRowProps = {
  lang: Lang;
  action: string;
  method?: "get";
  qName?: string;
  cityName?: string;
  defaultQ?: string;
  defaultCity?: string;
  searchPlaceholder: string;
  locationPlaceholder?: string;
  searchButtonLabel?: string;
  hiddenFields?: Record<string, string>;
  /** Extra filter fields rendered in advanced panel */
  advancedFilters?: ReactNode;
  /** Quick chips below primary row */
  chips?: ReactNode;
  className?: string;
};

/**
 * Standard horizontal search row — GET form preserves query-param contract.
 * Leonix burgundy/gold/cream — aligned with Rentas V7 search shell DNA.
 */
export function CategoryStandardSearchRow({
  lang,
  action,
  method = "get",
  qName = "q",
  cityName = "city",
  defaultQ = "",
  defaultCity = "",
  searchPlaceholder,
  locationPlaceholder,
  searchButtonLabel,
  hiddenFields,
  advancedFilters,
  chips,
  className = "",
}: CategoryStandardSearchRowProps) {
  const ui = categoryStandardUi(lang);
  const locPh = locationPlaceholder ?? ui.cityZip;
  const btn = searchButtonLabel ?? ui.search;
  const fieldClass =
    "min-h-[2.875rem] w-full rounded-lg border border-[#D6C7AD]/70 bg-white px-3 text-sm text-[#1F241C] outline-none placeholder:text-[#3D3428]/50 focus:border-[#C9A84A]/70 focus:ring-2 focus:ring-[#C9A84A]/20";

  return (
    <form action={action} method={method} className={`${CAT_STD_FORM_PANEL} ${className}`.trim()}>
      <input type="hidden" name="lang" value={lang} />
      {hiddenFields
        ? Object.entries(hiddenFields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
        : null}

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{searchPlaceholder}</span>
          <input
            type="search"
            name={qName}
            defaultValue={defaultQ}
            placeholder={searchPlaceholder}
            className={fieldClass}
          />
        </label>
        <label className="min-w-0 lg:w-44">
          <span className="sr-only">{locPh}</span>
          <input type="text" name={cityName} defaultValue={defaultCity} placeholder={locPh} className={fieldClass} />
        </label>
        <button type="submit" className={`${CAT_STD_BTN_PRIMARY} shrink-0 lg:min-w-[7.5rem]`}>
          {btn}
        </button>
      </div>

      {advancedFilters ? (
        <details className="group mt-3 rounded-lg border border-[#C9A84A]/30 bg-[#FAF6EE]/80">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-[#556B3E] marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              {ui.moreFilters}
              <span className="text-[#7A1E2C] transition-transform group-open:rotate-180" aria-hidden>
                ▾
              </span>
            </span>
          </summary>
          <div className="border-t border-[#D6C7AD]/50 px-3 py-3">{advancedFilters}</div>
        </details>
      ) : null}

      {chips ? <div className="mt-3 min-w-0">{chips}</div> : null}
    </form>
  );
}
