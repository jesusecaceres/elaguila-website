"use client";

import Link from "next/link";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { buildBrResultsUrl } from "@/app/clasificados/bienes-raices/shared/constants/brResultsRoutes";

const ITEMS: { id: BrNegocioCategoriaPropiedad | ""; label: string }[] = [
  { id: "", label: "Todas" },
  { id: "residencial", label: "Residencial" },
  { id: "comercial", label: "Comercial" },
  { id: "terreno_lote", label: "Terreno / lote" },
];

export function BienesRaicesPropiedadFilterChips({ active }: { active: BrNegocioCategoriaPropiedad | null }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2" role="navigation" aria-label="Tipo estructural">
      <span className="w-full text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75 sm:w-auto sm:mr-1">
        Categoría
      </span>
      {ITEMS.map((item) => {
        const isOn = item.id === "" ? active == null : active === item.id;
        const href =
          item.id === ""
            ? buildBrResultsUrl()
            : buildBrResultsUrl({ [BR_NEGOCIO_Q_PROPIEDAD]: item.id });
        return (
          <Link
            key={item.label}
            href={href}
            scroll={false}
            className={
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm " +
              (isOn
                ? "border-[#C9B46A]/70 bg-[#2A2620] text-[#FAF7F2] shadow-sm"
                : "border-[#E8DFD0] bg-white/90 text-[#3D3630] hover:border-[#C9B46A]/45")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
