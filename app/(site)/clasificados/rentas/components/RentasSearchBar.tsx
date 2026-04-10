"use client";

import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";

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
    <div className="rounded-[1.35rem] border border-white/80 bg-[#FFFCF7]/95 p-3 shadow-[0_16px_48px_-24px_rgba(44,36,28,0.28),0_1px_0_rgba(255,255,255,0.9)_inset] ring-1 ring-[#C4B8A8]/25 backdrop-blur-sm sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{copy.labelSearch}</span>
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#5B7C99]/85">
            {copy.labelSearch}
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#C45C26]/90" aria-hidden>
              ⌕
            </span>
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder={copy.placeholder}
              className="w-full rounded-xl border border-[#D8D2C8] bg-white py-2.5 pl-9 pr-3 text-sm text-[#1E1810] outline-none ring-0 placeholder:text-[#6B7280]/55 focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/15"
            />
          </div>
        </label>
        <div className="grid flex-1 gap-3 sm:grid-cols-3 lg:max-w-xl lg:shrink-0">
          <label>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#5B7C99]/85">{copy.tipo}</span>
            <select
              value={propertyType}
              onChange={(e) => onPropertyType(e.target.value)}
              className="w-full rounded-xl border border-[#D8D2C8] bg-white px-3 py-2.5 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/15"
            >
              <option value="">{copy.tipoPlaceholder}</option>
              <option value="casa">{copy.optCasa}</option>
              <option value="depto">{copy.optDepto}</option>
              <option value="terreno">{copy.optTerreno}</option>
              <option value="comercial">{copy.optComercial}</option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#5B7C99]/85">{copy.precio}</span>
            <select
              value={priceBand}
              onChange={(e) => onPriceBand(e.target.value)}
              className="w-full rounded-xl border border-[#D8D2C8] bg-white px-3 py-2.5 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/15"
            >
              {priceOptions.map((o) => (
                <option key={o.value || "any"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#5B7C99]/85">{copy.recs}</span>
            <select
              value={beds}
              onChange={(e) => onBeds(e.target.value)}
              className="w-full rounded-xl border border-[#D8D2C8] bg-white px-3 py-2.5 text-sm text-[#1E1810] outline-none focus:border-[#5B7C99]/45 focus:ring-2 focus:ring-[#5B7C99]/15"
            >
              <option value="">{copy.recsAny}</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={() => onSearch?.()}
          className="rounded-xl bg-[#C45C26] px-6 py-2.5 text-sm font-bold text-[#FFFBF7] shadow-[0_8px_22px_-10px_rgba(196,92,38,0.65)] transition hover:bg-[#A84E20] lg:shrink-0"
        >
          {copy.buscar}
        </button>
      </div>
    </div>
  );
}
