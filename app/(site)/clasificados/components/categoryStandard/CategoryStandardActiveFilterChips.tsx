"use client";

import Link from "next/link";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { CATEGORY_STANDARD_CHIP } from "./categoryStandardTheme";

export type ActiveFilterChip = {
  key: string;
  label: string;
  href: string;
};

type Props = {
  lang: Lang;
  chips: ActiveFilterChip[];
  className?: string;
};

export function CategoryStandardActiveFilterChips({ lang, chips, className = "" }: Props) {
  if (!chips.length) return null;
  const heading = lang === "es" ? "Filtros activos" : "Active filters";

  return (
    <div className={`min-w-0 ${className}`.trim()} data-testid="category-active-filter-chips">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8A6B1F]">{heading}</p>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <Link
            key={chip.key}
            href={chip.href}
            className={`${CATEGORY_STANDARD_CHIP} gap-1 pr-1.5 hover:border-[#7A1E2C]/40 hover:bg-[#F9EEF0]`}
            title={lang === "es" ? "Quitar filtro" : "Remove filter"}
          >
            <span>{chip.label}</span>
            <span className="text-[#7A1E2C]" aria-hidden>
              ×
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
