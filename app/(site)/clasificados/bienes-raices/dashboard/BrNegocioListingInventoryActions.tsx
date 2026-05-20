"use client";

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

type Lang = "es" | "en";

type Props = {
  lang: Lang;
  row: BrPropertyInventoryRowLike;
  parentLeonixAdIdByListingId: ReadonlyMap<string, string>;
  /** All negocio rows in owner inventory — used for active-count limits. */
  inventoryRows?: readonly BrPropertyInventoryRowLike[];
};

export function BrNegocioListingInventoryActions({ lang, row, parentLeonixAdIdByListingId, inventoryRows }: Props) {
  if (!isBrNegocioListing(row)) return null;

  const isChild = isBrInventoryProperty(row);
  const isMain = isBrInventoryMainListing(row) || (!isChild && !row.inventory_role);
  const parentId = row.br_inventory_parent_listing_id?.trim() || null;
  const parentLeonix =
    (parentId ? parentLeonixAdIdByListingId.get(parentId) : null) ??
    (isMain ? row.leonix_ad_id?.trim() : null) ??
    null;

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

  const mainListingId = isMain ? row.id : parentId ?? row.id;
  const addCtx: BrInventoryAddContext = {
    parentListingId: mainListingId,
    returnToListingId: mainListingId,
    brInventoryGroupId: row.br_inventory_group_id?.trim() || mainListingId,
  };
  const groupingKey = resolveBrInventoryGroupingKey(row);
  const upgradeActive = isBrInventoryUpgradeActive();
  const counts = computeBrPropertyInventoryCounts(inventoryRows ?? [row], {
    groupingKey,
    upgradeActive,
  });

  return (
    <div className="mt-4 rounded-xl border border-[#E8DFD0]/90 bg-[#FFFCF7] p-3 sm:p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{t.section}</p>
      <p className="mt-2 text-sm text-[#2C2416]">{t.plan}</p>
      <p className="mt-1 text-xs text-[#5C5346]">{t.upgrade}</p>
      {(row.leonix_ad_id ?? "").trim() ? (
        <p className="mt-2 font-mono text-[11px] text-[#7A7164]">
          {lang === "es" ? "ID Leonix" : "Leonix Ad ID"}: {(row.leonix_ad_id ?? "").trim()}
        </p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
