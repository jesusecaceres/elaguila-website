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

  return (
    <section className="relative" aria-labelledby="servicios-recientes-heading">
      <div className="mb-8 md:mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3d5a73]/85">
          {lang === "en" ? "Community" : "Comunidad"}
        </p>
        <h2
          id="servicios-recientes-heading"
          className="mt-2 text-[1.65rem] font-bold leading-tight tracking-tight text-[#142a42] sm:text-[1.85rem] md:text-[2rem]"
        >
          {lang === "en" ? "Recent services" : "Servicios Recientes"}
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#4a5d6e] sm:text-[16px]">
          {lang === "en"
            ? "Newest published Leonix showcases (live data — not static demos)."
            : "Las vitrinas publicadas más recientes en Leonix (datos reales, no demos fijas)."}
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c9b8a4] bg-[#faf8f5] px-5 py-12 text-center">
          <p className="mx-auto max-w-lg text-sm font-medium text-[#142a42]">
            {lang === "en"
              ? "No public listings yet — when businesses publish, the newest appear here first."
              : "Aún no hay anuncios públicos: al publicarse, los más recientes aparecerán aquí primero."}
          </p>
          <Link
            href={resultsHref}
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#3B66AD] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#2f5699]"
          >
            {lang === "en" ? "Open results" : "Abrir resultados"}
          </Link>
        </div>
      ) : (
        <ul className="mx-auto flex max-w-[1100px] list-none flex-col gap-5 sm:gap-6">
          {rows.map((row) => (
            <li key={row.slug} className="min-w-0">
              <ServiciosHorizontalResultCard row={row} lang={lang} persistListingEngagement={Boolean((row.leonix_ad_id || "").trim())} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
