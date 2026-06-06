import type { Metadata } from "next";
import Link from "next/link";
import { ServiciosResultsPageShell } from "../ServiciosResultsPageShell";
import { ServiciosHorizontalResultCard } from "../components/ServiciosHorizontalResultCard";
import { ServiciosResultsActiveSummary } from "../ServiciosResultsActiveSummary";
import { ServiciosResultsFilters } from "../ServiciosResultsFilters";
import { ServiciosDestacadosSection } from "../components/ServiciosDestacadosSection";
import { getServiciosDestacadosRows } from "../lib/serviciosDestacados";
import {
  filterServiciosPublicListingRows,
  filterServiciosRowsByKeyword,
  filterServiciosRowsBySeller,
  serviciosResultsHasActiveFilters,
  sortServiciosResultsForDisplay,
  type ServiciosResultsFilterQuery,
} from "../lib/serviciosResultsFilter";
import { listServiciosPublicListingsRaw } from "../lib/serviciosPublicListingsServer";
import { overlayActiveEntitlementsForServiciosResults } from "../lib/serviciosEntitlementOverlay";
import { ServiciosResultsViewAnalytics } from "../ServiciosResultsViewAnalytics";
import { CategoryStandardPagination } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardPagination";
import {
  parseCatStdPage,
  parseCatStdPerPage,
} from "@/app/(site)/clasificados/components/categoryPipeline/catStdPerPage";

export const dynamic = "force-dynamic";

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
    open_now?: string;
    licensed?: string;
    insured?: string;
    free_estimate?: string;
    free_consultation?: string;
    has_photos?: string;
    has_videos?: string;
    has_offers?: string;
    page?: string;
    perPage?: string;
  }>;
};

const SERVICIOS_RESULTS_PATH = "/clasificados/servicios/results";

function parseSeller(raw: string | undefined): ServiciosResultsFilterQuery["seller"] {
  if (raw === "business" || raw === "independent") return raw;
  return "all";
}

function parseSort(raw: string | undefined): ServiciosResultsFilterQuery["sort"] {
  if (raw === "name") return "name";
  if (raw === "rating") return "rating";
  if (raw === "most_liked") return "most_liked";
  if (raw === "most_saved") return "most_saved";
  if (raw === "open_now") return "open_now";
  return "newest";
}

function parseTruthyResultsFlag(raw: string | undefined): "1" | undefined {
  const t = (raw ?? "").trim().toLowerCase();
  if (t === "1" || t === "true") return "1";
  return undefined;
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
    openNow: parseTruthyResultsFlag(sp.open_now),
    licensed: parseTruthyResultsFlag(sp.licensed),
    insured: parseTruthyResultsFlag(sp.insured),
    freeEstimate: parseTruthyResultsFlag(sp.free_estimate),
    freeConsultation: parseTruthyResultsFlag(sp.free_consultation),
    hasPhotos: parseTruthyResultsFlag(sp.has_photos),
    hasVideos: parseTruthyResultsFlag(sp.has_videos),
    hasOffers: parseTruthyResultsFlag(sp.has_offers),
  };

  // Pipeline: raw fetch → filter → entitlement overlay → visibility ranking
  const allRows = await listServiciosPublicListingsRaw(500);

  let rows = filterServiciosPublicListingRows(allRows, lang, filterQuery);
  rows = filterServiciosRowsByKeyword(rows, lang, filterQuery.q);
  rows = filterServiciosRowsBySeller(rows, lang, filterQuery.seller);

  // Gate G2A: overlay active entitlements onto filtered results only (public-safe fields)
  const overlaid = await overlayActiveEntitlementsForServiciosResults(rows);

  const destacadosRows = getServiciosDestacadosRows(overlaid);
  const displayRows = sortServiciosResultsForDisplay(overlaid, lang, filterQuery.sort);

  const hasActiveFilters = serviciosResultsHasActiveFilters(filterQuery);
  const landingHref = `/clasificados/servicios?lang=${lang}`;
  const perPage = parseCatStdPerPage(sp.perPage);
  const pageCount = Math.max(1, Math.ceil(displayRows.length / perPage));
  const currentPage = Math.min(parseCatStdPage(sp.page), pageCount);
  const startIdx = (currentPage - 1) * perPage;
  const pagedRows = displayRows.slice(startIdx, startIdx + perPage);
  const paginationParams = new URLSearchParams();
  paginationParams.set("lang", lang);
  for (const [k, v] of Object.entries(sp)) {
    if (v != null && v !== "" && k !== "page") paginationParams.set(k, v);
  }

  return (
    <ServiciosResultsPageShell lang={lang} resultCount={displayRows.length}>
        <ServiciosResultsViewAnalytics resultCount={displayRows.length} />

        <div className="min-w-0">
            <div className="mt-0 min-w-0 rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-3 shadow-[0_4px_18px_-14px_rgba(31,36,28,0.1)] sm:p-4">
            <ServiciosResultsFilters lang={lang} current={filterQuery} perPage={perPage} />

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
                  ? "Few matches — try clearing one filter, removing keywords, or browsing all services from landing page."
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
                      href={`${SERVICIOS_RESULTS_PATH}?lang=${lang}`}
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
            ) : null}

            {destacadosRows.length > 0 ? (
              <div className="mb-8">
                <ServiciosDestacadosSection
                  rows={destacadosRows}
                  lang={lang}
                  id="servicios-res-destacados"
                />
              </div>
            ) : null}
            {displayRows.length > 0 ? (
              <section aria-labelledby="servicios-res-listings">
                {destacadosRows.length > 0 ? (
                  <h2
                    id="servicios-res-listings"
                    className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#3d5a73]/90"
                  >
                    {lang === "en" ? "All matching showcases" : "Todas las vitrinas coincidentes"}
                  </h2>
                ) : null}
                <ul className="mx-auto grid max-w-[1100px] list-none grid-cols-1 gap-4 sm:gap-5">
                  {pagedRows.map((r) => (
                    <li key={r.slug} className="min-w-0">
                      <ServiciosHorizontalResultCard row={r} lang={lang} />
                    </li>
                  ))}
                </ul>
                <CategoryStandardPagination
                  lang={lang}
                  basePath={SERVICIOS_RESULTS_PATH}
                  searchParams={paginationParams}
                  currentPage={currentPage}
                  pageCount={pageCount}
                />
              </section>
            ) : null}
            </div>
        </div>
    </ServiciosResultsPageShell>
  );
}
