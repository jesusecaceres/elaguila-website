"use client";

import type { FormEventHandler } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { writeServiciosDiscoveryPrefs } from "./lib/serviciosLocalPreferences";
import {
  serviciosResultsHasActiveFilters,
  type ServiciosResultsFilterQuery,
} from "./lib/serviciosResultsFilter";
import { normalizeServiciosDiscoveryLocationInput } from "./lib/serviciosLocationNormalize";
import { ServiciosResultsAdvancedFilterFields } from "./resultados/ServiciosResultsAdvancedFilterFields";
import { CAT_STD_PER_PAGE_OPTIONS } from "@/app/(site)/clasificados/components/categoryPipeline/catStdPerPage";

const RESULTS_PATH = "/clasificados/servicios/results";

const RESULTS_FORM_ID_MOBILE = "servicios-results-filter-form-mobile";

const BTN_PRIMARY =
  "inline-flex min-h-[2.625rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721]";
const BTN_SECONDARY =
  "inline-flex min-h-[2.625rem] items-center justify-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3.5 text-sm font-semibold text-[#3D3428] hover:border-[#C9A84A] hover:bg-[#FBF7EF]";
const CONTROL_SELECT =
  "min-h-[2.625rem] rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF7] px-3 text-xs font-semibold text-[#3D3428]";
const SEARCH_INPUT =
  "min-h-[2.625rem] w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#3D3428]/45";
const SEARCH_CANVAS =
  "overflow-hidden rounded-xl border border-[#D6C7AD]/90 bg-[#FFFDF7] shadow-[0_6px_22px_-16px_rgba(31,36,28,0.16)]";

const sortSelectDefault = (current: ServiciosResultsFilterQuery) =>
  current.sort === "name"
    ? "name"
    : current.sort === "rating"
      ? "rating"
      : current.sort === "most_liked"
        ? "most_liked"
        : current.sort === "most_saved"
          ? "most_saved"
          : current.sort === "open_now"
            ? "open_now"
            : "newest";

/** Drawer-only refinements (excludes q, city, sort) — badge when advanced filters URL params are active. */
function serviciosResultsHasAdvancedDrawerFilters(current: ServiciosResultsFilterQuery): boolean {
  return Boolean(
    current.group?.trim() ||
      (current.seller && current.seller !== "all") ||
      current.whatsapp === "1" ||
      current.promo === "1" ||
      current.call === "1" ||
      current.verified === "1" ||
      current.web === "1" ||
      current.bilingual === "1" ||
      current.email === "1" ||
      current.emergency === "1" ||
      current.mobileSvc === "1" ||
      current.msg === "1" ||
      current.phys === "1" ||
      current.svcMulti === "1" ||
      current.offer === "1" ||
      current.legal === "1" ||
      current.langEs === "1" ||
      current.langEn === "1" ||
      current.langOt === "1" ||
      current.vint === "1" ||
      current.wknd === "1" ||
      current.openNow === "1" ||
      current.licensed === "1" ||
      current.insured === "1" ||
      current.freeEstimate === "1" ||
      current.freeConsultation === "1" ||
      current.hasPhotos === "1" ||
      current.hasVideos === "1" ||
      current.hasOffers === "1",
  );
}

function createServiciosResultsFormSubmitCapture(): FormEventHandler<HTMLFormElement> {
  return (e) => {
    const form = e.currentTarget;
    const cityInput = form.querySelector<HTMLInputElement>('input[name="city"]');
    if (cityInput) {
      const raw = cityInput.value.trim();
      const norm = normalizeServiciosDiscoveryLocationInput(raw);
      if (norm !== raw) cityInput.value = norm;
    }
    const fd = new FormData(form);
    writeServiciosDiscoveryPrefs({
      lastQ: String(fd.get("q") ?? "").trim() || undefined,
      lastCity: String(fd.get("city") ?? "").trim() || undefined,
      lastGroup: String(fd.get("group") ?? "").trim() || undefined,
    });
    const snap: Record<string, string> = {};
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string" && v.trim()) snap[String(k)] = v.trim().slice(0, 240);
    }
    void fetch("/api/clasificados/servicios/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingSlug: null,
        eventType: "filter_change",
        meta: { path: "/clasificados/servicios/resultados", form: snap },
      }),
    }).catch(() => {});
  };
}

