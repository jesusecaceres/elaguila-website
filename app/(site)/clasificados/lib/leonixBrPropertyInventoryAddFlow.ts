import type { BrPropertyInventoryRowLike } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import { getBrInventoryGroupId } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";

export const BR_INVENTORY_ADD_SESSION_KEY = "lx-br-inventory-add-context" as const;

export type BrInventoryAddContext = {
  parentListingId: string;
  returnToListingId?: string | null;
  brInventoryGroupId?: string | null;
};

export function parseBrInventoryAddSearchParams(
  params: URLSearchParams | { get: (key: string) => string | null },
): { inventoryModeAdd: boolean; context: BrInventoryAddContext | null } {
  const mode = params.get("inventoryMode")?.trim().toLowerCase();
  if (mode !== "add") return { inventoryModeAdd: false, context: null };
  const parentListingId = params.get("parentListingId")?.trim() ?? "";
  if (!parentListingId) return { inventoryModeAdd: true, context: null };
  return {
    inventoryModeAdd: true,
    context: {
      parentListingId,
      returnToListingId: params.get("returnToListingId")?.trim() || parentListingId,
      brInventoryGroupId: params.get("inventoryGroupId")?.trim() || null,
    },
  };
}

export function buildBrInventoryAddPublishHref(ctx: BrInventoryAddContext, lang: "es" | "en"): string {
  const p = new URLSearchParams();
  p.set("inventoryMode", "add");
  p.set("parentListingId", ctx.parentListingId);
  if (ctx.returnToListingId?.trim()) p.set("returnToListingId", ctx.returnToListingId.trim());
  if (ctx.brInventoryGroupId?.trim()) p.set("inventoryGroupId", ctx.brInventoryGroupId.trim());
  if (lang === "en") p.set("lang", "en");
  return `${BR_PUBLICAR_NEGOCIO}?${p.toString()}`;
}

export function buildBrInventoryAddPreviewHref(ctx: BrInventoryAddContext, lang: "es" | "en"): string {
  const p = new URLSearchParams();
  p.set("inventoryMode", "add");
  p.set("parentListingId", ctx.parentListingId);
  if (ctx.returnToListingId?.trim()) p.set("returnToListingId", ctx.returnToListingId.trim());
  if (ctx.brInventoryGroupId?.trim()) p.set("inventoryGroupId", ctx.brInventoryGroupId.trim());
  if (lang === "en") p.set("lang", "en");
  return `/clasificados/bienes-raices/preview/negocio?${p.toString()}`;
}

export function resolveBrInventoryAddReturnHref(opts: {
  returnToListingId?: string | null;
  lang: "es" | "en";
}): string {
  const langQ = opts.lang === "en" ? "lang=en" : "lang=es";
  const returnId = opts.returnToListingId?.trim();
  if (returnId) return `${leonixLiveAnuncioPath(returnId)}?${langQ}`;
  return `/dashboard/mis-anuncios?${langQ}&cat=bienes-raices`;
}

export function resolveBrInventoryGroupIdForParent(
  parent: Pick<BrPropertyInventoryRowLike, "id" | "br_inventory_group_id">,
  explicitGroupId?: string | null,
): string {
  const explicit = explicitGroupId?.trim();
  if (explicit) return explicit;
  return getBrInventoryGroupId(parent) ?? parent.id;
}

export function readBrInventoryAddContextFromSession(): BrInventoryAddContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(BR_INVENTORY_ADD_SESSION_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as BrInventoryAddContext;
    if (!j?.parentListingId?.trim()) return null;
    return {
      parentListingId: j.parentListingId.trim(),
      returnToListingId: j.returnToListingId?.trim() || j.parentListingId.trim(),
      brInventoryGroupId: j.brInventoryGroupId?.trim() || null,
    };
  } catch {
    return null;
  }
}

export function writeBrInventoryAddContextToSession(ctx: BrInventoryAddContext): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(BR_INVENTORY_ADD_SESSION_KEY, JSON.stringify(ctx));
}

export function clearBrInventoryAddContextFromSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(BR_INVENTORY_ADD_SESSION_KEY);
}
