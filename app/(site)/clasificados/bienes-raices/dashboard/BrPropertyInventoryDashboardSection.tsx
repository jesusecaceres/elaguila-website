"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BASE_BR_NEGOCIO_MONTHLY_PRICE,
  computeBrPropertyInventoryCounts,
  getBrInventoryGroupId,
  getBrInventoryParentListingId,
  isBrInventoryMainListing,
  isBrInventoryProperty,
  isBrNegocioListing,
  type BrPropertyInventoryRowLike,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import {
  brNegocioBasePlanPitch,
  brPropertyInventoryAddPropertyCtaLabel,
  brPropertyInventoryContactLeonixLine,
  brPropertyInventoryTotalWithUpgradeLine,
  brPropertyInventoryUpgradeCtaLabel,
  brPropertyInventoryUpgradeDetail,
  brPropertyInventoryUpgradePitch,
  brPropertyInventoryBaseLimitMessage,
  brPropertyInventoryMaxTotalLimitMessage,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryCopy";
import type { BrInventoryAddContext } from "@/app/clasificados/lib/leonixBrPropertyInventoryAddFlow";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { BrPropertyInventoryValueDrawerTrigger } from "./BrPropertyInventoryValueDrawerTrigger";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  dashboardAddonStatusForKey,
  fetchDashboardListingPackageEntitlementBadges,
} from "@/app/(site)/dashboard/lib/dashboardPackageEntitlementBadges";
import { BR_INVENTORY_PACK_PACKAGE_KEY } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import type { AddonLifecycleStatus } from "@/app/lib/listingPlans/addonLifecycle";

type Lang = "es" | "en";

type Props = {
  lang: Lang;
  rows: BrPropertyInventoryRowLike[];
};

/**
 * Gate F.2.3 — deterministic, dashboard-only grouping key. `br_inventory_group_id` is grouping
 * metadata, not canonical identity (F.2A certification): the durable authority is always a row's
 * own `id` (parent) or its `br_inventory_parent_listing_id` (child). Never falls back to an
 * owner-wide literal — two distinct, still-ungrouped parent rows for the same owner must never
 * collapse into one dashboard bucket (each gets its own `parent:` key derived from its own
 * canonical uuid), and a malformed child row with neither a group id nor a parent reference stays
 * isolated under its own row id rather than guessing an owner-wide or arbitrary attachment.
 * `"parent:"`/`"orphan:"`-prefixed keys are synthetic (dashboard-local only) and are never a real
 * stored `br_inventory_group_id` value — see the check below where `group.groupKey` is turned
 * into a real group id for the Add Property context. This intentionally does not reuse
 * `resolveBrInventoryGroupingKey` from the shared policy module: that function's owner-wide
 * fallback is still relied on verbatim by the public related-listings fetcher
 * (`fetchBrRelatedInventoryListingsBrowser.ts`) and is left untouched here.
 */
function resolveBrPropertyInventoryDashboardGroupKey(row: BrPropertyInventoryRowLike): string {
  const groupId = getBrInventoryGroupId(row);
  if (groupId) return groupId;
  if (isBrInventoryProperty(row)) {
    const parentId = getBrInventoryParentListingId(row);
    if (parentId) return `parent:${parentId}`;
    return `orphan:${row.id}`;
  }
  return `parent:${row.id}`;
}

export function BrPropertyInventoryDashboardSection({ lang, rows }: Props) {
  const negocioRows = useMemo(() => rows.filter((r) => isBrNegocioListing(r)), [rows]);

  const groups = useMemo(() => {
    const map = new Map<
      string,
      { groupKey: string; mainId: string | null; rows: BrPropertyInventoryRowLike[] }
    >();
    for (const row of negocioRows) {
      const groupKey = resolveBrPropertyInventoryDashboardGroupKey(row);
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

  // Gate F.2.4.3 — one batched entitlement read for every distinct canonical main parent uuid
  // found across all groups, never a child/synthetic/owner-derived key. Fails closed to an empty
  // map (every parent resolves to inactive) on missing auth, no groups, or any fetch failure.
  const [entitlementStatusByParentId, setEntitlementStatusByParentId] = useState<
    Map<string, AddonLifecycleStatus>
  >(new Map());
  const parentIdsKey = useMemo(
    () =>
      [...new Set(groups.map((g) => g.mainId ?? g.rows[0]?.id).filter((id): id is string => Boolean(id)))].join(","),
    [groups],
  );

  useEffect(() => {
    const parentIds = parentIdsKey ? parentIdsKey.split(",") : [];
    if (parentIds.length === 0) {
      setEntitlementStatusByParentId(new Map());
      return;
    }
    let cancelled = false;
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        if (!cancelled) setEntitlementStatusByParentId(new Map());
        return;
      }
      const { badges } = await fetchDashboardListingPackageEntitlementBadges(
        parentIds.map((id) => ({
          key: id,
          category: "bienes-raices",
          listingSource: "listings",
          listingId: id,
          packageKey: BR_INVENTORY_PACK_PACKAGE_KEY,
        })),
        token,
      );
      if (cancelled) return;
      const map = new Map<string, AddonLifecycleStatus>();
      for (const id of parentIds) {
        map.set(id, dashboardAddonStatusForKey(badges, [id]));
      }
      setEntitlementStatusByParentId(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [parentIdsKey]);

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
        const mainId = group.mainId ?? group.rows[0]?.id;
        // Gate F.2.4.3 — entitlement truth is per canonical main parent, sourced from the
        // shared lifecycle-backed dashboard entitlement API; fails closed to inactive when the
        // parent has no resolved status (not yet fetched, no purchase, or a fetch failure).
        const upgradeActive = mainId ? entitlementStatusByParentId.get(mainId) === "active" : false;
        // Gate F.2.3 — count only this group's own already-correctly-scoped rows directly,
        // rather than re-deriving membership via the shared (owner-wide-fallback) grouping key;
        // this keeps the displayed count consistent with the visual grouping above.
        const counts = computeBrPropertyInventoryCounts(group.rows, {
          groupingKey: null,
          upgradeActive,
        });
        // Synthetic dashboard-local keys (never a real stored br_inventory_group_id) must never
        // leak into the Add Property context's explicit group id.
        const isSyntheticGroupKey =
          group.groupKey.startsWith("parent:") || group.groupKey.startsWith("orphan:");
        const addCtx: BrInventoryAddContext | null = mainId
          ? {
              parentListingId: mainId,
              returnToListingId: mainId,
              brInventoryGroupId: isSyntheticGroupKey ? null : group.groupKey,
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
                <BrPropertyInventoryValueDrawerTrigger
                  lang={lang}
                  addCtx={addCtx}
                  counts={counts}
                  label={brPropertyInventoryAddPropertyCtaLabel(lang)}
                  className="flex-1 sm:flex-none"
                />
              ) : null}
              {mainId ? (
                <Link
                  href={`${leonixLiveAnuncioPath(mainId)}?lang=${lang}`}
                  prefetch={false}
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
                {addCtx ? (
                  <BrPropertyInventoryValueDrawerTrigger
                    lang={lang}
                    addCtx={addCtx}
                    counts={counts}
                    label={brPropertyInventoryUpgradeCtaLabel(lang)}
                    variant="secondary"
                    className="mt-4 w-full sm:w-auto"
                  />
                ) : null}
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