function ServiciosResultsFiltersCompact({
  lang,
  current,
  perPage,
}: {
  lang: ServiciosLang;
  current: ServiciosResultsFilterQuery;
  perPage: number;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const resetHref = `${RESULTS_PATH}?lang=${lang}`;
  const hasFilters = serviciosResultsHasActiveFilters(current);
  const hasAdvancedFilters = serviciosResultsHasAdvancedDrawerFilters(current);
  const onSubmitCapture = createServiciosResultsFormSubmitCapture();

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    if (drawerOpen) el.removeAttribute("inert");
    else el.setAttribute("inert", "");
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen]);

  const inputClass =
    "min-h-[2.625rem] w-full rounded-lg border border-[#D6C7AD]/90 bg-white px-3 py-2 text-sm text-[#1F241C] outline-none focus:border-[#C9A84A]/70 focus:ring-2 focus:ring-[#C9A84A]/20";

  return (
    <div className="mb-3 border-b border-[#D6C7AD]/50 pb-3">
      <form
        id={RESULTS_FORM_ID_MOBILE}
        method="get"
        action={RESULTS_PATH}
        aria-label={lang === "en" ? "Search and filter Servicios results" : "Buscar y filtrar resultados de Servicios"}
        className="space-y-2.5"
        onSubmitCapture={onSubmitCapture}
      >
        <input type="hidden" name="lang" value={lang} />

        <div className={SEARCH_CANVAS}>
          <div className="flex flex-col sm:grid sm:grid-cols-12 sm:items-stretch">
            <label className="flex min-h-[2.625rem] min-w-0 items-center border-b border-[#D6C7AD]/80 sm:col-span-5 sm:border-b-0 sm:border-r">
              <input
                name="q"
                type="search"
                defaultValue={current.q ?? ""}
                autoComplete="off"
                placeholder={lang === "en" ? "Service, trade, business…" : "Servicio, giro, negocio…"}
                aria-label={lang === "en" ? "Keywords" : "Palabras clave"}
                className={`${SEARCH_INPUT} min-w-0 flex-1`}
              />
            </label>
            <label className="flex min-h-[2.625rem] min-w-0 border-b border-[#D6C7AD]/80 sm:col-span-3 sm:border-b-0 sm:border-r">
              <input
                name="city"
                type="text"
                defaultValue={current.city ?? ""}
                placeholder={lang === "en" ? "City" : "Ciudad"}
                aria-label={lang === "en" ? "City" : "Ciudad"}
                className={SEARCH_INPUT}
              />
            </label>
            <div className="flex gap-1.5 p-1.5 sm:col-span-4">
              <button
                type="button"
                data-testid="servicios-open-filters-drawer"
                onClick={() => setDrawerOpen(true)}
                className={`${BTN_SECONDARY} relative flex-1`}
              >
                {lang === "en" ? "Filters" : "Filtros"}
                {hasAdvancedFilters ? (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-sm bg-[#7A1E2C]" aria-hidden />
                ) : null}
              </button>
              <button type="submit" className={`${BTN_PRIMARY} flex-[1.2]`}>
                {lang === "en" ? "Search" : "Buscar"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7A7164]">
            {lang === "en" ? "Show" : "Mostrar"}
          </span>
          <label className="min-w-0">
            <span className="sr-only">{lang === "en" ? "Sort" : "Ordenar"}</span>
            <select name="sort" defaultValue={sortSelectDefault(current)} className={CONTROL_SELECT}>
              <option value="newest">{lang === "en" ? "Newest" : "Más recientes"}</option>
              <option value="most_liked">{lang === "en" ? "Most liked" : "Más gustados"}</option>
              <option value="most_saved">{lang === "en" ? "Most saved" : "Más guardados"}</option>
              <option value="open_now">{lang === "en" ? "Open now" : "Abiertos ahora"}</option>
              <option value="name">{lang === "en" ? "Name (A–Z)" : "Nombre (A–Z)"}</option>
              <option value="rating">{lang === "en" ? "Highest rated" : "Mejor calificados"}</option>
            </select>
          </label>
          <label className="min-w-0">
            <span className="sr-only">{lang === "en" ? "Per page" : "Por página"}</span>
            <select name="perPage" defaultValue={String(perPage)} className={CONTROL_SELECT}>
              {CAT_STD_PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {hasFilters ? (
            <Link href={resetHref} className={BTN_SECONDARY}>
              {lang === "en" ? "Clear filters" : "Limpiar filtros"}
            </Link>
          ) : null}
        </div>

        <div
          className={`fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4 ${drawerOpen ? "pointer-events-auto" : "pointer-events-none"}`}
          aria-hidden={!drawerOpen}
        >
          <button
            type="button"
            className={`absolute inset-0 bg-[#142a42]/45 transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0"}`}
            onClick={() => setDrawerOpen(false)}
            aria-label={lang === "en" ? "Close filters" : "Cerrar filtros"}
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={lang === "en" ? "Filters" : "Filtros"}
            className={`relative z-[61] flex max-h-[min(92vh,760px)] w-full flex-col rounded-t-[22px] border border-[#e5ddd2] bg-[#FFFCF7] shadow-[0_-12px_40px_-8px_rgba(20,38,58,0.35)] transition-transform duration-300 ease-out sm:max-w-xl sm:rounded-2xl ${drawerOpen ? "translate-y-0 sm:scale-100 sm:opacity-100" : "translate-y-[calc(100%+12px)] sm:translate-y-0 sm:scale-95 sm:opacity-0"}`}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#ebe4d9] px-4 py-3">
              <p className="text-base font-bold text-[#142a42]">{lang === "en" ? "Filters" : "Filtros"}</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className={`${BTN_SECONDARY} min-w-[4.5rem]`}
              >
                {lang === "en" ? "Close" : "Cerrar"}
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4">
              {hasFilters ? (
                <div className="border-b border-[#D6C7AD]/60 pb-3">
                  <Link
                    href={resetHref}
                    onClick={() => setDrawerOpen(false)}
                    className="text-xs font-semibold text-[#7A1E2C] underline underline-offset-2"
                  >
                    {lang === "en" ? "Clear all filters" : "Quitar todos los filtros"}
                  </Link>
                </div>
              ) : null}

              <ServiciosResultsAdvancedFilterFields lang={lang} current={current} />
            </div>

            <div className="shrink-0 flex gap-2 border-t border-[#D6C7AD]/60 bg-[#FFFDF7] px-4 py-3">
              {hasFilters ? (
                <Link href={resetHref} onClick={() => setDrawerOpen(false)} className={`${BTN_SECONDARY} flex-1 text-center`}>
                  {lang === "en" ? "Clear" : "Limpiar"}
                </Link>
              ) : null}
              <button
                type="submit"
                onClick={() => setDrawerOpen(false)}
                className={`${BTN_PRIMARY} ${hasFilters ? "flex-[1.2]" : "w-full"}`}
              >
                {lang === "en" ? "Apply" : "Aplicar"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export function ServiciosResultsFilters({
  lang,
  current,
  perPage = 12,
}: {
  lang: ServiciosLang;
  current: ServiciosResultsFilterQuery;
  perPage?: number;
}) {
  return <ServiciosResultsFiltersCompact lang={lang} current={current} perPage={perPage} />;
}
