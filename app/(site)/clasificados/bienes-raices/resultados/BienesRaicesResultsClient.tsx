"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  parseBrNegocioPropiedadParam,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { BR_PUBLICAR_HUB, BR_RESULTS } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import type { BrPrimaryChipId, BrSecondaryChipId } from "./search/filterTypes";
import { brNegocioFeaturedListing, brNegocioGridListings } from "./demoData";
import type { BrNegocioListing } from "./cards/listingTypes";
import { BienesRaicesNegocioCard } from "./cards/BienesRaicesNegocioCard";
import { BienesRaicesCategoryNav } from "./components/BienesRaicesCategoryNav";
import { BienesRaicesFilterChips } from "./components/BienesRaicesFilterChips";
import { BienesRaicesNegociosSpotlightBand } from "./components/BienesRaicesNegociosSpotlightBand";
import { BienesRaicesPropiedadFilterChips } from "./components/BienesRaicesPropiedadFilterChips";
import { BienesRaicesResultsActiveFilters } from "./components/BienesRaicesResultsActiveFilters";
import { BienesRaicesResultsFilterDrawer } from "./components/BienesRaicesResultsFilterDrawer";
import { BienesRaicesResultsFilters } from "./components/BienesRaicesResultsFilters";
import { BienesRaicesResultsHeader } from "./components/BienesRaicesResultsHeader";
import { BienesRaicesResultsHero } from "./components/BienesRaicesResultsHero";
import { BienesRaicesResultsShell } from "./components/BienesRaicesResultsShell";
import { BienesRaicesResultsTopBar } from "./components/BienesRaicesResultsTopBar";
import { BienesRaicesMapPreview } from "./map/BienesRaicesMapPreview";
import { getBrResultsCopy } from "./bienesRaicesResultsCopy";
import {
  filterBrListings,
  paginateListings,
  pickNegociosSpotlight,
} from "./lib/brResultsFilters";
import { mergeBrResultsHref, parseBrResultsUrl } from "./lib/brResultsUrlState";

const PRIMARY_IDS: readonly BrPrimaryChipId[] = [
  "casas",
  "departamentos",
  "venta",
  "renta",
  "comerciales",
  "terrenos",
] as const;

const SECONDARY_IDS: readonly BrSecondaryChipId[] = [
  "piscina",
  "mascotas",
  "nuevo_desarrollo",
  "open_house",
  "reducida",
  "tour_virtual",
  "planos",
  "financiamiento",
  "segundo_agente",
] as const;

const PAGE_SIZE = 9;

function buildListingPool(): BrNegocioListing[] {
  const ids = new Set(brNegocioGridListings.map((l) => l.id));
  const extra = !ids.has(brNegocioFeaturedListing.id) ? [brNegocioFeaturedListing] : [];
  return [...extra, ...brNegocioGridListings];
}

