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
  const empty =
    lang === "es"
      ? "Aún no hay anuncios publicados en Varios. Sé el primero en publicar."
      : "No published For Sale listings yet. Be the first to post.";

  return (
    <section className="mt-11 sm:mt-16" aria-labelledby="enventa-hub-recent">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div>
          <h2 id="enventa-hub-recent" className="font-serif text-[1.35rem] font-bold tracking-tight text-[#1E1810] sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[#5C5346] sm:text-sm">
            {lang === "es"
              ? "Anuncios reales publicados en Varios — el mismo catálogo que en resultados."
              : "Real listings published in For Sale — the same catalog as results."}
          </p>
        </div>
        <Link
          href={allListingsHref}
          className="shrink-0 text-[13px] font-semibold text-[#2F4A65] underline underline-offset-2 hover:text-[#1E1810] sm:text-sm"
        >
          {allListingsLabel}
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="mt-6 rounded-[20px] border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 px-4 py-8 text-center text-[14px] leading-relaxed text-[#5C5346] sm:px-8">
          {empty}
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recent.map(({ row, dto }) => {
            const effectiveDept = resolveEffectiveDept(dto);
            const returnParams = new URLSearchParams({ lang, sort: "newest" });
            const href = buildEnVentaListingDetailHrefFromResults(dto.id, lang, returnParams);
            const model = buildEnVentaResultsCardModel(dto, {
              lang,
              effectiveDeptKey: effectiveDept,
              featuredHighlight: isFeaturedPlacement(row),
            });
            return (
              <li key={dto.id}>
                <EnVentaResultListingCard
                  model={model}
                  lang={lang}
                  layout="grid"
                  mode="live"
                  isFav={isListingSaved(dto.id)}
                  onToggleFav={toggleListingSaved}
                  href={href}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
