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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between md:mb-10">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3d5a73]/85">
            {lang === "en" ? "Featured" : "Destacados"}
          </p>
          <h2
            id="servicios-destacados-heading"
            className="mt-2 text-[1.65rem] font-bold leading-tight tracking-tight text-[#142a42] sm:text-[1.85rem] md:text-[2rem]"
          >
            {lang === "en" ? "Featured services" : "Destacados en servicios"}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#4a5d6e] sm:text-[16px]">
            {lang === "en"
              ? "Real published profiles with featured placement — the same listings you see in results, never sample data."
              : "Perfiles reales con destacado: los mismos anuncios que ves en resultados, sin datos de muestra."}
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
        <div className="rounded-2xl border border-dashed border-[#c9b8a4] bg-gradient-to-b from-[#FFFCF7] to-[#faf6f0] px-5 py-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <p className="mx-auto max-w-lg text-sm font-medium leading-relaxed text-[#142a42]">
            {lang === "en"
              ? "No featured listings yet. When a business has featured placement, it will show up here automatically."
              : "Aún no hay destacados. Cuando un negocio tenga colocación destacada, aparecerá aquí automáticamente."}
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#4a5d6e]">
            {lang === "en"
              ? "Browse all services or publish yours to reach people who are already searching."
              : "Explora todos los servicios o publica el tuyo para llegar a quien ya está buscando."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={resultsHref}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#3B66AD] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#2f5699]"
            >
              {lang === "en" ? "View all services" : "Ver todos los servicios"}
            </Link>
            <Link
              href={publishHref}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#EA580C]/35 bg-white px-5 text-sm font-bold text-[#C2410C] shadow-sm transition hover:bg-[#fff8f3]"
            >
              {lang === "en" ? "Publish your service" : "Publica tu servicio"}
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mx-auto flex max-w-[1100px] list-none flex-col gap-5 sm:gap-6">
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
