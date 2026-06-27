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
  const resultsHref = `/clasificados/servicios/results?lang=${lang}`;
  const publishHref = `/clasificados/publicar/servicios?lang=${lang}`;

  return (
    <section className="relative" aria-labelledby="servicios-recientes-heading">
      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3d5a73]/85">
            {lang === "en" ? "New on Leonix" : "Novedades"}
          </p>
          <h2
            id="servicios-recientes-heading"
            className="mt-1 text-lg font-bold leading-tight tracking-tight text-[#142a42] sm:text-xl"
          >
            {lang === "en" ? "Recent services" : "Servicios recientes"}
          </h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-snug text-[#4a5d6e] sm:text-[13px]">
            {lang === "en"
              ? "The newest public service profiles — live data from published listings only."
              : "Los perfiles públicos más recientes: solo datos reales de anuncios publicados."}
          </p>
        </div>
        {rows.length > 0 ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            <Link
              href={resultsHref}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#1a3352] px-4 text-[13px] font-bold tracking-wide text-white shadow-[0_8px_22px_-12px_rgba(26,51,82,0.45)] transition hover:bg-[#152a45] hover:brightness-[1.02] active:scale-[0.99] sm:hidden"
            >
              {lang === "en" ? "View all services" : "Ver todos los servicios"}
            </Link>
            <Link
              href={resultsHref}
              className="hidden shrink-0 self-start text-[13px] font-bold text-[#3B66AD] underline-offset-4 transition hover:underline sm:inline sm:self-auto sm:text-[14px]"
            >
              {lang === "en" ? "View all services" : "Ver todos los servicios"}
            </Link>
          </div>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#c9b8a4]/90 bg-gradient-to-b from-[#FFFCF7] to-[#faf6f0] px-4 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:rounded-2xl sm:px-5 sm:py-6">
          <p className="mx-auto max-w-lg text-[13px] font-medium leading-snug text-[#142a42] sm:text-sm sm:leading-relaxed">
            {lang === "en"
              ? "No public listings yet. When businesses publish, the newest will appear here first."
              : "Aún no hay anuncios públicos. Cuando se publiquen servicios, los más recientes aparecerán aquí primero."}
          </p>
          <p className="mx-auto mt-1.5 max-w-lg text-[13px] leading-snug text-[#4a5d6e] sm:mt-2 sm:text-sm sm:leading-relaxed">
            {lang === "en"
              ? "Browse all results or publish your service to show up in the marketplace."
              : "Abre todos los resultados o publica tu servicio para aparecer en el marketplace."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-3">
            <Link
              href={resultsHref}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-xs font-bold text-white shadow-md transition hover:bg-[#2f5699] sm:min-h-[48px] sm:px-5 sm:text-sm"
            >
              {lang === "en" ? "View all services" : "Ver todos los servicios"}
            </Link>
            <Link
              href={publishHref}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#EA580C]/35 bg-white px-4 text-xs font-bold text-[#C2410C] shadow-sm transition hover:bg-[#fff8f3] sm:min-h-[48px] sm:px-5 sm:text-sm"
            >
              {lang === "en" ? "Publish your service" : "Publica tu servicio"}
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mx-auto grid max-w-[1100px] list-none grid-cols-1 gap-2.5 lg:grid-cols-2">
          {rows.map((row) => (
            <li key={row.slug} className="min-w-0">
              <ServiciosHorizontalResultCard row={row} lang={lang} density="compact" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
