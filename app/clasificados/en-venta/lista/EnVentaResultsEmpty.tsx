"use client";

type Lang = "es" | "en";

export function EnVentaResultsEmpty({ lang, onReset }: { lang: Lang; onReset?: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-black/10 bg-[#F5F5F5] px-6 py-10 text-center shadow-sm">
      <div className="text-4xl" aria-hidden>
        🛒
      </div>
      <h2 className="mt-4 text-lg font-semibold text-[#111111]">
        {lang === "es" ? "Sin resultados en En Venta" : "No For Sale results yet"}
      </h2>
      <p className="mt-2 text-sm text-[#111111]/70">
        {lang === "es"
          ? "Prueba otra búsqueda, amplía la ciudad o publica el primer artículo."
          : "Try another search, widen your city, or post the first item."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a
          href={`/clasificados/publicar/en-venta?lang=${lang}`}
          className="rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          {lang === "es" ? "Publicar artículo" : "Post an item"}
        </a>
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF]"
          >
            {lang === "es" ? "Limpiar filtros" : "Clear filters"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
