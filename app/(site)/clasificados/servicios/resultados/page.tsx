import type { Metadata } from "next";
import Link from "next/link";
import { ServiciosDirectoryLocalSection } from "../ServiciosDirectoryLocalSection";
import { ServiciosListingResultCard } from "../ServiciosListingResultCard";
import { ServiciosResultsFilters } from "../ServiciosResultsFilters";
import { filterServiciosPublicListingRows, type ServiciosResultsFilterQuery } from "../lib/serviciosResultsFilter";
import { listServiciosPublicListingsFromDb } from "../lib/serviciosPublicListingsServer";

export const metadata: Metadata = {
  title: "Servicios — Resultados · Leonix Clasificados",
  description: "Filtra y descubre vitrinas de servicios locales publicadas en Leonix.",
};

type PageProps = {
  searchParams?: Promise<{
    lang?: string;
    city?: string;
    group?: string;
    whatsapp?: string;
    promo?: string;
    call?: string;
    q?: string;
  }>;
};

export default async function ClasificadosServiciosResultadosPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";
  const allRows = await listServiciosPublicListingsFromDb(96);

  const filterQuery: ServiciosResultsFilterQuery = {
    city: sp.city,
    group: sp.group,
    whatsapp: sp.whatsapp === "1" ? "1" : undefined,
    promo: sp.promo === "1" ? "1" : undefined,
    call: sp.call === "1" ? "1" : undefined,
  };

  const rows = filterServiciosPublicListingRows(allRows, lang, filterQuery);
  const dbSlugList = allRows.map((r) => r.slug);

  const hasActiveFilters = Boolean(
    filterQuery.city?.trim() ||
      filterQuery.group?.trim() ||
      filterQuery.whatsapp === "1" ||
      filterQuery.promo === "1" ||
      filterQuery.call === "1",
  );

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-neutral-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <section
          className="relative overflow-hidden rounded-3xl border border-[#D8C79A]/35 bg-gradient-to-br from-[#3B66AD]/10 via-white to-[#F6F0E2]/50 px-5 py-8 shadow-sm sm:px-8 sm:py-10"
          aria-labelledby="servicios-discovery-heading"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[#3B66AD]">Leonix Clasificados</p>
          <h1
            id="servicios-discovery-heading"
            className="mt-2 text-2xl font-extrabold tracking-tight text-[#3D2C12] sm:text-3xl"
          >
            {lang === "en" ? "Find local services" : "Encuentra servicios locales"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700">
            {lang === "en"
              ? "Each card is a real business showcase on Leonix — not a generic directory scrape. Filter by area, trade family, and how you want to reach out."
              : "Cada tarjeta es una vitrina real en Leonix, no un listado genérico. Filtra por zona, familia de giro y cómo quieres conectar."}
          </p>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-neutral-500">
            {lang === "en"
              ? "Publish when you are ready; empty sections stay hidden so the ad stays premium."
              : "Publica cuando estés listo; las secciones vacías no se muestran para mantener la vitrina impecable."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/clasificados/publicar/servicios?lang=${lang}`}
              className="inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-xl bg-[#3B66AD] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#2f5699]"
            >
              {lang === "en" ? "Create a listing" : "Crear anuncio"}
            </Link>
            <Link
              href={`/clasificados/publicar/servicios/preview?lang=${lang}&sample=expert`}
              className="inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-xl border border-[#3D2C12]/20 bg-white px-5 text-sm font-semibold text-[#3D2C12] shadow-sm transition hover:border-[#3B66AD]/40"
            >
              {lang === "en" ? "See sample profile" : "Ver ejemplo de vitrina"}
            </Link>
            <Link
              href={`/clasificados/servicios?lang=${lang}`}
              className="inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-xl border border-transparent px-2 text-sm font-semibold text-[#3B66AD] underline underline-offset-4"
            >
              {lang === "en" ? "Servicios home" : "Inicio Servicios"}
            </Link>
            <Link
              href={`/clasificados?lang=${lang}`}
              className="inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-xl border border-transparent px-2 text-sm font-semibold text-[#3B66AD] underline underline-offset-4"
            >
              {lang === "en" ? "All classifieds" : "Todos los clasificados"}
            </Link>
          </div>
        </section>

        <ServiciosResultsFilters lang={lang} current={filterQuery} />

        <section className="mt-8" aria-labelledby="servicios-results-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="servicios-results-heading" className="text-sm font-bold uppercase tracking-wide text-neutral-500">
              {lang === "en" ? "Results" : "Resultados"}
              <span className="ml-2 tabular-nums text-neutral-400">({rows.length})</span>
            </h2>
          </div>

          {rows.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-white/90 px-4 py-12 text-center shadow-sm">
              <p className="mx-auto max-w-md text-sm font-medium leading-relaxed text-neutral-800">
                {hasActiveFilters
                  ? lang === "en"
                    ? "No profiles match these filters yet."
                    : "Aún no hay perfiles que coincidan con estos filtros."
                  : lang === "en"
                    ? "No public Servicios showcases yet."
                    : "Aún no hay vitrinas públicas en Servicios."}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
                {hasActiveFilters
                  ? lang === "en"
                    ? "Try resetting filters or broadening city / trade."
                    : "Prueba restablecer filtros o ampliar ciudad / giro."
                  : lang === "en"
                    ? "When listings go live, they will appear here with the same layout you preview in the publish flow."
                    : "Cuando haya listados, aparecerán aquí con el mismo diseño que ves al publicar."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {hasActiveFilters ? (
                  <Link
                    href={`/clasificados/servicios/resultados?lang=${lang}`}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#3B66AD]/30 bg-white px-5 text-sm font-bold text-[#3B66AD] shadow-sm transition hover:bg-[#3B66AD]/5"
                  >
                    {lang === "en" ? "Reset filters" : "Restablecer filtros"}
                  </Link>
                ) : null}
                <Link
                  href={`/clasificados/publicar/servicios?lang=${lang}`}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#3B66AD] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#2f5699]"
                >
                  {lang === "en" ? "Start a listing" : "Empezar un anuncio"}
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {rows.map((r) => (
                <ServiciosListingResultCard key={r.slug} row={r} lang={lang} />
              ))}
            </ul>
          )}
        </section>

        <ServiciosDirectoryLocalSection lang={lang} dbSlugs={dbSlugList} />
      </div>
    </div>
  );
}
