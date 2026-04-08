import type { Metadata } from "next";
import Link from "next/link";
import { ServiciosDirectoryLocalSection } from "./ServiciosDirectoryLocalSection";
import { ServiciosListingResultCard } from "./ServiciosListingResultCard";
import { ServiciosResultsFilters } from "./ServiciosResultsFilters";
import { filterServiciosPublicListingRows, type ServiciosResultsFilterQuery } from "./lib/serviciosResultsFilter";
import { listServiciosPublicListingsFromDb } from "./lib/serviciosPublicListingsServer";

export const metadata: Metadata = {
  title: "Servicios · Leonix Clasificados",
  description: "Descubre servicios locales en Leonix — base de descubrimiento y listados.",
};

type PageProps = {
  searchParams?: Promise<{
    lang?: string;
    city?: string;
    group?: string;
    whatsapp?: string;
    promo?: string;
    call?: string;
  }>;
};

export default async function ClasificadosServiciosDirectoryPage(props: PageProps) {
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
              ? "Browse published business profiles — filter by city, trade, and how you prefer to connect."
              : "Explora perfiles publicados: filtra por ciudad, giro y cómo prefieres conectar."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/clasificados/publicar/servicios?lang=${lang}`}
              className="inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-xl bg-[#3B66AD] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#2f5699]"
            >
              {lang === "en" ? "Create a listing" : "Crear anuncio"}
            </Link>
            <Link
              href={`/clasificados/publicar/servicios/preview?lang=${lang}`}
              className="inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-xl border border-[#3D2C12]/20 bg-white px-5 text-sm font-semibold text-[#3D2C12] shadow-sm transition hover:border-[#3B66AD]/40"
            >
              {lang === "en" ? "Preview shell" : "Vista previa"}
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
            <p className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-white/80 px-4 py-12 text-center text-sm leading-relaxed text-neutral-600">
              {hasActiveFilters
                ? lang === "en"
                  ? "No listings match these filters — try resetting or broadening your search."
                  : "Ningún anuncio coincide con estos filtros: restablece o amplía la búsqueda."
                : lang === "en"
                  ? "No public listings yet — publish from the Servicios flow when your profile is ready."
                  : "Aún no hay anuncios públicos: publica desde Servicios cuando tu perfil esté listo."}
            </p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
