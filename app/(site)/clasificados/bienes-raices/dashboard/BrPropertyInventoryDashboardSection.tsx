"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  BASE_BR_NEGOCIO_MONTHLY_PRICE,
  computeBrPropertyInventoryCounts,
  isBrInventoryMainListing,
  isBrInventoryUpgradeActive,
  isBrNegocioListing,
  resolveBrInventoryGroupingKey,
  type BrPropertyInventoryRowLike,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import {
  brNegocioBasePlanPitch,
  brPropertyInventoryAddPropertyCtaLabel,
  brPropertyInventoryContactLeonixLine,
  brPropertyInventoryTotalWithUpgradeLine,
  brPropertyInventoryUpgradeContactHref,
  brPropertyInventoryUpgradeCtaLabel,
  brPropertyInventoryUpgradeDetail,
  brPropertyInventoryUpgradePitch,
  brPropertyInventoryBaseLimitMessage,
  brPropertyInventoryMaxTotalLimitMessage,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryCopy";
import {
  buildBrInventoryAddPublishHref,
  type BrInventoryAddContext,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryAddFlow";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";

type Lang = "es" | "en";

type Props = {
  lang: Lang;
  rows: BrPropertyInventoryRowLike[];
};

export function BrPropertyInventoryDashboardSection({ lang, rows }: Props) {
  const upgradeActive = isBrInventoryUpgradeActive();
  const negocioRows = useMemo(() => rows.filter((r) => isBrNegocioListing(r)), [rows]);

  const groups = useMemo(() => {
    const map = new Map<
      string,
      { groupKey: string; mainId: string | null; rows: BrPropertyInventoryRowLike[] }
    >();
    for (const row of negocioRows) {
      const groupKey = resolveBrInventoryGroupingKey(row) ?? `listing:${row.id}`;
      const existing = map.get(groupKey);
      if (!existing) {
        map.set(groupKey, {
          groupKey,
          mainId: isBrInventoryMainListing(row) ? row.id : row.br_inventory_parent_listing_id ?? row.id,
          rows: [row],
        });
      } else {
        existing.rows.push(row);
        if (isBrInventoryMainListing(row)) existing.mainId = row.id;
      }
    }
    return [...map.values()].filter((g) => g.rows.some((r) => r.status === "active" && r.is_published !== false));
  }, [negocioRows]);

  if (!negocioRows.length) return null;

  const t =
    lang === "es"
      ? {
          title: "Inventario de propiedades (Negocio)",
          basePrice: `Plan Bienes Raíces Negocio · $${BASE_BR_NEGOCIO_MONTHLY_PRICE}/mes`,
          included: "propiedades activas incluidas",
          additional: "propiedades adicionales activas",
          manage: "Ver anuncio principal",
        }
      : {
          title: "Property inventory (Business)",
          basePrice: `Real Estate Business plan · $${BASE_BR_NEGOCIO_MONTHLY_PRICE}/mo`,
          included: "active properties included",
          additional: "additional active properties",
          manage: "View main listing",
        };

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-[#C9B46A]/35 bg-gradient-to-br from-[#FFFCF7] to-[#FAF7F2] p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]">
        <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>
        <p className="mt-1 text-sm font-semibold text-[#6E5418]">{t.basePrice}</p>
        <p className="mt-2 text-sm text-[#5C5346]">{brNegocioBasePlanPitch(lang)}</p>
      </div>

      {groups.map((group) => {
        const counts = computeBrPropertyInventoryCounts(negocioRows, {
          groupingKey: group.groupKey,
          upgradeActive,
        });
        const mainId = group.mainId ?? group.rows[0]?.id;
        const addCtx: BrInventoryAddContext | null = mainId
          ? {
              parentListingId: mainId,
              returnToListingId: mainId,
              brInventoryGroupId: group.groupKey.startsWith("owner:") ? null : group.groupKey,
            }
          : null;

        return (
          <div
            key={group.groupKey}
            className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 p-4 sm:p-5"
          >
            <p className="text-sm font-bold text-[#1E1810]">
              {counts.baseUsed} / {counts.baseLimit} {t.included}
              {upgradeActive ? (
                <span className="mt-1 block font-medium text-[#5C5346]">
                  {counts.additionalUsed} / {counts.additionalLimit} {t.additional}
                </span>
              ) : null}
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {addCtx ? (
                <Link
                  href={buildBrInventoryAddPublishHref(addCtx, lang)}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[#2A2620] px-4 text-sm font-bold text-[#FAF7F2] sm:flex-none"
                >
                  {brPropertyInventoryAddPropertyCtaLabel(lang)}
                </Link>
              ) : null}
              {mainId ? (
                <Link
                  href={`${leonixLiveAnuncioPath(mainId)}?lang=${lang}`}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#E8DFD0] bg-white px-4 text-sm font-semibold text-[#1E1810] sm:flex-none"
                >
                  {t.manage}
                </Link>
              ) : null}
            </div>
            {!upgradeActive ? (
              <div className="mt-4 rounded-xl border border-[#E8DFD0] bg-white p-4">
                <p className="text-sm text-[#2C2416]">{brPropertyInventoryUpgradePitch(lang)}</p>
                <p className="mt-2 text-sm text-[#5C5346]">{brPropertyInventoryUpgradeDetail(lang)}</p>
                <p className="mt-2 text-xs font-semibold text-[#6E5418]">{brPropertyInventoryTotalWithUpgradeLine(lang)}</p>
                <p className="mt-1 text-xs text-[#7A7164]">{brPropertyInventoryContactLeonixLine(lang)}</p>
                <a
                  href={brPropertyInventoryUpgradeContactHref(lang)}
                  className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-[#FFF6E7] px-4 text-sm font-bold text-[#6E5418] sm:w-auto"
                >
                  {brPropertyInventoryUpgradeCtaLabel(lang)}
                </a>
              </div>
            ) : null}

            {counts.atBaseLimit && !upgradeActive ? (
              <p className="mt-3 text-sm text-amber-950">{brPropertyInventoryBaseLimitMessage(lang)}</p>
            ) : null}
            {counts.atTotalLimit ? (
              <p className="mt-3 text-sm text-amber-950">{brPropertyInventoryMaxTotalLimitMessage(lang)}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
