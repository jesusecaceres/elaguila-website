"use client";

import { useMemo, useState } from "react";
import { CategoryKey, categoryConfig } from "../config/categoryConfig";

type Lang = "es" | "en";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function FilterBar({
  category,
  lang,
}: {
  category: CategoryKey;
  lang: Lang;
}) {
  const cfg = categoryConfig[category];

  const t = useMemo(() => {
    const es = {
      searchPlaceholder: "Buscar…",
      location: "Ubicación",
      sort: "Ordenar",
      filters: "Filtros",
      comingSoon: `Próximamente: filtros completos para ${cfg.label.es}`,
      close: "Cerrar",
      hint: "Este panel es la base. La lógica completa de filtros se activa en la siguiente fase.",
    };
    const en = {
      searchPlaceholder: "Search…",
      location: "Location",
      sort: "Sort",
      filters: "Filters",
      comingSoon: `Coming soon: full filters for ${cfg.label.en}`,
      close: "Close",
      hint: "This is the foundation UI. Full filter logic ships in the next phase.",
    };
    return lang === "es" ? es : en;
  }, [cfg.label.en, cfg.label.es, lang]);

  const [q, setQ] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div
        className={cx(
          "mt-6 mb-8 rounded-2xl border border-yellow-600/20 bg-black/30",
          "px-4 py-4 md:px-6"
        )}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
              <span className="text-white/40 text-sm">⌕</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent outline-none text-white/90 placeholder:text-white/40 text-sm"
                aria-label={t.searchPlaceholder}
              />
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white/90 text-sm font-semibold hover:bg-black/50 transition"
            >
              {t.filters}
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white/90 text-sm font-semibold hover:bg-black/50 transition"
            >
              {t.sort}
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white/90 text-sm font-semibold hover:bg-black/50 transition"
            >
              {t.location}
            </button>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-400">
          {t.comingSoon}
        </div>
      </div>

      {/* Drawer (UI-only for now) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[999]">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
            onClick={() => setDrawerOpen(false)}
            aria-label={t.close}
          />
          <div className="absolute left-1/2 top-[10%] w-[92vw] max-w-xl -translate-x-1/2 rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-white font-semibold">
                {lang === "es" ? "Filtros" : "Filters"} • {cfg.label[lang]}
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-white/80 text-2xl"
                aria-label={t.close}
              >
                ×
              </button>
            </div>

            <div className="mt-3 text-sm text-white/80">
              {t.hint}
            </div>

            <div className="mt-4 rounded-xl border border-yellow-600/20 bg-black/40 p-4 text-sm text-gray-300">
              {lang === "es"
                ? "Aquí van los filtros por categoría (precio, recámaras, año, etc.)."
                : "Category-specific filters (price, beds, year, etc.) will live here."}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
