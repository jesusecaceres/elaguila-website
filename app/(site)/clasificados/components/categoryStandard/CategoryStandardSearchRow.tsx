import type { ReactNode } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
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

  return (
    <form
      action={action}
      method={method}
      className={`rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-3 shadow-[0_6px_24px_-16px_rgba(31,36,28,0.12)] sm:p-3.5 ${className}`.trim()}
    >
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
            className="min-h-[2.625rem] w-full rounded-lg border border-[#D6C7AD] bg-white px-3 text-sm text-[#1F241C] outline-none placeholder:text-[#3D3428]/50 focus:border-[#C9A84A]/70 focus:ring-2 focus:ring-[#C9A84A]/20"
          />
        </label>
        <label className="min-w-0 lg:w-40">
          <span className="sr-only">{locPh}</span>
          <input
            type="text"
            name={cityName}
            defaultValue={defaultCity}
            placeholder={locPh}
            className="min-h-[2.625rem] w-full rounded-lg border border-[#D6C7AD] bg-white px-3 text-sm text-[#1F241C] outline-none placeholder:text-[#3D3428]/50 focus:border-[#C9A84A]/70 focus:ring-2 focus:ring-[#C9A84A]/20"
          />
        </label>
        <button
          type="submit"
          className="inline-flex min-h-[2.625rem] shrink-0 items-center justify-center rounded-lg bg-[#7A1E2C] px-5 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] lg:min-w-[7rem]"
        >
          {btn}
        </button>
      </div>

      {advancedFilters ? (
        <details className="group mt-2.5 rounded-lg border border-[#D6C7AD]/60 bg-[#FAF6EE]/80">
          <summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#556B3E] marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              {ui.moreFilters}
              <span className="text-[#7A1E2C] group-open:rotate-180 transition-transform" aria-hidden>
                ▾
              </span>
            </span>
          </summary>
          <div className="border-t border-[#D6C7AD]/50 px-3 py-3">{advancedFilters}</div>
        </details>
      ) : null}

      {chips ? <div className="mt-2.5 min-w-0">{chips}</div> : null}
    </form>
  );
}
