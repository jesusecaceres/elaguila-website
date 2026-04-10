"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaMapMarkerAlt, FaSearch, FaStar } from "react-icons/fa";

import Navbar from "@/app/components/Navbar";
import { RESTAURANTE_CUISINES, RESTAURANTE_PRICE_LEVELS } from "@/app/clasificados/restaurantes/application/restauranteTaxonomy";
import {
  RESTAURANTES_PUBLIC_BLUEPRINT_ROWS,
  type RestaurantesPublicBlueprintRow,
} from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import { filterRestaurantesBlueprintRows, sortRestaurantesBlueprintRows } from "@/app/clasificados/restaurantes/lib/filterRestaurantesBlueprintRows";
import {
  buildRestaurantesResultsHref,
  parseRestaurantesResultsSearchParams,
  restaurantesDiscoveryStateToParams,
  splitLocationInput,
  type RestaurantesDiscoveryLang,
  type RestaurantesDiscoveryState,
} from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

const ACCENT = "#D97706";
const PAGE_SIZE = 9;

function labelForSvcParam(svc: string, lang: RestaurantesDiscoveryLang): string {
  switch (svc) {
    case "dine_in":
      return lang === "es" ? "Comer en local" : "Dine-in";
    case "takeout":
      return lang === "es" ? "Para llevar" : "Takeout";
    case "delivery":
      return lang === "es" ? "Entrega a domicilio" : "Delivery";
    default:
      return svc;
  }
}

function mergeDiscovery(
  base: RestaurantesDiscoveryState,
  patch: Partial<RestaurantesDiscoveryState>,
): RestaurantesDiscoveryState {
  return { ...base, ...patch };
}

