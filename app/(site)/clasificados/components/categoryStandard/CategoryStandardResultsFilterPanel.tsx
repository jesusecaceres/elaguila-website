import Link from "next/link";
import type { ReactNode } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { categoryStandardUi } from "./categoryStandardTheme";
import {
  CAT_STD_BTN_PRIMARY,
  CAT_STD_BTN_SECONDARY,
  CAT_STD_FILTER_INPUT,
  CAT_STD_FILTER_LABEL,
  CAT_STD_FILTER_SELECT,
  CAT_STD_FORM_PANEL,
} from "./categoryStandardStyles";

export {
  CAT_STD_BTN_PRIMARY,
  CAT_STD_BTN_SECONDARY,
  CAT_STD_FILTER_INPUT,
  CAT_STD_FILTER_LABEL,
  CAT_STD_FILTER_SELECT,
  CAT_STD_FORM_PANEL,
};

type Props = {
  lang: Lang;
  action: string;
  /** Primary row: q + optional city (use children for custom primary row) */
  defaultQ?: string;
  defaultCity?: string;
  searchPlaceholder?: string;
  cityPlaceholder?: string;
  primaryRow?: ReactNode;
  advancedFilters: ReactNode;
  clearHref: string;
  applyLabel?: string;
};

/**
 * Results filter form — compact search row + collapsed advanced filters (CAT-STD-1).
 */
export function CategoryStandardResultsFilterPanel({
  lang,
  action,
  defaultQ = "",
  defaultCity = "",
  searchPlaceholder,
  cityPlaceholder,
  primaryRow,
  advancedFilters,
  clearHref,
  applyLabel,
}: Props) {
  const ui = categoryStandardUi(lang);
  const searchPh = searchPlaceholder ?? (lang === "es" ? "Buscar…" : "Search…");
  const cityPh = cityPlaceholder ?? ui.cityZip;
  const apply = applyLabel ?? (lang === "es" ? "Aplicar filtros" : "Apply filters");

  return (
    <form action={action} method="get" className={CAT_STD_FORM_PANEL}>
      <input type="hidden" name="lang" value={lang} />
      {primaryRow ?? (
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{searchPh}</span>
            <input
              className={CAT_STD_FILTER_INPUT}
              name="q"
              defaultValue={defaultQ}
              placeholder={searchPh}
            />
          </label>
          <label className="min-w-0 lg:w-40">
            <span className="sr-only">{cityPh}</span>
            <input
              className={CAT_STD_FILTER_INPUT}
              name="city"
              defaultValue={defaultCity}
              placeholder={cityPh}
            />
          </label>
          <button type="submit" className={`${CAT_STD_BTN_PRIMARY} shrink-0 lg:min-w-[7.5rem]`}>
            {ui.search}
          </button>
        </div>
      )}

      <details className="group mt-2.5 rounded-lg border border-[#D6C7AD]/60 bg-[#FAF6EE]/80">
        <summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#556B3E] marker:content-none [&::-webkit-details-marker]:hidden">
          {ui.moreFilters}
        </summary>
        <div className="space-y-3 border-t border-[#D6C7AD]/50 px-3 py-3">{advancedFilters}</div>
      </details>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <button type="submit" className={CAT_STD_BTN_PRIMARY}>
          {apply}
        </button>
        <Link href={clearHref} className={CAT_STD_BTN_SECONDARY}>
          {ui.clearFilters}
        </Link>
      </div>
    </form>
  );
}
