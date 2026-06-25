"use client";

import { LX_DASH } from "../lib/dashboardLeonixTheme";
import { dashboardCategoryCountLabel } from "../lib/dashboardCountDefinitions";
import type { MisAnunciosCategoryDef, MisAnunciosCategoryKey } from "../lib/dashboardMisAnunciosCategories";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

type Props = {
  lang: Lang;
  categories: MisAnunciosCategoryDef[];
  counts: Record<MisAnunciosCategoryKey, number>;
  selected: MisAnunciosCategoryKey;
  onSelect: (key: MisAnunciosCategoryKey) => void;
  readyLabel: string;
  soonLabel: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function DashboardMisAnunciosCategorySelector({
  lang,
  categories,
  counts,
  selected,
  onSelect,
  readyLabel,
  soonLabel,
}: Props) {
  return (
    <nav
      className="flex flex-col gap-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
      aria-label={lang === "es" ? "Categorías" : "Categories"}
    >
      <p className="mb-1 hidden text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A6B1F] lg:block">
        {lang === "es" ? "Elige categoría" : "Choose category"}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {categories.map((cat) => {
          const count = counts[cat.key] ?? 0;
          const isSelected = selected === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelect(cat.key)}
              className={cx(
                "min-w-[11.5rem] shrink-0 rounded-2xl border p-4 text-left transition lg:min-w-0 lg:w-full",
                isSelected
                  ? "border-[#C9A84A]/70 bg-gradient-to-br from-[#FFFDF7] to-[#FAF4EA] shadow-[0_8px_24px_-10px_rgba(201,168,74,0.35)] ring-2 ring-[#C9A84A]/25"
                  : "border-[#D6C7AD]/70 bg-[#FFFCF7]/95 hover:border-[#C9A84A]/35 hover:bg-[#FBF7EF]",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-serif text-base font-semibold text-[#1F241C]">{cat.title(lang)}</span>
                <span className={cat.ready ? LX_DASH.badgeReady : LX_DASH.badgeSoon}>
                  {cat.ready ? readyLabel : soonLabel}
                </span>
              </div>
              <p className="mt-1.5 text-xs tabular-nums text-[#5C5346]">
                {count > 0 ? dashboardCategoryCountLabel(count, lang) : lang === "es" ? "Sin publicaciones" : "No listings"}
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[#7A7164]">{cat.description(lang)}</p>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
