"use client";

import { FiSearch } from "react-icons/fi";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import { rentasSearchShellClass, rentasSearchSubmitClass } from "@/app/clasificados/rentas/rentasLandingTheme";

type Props = {
  query: string;
  onQuery: (v: string) => void;
  propertyType: string;
  onPropertyType: (v: string) => void;
  priceBand: string;
  onPriceBand: (v: string) => void;
  beds: string;
  onBeds: (v: string) => void;
  onSearch?: () => void;
  copy: RentasLandingCopy["search"];
  priceOptions: RentasLandingCopy["priceOptions"];
};

const fieldClass =
  "w-full rounded-xl border border-[#D4CBC0] bg-white py-2.5 pl-3 pr-3 text-sm text-[#1E1810] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] placeholder:text-[#6B7280]/55 focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/18";

export function RentasSearchBar({
  query,
  onQuery,
  propertyType,
  onPropertyType,
  priceBand,
  onPriceBand,
  beds,
  onBeds,
  onSearch,
  copy,
  priceOptions,
}: Props) {
  return (
    <div className={rentasSearchShellClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-4">
        <label className="min-w-0 flex-1 lg:flex-[1.15]">
          <span className="sr-only">{copy.labelSearch}</span>
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">
            {copy.labelSearch}
          </span>
          <div className="relative">
            <FiSearch
              className="pointer-events-none absolute left-3.5 top-1/2 h-[1.1rem] w-[1.1rem] -translate-y-1/2 text-[#C45C26]/90"
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder={copy.placeholder}
              className={`${fieldClass} pl-10`}
            />
          </div>
        </label>
        <div className="grid flex-1 gap-3 sm:grid-cols-3 lg:max-w-[28rem] lg:shrink-0">
          <label>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.tipo}</span>
            <select
              value={propertyType}
              onChange={(e) => onPropertyType(e.target.value)}
              className={fieldClass}
            >
              <option value="">{copy.tipoPlaceholder}</option>
              <option value="casa">{copy.optCasa}</option>
              <option value="depto">{copy.optDepto}</option>
              <option value="terreno">{copy.optTerreno}</option>
              <option value="comercial">{copy.optComercial}</option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.precio}</span>
            <select
              value={priceBand}
              onChange={(e) => onPriceBand(e.target.value)}
              className={fieldClass}
            >
              {priceOptions.map((o) => (
                <option key={o.value || "any"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{copy.recs}</span>
            <select value={beds} onChange={(e) => onBeds(e.target.value)} className={fieldClass}>
              <option value="">{copy.recsAny}</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </label>
        </div>
        <button type="button" onClick={() => onSearch?.()} className={rentasSearchSubmitClass}>
          <FiSearch className="h-4 w-4 opacity-95 lg:hidden" aria-hidden />
          {copy.buscar}
        </button>
      </div>
    </div>
  );
}
