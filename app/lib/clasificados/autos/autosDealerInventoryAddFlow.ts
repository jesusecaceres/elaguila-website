import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { createEmptyListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import type { AutosClassifiedsListingRow } from "./autosClassifiedsTypes";
import { getDealerInventoryGroupId } from "./autosDealerInventoryPolicy";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";

export const AUTOS_INVENTORY_ADD_SESSION_KEY = "lx-autos-inventory-add-context" as const;

export type AutosInventoryAddContext = {
  parentListingId: string;
  returnToListingId?: string | null;
  dealerInventoryGroupId?: string | null;
};

export function parseAutosInventoryAddSearchParams(
  params: URLSearchParams | { get: (key: string) => string | null },
): { inventoryModeAdd: boolean; context: AutosInventoryAddContext | null } {
  const mode = params.get("inventoryMode")?.trim().toLowerCase();
  if (mode !== "add") return { inventoryModeAdd: false, context: null };
  const parentListingId = params.get("parentListingId")?.trim() ?? "";
  if (!parentListingId) return { inventoryModeAdd: true, context: null };
  return {
    inventoryModeAdd: true,
    context: {
      parentListingId,
      returnToListingId: params.get("returnToListingId")?.trim() || parentListingId,
      dealerInventoryGroupId: params.get("dealerInventoryGroupId")?.trim() || null,
    },
  };
}

export function buildAutosInventoryAddPublishHref(
  ctx: AutosInventoryAddContext,
  lang: "es" | "en",
): string {
  const p = new URLSearchParams();
  p.set("inventoryMode", "add");
  p.set("parentListingId", ctx.parentListingId);
  if (ctx.returnToListingId?.trim()) p.set("returnToListingId", ctx.returnToListingId.trim());
  if (ctx.dealerInventoryGroupId?.trim()) p.set("dealerInventoryGroupId", ctx.dealerInventoryGroupId.trim());
  if (lang === "en") p.set("lang", "en");
  return `/publicar/autos/negocios?${p.toString()}`;
}

export function buildAutosInventoryAddConfirmHref(
  ctx: AutosInventoryAddContext,
  lang: "es" | "en",
): string {
  const p = new URLSearchParams();
  p.set("inventoryMode", "add");
  p.set("parentListingId", ctx.parentListingId);
  if (ctx.returnToListingId?.trim()) p.set("returnToListingId", ctx.returnToListingId.trim());
  if (ctx.dealerInventoryGroupId?.trim()) p.set("dealerInventoryGroupId", ctx.dealerInventoryGroupId.trim());
  if (lang === "en") p.set("lang", "en");
  return `/publicar/autos/negocios/confirm?${p.toString()}`;
}

export function dealerInventoryGroupPublicPath(groupId: string, lang: "es" | "en"): string {
  const q = lang === "en" ? "?lang=en" : "?lang=es";
  return `/clasificados/autos/dealer/${encodeURIComponent(groupId)}${q}`;
}

export function resolveInventoryAddReturnHref(opts: {
  returnToListingId?: string | null;
  newListingId?: string | null;
  lang: "es" | "en";
  dashboardFallback?: boolean;
}): string {
  const langQ = opts.lang === "en" ? "lang=en" : "lang=es";
  const returnId = opts.returnToListingId?.trim();
  if (returnId) return `${autosLiveVehiclePath(returnId)}?${langQ}`;
  if (opts.dashboardFallback !== false) return `/dashboard/mis-anuncios?${langQ}&cat=autos`;
  const newId = opts.newListingId?.trim();
  if (newId) return `${autosLiveVehiclePath(newId)}?${langQ}`;
  return `/dashboard/mis-anuncios?${langQ}&cat=autos`;
}

/** Dealer/contact fields from parent; vehicle identity and media stay empty. */
export function prefillDealerListingForInventoryAdd(parent: AutoDealerListing): AutoDealerListing {
  const empty = createEmptyListing();
  return {
    ...empty,
    autosLane: "negocios",
    dealerName: parent.dealerName,
    dealerLogo: parent.dealerLogo,
    dealerPhoneOffice: parent.dealerPhoneOffice ?? parent.dealerPhone,
    dealerPhone: undefined,
    dealerPhoneMobile: parent.dealerPhoneMobile,
    dealerWhatsapp: parent.dealerWhatsapp,
    dealerEmail: parent.dealerEmail,
    dealerAddress: parent.dealerAddress,
    dealerHours: Array.isArray(parent.dealerHours) ? parent.dealerHours.map((r, i) => ({ ...r, rowId: r.rowId ?? `prefill-hour-${i}` })) : [],
    dealerWebsite: parent.dealerWebsite,
    dealerBookingUrl: parent.dealerBookingUrl,
    dealerSocials: parent.dealerSocials ? { ...parent.dealerSocials } : {},
    city: parent.city,
    state: parent.state,
    zip: parent.zip,
  };
}

export function resolveDealerInventoryGroupIdForParent(
  parent: Pick<AutosClassifiedsListingRow, "id" | "dealer_inventory_group_id">,
  explicitGroupId?: string | null,
): string {
  const explicit = explicitGroupId?.trim();
  if (explicit) return explicit;
  return getDealerInventoryGroupId(parent) ?? parent.id;
}

export function readInventoryAddContextFromSession(): AutosInventoryAddContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(AUTOS_INVENTORY_ADD_SESSION_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as AutosInventoryAddContext;
    if (!j?.parentListingId?.trim()) return null;
    return {
      parentListingId: j.parentListingId.trim(),
      returnToListingId: j.returnToListingId?.trim() || j.parentListingId.trim(),
      dealerInventoryGroupId: j.dealerInventoryGroupId?.trim() || null,
    };
  } catch {
    return null;
  }
}

export function writeInventoryAddContextToSession(ctx: AutosInventoryAddContext): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(AUTOS_INVENTORY_ADD_SESSION_KEY, JSON.stringify(ctx));
}

export function clearInventoryAddContextFromSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTOS_INVENTORY_ADD_SESSION_KEY);
}
