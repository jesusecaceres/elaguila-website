"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { mergeBrResultsHref, parseBrResultsUrl } from "../lib/brResultsUrlState";
import type { BrResultsCopy } from "../bienesRaicesResultsCopy";

const ITEMS: { id: BrNegocioCategoriaPropiedad | ""; labelEs: string; labelEn: string }[] = [
  { id: "", labelEs: "Todas", labelEn: "All" },
  { id: "residencial", labelEs: "Residencial", labelEn: "Residential" },
  { id: "comercial", labelEs: "Comercial", labelEn: "Commercial" },
  { id: "terreno_lote", labelEs: "Terreno / lote", labelEn: "Land / lot" },
];

export function BienesRaicesPropiedadFilterChips({
  active,
  copy,
}: {
  active: BrNegocioCategoriaPropiedad | null;
  copy: BrResultsCopy;
}) {
  const searchParams = useSearchParams();
  const sp = searchParams ?? new URLSearchParams();
  const { lang } = parseBrResultsUrl(sp);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2" role="navigation" aria-label={copy.categoryHeading}>
      <span className="w-full text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75 sm:mr-1 sm:w-auto">
        {copy.categoryHeading}
      </span>
      {ITEMS.map((item) => {
        const isOn = item.id === "" ? active == null : active === item.id;
        const label = lang === "en" ? item.labelEn : item.labelEs;
        const href =
          item.id === ""
            ? mergeBrResultsHref(sp, { [BR_NEGOCIO_Q_PROPIEDAD]: null }, lang)
            : mergeBrResultsHref(sp, { [BR_NEGOCIO_Q_PROPIEDAD]: item.id }, lang);
        return (
          <Link
            key={item.labelEs}
            href={href}
            scroll={false}
            className={
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm " +
              (isOn
                ? "border-[#C9B46A]/70 bg-[#2A2620] text-[#FAF7F2] shadow-sm"
                : "border-[#E8DFD0] bg-white/90 text-[#3D3630] hover:border-[#C9B46A]/45")
            }
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
