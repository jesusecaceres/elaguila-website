import type { Metadata } from "next";
import Link from "next/link";
import { ServiciosDirectoryLocalSection } from "../ServiciosDirectoryLocalSection";
import { ServiciosListingResultCard } from "../ServiciosListingResultCard";
import { ServiciosResultsActiveSummary } from "../ServiciosResultsActiveSummary";
import { ServiciosResultsFilters } from "../ServiciosResultsFilters";
import {
  filterServiciosPublicListingRows,
  filterServiciosRowsByKeyword,
  filterServiciosRowsBySeller,
  serviciosResultsHasActiveFilters,
  sortServiciosResultsForDisplay,
  type ServiciosResultsFilterQuery,
} from "../lib/serviciosResultsFilter";
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
    sort?: string;
    seller?: string;
  }>;
};

function parseSeller(raw: string | undefined): ServiciosResultsFilterQuery["seller"] {
  if (raw === "business" || raw === "independent") return raw;
  return "all";
}

function parseSort(raw: string | undefined): ServiciosResultsFilterQuery["sort"] {
  return raw === "name" ? "name" : "newest";
}

export default async function ClasificadosServiciosResultadosPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";

  const filterQuery: ServiciosResultsFilterQuery = {
    city: sp.city,
    group: sp.group,
    whatsapp: sp.whatsapp === "1" ? "1" : undefined,
    promo: sp.promo === "1" ? "1" : undefined,
    call: sp.call === "1" ? "1" : undefined,
    q: sp.q,
    sort: parseSort(sp.sort),
    seller: parseSeller(sp.seller),
  };

  const allRows = await listServiciosPublicListingsFromDb(120);

  let rows = filterServiciosPublicListingRows(allRows, lang, filterQuery);
  rows = filterServiciosRowsByKeyword(rows, lang, filterQuery.q);
  rows = filterServiciosRowsBySeller(rows, lang, filterQuery.seller);
  const displayRows = sortServiciosResultsForDisplay(rows, lang, filterQuery.sort);

  const dbSlugList = allRows.map((r) => r.slug);
  const hasActiveFilters = serviciosResultsHasActiveFilters(filterQuery);
  const landingHref = `/clasificados/servicios?lang=${lang}`;
  const publishHref = `/clasificados/publicar/servicios?lang=${lang}`;

  return (
    <div className="min-h-screen bg-[#f3ede4] text-[#142a42]">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_90%_50%_at_50%_-10%,rgba(255,255,255,0.5),transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-10 sm:pb-10 lg:px-8">
        {/* Top bar: dedicated results context + CTAs */}
        <header className="mb-6 flex flex-col gap-4 rounded-[22px] border border-[#e5ddd2]/90 bg-[#FFFCF7] p-4 shadow-[0_22px_60px_-42px_rgba(20,38,58,0.42)] ring-1 ring-[#1e3a5f]/[0.04] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
          <div className="min-w-0">
            <Link
              href={landingHref}
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#3B66AD] underline-offset-4 hover:underline"
            >
              <span aria-hidden>←</span>
              {lang === "en" ? "Back to Servicios home" : "Volver al inicio de Servicios"}
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#142a42] sm:text-3xl">
              {lang === "en" ? "Service results" : "Resultados de servicios"}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-[#4a5d6e]">
              {lang === "en"
                ? "Refine by trade, city, contact options, and seller type — then open a full profile."
                : "Afina por giro, ciudad, contacto y tipo de anunciante; luego abre la vitrina completa."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
            <Link
              href={publishHref}
              className="inline-flex min-h-[48px] min-w-[44px] items-center justify-center rounded-full border-2 border-[#EA580C]/30 bg-gradient-to-br from-[#EA580C] to-[#C2410C] px-5 text-sm font-bold text-white shadow-md transition hover:brightness-[1.03]"
            >
              {lang === "en" ? "Publish your service" : "Publica tu servicio"}
            </Link>
            <Link
              href={`/clasificados/servicios/resultados?lang=${lang}`}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#1a3352]/20 bg-white px-4 text-sm font-bold text-[#1a3352] shadow-sm transition hover:bg-[#fafcff]"
            >
              {lang === "en" ? "View all" : "Ver todos"}
            </Link>
          </div>
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start lg:gap-8">
          <aside className="lg:sticky lg:top-4">
            <ServiciosResultsFilters lang={lang} current={filterQuery} />
          </aside>

          <div className="mt-6 min-w-0 lg:mt-0">
            <ServiciosResultsActiveSummary lang={lang} query={filterQuery} />

            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-[#dcd3c7]/80 pb-3">
              <p className="text-sm font-semibold text-[#142a42]">
                {lang === "en" ? "Listings" : "Anuncios"}
                <span className="ml-2 tabular-nums text-[#64748b]">({displayRows.length})</span>
              </p>
              {filterQuery.sort === "name" ? (
                <span className="text-xs font-medium text-[#64748b]">
                  {lang === "en" ? "Sorted A–Z within featured + standard." : "Orden A–Z dentro de destacados y resto."}
                </span>
              ) : null}
            </div>

            {displayRows.length > 0 && displayRows.length < 4 && hasActiveFilters ? (
              <p className="mb-4 rounded-xl border border-[#dfe6ef] bg-white/90 px-4 py-3 text-[13px] leading-relaxed text-[#4a5d6e]">
                {lang === "en"
                  ? "Few matches — try clearing one filter, removing keywords, or browsing all services from the landing page."
                  : "Pocos resultados: prueba quitar un filtro, acortar palabras clave o volver al inicio para explorar todo."}
              </p>
            ) : null}

            {displayRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#c9b8a4] bg-[#FFFCF7] px-4 py-14 text-center shadow-sm">
                <p className="mx-auto max-w-md text-sm font-medium leading-relaxed text-[#142a42]">
                  {hasActiveFilters
                    ? lang === "en"
                      ? "No listings match these filters yet."
                      : "Aún no hay anuncios que coincidan con estos filtros."
                    : lang === "en"
                      ? "No public Servicios showcases yet."
                      : "Aún no hay vitrinas públicas en Servicios."}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#4a5d6e]">
                  {hasActiveFilters
                    ? lang === "en"
                      ? "Try clearing filters or searching with broader keywords."
                      : "Prueba limpiar filtros o buscar con palabras más amplias."
                    : lang === "en"
                      ? "When businesses publish, they will appear here automatically."
                      : "Cuando se publiquen negocios, aparecerán aquí automáticamente."}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {hasActiveFilters ? (
                    <Link
                      href={`/clasificados/servicios/resultados?lang=${lang}`}
                      className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#3B66AD]/30 bg-white px-5 text-sm font-bold text-[#3B66AD] shadow-sm transition hover:bg-[#3B66AD]/5"
                    >
                      {lang === "en" ? "Show all listings" : "Ver todos los anuncios"}
                    </Link>
                  ) : null}
                  <Link
                    href={landingHref}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#3B66AD] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#2f5699]"
                  >
                    {lang === "en" ? "Back to landing" : "Volver al inicio"}
                  </Link>
                  {hasActiveFilters ? (
                    <Link
                      href={`/clasificados/servicios?lang=${lang}#categorias`}
                      className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#e5ddd2] bg-[#FFFCF7] px-5 text-sm font-bold text-[#142a42] shadow-sm transition hover:bg-white"
                    >
                      {lang === "en" ? "Explore categories" : "Explorar categorías"}
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {displayRows.map((r) => (
                  <ServiciosListingResultCard key={r.slug} row={r} lang={lang} />
                ))}
              </ul>
            )}
          </div>
        </div>

        <ServiciosDirectoryLocalSection lang={lang} dbSlugs={dbSlugList} />

        <a
          href="#servicios-resultados-filtros"
          className="fixed bottom-5 left-1/2 z-40 flex min-h-[48px] -translate-x-1/2 items-center gap-2 rounded-full border border-[#1a3352]/12 bg-[#FFFCF7]/95 px-6 text-sm font-bold text-[#142a42] shadow-[0_14px_44px_-12px_rgba(20,38,58,0.45)] backdrop-blur-md transition hover:bg-white lg:hidden"
        >
          {lang === "en" ? "Refine search" : "Refinar búsqueda"}
          <span aria-hidden className="text-[#3B66AD]">
            ↑
          </span>
        </a>
      </div>
    </div>
  );
}
