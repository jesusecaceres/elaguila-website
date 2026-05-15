"use client";

import type { FormEventHandler, ReactNode } from "react";
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

const RESULTS_FORM_ID_DESKTOP = "servicios-results-filter-form-desktop";
const RESULTS_FORM_ID_MOBILE = "servicios-results-filter-form-mobile";

function GroupShell({
  titleEs,
  titleEn,
  lang,
  children,
}: {
  titleEs: string;
  titleEn: string;
  lang: ServiciosLang;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe6ef]/90 bg-white/[0.97] p-4 shadow-[0_10px_32px_-24px_rgba(20,38,58,0.25)] sm:p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#3d5a73]/90">
        {lang === "en" ? titleEn : titleEs}
      </p>
      <div className="mt-3.5">{children}</div>
    </div>
  );
}

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

function ServiciosResultsFiltersMobile({
  lang,
  current,
}: {
  lang: ServiciosLang;
  current: ServiciosResultsFilterQuery;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const resetHref = `/clasificados/servicios/resultados?lang=${lang}`;
  const hasFilters = serviciosResultsHasActiveFilters(current);
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

  return (
    <div className="rounded-[22px] border border-[#e5ddd2]/90 bg-[#FFFCF7] p-4 shadow-[0_26px_64px_-40px_rgba(20,38,58,0.42)] ring-1 ring-[#1e3a5f]/[0.06] sm:rounded-[24px] sm:p-5">
      <form
        id={RESULTS_FORM_ID_MOBILE}
        method="get"
        action="/clasificados/servicios/resultados"
        aria-label={lang === "en" ? "Search and filter Servicios results" : "Buscar y filtrar resultados de Servicios"}
        className="space-y-4"
        onSubmitCapture={onSubmitCapture}
      >
        <input type="hidden" name="lang" value={lang} />

        <div className="sticky top-0 z-20 space-y-4 rounded-2xl border border-[#e5ddd2]/80 bg-[#FFFCF7]/96 p-3 shadow-sm backdrop-blur-md sm:p-4">
          <GroupShell titleEs="Buscar" titleEn="Search" lang={lang}>
            <label className="block min-w-0">
              <span className="text-xs font-semibold text-[#3d4f62]">
                {lang === "en" ? "Keywords" : "Palabras clave"}
              </span>
              <input
                name="q"
                type="search"
                defaultValue={current.q ?? ""}
                autoComplete="off"
                placeholder={lang === "en" ? "Service, trade, business name…" : "Servicio, giro, nombre del negocio…"}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-[#e5ddd2] bg-white px-3 py-2 text-sm text-[#142a42] outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
              />
            </label>
          </GroupShell>

          <GroupShell titleEs="Ubicación" titleEn="Location" lang={lang}>
            <label className="block min-w-0">
              <span className="text-xs font-semibold text-[#3d4f62]">
                {lang === "en" ? "City, ZIP, or service area" : "Ciudad, código postal o zona"}
              </span>
              <input
                name="city"
                type="text"
                defaultValue={current.city ?? ""}
                placeholder={lang === "en" ? "e.g. San José, 95112" : "ej. San José, 95112"}
                aria-describedby="servicios-city-filter-hint-mobile"
                className="mt-1 min-h-[48px] w-full rounded-xl border border-[#e5ddd2] bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
              />
            </label>
            <span id="servicios-city-filter-hint-mobile" className="mt-2 block text-[11px] leading-snug text-[#64748b]">
              {lang === "en"
                ? "Matches listing city and, when published, postal code, service-area lines, and location summary on the profile."
                : "Coincide con la ciudad del anuncio y, si está en la vitrina, CP, zonas de servicio y resumen de ubicación."}
            </span>
            <div className="mt-3">
              <ServiciosUseMyLocationButton lang={lang} formId={RESULTS_FORM_ID_MOBILE} />
            </div>
            <button
              type="submit"
              className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] px-6 text-sm font-bold text-white shadow-md transition hover:brightness-[1.03]"
            >
              {lang === "en" ? "Search with these terms" : "Buscar con estos términos"}
            </button>
          </GroupShell>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <GroupShell titleEs="Ordenar" titleEn="Sort" lang={lang}>
                <label className="flex min-w-0 flex-col gap-1">
                  <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Order" : "Orden"}</span>
                  <select
                    name="sort"
                    defaultValue={sortSelectDefault(current)}
                    className="min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
                  >
                    <option value="newest">{lang === "en" ? "Newest" : "Más recientes"}</option>
                    <option value="most_liked">{lang === "en" ? "Most liked" : "Más gustados"}</option>
                    <option value="most_saved">{lang === "en" ? "Most saved" : "Más guardados"}</option>
                    <option value="open_now">{lang === "en" ? "Open now" : "Abiertos ahora"}</option>
                    <option value="name">{lang === "en" ? "Name (A–Z)" : "Nombre (A–Z)"}</option>
                    <option value="rating">{lang === "en" ? "Highest rated" : "Mejor calificados"}</option>
                  </select>
                </label>
              </GroupShell>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[200px]">
              <button
                type="submit"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-sm font-bold text-white shadow-[0_12px_32px_-14px_rgba(30,58,95,0.45)] transition hover:bg-[#2f5699]"
              >
                {lang === "en" ? "Apply & view results" : "Aplicar y ver resultados"}
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#1a3352]/20 bg-white px-4 text-sm font-bold text-[#142a42] shadow-sm transition hover:bg-[#fafcff]"
              >
                {lang === "en" ? "Filters" : "Filtros"}
              </button>
            </div>
          </div>
        </div>

        <div
          className={`fixed inset-0 z-[60] flex flex-col justify-end lg:hidden ${drawerOpen ? "pointer-events-auto" : "pointer-events-none"}`}
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
            className={`relative z-[61] flex max-h-[min(92vh,760px)] w-full flex-col rounded-t-[22px] border border-[#e5ddd2] bg-[#FFFCF7] shadow-[0_-12px_40px_-8px_rgba(20,38,58,0.35)] transition-transform duration-300 ease-out ${drawerOpen ? "translate-y-0" : "translate-y-[calc(100%+12px)]"}`}
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
                className="inline-flex min-h-[50px] w-full items-center justify-center rounded-xl bg-[#3B66AD] px-6 text-sm font-bold text-white shadow-[0_12px_32px_-14px_rgba(30,58,95,0.45)] transition hover:bg-[#2f5699]"
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
  variant = "desktop",
}: {
  lang: ServiciosLang;
  current: ServiciosResultsFilterQuery;
  variant?: "desktop" | "mobile";
}) {
  if (variant === "mobile") {
    return <ServiciosResultsFiltersMobile lang={lang} current={current} />;
  }

  const resetHref = `/clasificados/servicios/resultados?lang=${lang}`;
  const hasFilters = serviciosResultsHasActiveFilters(current);
  const onSubmitCapture = createServiciosResultsFormSubmitCapture();

  return (
    <div
      id="servicios-resultados-filtros"
      className="rounded-[22px] border border-[#e5ddd2]/90 bg-[#FFFCF7] p-5 shadow-[0_26px_64px_-40px_rgba(20,38,58,0.42)] ring-1 ring-[#1e3a5f]/[0.06] sm:rounded-[24px] sm:p-7"
    >
      <form
        id={RESULTS_FORM_ID_DESKTOP}
        method="get"
        action="/clasificados/servicios/resultados"
        aria-label={lang === "en" ? "Search and filter Servicios results" : "Buscar y filtrar resultados de Servicios"}
        className="space-y-6"
        onSubmitCapture={onSubmitCapture}
      >
        <input type="hidden" name="lang" value={lang} />

        <GroupShell titleEs="Buscar" titleEn="Search" lang={lang}>
          <label className="block min-w-0">
            <span className="text-xs font-semibold text-[#3d4f62]">
              {lang === "en" ? "Keywords" : "Palabras clave"}
            </span>
            <input
              name="q"
              type="search"
              defaultValue={current.q ?? ""}
              autoComplete="off"
              placeholder={lang === "en" ? "Service, trade, business name…" : "Servicio, giro, nombre del negocio…"}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-[#e5ddd2] bg-white px-3 py-2 text-sm text-[#142a42] outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
            />
          </label>
        </GroupShell>

        <GroupShell titleEs="Ubicación" titleEn="Location" lang={lang}>
          <label className="block min-w-0">
            <span className="text-xs font-semibold text-[#3d4f62]">
              {lang === "en" ? "City, ZIP, or service area" : "Ciudad, código postal o zona"}
            </span>
            <input
              name="city"
              type="text"
              defaultValue={current.city ?? ""}
              placeholder={lang === "en" ? "e.g. San José, 95112" : "ej. San José, 95112"}
              aria-describedby="servicios-city-filter-hint"
              className="mt-1 min-h-[48px] w-full rounded-xl border border-[#e5ddd2] bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
            />
          </label>
          <span id="servicios-city-filter-hint" className="mt-2 block text-[11px] leading-snug text-[#64748b]">
            {lang === "en"
              ? "Matches listing city and, when published, postal code, service-area lines, and location summary on the profile."
              : "Coincide con la ciudad del anuncio y, si está en la vitrina, CP, zonas de servicio y resumen de ubicación."}
          </span>
          <div className="mt-3">
            <ServiciosUseMyLocationButton lang={lang} formId={RESULTS_FORM_ID_DESKTOP} />
          </div>
          <button
            type="submit"
            className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] px-6 text-sm font-bold text-white shadow-md transition hover:brightness-[1.03]"
          >
            {lang === "en" ? "Search with these terms" : "Buscar con estos términos"}
          </button>
        </GroupShell>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ebe4d9]/90 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
            {lang === "en" ? "Refine" : "Afinar"}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {hasFilters ? (
              <Link
                href={resetHref}
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

        <GroupShell titleEs="Ordenar" titleEn="Sort" lang={lang}>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Order" : "Orden"}</span>
            <select
              name="sort"
              defaultValue={sortSelectDefault(current)}
              className="min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
            >
              <option value="newest">{lang === "en" ? "Newest" : "Más recientes"}</option>
              <option value="most_liked">{lang === "en" ? "Most liked" : "Más gustados"}</option>
              <option value="most_saved">{lang === "en" ? "Most saved" : "Más guardados"}</option>
              <option value="open_now">{lang === "en" ? "Open now" : "Abiertos ahora"}</option>
              <option value="name">{lang === "en" ? "Name (A–Z)" : "Nombre (A–Z)"}</option>
              <option value="rating">{lang === "en" ? "Highest rated" : "Mejor calificados"}</option>
            </select>
          </label>
        </GroupShell>

        <ServiciosResultsAdvancedFilterFields lang={lang} current={current} />

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="inline-flex min-h-[50px] min-w-[min(100%,220px)] flex-1 items-center justify-center rounded-xl bg-[#3B66AD] px-6 text-sm font-bold text-white shadow-[0_12px_32px_-14px_rgba(30,58,95,0.45)] transition hover:bg-[#2f5699]"
          >
            {lang === "en" ? "Apply all filters & refresh" : "Aplicar filtros y actualizar"}
          </button>
        </div>

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
      </form>
    </div>
  );
}
