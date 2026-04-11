"use client";

import { EnVentaResultListingCard } from "../EnVentaResultListingCard";
import { buildEnVentaResultsCardModel } from "../buildEnVentaResultsCardModel";
import { promotedSectionHelp, sortSectionCaption, type SortId } from "../utils/enVentaResultsSummary";
import type { EnVentaAnuncioDTO } from "../../shared/types/enVentaListing.types";

type RowPack = {
  row: Record<string, unknown>;
  dto: EnVentaAnuncioDTO;
  priceNum: number;
  boosted: boolean;
  effectiveDept: string | null;
};

type Lang = "es" | "en";

export function EnVentaResultsListingSections({
  lang,
  featuredOnly,
  promotedPool,
  standardSlice,
  view,
  sort,
  safePage,
  pageCount,
  onPagePrev,
  onPageNext,
  isFav,
  onFav,
  listingHref,
  t,
}: {
  lang: Lang;
  featuredOnly: boolean;
  promotedPool: RowPack[];
  standardSlice: RowPack[];
  view: "grid" | "list";
  sort: SortId;
  safePage: number;
  pageCount: number;
  onPagePrev: () => void;
  onPageNext: () => void;
  isFav: (id: string) => boolean;
  onFav: (id: string) => void;
  /** Preserves current results query string on the listing detail page for back navigation. */
  listingHref: (listingId: string) => string;
  t: {
    promoted: string;
    featuredMode: string;
    latest: string;
    catalog: string;
    catalogSub: string;
    standardEngineLine: string;
    page: (p: number, pc: number) => string;
    featuredBanner: string;
  };
}) {
  const gridClass =
    view === "grid"
      ? "grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 xl:gap-7"
      : "flex flex-col gap-4 sm:gap-5";

  return (
    <>
      {!featuredOnly && promotedPool.length > 0 ? (
        <section className="mt-10 w-full sm:mt-12" aria-labelledby="ev-promoted-heading">
          <div className="mb-5 border-b border-[#E8DFD0]/80 pb-4">
            <h2 id="ev-promoted-heading" className="text-lg font-bold tracking-tight text-[#1E1810] sm:text-xl">
              {t.promoted}
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#5C5346]">{promotedSectionHelp(lang)}</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:gap-7">
            {promotedPool.map((p) => (
              <EnVentaResultListingCard
                key={p.dto.id}
                model={buildEnVentaResultsCardModel(p.dto, {
                  lang,
                  effectiveDeptKey: p.effectiveDept,
                  boosted: p.boosted,
                })}
                lang={lang}
                isFav={isFav(p.dto.id)}
                onToggleFav={onFav}
                href={listingHref(p.dto.id)}
                layout="grid"
              />
            ))}
          </div>
        </section>
      ) : null}

      <section
        className={`w-full ${!featuredOnly && promotedPool.length > 0 ? "mt-12 sm:mt-14" : "mt-10 sm:mt-12"}`}
        aria-labelledby="ev-catalog-heading"
      >
        {featuredOnly ? (
          <div className="mb-5 rounded-2xl border border-[#C9A84A]/35 bg-gradient-to-br from-[#FFFBF0]/95 to-[#F5F8FB]/90 px-4 py-3 sm:px-5">
            <p className="text-sm font-medium leading-relaxed text-[#2F4A65]">{t.featuredBanner}</p>
          </div>
        ) : null}

        <div className="mb-5 flex flex-col gap-3 border-b border-[#E8DFD0]/80 pb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            {!featuredOnly ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A7164]">{t.latest}</p>
            ) : null}
            <h2 id="ev-catalog-heading" className={`font-bold tracking-tight text-[#1E1810] sm:text-xl ${featuredOnly ? "text-lg" : "mt-1 text-lg"}`}>
              {featuredOnly ? t.featuredMode : t.catalog}
            </h2>
            {!featuredOnly ? <p className="mt-1 max-w-2xl text-sm text-[#5C5346]">{t.catalogSub}</p> : null}
            <p className="mt-2 text-xs font-medium text-[#5C5346]/95">{sortSectionCaption(sort, lang)}</p>
            {!featuredOnly ? (
              <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-[#7A7164]">{t.standardEngineLine}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-[#5C5346]">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={onPagePrev}
              className="min-h-[40px] min-w-[40px] rounded-full border border-[#E8DFD0] bg-white px-2 py-2 shadow-sm disabled:opacity-40"
              aria-label={lang === "es" ? "Página anterior" : "Previous page"}
            >
              ←
            </button>
            <span className="tabular-nums">{t.page(safePage, pageCount)}</span>
            <button
              type="button"
              disabled={safePage >= pageCount}
              onClick={onPageNext}
              className="min-h-[40px] min-w-[40px] rounded-full border border-[#E8DFD0] bg-white px-2 py-2 shadow-sm disabled:opacity-40"
              aria-label={lang === "es" ? "Página siguiente" : "Next page"}
            >
              →
            </button>
          </div>
        </div>

        <div className={gridClass}>
          {standardSlice.map((p) => (
            <EnVentaResultListingCard
              key={p.dto.id}
              model={buildEnVentaResultsCardModel(p.dto, {
                lang,
                effectiveDeptKey: p.effectiveDept,
                boosted: featuredOnly ? p.boosted : false,
              })}
              lang={lang}
              isFav={isFav(p.dto.id)}
              onToggleFav={onFav}
              href={listingHref(p.dto.id)}
              layout={view}
            />
          ))}
        </div>
      </section>
    </>
  );
}
