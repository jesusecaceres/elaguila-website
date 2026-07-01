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
    <div className="mx-auto max-w-lg rounded-xl border border-[#D6C7AD]/70 bg-[#FFFDF7] px-4 py-5 text-center">
      <h2 className="text-sm font-semibold text-[#3D3428]">
        {featuredOnly
          ? lang === "es"
            ? "No hay anuncios recién refrescados"
            : "No recently refreshed listings"
          : lang === "es"
            ? "No hay resultados que coincidan"
            : "No matching results"}
      </h2>
      <p className="mt-1 text-xs text-[#3D3428]/70">
        {featuredOnly
          ? lang === "es"
            ? "Quita el filtro de refrescados o amplía ciudad/ZIP."
            : "Turn off refreshed-only or widen city/ZIP."
          : lang === "es"
            ? "Prueba otra búsqueda, ajusta filtros o publica el primer artículo."
            : "Try another search, adjust filters, or post the first item."}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Link
          href={`/clasificados/publicar/en-venta?lang=${lang}`}
          className="inline-flex min-h-[2.625rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721]"
        >
          {lang === "es" ? "Publicar artículo" : "Post item"}
        </Link>
        <Link
          href={home}
          className="inline-flex min-h-[2.625rem] items-center justify-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3.5 text-sm font-semibold text-[#3D3428] hover:bg-[#FBF7EF]"
        >
          {lang === "es" ? "Ver todos los anuncios" : "Browse all listings"}
        </Link>
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-[2.625rem] items-center justify-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3.5 text-sm font-semibold text-[#3D3428] hover:bg-[#FBF7EF]"
          >
            {lang === "es" ? "Limpiar filtros" : "Clear filters"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