/** Category-owned results UI for `/clasificados/bienes-raices/resultados` — URL-driven demo grid. */
export function BienesRaicesResultsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sp = searchParams ?? new URLSearchParams();

  const parsed = useMemo(() => parseBrResultsUrl(sp), [sp]);
  const lang = parsed.lang;
  const copy = useMemo(() => getBrResultsCopy(lang), [lang]);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [showMap, setShowMap] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const propiedadFilter: BrNegocioCategoriaPropiedad | null = useMemo(
    () => parseBrNegocioPropiedadParam(sp.get(BR_NEGOCIO_Q_PROPIEDAD)),
    [sp]
  );

  const propiedadLabelActive = useMemo(() => {
    if (!propiedadFilter) return null;
    if (propiedadFilter === "residencial") return copy.categoryResidential;
    if (propiedadFilter === "comercial") return copy.categoryCommercial;
    return copy.categoryLand;
  }, [propiedadFilter, copy]);

  const listingPool = useMemo(() => buildListingPool(), []);

  const filtered = useMemo(
    () => filterBrListings(listingPool, parsed, propiedadFilter),
    [listingPool, parsed, propiedadFilter]
  );

  const spotlight = useMemo(() => pickNegociosSpotlight(filtered, 3), [filtered]);
  const spotlightIds = useMemo(() => new Set(spotlight.map((s) => s.id)), [spotlight]);

  const mainList = useMemo(
    () => filtered.filter((l) => !spotlightIds.has(l.id)),
    [filtered, spotlightIds]
  );

  const { page: pageNum, slice: pageSlice, total: mainTotal } = useMemo(
    () => paginateListings(mainList, parsed.page, PAGE_SIZE),
    [mainList, parsed.page]
  );

  const displayedListings = useMemo(() => {
    const rows = pageSlice.map((l) =>
      view === "list" ? { ...l, layout: "horizontal" as const } : l
    );
    return rows;
  }, [pageSlice, view]);

  const primarySet = useMemo(() => {
    const next = new Set<BrPrimaryChipId>();
    for (const part of parsed.primary
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)) {
      if ((PRIMARY_IDS as readonly string[]).includes(part)) next.add(part as BrPrimaryChipId);
    }
    return next;
  }, [parsed.primary]);

  const secondarySet = useMemo(() => {
    const next = new Set<BrSecondaryChipId>();
    for (const part of parsed.secondary
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)) {
      if ((SECONDARY_IDS as readonly string[]).includes(part)) next.add(part as BrSecondaryChipId);
    }
    return next;
  }, [parsed.secondary]);

  const patchUrl = useCallback(
    (patch: Record<string, string | null>) => {
      const next: Record<string, string | null> = { ...patch };
      if (!("page" in patch)) next.page = "1";
      router.replace(mergeBrResultsHref(sp, next, lang));
    },
    [router, sp, lang]
  );

  const patchPageOnly = useCallback(
    (patch: Record<string, string | null>) => {
      router.replace(mergeBrResultsHref(sp, patch, lang));
    },
    [router, sp, lang]
  );

  const clearAllFilters = useCallback(() => {
    router.replace(appendLangToPath(BR_RESULTS, lang));
  }, [router, lang]);

  const togglePrimary = (id: BrPrimaryChipId) => {
    const next = new Set(primarySet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    patchUrl({ primary: next.size ? [...next].join(",") : null });
  };

  const toggleSecondary = (id: BrSecondaryChipId) => {
    const next = new Set(secondarySet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    patchUrl({ secondary: next.size ? [...next].join(",") : null });
  };

  const totalCount = filtered.length;
  const totalForHeader = totalCount;

  const showingFrom = mainTotal === 0 ? 0 : (pageNum - 1) * PAGE_SIZE + 1;
  const showingTo = mainTotal === 0 ? 0 : Math.min(pageNum * PAGE_SIZE, mainTotal);

  const maxPage = Math.max(1, Math.ceil(mainTotal / PAGE_SIZE) || 1);

  return (
    <BienesRaicesResultsShell>
      <BienesRaicesResultsTopBar copy={copy} lang={lang} />
      <BienesRaicesCategoryNav lang={lang} />

      <BienesRaicesResultsHero copy={copy} />

      <div className="mt-8 max-w-5xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:hidden">
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-[#E8DFD0] bg-[#2A2620] px-4 py-3 text-sm font-bold text-[#FAF7F2] shadow-md sm:w-auto"
          >
            {copy.filterOpenMobile}
          </button>
        </div>

        <div className="hidden lg:block">
          <BienesRaicesResultsFilters parsed={parsed} copy={copy} onPatch={(patch) => patchUrl(patch)} />
        </div>

        <BienesRaicesPropiedadFilterChips active={propiedadFilter} copy={copy} />

        <BienesRaicesFilterChips
          copy={copy}
          primary={primarySet}
          secondary={secondarySet}
          onTogglePrimary={togglePrimary}
          onToggleSecondary={toggleSecondary}
          onMoreFilters={() => setFilterDrawerOpen(true)}
          matchCount={totalCount}
        />

        <BienesRaicesResultsActiveFilters
          parsed={parsed}
          copy={copy}
          onPatch={(p) => patchUrl(p)}
          onClearAll={clearAllFilters}
          propiedadActive={propiedadLabelActive}
        />
      </div>

      <BienesRaicesResultsHeader
        showingFrom={showingFrom}
        showingTo={showingTo}
        total={totalForHeader}
        sort={parsed.sort || "reciente"}
        onSort={(v) => patchUrl({ sort: v || null })}
        view={view}
        onView={setView}
        mapOn={showMap}
        onMapOn={setShowMap}
        copy={copy}
        lang={lang}
      />

      {showMap ? (
        <section
          className="mt-6 overflow-hidden rounded-2xl border border-[#E8DFD0]/90 bg-[#FDFBF7]/90 shadow-[0_12px_40px_-24px_rgba(42,36,22,0.25)]"
          aria-label={copy.mapAsideTitle}
        >
          <div className="grid gap-0 lg:grid-cols-12 lg:items-stretch">
            <div className="min-h-[240px] lg:col-span-7 xl:col-span-8">
              <BienesRaicesMapPreview />
            </div>
            <div className="border-t border-[#E8DFD0]/80 p-5 lg:col-span-5 lg:border-l lg:border-t-0 xl:col-span-4">
              <p className="font-serif text-lg font-semibold text-[#1E1810]">{copy.mapAsideTitle}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/88">{copy.mapAsideBody}</p>
            </div>
          </div>
        </section>
      ) : null}

      <BienesRaicesNegociosSpotlightBand listings={spotlight} copy={copy} lang={lang} />

      <section className="mt-14" aria-labelledby="br-more-heading">
        <h2 id="br-more-heading" className="font-serif text-xl font-semibold text-[#1E1810] sm:text-2xl">
          {copy.moreResultsTitle}
        </h2>

        {displayedListings.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-[#E8DFD0] bg-[#FDFBF7]/90 p-6 text-center text-sm text-[#5C5346]">
            {copy.emptyState}{" "}
            <Link href={appendLangToPath(BR_RESULTS, lang)} className="font-semibold text-[#B8954A] underline">
              {copy.emptyCta}
            </Link>
          </p>
        ) : view === "list" ? (
          <div className="mt-6 flex flex-col gap-5">
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
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-6">
            {displayedListings.map((listing) => (
              <div
                key={listing.id}
                className={
                  listing.layout === "horizontal" ? "sm:col-span-2 xl:col-span-3" : "sm:col-span-1 xl:col-span-2"
                }
              >
                <BienesRaicesNegocioCard listing={listing} sellerKindLabels={copy.sellerKindLabels} lang={lang} />
              </div>
            ))}
          </div>
        )}

        {mainTotal > PAGE_SIZE ? (
          <nav
            className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8DFD0]/70 pt-6"
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
                className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#1E1810] disabled:opacity-40"
              >
                {copy.paginationPrev}
              </button>
              <button
                type="button"
                disabled={pageNum >= maxPage}
                onClick={() => patchPageOnly({ page: String(Math.min(maxPage, pageNum + 1)) })}
                className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#1E1810] disabled:opacity-40"
              >
                {copy.paginationNext}
              </button>
            </div>
          </nav>
        ) : null}
      </section>

      <footer className="mt-16 border-t border-[#E8DFD0]/70 pt-8 text-center">
        <p className="text-sm text-[#5C5346]/85">{copy.footerLine}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm font-semibold">
          <Link
            href={appendLangToPath(BR_PUBLICAR_HUB, lang)}
            className="rounded-lg text-[#B8954A] underline decoration-[#C9B46A]/50 underline-offset-4 hover:text-[#8A6F3A]"
          >
            {copy.footerPublish}
          </Link>
        </div>
      </footer>

      <BienesRaicesResultsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        parsed={parsed}
        copy={copy}
        onPatch={(patch) => {
          patchUrl(patch);
        }}
      />
    </BienesRaicesResultsShell>
  );
}
