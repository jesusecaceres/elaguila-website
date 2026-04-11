"use client";

import Link from "next/link";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import { RENTAS_LANDING_LANG_QUERY, type RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { RENTAS_QUERY_PAGE } from "@/app/clasificados/rentas/shared/rentasResultsQueryKeys";
import { RENTAS_RESULTS } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

type Props = {
  active: BrNegocioCategoriaPropiedad | null;
  lang: RentasLandingLang;
  copy: RentasLandingCopy;
  /** Current results query string (preserves filters when switching category). */
  queryString: string;
};

export function RentasPropiedadFilterChips({ active, lang, copy, queryString }: Props) {
  const qe = copy.quickExplore;
  const items: { id: BrNegocioCategoriaPropiedad | ""; label: string }[] = [
    { id: "", label: copy.results.categoryAll },
    { id: "residencial", label: qe.chipResidencial },
    { id: "comercial", label: qe.chipComercial },
    { id: "terreno_lote", label: qe.chipTerreno },
  ];

  const buildHref = (id: BrNegocioCategoriaPropiedad | "") => {
    const sp = new URLSearchParams(queryString || "");
    sp.set(RENTAS_LANDING_LANG_QUERY, lang);
    if (id === "") sp.delete(BR_NEGOCIO_Q_PROPIEDAD);
    else sp.set(BR_NEGOCIO_Q_PROPIEDAD, id);
    sp.delete(RENTAS_QUERY_PAGE);
    const qs = sp.toString();
    return qs ? `${RENTAS_RESULTS}?${qs}` : `${RENTAS_RESULTS}?${RENTAS_LANDING_LANG_QUERY}=${lang}`;
  };

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2" role="navigation" aria-label={copy.results.categoryLabel}>
      <span className="w-full text-[10px] font-bold uppercase tracking-[0.12em] text-[#5B7C99]/85 sm:mr-1 sm:w-auto">
        {copy.results.categoryLabel}
      </span>
      {items.map((item) => {
        const isOn = item.id === "" ? active == null : active === item.id;
        return (
          <Link
            key={item.label}
            href={buildHref(item.id)}
            scroll={false}
            className={
              "rounded-full border px-3.5 py-2 text-xs font-semibold transition sm:text-sm " +
              (isOn
                ? "border-[#C45C26]/45 bg-[#C45C26] text-[#FFFBF7] shadow-[0_6px_18px_-8px_rgba(196,92,38,0.55)]"
                : "border-[#C9D4E0]/85 bg-gradient-to-b from-[#FBFCFE] to-[#F4F7FA] text-[#3D3630] hover:border-[#5B7C99]/35")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
