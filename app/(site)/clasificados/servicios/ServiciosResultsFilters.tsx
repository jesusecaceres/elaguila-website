"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { ServiciosUseMyLocationButton } from "./ServiciosUseMyLocationButton";
import { clearServiciosDiscoveryPrefs, writeServiciosDiscoveryPrefs } from "./lib/serviciosLocalPreferences";
import {
  serviciosResultsHasActiveFilters,
  type ServiciosResultsFilterQuery,
} from "./lib/serviciosResultsFilter";
import {
  formatServiciosInternalGroupForDiscovery,
  SERVICIOS_INTERNAL_GROUP_IDS,
} from "./lib/serviciosInternalGroupDisplay";
import { normalizeServiciosDiscoveryLocationInput } from "./lib/serviciosLocationNormalize";

const RESULTS_FORM_ID = "servicios-results-filter-form";

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

export function ServiciosResultsFilters({
  lang,
  current,
}: {
  lang: ServiciosLang;
  current: ServiciosResultsFilterQuery;
}) {
  const resetHref = `/clasificados/servicios/resultados?lang=${lang}`;
  const hasFilters = serviciosResultsHasActiveFilters(current);

  return (
    <div
      id="servicios-resultados-filtros"
      className="rounded-[22px] border border-[#e5ddd2]/90 bg-[#FFFCF7] p-5 shadow-[0_26px_64px_-40px_rgba(20,38,58,0.42)] ring-1 ring-[#1e3a5f]/[0.06] sm:rounded-[24px] sm:p-7"
    >
      <form
        id={RESULTS_FORM_ID}
        method="get"
        action="/clasificados/servicios/resultados"
        aria-label={lang === "en" ? "Search and filter Servicios results" : "Buscar y filtrar resultados de Servicios"}
        className="space-y-6"
        onSubmitCapture={(e) => {
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
        }}
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
            <ServiciosUseMyLocationButton lang={lang} formId={RESULTS_FORM_ID} />
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
              defaultValue={current.sort === "name" ? "name" : current.sort === "rating" ? "rating" : "newest"}
              className="min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
            >
              <option value="newest">{lang === "en" ? "Newest first" : "Más recientes primero"}</option>
              <option value="name">{lang === "en" ? "Name (A–Z)" : "Nombre (A–Z)"}</option>
              <option value="rating">{lang === "en" ? "Highest rated" : "Mejor calificados"}</option>
            </select>
          </label>
        </GroupShell>

        <GroupShell titleEs="Tipo de anunciante" titleEn="Provider type" lang={lang}>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">
              {lang === "en" ? "Seller presentation" : "Tipo de proveedor"}
            </span>
            <select
              name="seller"
              defaultValue={current.seller ?? "all"}
              className="min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
            >
              <option value="all">{lang === "en" ? "All" : "Todos"}</option>
              <option value="business">{lang === "en" ? "Business (web or address)" : "Negocio (web o dirección)"}</option>
              <option value="independent">{lang === "en" ? "Independent professional" : "Profesional independiente"}</option>
            </select>
          </label>
        </GroupShell>

        <GroupShell titleEs="Categoría / giro" titleEn="Category / trade" lang={lang}>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Trade family" : "Familia de giro"}</span>
            <select
              name="group"
              defaultValue={current.group ?? ""}
              className="min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
            >
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              {SERVICIOS_INTERNAL_GROUP_IDS.map((id) => (
                <option key={id} value={id}>
                  {formatServiciosInternalGroupForDiscovery(id, lang) ?? id}
                </option>
              ))}
            </select>
          </label>
        </GroupShell>

        <GroupShell titleEs="Confianza y alcance" titleEn="Trust & reach" lang={lang}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-700">
                {lang === "en" ? "Leonix verified" : "Verificado Leonix"}
              </span>
              <select
                name="verified"
                defaultValue={current.verified === "1" ? "1" : ""}
                className="min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
              >
                <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
                <option value="1">{lang === "en" ? "Verified listings only" : "Solo anuncios verificados"}</option>
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-700">
                {lang === "en" ? "Website on profile" : "Sitio web en vitrina"}
              </span>
              <select
                name="web"
                defaultValue={current.web === "1" ? "1" : ""}
                className="min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
              >
                <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
                <option value="1">{lang === "en" ? "Has website link" : "Con enlace a web"}</option>
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-700">
                {lang === "en" ? "Bilingual signal" : "Señal bilingüe"}
              </span>
              <select
                name="bilingual"
                defaultValue={current.bilingual === "1" ? "1" : ""}
                className="min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
              >
                <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
                <option value="1">{lang === "en" ? "Bilingual quick-fact" : "Dato rápido bilingüe"}</option>
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-700">
                {lang === "en" ? "Email on profile" : "Correo en vitrina"}
              </span>
              <select
                name="email"
                defaultValue={current.email === "1" ? "1" : ""}
                className="min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
              >
                <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
                <option value="1">{lang === "en" ? "Shows email" : "Muestra correo"}</option>
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-700">
                {lang === "en" ? "Emergency / urgent" : "Emergencia / urgente"}
              </span>
              <select
                name="emergency"
                defaultValue={current.emergency === "1" ? "1" : ""}
                className="min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
              >
                <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
                <option value="1">{lang === "en" ? "Emergency quick-fact" : "Dato rápido emergencia"}</option>
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-700">
                {lang === "en" ? "Mobile / on-site" : "Móvil / a domicilio"}
              </span>
              <select
                name="mobileSvc"
                defaultValue={current.mobileSvc === "1" ? "1" : ""}
                className="min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
              >
                <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
                <option value="1">{lang === "en" ? "Mobile-service quick-fact" : "Dato rápido servicio móvil"}</option>
              </select>
            </label>
          </div>
        </GroupShell>

        <GroupShell titleEs="Formas de contacto" titleEn="Contact options" lang={lang}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-700">WhatsApp</span>
              <select
                name="whatsapp"
                defaultValue={current.whatsapp === "1" ? "1" : ""}
                className="min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
              >
                <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
                <option value="1">{lang === "en" ? "WhatsApp shown" : "Con WhatsApp visible"}</option>
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Offer / promo" : "Oferta"}</span>
              <select
                name="promo"
                defaultValue={current.promo === "1" ? "1" : ""}
                className="min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
              >
                <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
                <option value="1">{lang === "en" ? "Has offer line" : "Con línea de oferta"}</option>
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Phone" : "Teléfono"}</span>
              <select
                name="call"
                defaultValue={current.call === "1" ? "1" : ""}
                className="min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
              >
                <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
                <option value="1">{lang === "en" ? "Phone shown" : "Con teléfono visible"}</option>
              </select>
            </label>
          </div>
        </GroupShell>

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
