import Link from "next/link";
import { FeaturedBusinessCard } from "./FeaturedBusinessCard";
import type { ServiciosLandingFeaturedBusiness } from "./serviciosLandingSampleData";

export function FeaturedBusinessSection({
  lang,
  items,
}: {
  lang: "es" | "en";
  items: ServiciosLandingFeaturedBusiness[];
}) {
  const resultsHref = `/clasificados/servicios/resultados?lang=${lang}`;
  const publishHref = `/clasificados/publicar/servicios?lang=${lang}`;

  return (
    <section className="relative" aria-labelledby="servicios-destacados-heading">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3d5a73]/85">
            {lang === "en" ? "Premium placement" : "Espacio premium"}
          </p>
          <h2
            id="servicios-destacados-heading"
            className="mt-2 text-[1.65rem] font-bold leading-tight tracking-tight text-[#142a42] sm:text-[1.85rem] md:text-[2rem]"
          >
            {lang === "en" ? "Amplified placement" : "Mayor visibilidad"}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#4a5d6e] sm:text-[16px]">
            {lang === "en"
              ? "Only real published listings whose profile marks paid/amplified placement (`isFeatured`) — same data as results, never sample inventory."
              : "Solo anuncios reales publicados cuyo perfil marca colocación pagada o amplificada (`isFeatured`) — los mismos datos que en resultados, nunca inventario de muestra."}
          </p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c9b8a4] bg-gradient-to-b from-[#FFFCF7] to-[#faf6f0] px-5 py-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <p className="mx-auto max-w-lg text-sm font-medium leading-relaxed text-[#142a42]">
            {lang === "en"
              ? "No amplified listings yet — when a published profile earns featured placement, it appears here automatically."
              : "Aún no hay anuncios con mayor visibilidad: cuando un perfil publicado tenga destacado activo, aparecerá aquí automáticamente."}
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#4a5d6e]">
            {lang === "en"
              ? "Browse all public listings or publish your service."
              : "Explora todos los anuncios públicos o publica tu servicio."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={resultsHref}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#3B66AD] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#2f5699]"
            >
              {lang === "en" ? "Browse results" : "Ver resultados"}
            </Link>
            <Link
              href={publishHref}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#EA580C]/35 bg-white px-5 text-sm font-bold text-[#C2410C] shadow-sm transition hover:bg-[#fff8f3]"
            >
              {lang === "en" ? "Publish" : "Publicar"}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-7 sm:gap-8 md:grid-cols-2 md:gap-8 xl:grid-cols-3 xl:gap-9">
          {items.map((row) => (
            <FeaturedBusinessCard key={row.id} row={row} lang={lang} />
          ))}
        </div>
      )}
    </section>
  );
}
