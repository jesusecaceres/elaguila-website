import {
  getRestaurantesDestacadoDisplayMode,
  type RestaurantesDestacadoDisplayMode,
} from "../lib/restaurantesDestacados";
import type { RestaurantesPublicBlueprintRow } from "../data/restaurantesPublicBlueprintData";
import { RestaurantesDestacadoCard } from "./RestaurantesDestacadoCard";

function layoutClassForMode(mode: RestaurantesDestacadoDisplayMode): string {
  switch (mode) {
    case "hero":
      return "grid grid-cols-1 place-items-center";
    case "duo":
      return "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5";
    case "grid":
      return "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5";
    case "compact":
      return "flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
    default:
      return "grid grid-cols-1 gap-4";
  }
}

function itemClassForMode(mode: RestaurantesDestacadoDisplayMode): string {
  if (mode === "compact") return "min-w-[min(88vw,320px)] shrink-0 snap-start sm:min-w-[300px]";
  return "min-w-0";
}

export function RestaurantesDestacadosSection({
  rows,
  lang,
  id = "restaurantes-destacados-patrocinados",
}: {
  rows: RestaurantesPublicBlueprintRow[];
  lang: "es" | "en";
  id?: string;
}) {
  if (rows.length === 0) return null;

  const displayMode = getRestaurantesDestacadoDisplayMode(rows.length);

  return (
    <section className="relative" aria-labelledby={id}>
      <div className="mb-4 sm:mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a6220]">
          {lang === "en" ? "Sponsored visibility" : "Visibilidad patrocinada"}
        </p>
        <h2 id={id} className="mt-1 font-serif text-xl font-semibold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">
          {lang === "en" ? "Featured / Sponsored" : "Destacados / Patrocinados"}
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--lx-muted)] sm:text-sm">
          {lang === "en"
            ? "Leonix advertisers with highlighted visibility."
            : "Anunciantes Leonix con visibilidad destacada."}
        </p>
      </div>
      <ul className={`list-none ${layoutClassForMode(displayMode)}`}>
        {rows.map((row) => (
          <li key={row.id} className={itemClassForMode(displayMode)}>
            <RestaurantesDestacadoCard row={row} lang={lang} displayMode={displayMode} />
          </li>
        ))}
      </ul>
    </section>
  );
}
