import Link from "next/link";
import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";
import { ServiciosHorizontalResultCard } from "../components/ServiciosHorizontalResultCard";

export function FeaturedBusinessSection({
  lang,
  rows,
}: {
  lang: "es" | "en";
  rows: ServiciosPublicListingRow[];
}) {
  const resultsHref = `/clasificados/servicios/resultados?lang=${lang}`;
  const publishHref = `/clasificados/publicar/servicios?lang=${lang}`;

  return (
    <section className="relative" aria-labelledby="servicios-destacados-heading">
      <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4 md:mb-10">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3d5a73]/85">
            {lang === "en" ? "Featured" : "Destacados"}
          </p>
          <h2
            id="servicios-destacados-heading"
            className="mt-1.5 text-[1.45rem] font-bold leading-tight tracking-tight text-[#142a42] sm:mt-2 sm:text-[1.85rem] md:text-[2rem]"
          >
            {lang === "en" ? "Featured services" : "Destacados en servicios"}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#4a5d6e] sm:mt-3 sm:text-[16px]">
            {rows.length === 0 ? (
              <>
                <span className="sm:hidden">
                  {lang === "en"
                    ? "When a business has featured placement, it appears here automatically."
                    : "Cuando un negocio tenga destacado, aparecerá aquí automáticamente."}
                </span>
                <span className="hidden sm:inline">
                  {lang === "en"
                    ? "Real published profiles with featured placement — the same listings you see in results, never sample data."
                    : "Perfiles reales con destacado: los mismos anuncios que ves en resultados, sin datos de muestra."}
                </span>
              </>
            ) : lang === "en" ? (
              "Real published profiles with featured placement — the same listings you see in results, never sample data."
            ) : (
              "Perfiles reales con destacado: los mismos anuncios que ves en resultados, sin datos de muestra."
            )}
          </p>
        </div>
        {rows.length > 0 ? (
          <Link
            href={resultsHref}
            className="shrink-0 self-start text-[13px] font-bold text-[#3B66AD] underline-offset-4 transition hover:underline sm:self-auto sm:text-[14px]"
          >
            {lang === "en" ? "View all services" : "Ver todos los servicios"}
          </Link>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#c9b8a4]/90 bg-gradient-to-b from-[#FFFCF7] to-[#faf6f0] px-4 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:rounded-2xl sm:px-5 sm:py-12">
          <p className="mx-auto max-w-lg text-[13px] font-medium leading-snug text-[#142a42] sm:text-sm sm:leading-relaxed">
            {lang === "en"
              ? "No featured listings yet — browse results or publish to grow demand."
              : "Aún no hay destacados: explora resultados o publica para generar demanda."}
          </p>
          <p className="mx-auto mt-1.5 hidden max-w-lg text-sm leading-relaxed text-[#4a5d6e] sm:mt-2 sm:block">
            {lang === "en"
              ? "Browse all services or publish yours to reach people who are already searching."
              : "Explora todos los servicios o publica el tuyo para llegar a quien ya está buscando."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:mt-6 sm:gap-3">
            <Link
              href={resultsHref}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-xs font-bold text-white shadow-md transition hover:bg-[#2f5699] sm:min-h-[48px] sm:px-5 sm:text-sm"
            >
              {lang === "en" ? "View all services" : "Ver todos los servicios"}
            </Link>
            <Link
              href={publishHref}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#EA580C]/35 bg-white px-4 text-xs font-bold text-[#C2410C] shadow-sm transition hover:bg-[#fff8f3] sm:min-h-[48px] sm:px-5 sm:text-sm"
            >
              {lang === "en" ? "Publish your service" : "Publica tu servicio"}
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mx-auto flex max-w-[1100px] list-none flex-col gap-4 sm:gap-6">
          {rows.map((row) => (
            <li key={row.slug} className="min-w-0">
              <ServiciosHorizontalResultCard row={row} lang={lang} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