export function RestaurantesResultsShell() {
  const router = useRouter();
  const sp = useSearchParams();
  const spStr = sp?.toString() ?? "";

  const parsed = useMemo(() => parseRestaurantesResultsSearchParams(new URLSearchParams(spStr)), [spStr]);
  const lang: RestaurantesDiscoveryLang = parsed.lang;

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const [qInput, setQInput] = useState(parsed.q);
  const [locInput, setLocInput] = useState(parsed.zip || parsed.city || "");

  useEffect(() => {
    setQInput(parsed.q);
    setLocInput(parsed.zip || parsed.city || "");
  }, [parsed.q, parsed.city, parsed.zip]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [spStr]);

  const effectiveSort = useMemo(() => {
    if (parsed.top) return "rating-desc" as const;
    return parsed.sort;
  }, [parsed.top, parsed.sort]);

  const filteredUnsorted = useMemo(() => filterRestaurantesBlueprintRows(RESTAURANTES_PUBLIC_BLUEPRINT_ROWS, parsed), [parsed]);

  const sorted = useMemo(() => sortRestaurantesBlueprintRows(filteredUnsorted, effectiveSort), [filteredUnsorted, effectiveSort]);

  const promotedBand = useMemo(() => sorted.filter((r) => r.promoted).slice(0, 3), [sorted]);
  const promotedIds = useMemo(() => new Set(promotedBand.map((r) => r.id)), [promotedBand]);

  const gridRows = useMemo(() => sorted.filter((r) => !promotedIds.has(r.id)), [sorted, promotedIds]);

  const shown = useMemo(() => gridRows.slice(0, visible), [gridRows, visible]);

  const pushState = useCallback(
    (next: RestaurantesDiscoveryState) => {
      const href = buildRestaurantesResultsHref(lang, restaurantesDiscoveryStateToParams(next));
      router.push(href);
    },
    [lang, router],
  );

  const onSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const loc = splitLocationInput(locInput);
    pushState(
      mergeDiscovery(parsed, {
        q: qInput.trim(),
        city: loc.city ?? "",
        zip: loc.zip ?? "",
        page: 1,
      }),
    );
  };

  const t = useMemo(() => {
    if (lang === "en") {
      return {
        title: "Restaurants",
        subtitle: "Same search and filters as the Restaurants home—refine what you started on Leonix.",
        journeyLine: "Tune cuisine, service mode, and location; every control maps to profile data as listings grow.",
        searchPh: "Name, cuisine, or dish…",
        locationPh: "City or 5-digit ZIP",
        search: "Search",
        filters: "Filters",
        close: "Close",
        count: "Showing",
        results: "places",
        resultsMatching: "matching places",
        sort: "Sort",
        sortNew: "Newest",
        sortName: "Name A–Z",
        sortRating: "Highest rated",
        loadMore: "Load more",
        emptyTitle: "Nothing matched yet",
        emptyBody: "Loosen a filter, clear a chip, or return to the Restaurants page to start fresh—Leonix keeps your search intent intact.",
        emptyCta: "Back to Restaurants home",
        featured: "Featured on Leonix",
        promotedBadge: "Destacado",
        verMas: "See more",
        cuisine: "Cuisine",
        city: "City",
        zip: "ZIP",
        price: "Price range",
        service: "Service",
        serviceFull: "Service mode",
        dietFull: "Diet or preference",
        any: "Any",
        all: "All",
        openNow: "Open now",
        family: "Family-friendly",
        diet: "Dietary",
        apply: "Apply filters",
        reset: "Reset",
        active: "Active filters",
        backLanding: "Restaurants home",
        eyebrow: "Leonix · Clasificados",
        nearReserved: "Nearby (coming soon)",
      };
    }
    return {
      title: "Restaurantes",
      subtitle: "La misma búsqueda y filtros que en el inicio de Restaurantes—continúa lo que empezaste en Leonix.",
      journeyLine: "Ajusta cocina, modo de servicio y ubicación; cada control refleja datos del perfil cuando los anuncios crezcan.",
      searchPh: "Nombre, cocina o platillo…",
      locationPh: "Ciudad o código postal (5 dígitos)",
      search: "Buscar",
      filters: "Filtros",
      close: "Cerrar",
      count: "Mostrando",
      results: "lugares",
      resultsMatching: "lugares que coinciden",
      sort: "Orden",
      sortNew: "Más recientes",
      sortName: "Nombre A–Z",
      sortRating: "Mejor valorados",
      loadMore: "Cargar más",
      emptyTitle: "Aún no hay coincidencias",
      emptyBody:
        "Afloja un filtro, quita una etiqueta o vuelve al inicio de Restaurantes para reorientar la búsqueda—Leonix mantiene tu intención.",
      emptyCta: "Volver al inicio de Restaurantes",
      featured: "Destacados en Leonix",
      promotedBadge: "Destacado",
      verMas: "Ver más",
      cuisine: "Cocina",
      city: "Ciudad",
      zip: "Código postal",
      price: "Precio",
      service: "Servicio",
      serviceFull: "Modo de servicio",
      dietFull: "Dieta o preferencia",
      any: "Cualquiera",
      all: "Todas",
      openNow: "Abierto ahora",
      family: "Familiar",
      diet: "Preferencias",
      apply: "Aplicar filtros",
      reset: "Restablecer",
      active: "Filtros activos",
      backLanding: "Inicio Restaurantes",
      eyebrow: "Leonix · Clasificados",
      nearReserved: "Cerca (próximamente)",
    };
  }, [lang]);

  const landingHref = appendLangToPath("/clasificados/restaurantes", lang);

  const filterPanel = (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-[#2D241E]/60">{t.cuisine}</label>
        <select
          className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
          value={parsed.cuisine}
          onChange={(e) => pushState(mergeDiscovery(parsed, { cuisine: e.target.value, page: 1 }))}
        >
          <option value="">{t.all}</option>
          {RESTAURANTE_CUISINES.filter((c) => c.key !== "other").map((c) => (
            <option key={c.key} value={c.key}>
              {c.labelEs}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#2D241E]/60">{t.city}</label>
        <input
          className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
          defaultValue={parsed.city}
          key={`city-${parsed.city}`}
          onBlur={(e) => pushState(mergeDiscovery(parsed, { city: e.target.value.trim(), page: 1 }))}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#2D241E]/60">{t.zip}</label>
        <input
          className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
          defaultValue={parsed.zip}
          key={`zip-${parsed.zip}`}
          inputMode="numeric"
          maxLength={5}
          onBlur={(e) =>
            pushState(mergeDiscovery(parsed, { zip: e.target.value.replace(/\D/g, "").slice(0, 5), page: 1 }))
          }
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#2D241E]/60">{t.price}</label>
        <select
          className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
          value={parsed.price}
          onChange={(e) => pushState(mergeDiscovery(parsed, { price: e.target.value, page: 1 }))}
        >
          <option value="">{t.any}</option>
          {RESTAURANTE_PRICE_LEVELS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.labelEs}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#2D241E]/60">{t.serviceFull}</label>
        <select
          className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
          value={parsed.svc}
          onChange={(e) => pushState(mergeDiscovery(parsed, { svc: e.target.value, page: 1 }))}
        >
          <option value="">{t.any}</option>
          <option value="dine_in">{lang === "es" ? "Comer en local" : "Dine-in"}</option>
          <option value="takeout">{lang === "es" ? "Para llevar" : "Takeout"}</option>
          <option value="delivery">{lang === "es" ? "Entrega a domicilio" : "Delivery"}</option>
        </select>
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#2D241E]">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-[#2D241E]/20"
          checked={parsed.open}
          onChange={(e) => pushState(mergeDiscovery(parsed, { open: e.target.checked, page: 1 }))}
        />
        {t.openNow}
      </label>
      <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#2D241E]">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-[#2D241E]/20"
          checked={parsed.family}
          onChange={(e) => pushState(mergeDiscovery(parsed, { family: e.target.checked, page: 1 }))}
        />
        {t.family}
      </label>
      <div>
        <label className="text-xs font-semibold text-[#2D241E]/60">{t.dietFull}</label>
        <select
          className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
          value={parsed.diet}
          onChange={(e) =>
            pushState(
              mergeDiscovery(parsed, {
                diet: (e.target.value as RestaurantesDiscoveryState["diet"]) || "",
                page: 1,
              }),
            )
          }
        >
          <option value="">{t.any}</option>
          <option value="vegan">Vegano (opciones)</option>
          <option value="glutenfree">Sin gluten</option>
          <option value="halal">Halal</option>
        </select>
      </div>
      <button
        type="button"
        className="w-full min-h-[48px] rounded-[12px] border border-[#2D241E]/12 text-sm font-semibold text-[#2D241E]/80 hover:bg-[#FFFCF7]"
        onClick={() => router.push(buildRestaurantesResultsHref(lang, { lang }))}
      >
        {t.reset}
      </button>
    </div>
  );

  const activeChips = useMemo(() => {
    const chips: { label: string; clear: () => void }[] = [];
    if (parsed.q) chips.push({ label: `“${parsed.q}”`, clear: () => pushState(mergeDiscovery(parsed, { q: "", page: 1 })) });
    if (parsed.city) chips.push({ label: parsed.city, clear: () => pushState(mergeDiscovery(parsed, { city: "", page: 1 })) });
    if (parsed.zip) chips.push({ label: parsed.zip, clear: () => pushState(mergeDiscovery(parsed, { zip: "", page: 1 })) });
    if (parsed.cuisine)
      chips.push({
        label: RESTAURANTE_CUISINES.find((c) => c.key === parsed.cuisine)?.labelEs ?? parsed.cuisine,
        clear: () => pushState(mergeDiscovery(parsed, { cuisine: "", page: 1 })),
      });
    if (parsed.svc)
      chips.push({
        label: labelForSvcParam(parsed.svc, lang),
        clear: () => pushState(mergeDiscovery(parsed, { svc: "", page: 1 })),
      });
    if (parsed.family) chips.push({ label: t.family, clear: () => pushState(mergeDiscovery(parsed, { family: false, page: 1 })) });
    if (parsed.price) chips.push({ label: parsed.price, clear: () => pushState(mergeDiscovery(parsed, { price: "", page: 1 })) });
    if (parsed.open) chips.push({ label: t.openNow, clear: () => pushState(mergeDiscovery(parsed, { open: false, page: 1 })) });
    if (parsed.diet) chips.push({ label: parsed.diet, clear: () => pushState(mergeDiscovery(parsed, { diet: "", page: 1 })) });
    if (parsed.top) chips.push({ label: t.sortRating, clear: () => pushState(mergeDiscovery(parsed, { top: false, page: 1 })) });
    if (parsed.near) chips.push({ label: t.nearReserved, clear: () => pushState(mergeDiscovery(parsed, { near: false, page: 1 })) });
    return chips;
  }, [parsed, pushState, t, lang]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FDFBF7] text-[#2D241E]">
      <Navbar />
      <div className="mx-auto max-w-[1280px] px-4 pb-20 pt-6 sm:px-5 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#2D241E]/10 pb-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2D241E]/50">{t.eyebrow}</p>
            <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">{t.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#2D241E]/72">{t.subtitle}</p>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#2D241E]/58 sm:text-sm">{t.journeyLine}</p>
            <Link href={landingHref} className="mt-3 inline-flex text-sm font-semibold text-[#D97706] underline-offset-4 hover:underline">
              ← {t.backLanding}
            </Link>
          </div>
        </div>

        <form
          onSubmit={onSearchSubmit}
          className="mt-8 rounded-[20px] border border-[#2D241E]/10 bg-[#FFFCF7] p-4 shadow-[0_16px_48px_-28px_rgba(45,36,30,0.35)] sm:p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
            <div className="relative min-w-0 flex-1">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2D241E]/40" aria-hidden />
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder={t.searchPh}
                className="min-h-[52px] w-full rounded-[16px] border border-[#2D241E]/12 bg-[#FFFCF7] py-3 pl-10 pr-3 text-sm outline-none transition-shadow ring-[#D97706]/30 focus:ring-2"
                autoComplete="off"
              />
            </div>
            <div className="relative min-w-0 flex-1">
              <FaMapMarkerAlt className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2D241E]/40" aria-hidden />
              <input
                value={locInput}
                onChange={(e) => setLocInput(e.target.value)}
                placeholder={t.locationPh}
                className="min-h-[52px] w-full rounded-[16px] border border-[#2D241E]/12 bg-[#FFFCF7] py-3 pl-10 pr-3 text-sm outline-none transition-shadow ring-[#D97706]/30 focus:ring-2"
              />
            </div>
            <button
              type="submit"
              className="min-h-[52px] w-full shrink-0 rounded-[16px] px-8 text-sm font-bold text-[#FFFCF7] shadow-[0_10px_32px_-12px_rgba(180,83,9,0.55)] lg:w-[200px]"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
            >
              {t.search}
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#2D241E]/80">
            <span className="font-semibold text-[#2D241E]">{sorted.length}</span>{" "}
            <span className="text-[#2D241E]/72">{t.resultsMatching}</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-[#2D241E]/55">{t.sort}</span>
              <select
                aria-label={t.sort}
                className="min-h-[48px] min-w-[180px] rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none transition focus:border-[#D97706]/45 focus:ring-2 focus:ring-[#D97706]/25"
                value={parsed.top ? "rating-desc" : parsed.sort}
                onChange={(e) => {
                  const v = e.target.value as RestaurantesDiscoveryState["sort"];
                  pushState(mergeDiscovery(parsed, { sort: v, top: false, page: 1 }));
                }}
              >
                <option value="newest">{t.sortNew}</option>
                <option value="name-asc">{t.sortName}</option>
                <option value="rating-desc">{t.sortRating}</option>
              </select>
            </label>
            <button
              type="button"
              className="inline-flex min-h-[48px] items-center justify-center rounded-[12px] border border-[#2D241E]/15 bg-[#FFFCF7] px-4 text-sm font-semibold text-[#2D241E] shadow-sm transition hover:border-[#D97706]/35 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/45"
              onClick={() => setMobileFiltersOpen(true)}
            >
              {t.filters}
            </button>
          </div>
        </div>

        {activeChips.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#2D241E]/50">{t.active}:</span>
            {activeChips.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={c.clear}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-[#D97706]/35 bg-[#FFF7ED] px-3 text-xs font-semibold text-[#2D241E] transition hover:bg-[#FFEDD5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/50"
              >
                {c.label} <span aria-hidden>×</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-8 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
          <aside className="mb-6 hidden lg:block">
            <div className="sticky top-24 rounded-[20px] border border-[#2D241E]/10 bg-[#FFFCF7] p-5 shadow-sm">{filterPanel}</div>
          </aside>

          <div className="min-w-0">
            {promotedBand.length ? (
              <section className="mb-8" aria-label={t.featured}>
                <div className="mb-4 flex items-center gap-2">
                  <FaStar className="h-4 w-4" style={{ color: ACCENT }} aria-hidden />
                  <h2 className="font-serif text-lg font-semibold">{t.featured}</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {promotedBand.map((row) => (
                    <ResultCard key={row.id} row={row} lang={lang} badge={t.promotedBadge} cta={t.verMas} />
                  ))}
                </div>
              </section>
            ) : null}

            {shown.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-[#2D241E]/25 bg-gradient-to-b from-[#FFFCF7] to-[#FDFBF7] px-6 py-14 text-center sm:px-10">
                <p className="font-serif text-lg font-semibold text-[#2D241E]">{t.emptyTitle}</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#2D241E]/72">{t.emptyBody}</p>
                <Link
                  href={landingHref}
                  className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-[14px] border border-[#D97706]/45 bg-[#FFFCF7] px-6 text-sm font-semibold text-[#2D241E] shadow-sm transition hover:border-[#D97706]/65 hover:bg-[#FFF7ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/50"
                >
                  {t.emptyCta}
                </Link>
              </div>
            ) : (
              <ul className="grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map((row) => (
                  <li key={row.id}>
                    <ResultCard row={row} lang={lang} cta={t.verMas} />
                  </li>
                ))}
              </ul>
            )}

            {gridRows.length > visible ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  className="min-h-[48px] rounded-[14px] border border-[#2D241E]/15 px-8 text-sm font-semibold text-[#2D241E] hover:bg-[#FFFCF7]"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  {t.loadMore}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t.filters}>
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t.close}
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[20px] bg-[#FDFBF7] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-serif text-lg font-semibold">{t.filters}</p>
              <button type="button" className="min-h-[44px] px-3 text-sm font-semibold text-[#D97706]" onClick={() => setMobileFiltersOpen(false)}>
                {t.close}
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ResultCard({
  row,
  lang,
  badge,
  cta,
}: {
  row: RestaurantesPublicBlueprintRow;
  lang: RestaurantesDiscoveryLang;
  badge?: string;
  cta: string;
}) {
  const moreHref = buildRestaurantesResultsHref(lang, { q: row.name, lang });
  return (
    <article
      className={`flex h-full max-w-[100%] flex-col overflow-hidden rounded-[20px] border border-[#2D241E]/10 bg-[#FFFCF7] shadow-[0_12px_40px_-22px_rgba(45,36,30,0.3)] transition-shadow duration-300 hover:shadow-[0_16px_44px_-20px_rgba(45,36,30,0.36)] ${
        badge ? "w-[min(100vw-2rem,320px)] shrink-0 ring-1 ring-[#D97706]/22" : "w-full"
      }`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image src={row.imageSrc} alt="" fill className="object-cover" sizes={badge ? "320px" : "(max-width:640px) 100vw, 50vw"} />
        {badge ? (
          <span
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold text-[#FFFCF7] shadow-sm"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
          >
            {badge}
          </span>
        ) : row.promoted ? (
          <span
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold text-[#FFFCF7] shadow-sm"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
          >
            {lang === "es" ? "Destacado" : "Featured"}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-serif text-lg font-semibold text-[#2D241E]">{row.name}</h3>
        <p className="mt-1 text-sm text-[#2D241E]/65">{row.cuisineLine}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#2D241E]/55">
          <span className="inline-flex items-center gap-1">
            <FaStar className="h-3.5 w-3.5" style={{ color: ACCENT }} aria-hidden />
            {row.rating.toFixed(1)}
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <FaMapMarkerAlt className="h-3.5 w-3.5" style={{ color: ACCENT }} aria-hidden />
            {row.city}
            {row.zip ? ` · ${row.zip}` : ""}
          </span>
        </div>
        <div className="mt-4 border-t border-[#2D241E]/8 pt-4">
          <Link
            href={moreHref}
            className="flex min-h-[48px] w-full items-center justify-center rounded-[14px] text-sm font-bold text-[#FFFCF7] shadow-[0_8px_22px_-10px_rgba(180,83,9,0.45)] transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
          >
            {cta}
          </Link>
        </div>
      </div>
    </article>
  );
}
