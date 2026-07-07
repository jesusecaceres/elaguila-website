"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { BR_PUBLICAR_HUB, BR_RESULTS } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import type { BrNegocioListing } from "./cards/listingTypes";
import { buildBrDemoListingPool } from "../lib/brDemoListingPool";
import { brShouldMergeDemoInventoryWithLive } from "../lib/brPublicInventoryMode";
import { fetchBrPublishedListingsForBrowse } from "../lib/fetchBrPublishedListingsBrowser";
import { BienesRaicesCompactSearchCanvas } from "@/app/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas";
import { BienesRaicesSponsorsLane } from "@/app/clasificados/bienes-raices/components/BienesRaicesSponsorsLane";
import { BienesRaicesNegocioCard } from "./cards/BienesRaicesNegocioCard";
import { BienesRaicesResultsActiveFilters } from "./components/BienesRaicesResultsActiveFilters";
import { BienesRaicesResultsFilterDrawer } from "./components/BienesRaicesResultsFilterDrawer";
import { BienesRaicesResultsGatewayPanel } from "./components/BienesRaicesResultsGatewayPanel";
import { BienesRaicesResultsHeader } from "./components/BienesRaicesResultsHeader";
import { BienesRaicesResultsShell } from "./components/BienesRaicesResultsShell";
import { BR_BTN_PRIMARY } from "../shared/bienesRaicesLeonixPublicUi";
import { getBrResultsCopy } from "./bienesRaicesResultsCopy";
import { CategoryVisibilityCta } from "@/app/(site)/clasificados/components/categoryStandard/CategoryVisibilityCta";
import {
  filterBrListings,
  paginateListings,
} from "./lib/brResultsFilters";
import { mergeBrResultsHref, parseBrResultsUrl } from "./lib/brResultsUrlState";

const BR_RESULTS_DEV_LOG = process.env.NODE_ENV === "development";

const PAGE_SIZE = 9;

