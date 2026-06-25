"use client";

import Link from "next/link";
import { useMemo } from "react";
import { leonixPromotedFromDetailPairs } from "@/app/(site)/dashboard/lib/dashboardListingMeta";
import { isListingSaved, toggleListingSaved } from "@/app/clasificados/components/savedListings";
import type { EnVentaPublicBrowseListing } from "@/app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse";
import { EN_VENTA_DEPARTMENTS } from "../taxonomy/categories";
import { inferEnVentaDeptFromSubKey } from "../mapping/enVentaInferDeptFromSub";
import { buildEnVentaResultsCardModel } from "../results/buildEnVentaResultsCardModel";
import { EnVentaResultListingCard } from "../results/EnVentaResultListingCard";
import { buildEnVentaListingDetailHrefFromResults } from "../results/utils/enVentaListingLinks";
import {
  EnVentaHubMobileScrollRail,
  EnVentaHubSwipeHintBadge,
  enVentaSwipeHintLabel,
} from "./EnVentaHubHorizontalScroll";

type Lang = "es" | "en";

const HUB_RECENT_CAP = 8;

function resolveEffectiveDept(dto: EnVentaPublicBrowseListing["dto"]): string | null {
  const dk = (dto.departmentKey ?? "").trim();
  if (dk) {
    if (EN_VENTA_DEPARTMENTS.some((d) => d.key === dk)) return dk;
    const byLabel = EN_VENTA_DEPARTMENTS.find((d) => d.label.es === dk || d.label.en === dk);
    if (byLabel) return byLabel.key;
  }
  return inferEnVentaDeptFromSubKey(dto.subKey);
}

function isFeaturedPlacement(row: Record<string, unknown>): boolean {
  return Boolean(row.admin_promoted) || leonixPromotedFromDetailPairs(row.detail_pairs);
}

function desktopGridClassForCount(count: number): string {
  if (count <= 1) return "";
  if (count === 2) return "mx-auto sm:max-w-3xl sm:grid-cols-2";
  if (count === 3) return "sm:grid-cols-2 lg:grid-cols-3";
  return "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
}

export function EnVentaHubRecentListings({
  listings,
  lang,
  allListingsHref,
  allListingsLabel,
}: {
  listings: EnVentaPublicBrowseListing[];
  lang: Lang;
  allListingsHref: string;
  allListingsLabel: string;
}) {
  const recent = useMemo(() => listings.slice(0, HUB_RECENT_CAP), [listings]);

  const title = lang === "es" ? "Últimas publicaciones" : "Latest listings";
  const swipeHint = enVentaSwipeHintLabel(lang);
  const spotlightLabel = lang === "es" ? "Recién publicado" : "Just published";
  const spotlightBody =
    lang === "es"
      ? "Este es el anuncio más reciente en Varios. Explora el catálogo completo para ver más publicaciones locales."
      : "This is the newest listing in For Sale. Browse the full catalog for more local posts.";
  const empty =
    lang === "es"
      ? "Aún no hay anuncios publicados en Varios. Sé el primero en publicar."
      : "No published For Sale listings yet. Be the first to post.";

  const cardItems = recent.map(({ row, dto }) => {
    const effectiveDept = resolveEffectiveDept(dto);
    const returnParams = new URLSearchParams({ lang, sort: "newest" });
    const href = buildEnVentaListingDetailHrefFromResults(dto.id, lang, returnParams);
    const model = buildEnVentaResultsCardModel(dto, {
      lang,
      effectiveDeptKey: effectiveDept,
      featuredHighlight: isFeaturedPlacement(row),
      row,
    });
    return {
      id: dto.id,
      card: (
        <EnVentaResultListingCard
          model={model}
          lang={lang}
          layout="grid"
          mode="live"
          isFav={isListingSaved(dto.id)}
          onToggleFav={toggleListingSaved}
          href={href}
        />
      ),
    };
  });

  const mobileCards = cardItems.map((item) => (
    <div key={item.id} className="w-[min(72vw,248px)] shrink-0 snap-start">
      {item.card}
    </div>
  ));

  const isSpotlight = recent.length === 1;
  const desktopGrid = desktopGridClassForCount(recent.length);

  return (
    <section
      className="mt-3 sm:mt-8"
      aria-labelledby="enventa-hub-recent"
    >
      <div className="flex flex-col items-start justify-between gap-1 sm:flex-row sm:items-end sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 id="enventa-hub-recent" className="font-serif text-[1.1rem] font-bold tracking-tight text-[#1E1810] sm:text-3xl">
            {title}
          </h2>
          <p className="mt-0.5 max-w-xl text-[12px] leading-snug text-[#5C5346] max-sm:hidden sm:mt-1.5 sm:text-sm sm:leading-relaxed">
            {lang === "es"
              ? "Anuncios reales publicados en Varios — el mismo catálogo que en resultados."
              : "Real listings published in For Sale — the same catalog as results."}
          </p>
        </div>
        <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-end">
          {recent.length > 0 && !isSpotlight ? <EnVentaHubSwipeHintBadge label={swipeHint} /> : null}
          <Link
            href={allListingsHref}
            className="shrink-0 text-[13px] font-semibold text-[#2F4A65] underline underline-offset-2 hover:text-[#1E1810] sm:text-sm"
          >
            {allListingsLabel}
          </Link>
        </div>
      </div>

      {recent.length === 0 ? (
        <p className="mt-4 rounded-[20px] border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 px-4 py-6 text-center text-[14px] leading-relaxed text-[#5C5346] sm:mt-6 sm:px-8 sm:py-8">
          {empty}
        </p>
      ) : isSpotlight ? (
        <>
          <div className="mt-1.5 sm:hidden">
            <EnVentaHubMobileScrollRail
              className="gap-3"
              ariaLabel={title}
              lang={lang}
              showRailDots={false}
            >
              {mobileCards}
            </EnVentaHubMobileScrollRail>
          </div>
          <div
            className="mt-3 hidden gap-5 rounded-[20px] border border-[#E8DFD0]/85 bg-[#FFFCF7]/95 p-4 shadow-[0_12px_36px_-16px_rgba(47,74,101,0.14)] sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(240px,300px)] sm:items-stretch sm:p-5 lg:gap-6 lg:p-6"
          >
            <div className="min-w-0">{cardItems[0].card}</div>
            <aside
              className="flex flex-col justify-between gap-4 rounded-2xl border border-[#C9A84A]/28 bg-gradient-to-br from-[#FFFBF0] via-[#FFFDF7] to-[#F5F8FB]/90 p-4 shadow-inner"
              aria-label={spotlightLabel}
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A7164]">{spotlightLabel}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#5C5346]">{spotlightBody}</p>
              </div>
              <Link
                href={allListingsHref}
                className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-[#7A1E2C]/20 bg-[#7A1E2C] px-4 text-sm font-semibold text-[#FFFDF7] shadow-sm transition hover:bg-[#5e1721] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45"
              >
                {allListingsLabel}
              </Link>
            </aside>
          </div>
        </>
      ) : (
        <EnVentaHubMobileScrollRail
          className="mt-1.5 gap-3 sm:mt-3"
          ariaLabel={title}
          lang={lang}
          desktopGridClass={desktopGrid}
        >
          {cardItems.map((item) => (
            <div key={item.id} className="w-[min(72vw,248px)] shrink-0 snap-start sm:w-auto sm:min-w-0">
              {item.card}
            </div>
          ))}
        </EnVentaHubMobileScrollRail>
      )}
    </section>
  );
}
