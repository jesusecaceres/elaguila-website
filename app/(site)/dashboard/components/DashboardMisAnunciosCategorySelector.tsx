"use client";

import { useEffect, useRef, useState } from "react";
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

function chipLabel(cat: MisAnunciosCategoryDef, count: number, lang: Lang): string {
  const title = cat.title(lang);
  if (count <= 0) return title;
  return `${title} · ${count}`;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedDef = categories.find((c) => c.key === selected) ?? categories[0];
  const selectedCount = counts[selected] ?? 0;

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const dropdownLabel =
    lang === "es"
      ? `Categoría: ${selectedDef.title(lang)} (${selectedCount})`
      : `Category: ${selectedDef.title(lang)} (${selectedCount})`;

  return (
    <nav className="mt-6 min-w-0" aria-label={lang === "es" ? "Categorías" : "Categories"}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A6B1F]">
        {lang === "es" ? "Elige categoría" : "Choose category"}
      </p>

      <div className="relative mt-2" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex w-full min-h-[44px] items-center justify-between gap-3 rounded-xl border border-[#C9A84A]/45 bg-[#FFFDF7] px-4 py-2.5 text-left text-sm font-semibold text-[#1F241C] shadow-sm ring-1 ring-[#C9A84A]/12 hover:border-[#C9A84A]/60 sm:max-w-md"
          aria-expanded={menuOpen}
          aria-haspopup="listbox"
        >
          <span className="min-w-0 truncate">{dropdownLabel}</span>
          <span className="shrink-0 text-[#8A6B1F]" aria-hidden>
            ▾
          </span>
        </button>

        {menuOpen ? (
          <ul
            className="absolute z-30 mt-1 max-h-[min(18rem,60vh)] w-full min-w-[16rem] overflow-y-auto rounded-xl border border-[#D6C7AD]/80 bg-[#FFFCF7] py-1 shadow-[0_16px_40px_-12px_rgba(31,36,28,0.18)] sm:max-w-md"
            role="listbox"
          >
            {categories.map((cat) => {
              const count = counts[cat.key] ?? 0;
              const isSelected = selected === cat.key;
              return (
                <li key={cat.key} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(cat.key);
                      setMenuOpen(false);
                    }}
                    className={cx(
                      "flex w-full items-start justify-between gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-[#FBF7EF]",
                      isSelected && "bg-[#FAF4EA]/90 font-semibold text-[#1F241C]",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">{cat.title(lang)}</span>
                      <span className="mt-0.5 block text-xs text-[#7A7164]">
                        {count > 0
                          ? dashboardCategoryCountLabel(count, lang)
                          : lang === "es"
                            ? "Sin publicaciones"
                            : "No listings"}
                      </span>
                    </span>
                    <span className={cat.ready ? LX_DASH.badgeReady : LX_DASH.badgeSoon}>
                      {cat.ready ? readyLabel : soonLabel}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((cat) => {
          const count = counts[cat.key] ?? 0;
          const isSelected = selected === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelect(cat.key)}
              className={cx(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold tabular-nums transition",
                isSelected
                  ? "border-[#7A1E2C]/20 bg-[#7A1E2C] text-[#FFFCF7] shadow-sm"
                  : "border-[#D6C7AD]/70 bg-[#FFFCF7] text-[#3D3428] hover:border-[#C9A84A]/45 hover:bg-[#FBF7EF]",
              )}
            >
              {chipLabel(cat, count, lang)}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
