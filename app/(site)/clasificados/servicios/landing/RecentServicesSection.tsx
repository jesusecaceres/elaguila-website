import Link from "next/link";
import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";
import { ServiciosHorizontalResultCard } from "../components/ServiciosHorizontalResultCard";

export function RecentServicesSection({
  lang,
  rows,
}: {
  lang: "es" | "en";
  rows: ServiciosPublicListingRow[];
}) {
  const resultsHref = `/clasificados/servicios/resultados?lang=${lang}`;
  const publishHref = `/clasificados/publicar/servicios?lang=${lang}`;

  return (
    <section className="relative" aria-labelledby="servicios-recientes-heading">
      <div className="mb-8 md:mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3d5a73]/85">
          {lang === "en" ? "Fresh listings" : "Recién publicados"}
        </p>
        <h2
          id="servicios-recientes-heading"
          className="mt-2 text-[1.65rem] font-bold leading-tight tracking-tight text-[#142a42] sm:text-[1.85rem] md:text-[2rem]"
        >
          {lang === "en" ? "Recently added services" : "Servicios recientes"}
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#4a5d6e] sm:text-[16px]">
          {lang === "en"
            ? "The newest public service profiles on the marketplace — live data from published listings."
            : "Los perfiles de servicio públicos más nuevos en el marketplace: datos reales de anuncios publicados."}
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c9b8a4] bg-gradient-to-b from-[#FFFCF7] to-[#faf6f0] px-5 py-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <p className="mx-auto max-w-lg text-sm font-medium leading-relaxed text-[#142a42]">
            {lang === "en"
              ? "No public listings yet. When businesses publish, the newest will appear here first."
              : "Aún no hay anuncios públicos. Cuando se publiquen servicios, los más recientes aparecerán aquí primero."}
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#4a5d6e]">
            {lang === "en"
              ? "Browse all results or publish your service to show up in the marketplace."
              : "Abre todos los resultados o publica tu servicio para aparecer en el marketplace."}
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
