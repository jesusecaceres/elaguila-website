import Link from "next/link";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosResultsFilterQuery } from "./lib/serviciosResultsFilter";
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
  const hasFilters = Boolean(
    current.city?.trim() ||
      current.group?.trim() ||
      current.whatsapp === "1" ||
      current.promo === "1" ||
      current.call === "1",
  );

  return (
    <div className="mt-6 rounded-2xl border border-neutral-200/90 bg-white/90 p-3 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">
          {lang === "en" ? "Filters" : "Filtros"}
        </h2>
        {hasFilters ? (
          <Link
            href={resetHref}
            className="min-h-[40px] touch-manipulation text-xs font-semibold text-[#3B66AD] underline underline-offset-2"
          >
            {lang === "en" ? "Reset" : "Restablecer"}
          </Link>
        ) : null}
      </div>

      <form
        method="get"
        action="/clasificados/servicios/resultados"
        aria-label={lang === "en" ? "Filter Servicios results" : "Filtrar resultados de Servicios"}
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <input type="hidden" name="lang" value={lang} />
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "City" : "Ciudad"}</span>
          <input
            name="city"
            defaultValue={current.city ?? ""}
            placeholder={lang === "en" ? "e.g. Houston" : "ej. Houston"}
            className="min-h-[44px] w-full min-w-0 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Business group" : "Giro"}</span>
          <select
            name="group"
            defaultValue={current.group ?? ""}
            className="min-h-[44px] w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
          >
            <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
            {SERVICIOS_INTERNAL_GROUP_IDS.map((id) => (
              <option key={id} value={id}>
                {formatServiciosInternalGroupForDiscovery(id, lang) ?? id}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-semibold text-neutral-700">WhatsApp</span>
          <select
            name="whatsapp"
            defaultValue={current.whatsapp === "1" ? "1" : ""}
            className="min-h-[44px] w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
          >
            <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
            <option value="1">{lang === "en" ? "Listed" : "Disponible"}</option>
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Offer / promo" : "Oferta"}</span>
          <select
            name="promo"
            defaultValue={current.promo === "1" ? "1" : ""}
            className="min-h-[44px] w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
          >
            <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
            <option value="1">{lang === "en" ? "Has offer" : "Con oferta"}</option>
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Phone" : "Teléfono"}</span>
          <select
            name="call"
            defaultValue={current.call === "1" ? "1" : ""}
            className="min-h-[44px] w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]"
          >
            <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
            <option value="1">{lang === "en" ? "Listed" : "Disponible"}</option>
          </select>
        </label>
        <div className="flex items-end sm:col-span-2 lg:col-span-1">
          <button
            type="submit"
            className="min-h-[44px] w-full touch-manipulation rounded-xl bg-[#3B66AD] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#2f5699]"
          >
            {lang === "en" ? "Apply" : "Aplicar"}
          </button>
        </div>
      </form>

      <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">
        {lang === "en"
          ? "Filters use structured fields from published profiles only (city, trade family, contact signals, offers). Language is shown on each card when the business provided it — there is no language filter yet."
          : "Los filtros usan solo campos estructurados de perfiles publicados (ciudad, familia de giro, señales de contacto, ofertas). El idioma aparece en la tarjeta si el negocio lo indicó; aún no hay filtro por idioma."}
      </p>
    </div>
  );
}
