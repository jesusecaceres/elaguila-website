import type { Metadata } from "next";
import { ServiciosResultsPageShell } from "../ServiciosResultsPageShell";
import { ServiciosHorizontalResultCard } from "../components/ServiciosHorizontalResultCard";
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
import { listServiciosPublicListingsRaw } from "../lib/serviciosPublicListingsServer";
import { overlayActiveEntitlementsForServiciosResults } from "../lib/serviciosEntitlementOverlay";
import { ServiciosResultsViewAnalytics } from "../ServiciosResultsViewAnalytics";
import { CategoryStandardPagination } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardPagination";
import {
  parseCatStdPage,
  parseCatStdPerPage,
} from "@/app/(site)/clasificados/components/categoryPipeline/catStdPerPage";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Servicios — Resultados · Leonix Clasificados",
  description: "Filtra y descubre vitrinas de servicios locales publicadas en Leonix.",
};

type PageProps = {
  searchParams?: Promise<{
    lang?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
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
    same_day?: string;
    appointment?: string;
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
  const { routeLang, copyLang: lang } = resolveClasificadosPublishLangFromSearchParams(sp);

  const filterQuery: ServiciosResultsFilterQuery = {
    city: sp.city,
    state: sp.state,
    zip: sp.zip,
    country: sp.country,
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
    sameDay: parseTruthyResultsFlag(sp.same_day),
    appointment: parseTruthyResultsFlag(sp.appointment),
  };

  // Pipeline: raw fetch → filter → entitlement overlay → visibility ranking
  const allRows = await listServiciosPublicListingsRaw(500);

  let rows = filterServiciosPublicListingRows(allRows, lang, filterQuery);
  rows = filterServiciosRowsByKeyword(rows, lang, filterQuery.q);
  rows = filterServiciosRowsBySeller(rows, lang, filterQuery.seller);

  // Gate G2A: overlay active entitlements onto filtered results only (public-safe fields)
  const overlaid = await overlayActiveEntitlementsForServiciosResults(rows);

  const displayRows = sortServiciosResultsForDisplay(overlaid, lang, filterQuery.sort);

  const hasActiveFilters = serviciosResultsHasActiveFilters(filterQuery);
  const perPage = parseCatStdPerPage(sp.perPage);
  const pageCount = Math.max(1, Math.ceil(displayRows.length / perPage));
  const currentPage = Math.min(parseCatStdPage(sp.page), pageCount);
  const startIdx = (currentPage - 1) * perPage;
  const pagedRows = displayRows.slice(startIdx, startIdx + perPage);
  const paginationParams = new URLSearchParams();
  paginationParams.set("lang", routeLang);
  for (const [k, v] of Object.entries(sp)) {
    if (v != null && v !== "" && k !== "page") paginationParams.set(k, v);
  }

  return (
    <ServiciosResultsPageShell lang={lang} resultCount={displayRows.length}>
        <ServiciosResultsViewAnalytics resultCount={displayRows.length} />

        <div className="min-w-0">
            <div className="mt-0 min-w-0 rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-2.5 shadow-[0_4px_18px_-14px_rgba(31,36,28,0.1)] sm:p-3">
            <ServiciosResultsFilters lang={lang} current={filterQuery} perPage={perPage} />

            <ServiciosResultsActiveSummary lang={lang} query={filterQuery} perPage={perPage} />

            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-[#dcd3c7]/80 pb-2.5">
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
              <p className="mb-3 rounded-xl border border-[#dfe6ef] bg-white/90 px-3 py-2 text-[12px] leading-relaxed text-[#4a5d6e]">
                {lang === "en"
                  ? "Few matches — try clearing one filter, removing keywords, or browsing all services from landing page."
                  : "Pocos resultados: prueba quitar un filtro, acortar palabras clave o volver al inicio para explorar todo."}
              </p>
            ) : null}

            {displayRows.length === 0 ? (
              <p className="rounded-xl border border-[#D6C7AD]/60 bg-[#FFFCF7]/95 px-4 py-5 text-sm leading-relaxed text-[#5C5346]">
                {hasActiveFilters
                  ? lang === "en"
                    ? "No listings match these filters. Try clearing filters or searching with broader keywords."
                    : "No hay anuncios que coincidan. Prueba limpiar filtros o buscar con palabras más amplias."
                  : lang === "en"
                    ? "No public Servicios showcases yet. When businesses publish, they will appear here."
                    : "Aún no hay vitrinas públicas. Cuando se publiquen negocios, aparecerán aquí."}
              </p>
            ) : null}

            {displayRows.length > 0 ? (
              <section aria-labelledby="servicios-res-listings">
                <ul className="mx-auto grid max-w-[1100px] list-none grid-cols-1 gap-3">
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