/** Category-owned results UI for `/clasificados/bienes-raices/resultados` — URL + live `listings` merge. */
export function BienesRaicesResultsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spQueryKey = searchParams?.toString() ?? "";
  const sp = useMemo(() => new URLSearchParams(spQueryKey), [spQueryKey]);

  const parsed = useMemo(() => parseBrResultsUrl(sp), [sp]);
  const lang = parsed.lang;
  const spKey = sp.toString();
  const mergeDemo = brShouldMergeDemoInventoryWithLive();
  const copy = useMemo(() => getBrResultsCopy(lang, { useDevInventoryCopy: mergeDemo }), [lang, mergeDemo]);

  const [view, setView] = useState<"grid" | "list">("list");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchState, setSearchState] = useState("CA");
  const [searchZip, setSearchZip] = useState("");
  const [searchCountry, setSearchCountry] = useState("United States");

  const [liveBrListings, setLiveBrListings] = useState<BrNegocioListing[]>([]);
  const [liveFetchErr, setLiveFetchErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { listings, error } = await fetchBrPublishedListingsForBrowse({ lang, limit: 80 });
      if (cancelled) return;
      if (error) {
        setLiveFetchErr(error);
        setLiveBrListings([]);
        if (BR_RESULTS_DEV_LOG) console.info("[br resultados] live listings query", error);
        return;
      }
      setLiveBrListings(listings);
      setLiveFetchErr(null);
      if (BR_RESULTS_DEV_LOG) console.info("[br resultados] live rows", listings.length, "query", spKey);
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, spKey]);

  const listingPool = useMemo(() => {
    if (!mergeDemo) return liveBrListings;
    const demo = buildBrDemoListingPool();
    const byId = new Map<string, BrNegocioListing>();
    for (const d of demo) byId.set(d.id, d);
    for (const L of liveBrListings) byId.set(L.id, L);
    return Array.from(byId.values());
  }, [liveBrListings, mergeDemo]);

  const filtered = useMemo(
    () => filterBrListings(listingPool, parsed, null),
    [listingPool, parsed]
  );

  const { page: pageNum, slice: pageSlice, total: mainTotal } = useMemo(
    () => paginateListings(filtered, parsed.page, PAGE_SIZE),
    [filtered, parsed.page]
  );

  const displayedListings = useMemo(() => {
    const rows = pageSlice.map((l) =>
      view === "list" ? { ...l, layout: "horizontal" as const } : l
    );
    return rows;
  }, [pageSlice, view]);

  useEffect(() => {
    setSearchQ(parsed.q);
    setSearchCity(parsed.city);
    setSearchState(parsed.state || "CA");
    setSearchZip(parsed.zip);
    setSearchCountry(parsed.country || "United States");
  }, [parsed.q, parsed.city, parsed.state, parsed.zip, parsed.country]);

  const patchUrl = useCallback(
    (patch: Record<string, string | null>) => {
      const next: Record<string, string | null> = { ...patch };
      if (!("page" in patch)) next.page = "1";
      router.replace(mergeBrResultsHref(sp, next, lang));
    },
    [router, sp, lang]
  );

  const applySearch = useCallback(() => {
    patchUrl({
      q: searchQ.trim() || null,
      city: searchCity.trim() || null,
      state: searchState.trim() || null,
      zip: searchZip.trim() || null,
      country:
        searchCountry.trim() && searchCountry.trim().toLowerCase() !== "united states"
          ? searchCountry.trim()
          : null,
    });
  }, [patchUrl, searchCity, searchCountry, searchQ, searchState, searchZip]);

  const patchPageOnly = useCallback(
    (patch: Record<string, string | null>) => {
      router.replace(mergeBrResultsHref(sp, patch, lang));
    },
    [router, sp, lang]
  );

  const clearAllFilters = useCallback(() => {
    router.replace(appendLangToPath(BR_RESULTS, lang));
  }, [router, lang]);

  const totalCount = filtered.length;
  const totalForHeader = totalCount;

  const showingFrom = mainTotal === 0 ? 0 : (pageNum - 1) * PAGE_SIZE + 1;
  const showingTo = mainTotal === 0 ? 0 : Math.min(pageNum * PAGE_SIZE, mainTotal);

  const maxPage = Math.max(1, Math.ceil(mainTotal / PAGE_SIZE) || 1);
  const filtersLabel = lang === "es" ? "Filtros" : "Filters";
  const searchLabel = lang === "es" ? "Buscar" : "Search";
  const countLine =
    totalCount === 0
      ? lang === "es"
        ? "0 resultados"
        : "0 results"
      : lang === "es"
        ? `${showingFrom}–${showingTo} de ${totalForHeader}`
        : `${showingFrom}–${showingTo} of ${totalForHeader}`;

  return (
    <BienesRaicesResultsShell>
      <div className="space-y-4 pb-3">
        {liveFetchErr ? (
          <p className="rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-xs text-amber-950" role="status">
            {lang === "es" ? "Aviso — inventario no disponible:" : "Notice — inventory unavailable:"} {liveFetchErr}
          </p>
        ) : null}

        <BienesRaicesResultsGatewayPanel
          lang={lang}
          title={copy.heroTitle}
          countLine={countLine}
          publishHref={appendLangToPath(BR_PUBLICAR_HUB, lang)}
          publishLabel={copy.footerPublish}
          searchSlot={
            <BienesRaicesCompactSearchCanvas
              lang={lang}
              query={searchQ}
              city={searchCity}
              state={searchState}
              zip={searchZip}
              country={searchCountry}
              onQuery={setSearchQ}
              onCity={setSearchCity}
              onState={setSearchState}
              onZip={setSearchZip}
              onCountry={setSearchCountry}
              onSearch={applySearch}
              onOpenFilters={() => setFilterDrawerOpen(true)}
              browseAllHref={appendLangToPath(BR_RESULTS, lang)}
              searchButtonLabel={searchLabel}
              filtersButtonLabel={filtersLabel}
              layout="landing"
            />
          }
        />

        <BienesRaicesResultsActiveFilters
          parsed={parsed}
          copy={copy}
          onPatch={(p) => patchUrl(p)}
          onClearAll={clearAllFilters}
        />

        <BienesRaicesSponsorsLane
          lang={lang}
          listings={listingPool}
          surface="results"
          maxItems={8}
        />

        <BienesRaicesResultsHeader
          showingFrom={showingFrom}
          showingTo={showingTo}
          total={totalForHeader}
          sort={parsed.sort || "reciente"}
          onSort={(v) => patchUrl({ sort: v || null })}
          view={view}
          onView={setView}
          copy={copy}
          lang={lang}
          showMapToggle={false}
        />
      </div>

      <section className="mt-4" aria-labelledby="br-more-heading">
        <h2 id="br-more-heading" className="sr-only">
          {copy.moreResultsTitle}
        </h2>

        {displayedListings.length === 0 ? (
          <p className="rounded-lg border border-[#D6C7AD]/80 bg-[#FFFDF7] px-4 py-5 text-center text-sm text-[#5C5346]">
            {copy.emptyState}{" "}
            <Link href={appendLangToPath(BR_RESULTS, lang)} className="font-semibold text-[#7A1E2C] underline">
              {copy.emptyCta}
            </Link>
          </p>
        ) : view === "list" ? (
          <div className="flex flex-col gap-3">
            {displayedListings.map((listing) => (
              <BienesRaicesNegocioCard
                key={listing.id}
                listing={listing}
                sellerKindLabels={copy.sellerKindLabels}
                lang={lang}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayedListings.map((listing) => (
              <BienesRaicesNegocioCard listing={listing} sellerKindLabels={copy.sellerKindLabels} lang={lang} key={listing.id} />
            ))}
          </div>
        )}

        {mainTotal > PAGE_SIZE ? (
          <nav
            className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8DFD0]/70 pt-5"
            aria-label={copy.pageIndicator}
          >
            <p className="text-sm text-[#5C5346]">
              {copy.pageIndicator} {pageNum} / {maxPage}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pageNum <= 1}
                onClick={() => patchPageOnly({ page: String(Math.max(1, pageNum - 1)) })}
                className="rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-[#3D3428] disabled:opacity-40"
              >
                {copy.paginationPrev}
              </button>
              <button
                type="button"
                disabled={pageNum >= maxPage}
                onClick={() => patchPageOnly({ page: String(Math.min(maxPage, pageNum + 1)) })}
                className={`${BR_BTN_PRIMARY} px-4 disabled:opacity-40`}
              >
                {copy.paginationNext}
              </button>
            </div>
          </nav>
        ) : null}
      </section>

      <footer className="mt-8 border-t border-[#D6C7AD]/50 pt-6">
        <CategoryVisibilityCta lang={lang} category="bienes-raices" surface="results" compact />
      </footer>

      <BienesRaicesResultsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        parsed={parsed}
        copy={copy}
        lang={lang}
        onPatch={(patch) => {
          patchUrl(patch);
        }}
        onApply={applySearch}
        onClear={clearAllFilters}
      />
    </BienesRaicesResultsShell>
  );
}
