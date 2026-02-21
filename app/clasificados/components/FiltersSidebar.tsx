"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryKey, categoryConfig } from "../config/categoryConfig";

type Lang = "es" | "en";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function countActiveDeepFilters(sp: URLSearchParams | null) {
  if (!sp) return 0;
  let n = 0;
  sp.forEach((value, key) => {
    const v = value?.trim() ?? "";
    if (!v) return;
    if (["lang", "q", "city", "radius", "cat", "sort", "page"].includes(key)) return;
    n += 1;
  });
  return n;
}

export default function FiltersSidebar({
  category,
  lang,
  collapsed,
  onToggleCollapsed,
}: {
  category: CategoryKey;
  lang: Lang;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const cfg = categoryConfig[category];
  const params = useSearchParams();

  const t = useMemo(() => {
    const es = {
      filters: "Filtros",
      hint: "Filtros por categoría (UI). La lógica completa se conecta en la siguiente fase.",
      placeholder: "Ejemplos: precio, recámaras, año, salario, etc.",
    };
    const en = {
      filters: "Filters",
      hint: "Category filters (UI). Full logic will be connected in the next phase.",
      placeholder: "Examples: price, beds, year, salary, etc.",
    };
    return lang === "es" ? es : en;
  }, [lang]);

  const activeCount = useMemo(() => countActiveDeepFilters(params), [params]);

  return (
    <aside
      className={cx(
        "hidden md:block",
        collapsed ? "w-[44px]" : "w-[270px]",
        "shrink-0"
      )}
    >
      {/* Collapsed tab */}
      {collapsed ? (
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={cx(
            "h-full w-full rounded-2xl border",
            "border-yellow-600/15 bg-black/35 hover:bg-black/45 transition",
            "flex items-center justify-center"
          )}
          aria-label={t.filters}
          title={t.filters}
        >
          <div className="flex flex-col items-center gap-2 py-4">
            <div
              className="text-xs font-semibold tracking-wide text-gray-200"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              {t.filters}
              {activeCount > 0 ? ` (${activeCount})` : ""}
            </div>
          </div>
        </button>
      ) : (
        <div className="rounded-2xl border border-yellow-600/15 bg-black/35 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-100">
                {t.filters} • {cfg.label[lang]}
              </div>
              <div className="mt-1 text-xs text-gray-400">{t.hint}</div>
            </div>
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="rounded-xl border border-yellow-600/15 bg-black/35 px-2 py-1 text-xs text-gray-200 hover:bg-black/45 transition"
              aria-label={t.filters}
              title={t.filters}
            >
              ◀
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-yellow-600/10 bg-black/25 p-3">
              <div className="text-xs font-semibold text-gray-200">
                {lang === "es" ? "Filtros principales" : "Primary filters"}
              </div>
              <div className="mt-2 text-xs text-gray-400">{t.placeholder}</div>
            </div>

            <div className="rounded-xl border border-yellow-600/10 bg-black/25 p-3">
              <div className="text-xs font-semibold text-gray-200">
                {lang === "es" ? "Más filtros" : "More filters"}
              </div>
              <div className="mt-2 text-xs text-gray-400">{t.placeholder}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
