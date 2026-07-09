"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES,
  BASE_BR_NEGOCIO_MONTHLY_PRICE,
  BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT,
  BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT,
  BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE,
  computeBrPropertyInventoryCounts,
  isBrInventoryMainListing,
  isBrInventoryProperty,
  isBrInventoryUpgradeActive,
  isBrNegocioListing,
  resolveBrInventoryGroupingKey,
  type BrPropertyInventoryRowLike,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import {
  brPropertyInventoryAddMorePropertiesLabel,
  brPropertyInventoryAddPropertyCtaLabel,
  brPropertyInventoryUpgradeCtaLabel,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryCopy";
import type { BrInventoryAddContext } from "@/app/clasificados/lib/leonixBrPropertyInventoryAddFlow";
import { BrPropertyInventoryValueDrawerTrigger } from "./BrPropertyInventoryValueDrawerTrigger";
import {
  bienesInventoryEditHref,
  bienesInventoryPackAddonUpgradeBusyLabel,
  bienesInventoryPackAddonUpgradeLabel,
  bienesInventoryPackEditLabel,
  bienesInventoryPackInactiveDashboardHint,
  fetchBienesInventoryPackEntitlementActive,
  redirectBienesDashboardInventoryPackCheckout,
} from "@/app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout";

type Lang = "es" | "en";

type Props = {
  lang: Lang;
  row: BrPropertyInventoryRowLike;
  parentLeonixAdIdByListingId: ReadonlyMap<string, string>;
  /** All negocio rows in owner inventory — used for active-count limits. */
  inventoryRows?: readonly BrPropertyInventoryRowLike[];
};

export function BrNegocioListingInventoryActions({ lang, row, parentLeonixAdIdByListingId, inventoryRows }: Props) {
  const isNegocio = isBrNegocioListing(row);
  const isChild = isNegocio && isBrInventoryProperty(row);
  const isMain = isNegocio && (isBrInventoryMainListing(row) || (!isChild && !row.inventory_role));
  const parentId = row.br_inventory_parent_listing_id?.trim() || null;
  const parentLeonix =
    (parentId ? parentLeonixAdIdByListingId.get(parentId) : null) ??
    (isMain ? row.leonix_ad_id?.trim() : null) ??
    null;
  const mainListingId = isMain ? row.id : parentId ?? row.id;

  const [entitlementActive, setEntitlementActive] = useState<boolean | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!isMain) return;
    let cancelled = false;
    void fetchBienesInventoryPackEntitlementActive({
      listingId: mainListingId,
      leonixAdId: row.leonix_ad_id,
    }).then((result) => {
      if (!cancelled) setEntitlementActive(result.active);
    });
    return () => {
      cancelled = true;
    };
  }, [isMain, mainListingId, row.leonix_ad_id]);

  const startInventoryPackCheckout = useCallback(async () => {
    setCheckoutError(null);
    setCheckoutBusy(true);
    try {
      const result = await redirectBienesDashboardInventoryPackCheckout({
        listingId: mainListingId,
        leonixAdId: row.leonix_ad_id,
        lang,
        returnPath: bienesInventoryEditHref({
          lang,
          listingId: mainListingId,
          leonixAdId: row.leonix_ad_id,
        }),
      });
      if (!result.ok) setCheckoutError(result.userMessage);
    } finally {
      setCheckoutBusy(false);
    }
  }, [lang, mainListingId, row.leonix_ad_id]);

  if (!isNegocio) return null;

  const t =
    lang === "es"
      ? {
          section: "Inventario de propiedades",
          plan: `Tu plan de Bienes Raíces incluye hasta ${BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES} propiedades activas ($${BASE_BR_NEGOCIO_MONTHLY_PRICE}/mes).`,
          upgrade: `Activa el Inventario de Propiedades por $${BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE}/mes para agregar hasta ${BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT} propiedades adicionales. Total con upgrade: hasta ${BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT} propiedades activas.`,
          inventoryChild: "Propiedad de inventario",
          connected: parentLeonix ? `Conectada a ${parentLeonix}` : parentId ? `Conectada al anuncio principal` : null,
        }
      : {
          section: "Property Inventory",
          plan: `Your Real Estate plan includes up to ${BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES} active properties ($${BASE_BR_NEGOCIO_MONTHLY_PRICE}/mo).`,
          upgrade: `Unlock Property Inventory for $${BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE}/mo to add up to ${BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT} additional properties. Total with upgrade: up to ${BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT} active properties.`,
          inventoryChild: "Inventory property",
          connected: parentLeonix ? `Connected to ${parentLeonix}` : parentId ? `Connected to main listing` : null,
        };

  if (isChild) {
    return (
      <div className="mt-4 rounded-xl border border-[#E8DFD0]/90 bg-[#FFFCF7] p-3 sm:p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{t.section}</p>
        <p className="mt-1 text-sm font-semibold text-[#6E5418]">{t.inventoryChild}</p>
        {t.connected ? <p className="mt-1 text-xs text-[#5C5346]">{t.connected}</p> : null}
        {(row.leonix_ad_id ?? "").trim() ? (
          <p className="mt-1 font-mono text-[11px] text-[#7A7164]">
            {lang === "es" ? "ID Leonix" : "Leonix Ad ID"}: {(row.leonix_ad_id ?? "").trim()}
          </p>
        ) : null}
      </div>
    );
  }

  const upgradeActive =
    entitlementActive === true || isBrInventoryUpgradeActive({ entitlementActive: entitlementActive ?? undefined });
  const groupingKey = resolveBrInventoryGroupingKey(row);
  const addCtx: BrInventoryAddContext = {
    parentListingId: mainListingId,
    returnToListingId: mainListingId,
    brInventoryGroupId: row.br_inventory_group_id?.trim() || mainListingId,
  };
  const counts = computeBrPropertyInventoryCounts(inventoryRows ?? [row], {
    groupingKey,
    upgradeActive,
  });

  const inventoryEditHref = bienesInventoryEditHref({
    lang,
    listingId: mainListingId,
    leonixAdId: row.leonix_ad_id,
  });

  return (
    <div className="mt-4 rounded-xl border border-[#E8DFD0]/90 bg-[#FFFCF7] p-3 sm:p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{t.section}</p>
      <p className="mt-2 text-sm text-[#2C2416]">{t.plan}</p>
      <p className="mt-1 text-xs text-[#5C5346]">{t.upgrade}</p>
      {!upgradeActive ? (
        <p className="mt-2 text-xs text-[#5C5346]">{bienesInventoryPackInactiveDashboardHint(lang)}</p>
      ) : null}
      {checkoutError ? <p className="mt-2 text-xs text-red-800">{checkoutError}</p> : null}
      {(row.leonix_ad_id ?? "").trim() ? (
        <p className="mt-2 font-mono text-[11px] text-[#7A7164]">
          {lang === "es" ? "ID Leonix" : "Leonix Ad ID"}: {(row.leonix_ad_id ?? "").trim()}
        </p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {upgradeActive ? (
          <Link
            href={inventoryEditHref}
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-[#FFF6E7] px-4 py-2 text-sm font-semibold text-[#6E5418]"
          >
            {bienesInventoryPackEditLabel(lang)}
          </Link>
        ) : (
          <button
            type="button"
            disabled={checkoutBusy || entitlementActive === null}
            onClick={() => void startInventoryPackCheckout()}
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {checkoutBusy
              ? bienesInventoryPackAddonUpgradeBusyLabel(lang)
              : bienesInventoryPackAddonUpgradeLabel(lang)}
          </button>
        )}
        {upgradeActive ? (
          <>
            <BrPropertyInventoryValueDrawerTrigger
              lang={lang}
              addCtx={addCtx}
              counts={counts}
              label={brPropertyInventoryAddPropertyCtaLabel(lang)}
            />
            <BrPropertyInventoryValueDrawerTrigger
              lang={lang}
              addCtx={addCtx}
              counts={counts}
              label={brPropertyInventoryAddMorePropertiesLabel(lang)}
              variant="secondary"
            />
          </>
        ) : null}
        <BrPropertyInventoryValueDrawerTrigger
          lang={lang}
          addCtx={addCtx}
          counts={counts}
          label={brPropertyInventoryUpgradeCtaLabel(lang)}
          variant="secondary"
        />
      </div>
    </div>
  );
}
