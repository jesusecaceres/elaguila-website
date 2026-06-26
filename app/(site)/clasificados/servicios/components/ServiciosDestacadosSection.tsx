import Link from "next/link";
import { TbAward } from "react-icons/tb";
import {
  getServiciosDestacadoDisplayMode,
  type ServiciosDestacadoDisplayMode,
} from "../lib/serviciosDestacados";
import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";
import { ServiciosHorizontalResultCard } from "./ServiciosHorizontalResultCard";

function layoutClassForMode(mode: ServiciosDestacadoDisplayMode): string {
  switch (mode) {
    case "hero":
      return "grid grid-cols-1 gap-3 sm:max-w-md";
    case "duo":
      return "grid grid-cols-1 gap-3 sm:grid-cols-2";
    case "grid":
      return "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";
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

function DestacadosHeader({ id, lang }: { id: string; lang: "es" | "en" }) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a6220]">
          {lang === "en" ? "Sponsored visibility" : "Visibilidad patrocinada"}
        </p>
        <h2 id={id} className="mt-1 text-lg font-bold tracking-tight text-[#142a42] sm:text-xl">
          {lang === "en" ? "Featured / Sponsored" : "Destacados / Patrocinados"}
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#4a5d6e]">
          {lang === "en"
            ? "Leonix advertisers with highlighted visibility."
            : "Anunciantes Leonix con visibilidad destacada."}
        </p>
      </div>
    </div>
  );
}

function DestacadosEmptyState({ lang }: { lang: "es" | "en" }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-[#C9A84A]/55 bg-gradient-to-b from-[#FBF6EC] to-[#F6EFDF] px-4 py-5 text-center sm:flex-row sm:justify-between sm:text-left">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#7a6220] shadow-[0_6px_18px_-10px_rgba(122,98,32,0.6)] ring-1 ring-[#C9A84A]/40">
        <TbAward className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#142a42]">
          {lang === "en" ? "Featured spots are available" : "Espacios destacados disponibles"}
        </p>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[#5a4f3a]">
          {lang === "en"
            ? "Put your service first when clients search on Leonix."
            : "Haz que tu servicio aparezca primero cuando clientes buscan en Leonix."}
        </p>
      </div>
      <Link
        href={`/clasificados/publicar/servicios?lang=${lang}`}
        className="inline-flex min-h-[38px] shrink-0 items-center justify-center rounded-full bg-[#7A1E2C] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#651825]"
      >
        {lang === "en" ? "Publish your service" : "Publica tu servicio"}
      </Link>
    </div>
  );
}

export function ServiciosDestacadosSection({
  rows,
  lang,
  id = "servicios-destacados-patrocinados",
  showEmptyState = false,
}: {
  rows: ServiciosPublicListingRow[];
  lang: "es" | "en";
  id?: string;
  /** Landing: render a premium empty state instead of hiding when no real destacados exist. */
  showEmptyState?: boolean;
}) {
  if (rows.length === 0) {
    if (!showEmptyState) return null;
    return (
      <section className="relative" aria-labelledby={id}>
        <DestacadosHeader id={id} lang={lang} />
        <DestacadosEmptyState lang={lang} />
      </section>
    );
  }

  const displayMode = getServiciosDestacadoDisplayMode(rows.length);
  const layoutClass = layoutClassForMode(displayMode);

  return (
    <section className="relative" aria-labelledby={id}>
      <DestacadosHeader id={id} lang={lang} />
      <ul className={`list-none ${layoutClass}`}>
        {rows.map((row) => (
          <li key={row.slug} className={itemClassForMode(displayMode)}>
            <ServiciosHorizontalResultCard row={row} lang={lang} density="compact" />
          </li>
        ))}
      </ul>
    </section>
  );
}
