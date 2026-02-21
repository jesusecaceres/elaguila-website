"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CategoryKey, categoryConfig } from "../config/categoryConfig";
import ActiveFilterChips from "./ActiveFilterChips";

type Lang = "es" | "en";

type SortKey = "newest" | "price_asc" | "price_desc";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const RADIUS_OPTIONS = [10, 25, 40, 50] as const;

function safeGet(sp: URLSearchParams | null, key: string) {
  return (sp?.get(key) ?? "").trim();
}

function buildNextHref(pathname: string, sp: URLSearchParams, updates: Record<string, string>) {
  const next = new URLSearchParams(sp.toString());
  for (const [k, vRaw] of Object.entries(updates)) {
    const v = (vRaw ?? "").trim();
    if (!v) next.delete(k);
    else next.set(k, v);
  }
  // Keep lang always if present
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export default function FilterBar({
  category,
  lang,
}: {
  category: CategoryKey;
  lang: Lang;
}) {
  const cfg = categoryConfig[category];
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() || "";

  const t = useMemo(() => {
    const es = {
      search: "Buscar…",
      location: "Ciudad",
      radius: "Radio",
      category: "Categoría",
      sort: "Orden",
      filters: "Filtros",
      close: "Cerrar",
      contextIn: "en",
      contextMi: "mi",
      drawerTitle: "Filtros",
      drawerHint:
        "Ajusta búsqueda, ciudad y radio para ver resultados más relevantes. Más filtros según la categoría.",
      sortNewest: "Más recientes",
      sortPriceAsc: "Precio ↑",
      sortPriceDesc: "Precio ↓",
      radiusAny: "Cualquiera",
    };
    const en = {
      search: "Search…",
      location: "City",
      radius: "Radius",
      category: "Category",
      sort: "Sort",
      filters: "Filters",
      close: "Close",
      contextIn: "in",
      contextMi: "mi",
      drawerTitle: "Filters",
      drawerHint:
        "Refine your search with city and radius for better results. More filters appear by category.",
      sortNewest: "Newest",
      sortPriceAsc: "Price ↑",
      sortPriceDesc: "Price ↓",
      radiusAny: "Any",
    };
    return lang === "es" ? es : en;
  }, [lang]);

  // URL-derived values
  const urlQ = safeGet(params, "q");
  const urlCity = safeGet(params, "city");
  const urlRadius = safeGet(params, "radius");
  const urlCat = safeGet(params, "cat");
  const urlSort = (safeGet(params, "sort") as SortKey) || "newest";

  // Local UI state (debounced search)
  const [q, setQ] = useState(urlQ);
  const [city, setCity] = useState(urlCity);
  const [radius, setRadius] = useState(urlRadius);
  const [cat, setCat] = useState(urlCat || category);
  const [sort, setSort] = useState<SortKey>(urlSort);

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Keep local state synced when user navigates via back/forward
  useEffect(() => setQ(urlQ), [urlQ]);
  useEffect(() => setCity(urlCity), [urlCity]);
  useEffect(() => setRadius(urlRadius), [urlRadius]);
  useEffect(() => setSort(urlSort), [urlSort]);
  useEffect(() => {
    // If URL cat is absent, keep current category
    if (urlCat) setCat(urlCat);
  }, [urlCat]);

  // Debounce q updates to URL
  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (!params) return;
      const href = buildNextHref(pathname, params, { q });
      router.push(href);
    }, 300);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const contextLine = useMemo(() => {
    const parts: string[] = [];
    if (city) parts.push(`${t.contextIn} ${city}`);
    if (radius) parts.push(`• ${radius} ${t.contextMi}`);
    return parts.join(" ").trim();
  }, [city, radius, t.contextIn, t.contextMi]);

  const categories = useMemo(() => {
    return Object.keys(categoryConfig) as CategoryKey[];
  }, []);

  const pushNow = (updates: Record<string, string>) => {
    if (!params) return;
    const href = buildNextHref(pathname, params, updates);
    router.push(href);
  };

  return (
    <>
      <div
        className={cx(
          "mt-6 rounded-2xl border",
          "border-yellow-600/15 bg-black/35 shadow-sm",
          "px-4 py-4 md:px-6",
          // With the sticky quick actions bar above, keep filters below it on mobile
          "sticky top-[124px] z-30 backdrop-blur-md md:static"
        )}
      >
        {/* Top intent bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <span className="text-white/40 text-sm">⌕</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.search}
                className="w-full bg-transparent outline-none text-gray-100 placeholder:text-white/40 text-sm"
                aria-label={t.search}
              />
            </div>
          </div>

          {/* Location */}
          <div className="flex gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <span className="text-white/40 text-sm">📍</span>
              <input
                value={city}
                onChange={(e) => {
                  const v = e.target.value;
                  setCity(v);
                  pushNow({ city: v });
                }}
                placeholder={t.location}
                className="w-[150px] bg-transparent outline-none text-gray-100 placeholder:text-white/40 text-sm"
                aria-label={t.location}
              />
            </div>

            <select
              value={radius}
              onChange={(e) => {
                const v = e.target.value;
                setRadius(v);
                pushNow({ radius: v });
              }}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-100 outline-none"
              aria-label={t.radius}
            >
              <option value="">{t.radiusAny}</option>
              {RADIUS_OPTIONS.map((mi) => (
                <option key={mi} value={String(mi)}>
                  {mi} {t.contextMi}
                </option>
              ))}
            </select>
          </div>

          {/* Category + sort */}
          <div className="flex gap-2">
            <select
              value={cat}
              onChange={(e) => {
                const v = e.target.value;
                setCat(v);
                pushNow({ cat: v });
              }}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-100 outline-none"
              aria-label={t.category}
            >
              {categories.map((k) => (
                <option key={k} value={k}>
                  {categoryConfig[k].label[lang]}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => {
                const v = e.target.value as SortKey;
                setSort(v);
                pushNow({ sort: v });
              }}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-100 outline-none"
              aria-label={t.sort}
            >
              <option value="newest">{t.sortNewest}</option>
              <option value="price_asc">{t.sortPriceAsc}</option>
              <option value="price_desc">{t.sortPriceDesc}</option>
            </select>

            {/* Mobile-only big Filters button */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className={cx(
                "md:hidden",
                "rounded-xl border border-white/10 bg-black/20 px-3 py-2",
                "text-sm font-semibold text-gray-100 hover:bg-black/25 transition"
              )}
            >
              {t.filters}
            </button>
          </div>
        </div>

        {/* Context line */}
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-gray-400">
            <span className="text-gray-200 font-semibold">{cfg.label[lang]}</span>
            {contextLine ? <span className="ml-2">{contextLine}</span> : null}
          </div>

          {/* Desktop filters button (sidebar exists in Batch A page layout; this is fallback drawer) */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className={cx(
                "rounded-xl border border-white/10 bg-black/20 px-3 py-2",
                "text-sm font-semibold text-gray-100 hover:bg-black/25 transition"
              )}
            >
              {t.filters}
            </button>
          </div>
        </div>

        {/* Active chips */}
        <ActiveFilterChips lang={lang} />
      </div>

      {/* Full-screen panel (mobile) / modal (desktop fallback) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[999]">
          <button
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
            aria-label={t.close}
          />

          <div
            className={cx(
              "absolute left-1/2 top-[6%] w-[94vw] max-w-2xl -translate-x-1/2",
              "rounded-2xl border border-white/10 bg-[#0b0f14]/95 backdrop-blur-xl",
              "p-5"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-white font-semibold">
                  {t.drawerTitle} • {cfg.label[lang]}
                </div>
                <div className="mt-1 text-xs text-gray-400">{t.drawerHint}</div>
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

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold text-gray-100">
                  {lang === "es" ? "Filtros principales" : "Primary filters"}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {lang === "es"
                    ? "Precio, recámaras, año, salario… (según la categoría)"
                    : "Price, beds, year, salary… (by category)"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold text-gray-100">
                  {lang === "es" ? "Más filtros" : "More filters"}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {lang === "es"
                    ? "Condición, tipo de vendedor, con foto…"
                    : "Condition, seller type, has photo…"}
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-black/45 transition"
              >
                {lang === "es" ? "Listo" : "Done"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
