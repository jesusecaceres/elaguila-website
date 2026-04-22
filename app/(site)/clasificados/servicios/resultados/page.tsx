import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ServiciosDirectoryLocalSection } from "../ServiciosDirectoryLocalSection";
import { ServiciosListingResultCard } from "../ServiciosListingResultCard";
import { ServiciosResultsActiveSummary } from "../ServiciosResultsActiveSummary";
import { ServiciosResultsFilters } from "../ServiciosResultsFilters";
import {
  filterServiciosPublicListingRows,
  filterServiciosRowsByKeyword,
  filterServiciosRowsBySeller,
  isServiciosListingPromoted,
  serviciosResultsHasActiveFilters,
  sortServiciosResultsForDisplay,
  type ServiciosResultsFilterQuery,
} from "../lib/serviciosResultsFilter";
import { listServiciosPublicListingsForDiscovery } from "../lib/serviciosPublicListingsServer";
import { ServiciosResultsViewAnalytics } from "../ServiciosResultsViewAnalytics";

/** Same whisper image family as landing — stays behind content, low contrast */
const RESULTS_ATMOSPHERE =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=2400&q=68";

const contentShell =
  "rounded-[22px] border border-white/90 bg-[#FFFCF7]/95 shadow-[0_28px_80px_-48px_rgba(20,38,58,0.42)] ring-1 ring-[#1e3a5f]/[0.06] sm:rounded-[26px]";

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
    verified?: string;
    web?: string;
    bilingual?: string;
    email?: string;
    emergency?: string;
    mobileSvc?: string;
    msg?: string;
    phys?: string;
    svcMulti?: string;
    offer?: string;
    legal?: string;
    langEs?: string;
    langEn?: string;
    langOt?: string;
    vint?: string;
    wknd?: string;
  }>;
};

function parseSeller(raw: string | undefined): ServiciosResultsFilterQuery["seller"] {
  if (raw === "business" || raw === "independent") return raw;
  return "all";
}

