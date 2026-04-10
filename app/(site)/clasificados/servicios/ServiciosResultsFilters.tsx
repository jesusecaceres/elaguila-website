import Link from "next/link";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import {
  serviciosResultsHasActiveFilters,
  type ServiciosResultsFilterQuery,
} from "./lib/serviciosResultsFilter";
import {
  formatServiciosInternalGroupForDiscovery,
  SERVICIOS_INTERNAL_GROUP_IDS,
} from "./lib/serviciosInternalGroupDisplay";

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
      className="rounded-[22px] border border-[#e5ddd2]/90 bg-[#FFFCF7] p-4 shadow-[0_18px_48px_-32px_rgba(20,38,58,0.35)] sm:p-6"
    >
      <form
        method="get"
        action="/clasificados/servicios/resultados"
        aria-label={lang === "en" ? "Search and filter Servicios results" : "Buscar y filtrar resultados de Servicios"}
        className="space-y-5"
      >
        <input type="hidden" name="lang" value={lang} />

        <div className="rounded-2xl border border-[#dfe6ef]/80 bg-white/90 p-3 sm:p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3d5a73]/85">
            {lang === "en" ? "Search" : "Buscar"}
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-[#3d4f62]">
                {lang === "en" ? "Keywords" : "Palabras clave"}
              </span>
              <input
                name="q"
                type="search"
                defaultValue={current.q ?? ""}
                autoComplete="off"
                placeholder={lang === "en" ? "Service, trade, name…" : "Servicio, giro, nombre…"}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-[#e5ddd2] bg-white px-3 py-2 text-sm text-[#142a42] outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
              />
            </label>
            <label className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-[#3d4f62]">
                {lang === "en" ? "City / service area" : "Ciudad o zona de servicio"}
              </span>
              <input
                name="city"
                type="text"
                defaultValue={current.city ?? ""}
                placeholder={lang === "en" ? "e.g. San José, 95112" : "ej. San José, 95112"}
                aria-describedby="servicios-city-filter-hint"
                className="mt-1 min-h-[48px] w-full rounded-xl border border-[#e5ddd2] bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
              />
              <span id="servicios-city-filter-hint" className="mt-1 block text-[11px] leading-snug text-[#64748b]">
                {lang === "en"
                  ? "Matches the city stored on each published listing (same field as the advertiser chose)."
                  : "Coincide con la ciudad guardada en cada anuncio (el mismo campo que eligió el anunciante)."}
              </span>
            </label>
            <button
              type="submit"
              className="inline-flex min-h-[48px] w-full shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] px-6 text-sm font-bold text-white shadow-md transition hover:brightness-[1.03] sm:w-auto"
            >
              {lang === "en" ? "Search" : "Buscar"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ebe4d9]/90 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
            {lang === "en" ? "Refine" : "Afinar"}
          </h2>
          {hasFilters ? (
            <Link
              href={resetHref}
              className="min-h-[44px] touch-manipulation text-xs font-semibold text-[#3B66AD] underline underline-offset-2"
            >
              {lang === "en" ? "Clear all filters" : "Quitar todos los filtros"}
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Sort" : "Orden"}</span>
            <select
              name="sort"
              defaultValue={current.sort === "name" ? "name" : "newest"}
              className="min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
            >
              <option value="newest">{lang === "en" ? "Newest first" : "Más recientes primero"}</option>
              <option value="name">{lang === "en" ? "Name (A–Z)" : "Nombre (A–Z)"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">
              {lang === "en" ? "Provider type" : "Tipo de proveedor"}
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
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748b]">
            {lang === "en" ? "Contact signals on the profile" : "Señales de contacto en la vitrina"}
          </p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="inline-flex min-h-[48px] min-w-[160px] items-center justify-center rounded-xl bg-[#3B66AD] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#2f5699]"
          >
            {lang === "en" ? "Apply filters" : "Aplicar filtros"}
          </button>
        </div>

        <p className="text-[11px] leading-relaxed text-neutral-500">
          {lang === "en"
            ? "Provider type is inferred from published contact fields. Keyword search matches name, city, trade line, and about text."
            : "El tipo de proveedor se infiere de los datos de contacto publicados. La búsqueda coincide con nombre, ciudad, giro y texto «Acerca»."}
        </p>
      </form>
    </div>
  );
}
