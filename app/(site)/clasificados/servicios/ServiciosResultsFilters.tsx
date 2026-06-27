"use client";

import type { FormEventHandler } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { ServiciosUseMyLocationButton } from "./ServiciosUseMyLocationButton";
import { clearServiciosDiscoveryPrefs, writeServiciosDiscoveryPrefs } from "./lib/serviciosLocalPreferences";
import {
  serviciosResultsHasActiveFilters,
  type ServiciosResultsFilterQuery,
} from "./lib/serviciosResultsFilter";
import { normalizeServiciosDiscoveryLocationInput } from "./lib/serviciosLocationNormalize";
import { ServiciosResultsAdvancedFilterFields } from "./resultados/ServiciosResultsAdvancedFilterFields";
import { CAT_STD_PER_PAGE_OPTIONS } from "@/app/(site)/clasificados/components/categoryPipeline/catStdPerPage";

const RESULTS_PATH = "/clasificados/servicios/results";

const RESULTS_FORM_ID_MOBILE = "servicios-results-filter-form-mobile";

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
    "min-h-[40px] w-full rounded-xl border border-[#e5ddd2] bg-white px-3 py-2 text-sm text-[#142a42] outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]";

  return (
    <div className="mb-3 border-b border-[#dcd3c7]/80 pb-3">
      <form
        id={RESULTS_FORM_ID_MOBILE}
        method="get"
        action={RESULTS_PATH}
        aria-label={lang === "en" ? "Search and filter Servicios results" : "Buscar y filtrar resultados de Servicios"}
        className="space-y-2.5"
        onSubmitCapture={onSubmitCapture}
      >
        <input type="hidden" name="lang" value={lang} />

        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,0.72fr)_auto_auto] lg:items-end">
          <label className="block min-w-0">
            <span className="text-xs font-semibold text-[#3d4f62]">
              {lang === "en" ? "Keywords" : "Tipo de servicio"}
            </span>
            <input
              name="q"
              type="search"
              defaultValue={current.q ?? ""}
              autoComplete="off"
              placeholder={lang === "en" ? "Service, business, category…" : "Servicio, negocio o categoría…"}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="block min-w-0">
            <span className="text-xs font-semibold text-[#3d4f62]">
              {lang === "en" ? "City, ZIP, or service area" : "Ciudad o ZIP"}
            </span>
            <input
              name="city"
              type="text"
              defaultValue={current.city ?? ""}
              placeholder={lang === "en" ? "e.g. San José, 95112" : "ej. San José, 95112"}
              aria-describedby="servicios-city-filter-hint-mobile"
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <ServiciosUseMyLocationButton lang={lang} formId={RESULTS_FORM_ID_MOBILE} />
          <button
            type="submit"
            className="inline-flex min-h-[40px] w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#8A2433] to-[#5C1622] px-4 text-sm font-bold text-white shadow-md transition hover:brightness-[1.05] lg:w-auto"
          >
            {lang === "en" ? "Search" : "Buscar"}
          </button>
          <p id="servicios-city-filter-hint-mobile" className="sr-only">
            {lang === "en"
              ? "Matches city, ZIP, service areas, and location summary when published."
              : "Coincide con ciudad, CP, zonas de servicio y resumen de ubicación publicados."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="relative inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-full border border-[#D6C7AD] bg-white px-3 py-2 text-xs font-semibold text-[#142a42] shadow-sm transition hover:bg-[#fafcff]"
          >
            {lang === "en" ? "Filters" : "Filtros"}
            {hasAdvancedFilters ? (
              <span
                className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3B66AD] px-1 text-[10px] font-bold leading-none text-white"
                aria-hidden
              >
                •
              </span>
            ) : null}
          </button>
          <label className="min-w-0">
            <span className="sr-only">{lang === "en" ? "Sort" : "Ordenar"}</span>
            <select name="sort" defaultValue={sortSelectDefault(current)} className="min-h-[36px] rounded-full border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-medium text-[#142a42]">
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
            <select name="perPage" defaultValue={String(perPage)} className="min-h-[36px] rounded-full border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-medium text-[#142a42]">
              {CAT_STD_PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {hasFilters ? (
            <Link href={resetHref} className="inline-flex min-h-[36px] items-center rounded-full border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-semibold text-[#142a42]">
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
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[#1a3352]/15 bg-white px-4 text-sm font-bold text-[#142a42] shadow-sm transition hover:bg-[#fafcff]"
              >
                {lang === "en" ? "Close" : "Cerrar"}
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ebe4d9]/90 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
                  {lang === "en" ? "Refine" : "Afinar"}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  {hasFilters ? (
                    <Link
                      href={resetHref}
                      onClick={() => setDrawerOpen(false)}
                      className="min-h-[44px] touch-manipulation text-xs font-semibold text-[#3B66AD] underline underline-offset-2"
                    >
                      {lang === "en" ? "Clear all filters" : "Quitar todos los filtros"}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      clearServiciosDiscoveryPrefs();
                    }}
                    className="min-h-[44px] text-xs font-semibold text-[#64748b] underline underline-offset-2 hover:text-[#142a42]"
                  >
                    {lang === "en" ? "Clear saved device hints" : "Borrar sugerencias guardadas en el dispositivo"}
                  </button>
                </div>
              </div>

              <ServiciosResultsAdvancedFilterFields lang={lang} current={current} />
            </div>

            <div className="shrink-0 space-y-3 border-t border-[#ebe4d9] bg-[#FFFCF7]/98 px-4 py-3 backdrop-blur-md">
              <button
                type="submit"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex min-h-[50px] w-full items-center justify-center rounded-xl bg-[#7A1E2C] px-6 text-sm font-bold text-white shadow-[0_12px_32px_-14px_rgba(92,22,34,0.5)] transition hover:bg-[#651825]"
              >
                {lang === "en" ? "View results" : "Ver resultados"}
              </button>
              <p className="text-[11px] leading-relaxed text-neutral-500">
                {lang === "en"
                  ? "Provider type is inferred from published address/website fields. Keyword search includes services, trust lines, reviews, quick facts, and about. Submitting can save optional hints on this device — see Legal."
                  : "El tipo de proveedor se infiere de dirección o web publicadas. La búsqueda incluye servicios, confianza, reseñas, datos rápidos y «Acerca». Al enviar se pueden guardar sugerencias opcionales en este dispositivo — ver Legal."}
              </p>
              <p className="text-[11px] leading-relaxed text-neutral-500">
                <Link href={`/legal?lang=${lang}`} className="font-semibold text-[#3B66AD] underline-offset-2 hover:underline">
                  {lang === "en" ? "Privacy & optional local preferences" : "Privacidad y preferencias locales opcionales"}
                </Link>
              </p>
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
