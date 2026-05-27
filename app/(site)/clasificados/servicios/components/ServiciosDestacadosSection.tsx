import {
  getServiciosDestacadoDisplayMode,
  type ServiciosDestacadoDisplayMode,
} from "../lib/serviciosDestacados";
import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";
import { ServiciosDestacadoCard } from "./ServiciosDestacadoCard";

function layoutClassForMode(mode: ServiciosDestacadoDisplayMode): string {
  switch (mode) {
    case "hero":
      return "grid grid-cols-1 place-items-center";
    case "duo":
      return "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5";
    case "grid":
      return "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6";
    case "compact":
      return "flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
    default:
      return "grid grid-cols-1 gap-4";
  }
}

function itemClassForMode(mode: ServiciosDestacadoDisplayMode): string {
  if (mode === "compact") return "min-w-[min(88vw,300px)] shrink-0 snap-start sm:min-w-[280px]";
  return "min-w-0";
}

export function ServiciosDestacadosSection({
  rows,
  lang,
  id = "servicios-destacados-patrocinados",
}: {
  rows: ServiciosPublicListingRow[];
  lang: "es" | "en";
  id?: string;
}) {
  if (rows.length === 0) return null;

  const displayMode = getServiciosDestacadoDisplayMode(rows.length);
  const layoutClass = layoutClassForMode(displayMode);

  return (
    <section className="relative" aria-labelledby={id}>
      <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a6220]">
            {lang === "en" ? "Sponsored visibility" : "Visibilidad patrocinada"}
          </p>
          <h2 id={id} className="mt-1 text-lg font-bold tracking-tight text-[#142a42] sm:text-xl md:text-2xl">
            {lang === "en" ? "Featured / Sponsored" : "Destacados / Patrocinados"}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#4a5d6e] sm:text-sm">
            {lang === "en"
              ? "Leonix advertisers with highlighted visibility."
              : "Anunciantes Leonix con visibilidad destacada."}
          </p>
        </div>
      </div>
      <ul className={`list-none ${layoutClass}`}>
        {rows.map((row) => (
          <li key={row.slug} className={itemClassForMode(displayMode)}>
            <ServiciosDestacadoCard row={row} lang={lang} displayMode={displayMode} />
          </li>
        ))}
      </ul>
    </section>
  );
}