function parseSort(raw: string | undefined): ServiciosResultsFilterQuery["sort"] {
  if (raw === "name") return "name";
  if (raw === "rating") return "rating";
  return "newest";
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
    verified: sp.verified === "1" ? "1" : undefined,
    web: sp.web === "1" ? "1" : undefined,
    bilingual: sp.bilingual === "1" ? "1" : undefined,
    email: sp.email === "1" ? "1" : undefined,
    emergency: sp.emergency === "1" ? "1" : undefined,
    mobileSvc: sp.mobileSvc === "1" ? "1" : undefined,
    msg: sp.msg === "1" ? "1" : undefined,
    phys: sp.phys === "1" ? "1" : undefined,
    svcMulti: sp.svcMulti === "1" ? "1" : undefined,
    offer: sp.offer === "1" ? "1" : undefined,
    legal: sp.legal === "1" ? "1" : undefined,
    langEs: sp.langEs === "1" ? "1" : undefined,
    langEn: sp.langEn === "1" ? "1" : undefined,
    langOt: sp.langOt === "1" ? "1" : undefined,
    vint: sp.vint === "1" ? "1" : undefined,
    wknd: sp.wknd === "1" ? "1" : undefined,
  };

  const allRows = await listServiciosPublicListingsForDiscovery(120);

  let rows = filterServiciosPublicListingRows(allRows, lang, filterQuery);
  rows = filterServiciosRowsByKeyword(rows, lang, filterQuery.q);
  rows = filterServiciosRowsBySeller(rows, lang, filterQuery.seller);
  const displayRows = sortServiciosResultsForDisplay(rows, lang, filterQuery.sort);
  const promotedRows = displayRows.filter(isServiciosListingPromoted);
  const standardRows = displayRows.filter((r) => !isServiciosListingPromoted(r));

  const dbSlugList = allRows.map((r) => r.slug);
  const hasActiveFilters = serviciosResultsHasActiveFilters(filterQuery);
  const landingHref = `/clasificados/servicios?lang=${lang}`;
  const publishHref = `/clasificados/publicar/servicios?lang=${lang}`;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f3ede4] text-[#142a42]">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <Image
          src={RESULTS_ATMOSPHERE}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[center_42%] opacity-[0.07] blur-[1.5px] saturate-[0.72]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5efe6] via-[#f3ebe2]/[0.98] to-[#efe6db]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-10%,rgba(255,255,255,0.55),transparent_55%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 sm:py-10 sm:pb-10 lg:px-10 xl:px-12 2xl:max-w-[1440px]">
        <ServiciosResultsViewAnalytics resultCount={displayRows.length} />
        <header
          className={`mb-6 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-7 ${contentShell}`}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3d5a73]/75">
              {lang === "en" ? "Services · Leonix" : "Servicios · Leonix"}
            </p>
            <Link
              href={landingHref}
              className="mt-2 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#3B66AD] underline-offset-4 hover:underline"
            >
              <span aria-hidden>←</span>
              {lang === "en" ? "Back to Servicios home" : "Volver al inicio de Servicios"}
            </Link>
            <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-[#142a42] sm:text-3xl">
              {lang === "en" ? "Discover local services" : "Descubre servicios locales"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#4a5d6e]">
              {lang === "en"
                ? "Same search power as the home page — refine by area, trade, trust signals, and how providers want to be reached."
                : "La misma lógica que en inicio: afinar por zona, giro, señales de confianza y formas de contacto publicadas."}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:shrink-0 sm:items-end">
            <Link
              href={publishHref}
              className="inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center rounded-full border-2 border-[#EA580C]/30 bg-gradient-to-br from-[#EA580C] to-[#C2410C] px-6 text-sm font-bold text-white shadow-[0_14px_36px_-12px_rgba(194,65,12,0.45)] transition hover:brightness-[1.03] sm:w-auto"
            >
              {lang === "en" ? "Publish your service" : "Publica tu servicio"}
            </Link>
            <Link
              href={`/clasificados/servicios/resultados?lang=${lang}`}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-[#1a3352]/20 bg-white px-5 text-sm font-bold text-[#1a3352] shadow-sm transition hover:bg-[#fafcff] sm:w-auto"
            >
              {lang === "en" ? "View all listings" : "Ver todos los anuncios"}
            </Link>
          </div>
        </header>

        <div className="min-w-0 lg:grid lg:grid-cols-[minmax(300px,420px)_minmax(0,1fr)] lg:items-start lg:gap-9 xl:gap-11">
          <aside className="lg:sticky lg:top-4">
            <ServiciosResultsFilters lang={lang} current={filterQuery} />
          </aside>

          <div className={`mt-6 min-w-0 p-4 sm:p-6 lg:mt-0 ${contentShell}`}>
            <ServiciosResultsActiveSummary lang={lang} query={filterQuery} />

            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-[#dcd3c7]/80 pb-3">
              <p className="text-sm font-semibold text-[#142a42]">
                {lang === "en" ? "Listings" : "Anuncios"}
                <span className="ml-2 tabular-nums text-[#64748b]">({displayRows.length})</span>
              </p>
              {filterQuery.sort === "name" ? (
                <span className="text-xs font-medium text-[#64748b]">
                  {lang === "en" ? "A–Z within each block (featured first)." : "A–Z en cada bloque (destacados primero)."}
                </span>
              ) : null}
              {filterQuery.sort === "rating" ? (
                <span className="text-xs font-medium text-[#64748b]">
                  {lang === "en"
                    ? "Rated listings first; unrated follow by newest (featured blocks preserved)."
                    : "Primero con calificación; sin calificación van después por fecha (destacados se mantienen)."}
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
              <div className="rounded-2xl border border-dashed border-[#c9b8a4] bg-gradient-to-b from-[#FFFCF7] to-[#faf6f0] px-4 py-14 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
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
              <div className="space-y-10">
                {promotedRows.length > 0 ? (
                  <section aria-labelledby="servicios-res-destacados">
                    <h2
                      id="servicios-res-destacados"
                      className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7a6220]"
                    >
                      {lang === "en" ? "Featured on Leonix" : "Destacados en Leonix"}
                    </h2>
                    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3">
                      {promotedRows.map((r) => (
                        <ServiciosListingResultCard key={r.slug} row={r} lang={lang} />
                      ))}
                    </ul>
                  </section>
                ) : null}
                {standardRows.length > 0 ? (
                  <section aria-labelledby="servicios-res-mas">
                    {promotedRows.length > 0 ? (
                      <h2
                        id="servicios-res-mas"
                        className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#3d5a73]/90"
                      >
                        {lang === "en" ? "More showcases" : "Más vitrinas"}
                      </h2>
                    ) : null}
                    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3">
                      {standardRows.map((r) => (
                        <ServiciosListingResultCard key={r.slug} row={r} lang={lang} />
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
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
