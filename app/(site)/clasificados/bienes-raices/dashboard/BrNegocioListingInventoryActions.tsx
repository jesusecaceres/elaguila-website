"use client";

import Link from "next/link";
import {
  BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES,
  BASE_BR_NEGOCIO_MONTHLY_PRICE,
  BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE,
  BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT,
  BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT,
  isBrInventoryMainListing,
  isBrInventoryProperty,
  isBrNegocioListing,
  type BrPropertyInventoryRowLike,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import {
  brPropertyInventoryAddPropertyCtaLabel,
  brPropertyInventoryUpgradeCtaLabel,
  brPropertyInventoryUpgradeContactHref,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryCopy";
import {
  buildBrInventoryAddPublishHref,
  type BrInventoryAddContext,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryAddFlow";

type Lang = "es" | "en";

type Props = {
  lang: Lang;
  row: BrPropertyInventoryRowLike;
  parentLeonixAdIdByListingId: ReadonlyMap<string, string>;
};

export function BrNegocioListingInventoryActions({ lang, row, parentLeonixAdIdByListingId }: Props) {
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
          addMore: "Añadir más propiedades",
        }
      : {
          section: "Property Inventory",
          plan: `Your Real Estate plan includes up to ${BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES} active properties ($${BASE_BR_NEGOCIO_MONTHLY_PRICE}/mo).`,
          upgrade: `Unlock Property Inventory for $${BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE}/mo to add up to ${BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT} additional properties. Total with upgrade: up to ${BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT} active properties.`,
          inventoryChild: "Inventory property",
          connected: parentLeonix ? `Connected to ${parentLeonix}` : parentId ? `Connected to main listing` : null,
          addMore: "Add more properties",
        };

  const mainListingId = isMain ? row.id : parentId ?? row.id;
  const addCtx: BrInventoryAddContext = {
    parentListingId: mainListingId,
    returnToListingId: mainListingId,
    brInventoryGroupId: row.br_inventory_group_id?.trim() || mainListingId,
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

  return (
    <div className="mt-4 rounded-xl border border-[#E8DFD0]/90 bg-[#FFFCF7] p-3 sm:p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{t.section}</p>
      <p className="mt-2 text-sm text-[#2C2416]">{t.plan}</p>
      <p className="mt-1 text-xs text-[#5C5346]">{t.upgrade}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={buildBrInventoryAddPublishHref(addCtx, lang)}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#2A2620] px-4 text-sm font-bold text-[#FAF7F2]"
        >
          {brPropertyInventoryAddPropertyCtaLabel(lang)}
        </Link>
        <Link
          href={buildBrInventoryAddPublishHref(addCtx, lang)}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-white px-4 text-sm font-semibold text-[#6E5418]"
        >
          {t.addMore}
        </Link>
        <a
          href={brPropertyInventoryUpgradeContactHref(lang)}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#E8DFD0] bg-white px-4 text-sm font-semibold text-[#1E1810]"
        >
          {brPropertyInventoryUpgradeCtaLabel(lang)}
        </a>
      </div>
    </div>
  );
}
