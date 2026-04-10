"use client";

import Link from "next/link";
import { buildEnVentaResultsUrl } from "../shared/constants/enVentaResultsRoutes";

type Lang = "es" | "en";

export function EnVentaResultsEmpty({
  lang,
  onReset,
  featuredOnly,
}: {
  lang: Lang;
  onReset?: () => void;
  featuredOnly?: boolean;
}) {
  const home = buildEnVentaResultsUrl(lang);
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/95 px-6 py-12 text-center shadow-[0_12px_40px_-12px_rgba(42,36,22,0.12)]">
      <div className="text-4xl" aria-hidden>
        🛒
      </div>
      <h2 className="mt-4 text-lg font-semibold text-[#1E1810]">
        {featuredOnly
          ? lang === "es"
            ? "No hay destacados Pro activos"
            : "No active Pro featured listings"
          : lang === "es"
            ? "No hay resultados que coincidan"
            : "No matching results"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">
        {featuredOnly
          ? lang === "es"
            ? "Ningún anuncio con visibilidad destacada coincide con estos filtros. Quita el modo solo destacados Pro, amplía la zona o vuelve al listado general."
            : "No boosted listings match these filters. Turn off “Pro featured only”, widen location, or browse all listings."
          : lang === "es"
            ? "Prueba otra búsqueda, ajusta filtros o amplía la ciudad."
            : "Try another search, adjust filters, or widen your city."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href={`/clasificados/publicar/en-venta?lang=${lang}`}
          className="rounded-full bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
        >
          {lang === "es" ? "Publicar artículo" : "Post an item"}
        </Link>
        <Link
          href={home}
          className="rounded-full border border-[#E8DFD0] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
        >
          {lang === "es" ? "Ver todo En Venta" : "Browse all For Sale"}
        </Link>
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-[#C9B46A]/40 bg-[#FAF4EA]/80 px-5 py-2.5 text-sm font-semibold text-[#2C2416] hover:bg-[#F5ECD8]"
          >
            {lang === "es" ? "Limpiar filtros" : "Clear filters"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
