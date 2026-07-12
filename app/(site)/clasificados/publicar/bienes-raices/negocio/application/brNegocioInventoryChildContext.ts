/**
 * Pre-publish inventory-child routing context (Bienes Negocio only).
 * URL carries stable identity; parent/child form data stays in existing draft storage.
 */
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  parseBrNegocioPropiedadParam,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  BR_PUBLICAR_NEGOCIO,
  BR_PUBLICAR_NEGOCIO_SELECTOR,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { withBrAgenteResLangParam } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialLang";
import { newBrLocalPropertyDraftId } from "./brNegocioAdditionalInventoryDraft";

/** Distinct from dashboard `mode=inventory-edit|addon` and post-publish `inventoryMode=add`. */
export const BR_INVENTORY_CHILD_MODE_VALUE = "inventory-child" as const;

export const BR_INVENTORY_CHILD_Q_MODE = "mode";
export const BR_INVENTORY_CHILD_Q_DRAFT_ID = "childDraftId";
/** Child channel — must not overwrite parent `propiedad`. */
export const BR_INVENTORY_CHILD_Q_PROPIEDAD = "childPropiedad";
export const BR_INVENTORY_CHILD_SESSION_KEY = "lx-br-inventory-child-context" as const;

export type BrNegocioInventoryChildContext = {
  mode: typeof BR_INVENTORY_CHILD_MODE_VALUE;
  childDraftId: string;
  /** Parent application channel (`propiedad`) — never mutated by child selection. */
  parentPropiedad: BrNegocioCategoriaPropiedad;
  /** Selected child channel when known (after selector). */
  childPropiedad: BrNegocioCategoriaPropiedad | null;
  inventoryGroupId: string | null;
  lang: "es" | "en";
  savedAt: number;
};

export type BrInventoryChildRouteParse = {
  active: boolean;
  childDraftId: string | null;
  childPropiedad: BrNegocioCategoriaPropiedad | null;
  parentPropiedad: BrNegocioCategoriaPropiedad | null;
};

function readParam(params: URLSearchParams | { get: (key: string) => string | null }, key: string): string {
  return params.get(key)?.trim() ?? "";
}

export function isBrInventoryChildMode(
  params: URLSearchParams | { get: (key: string) => string | null } | null | undefined,
): boolean {
  if (!params) return false;
  return readParam(params, BR_INVENTORY_CHILD_Q_MODE) === BR_INVENTORY_CHILD_MODE_VALUE;
}

export function parseBrInventoryChildSearchParams(
  params: URLSearchParams | { get: (key: string) => string | null } | null | undefined,
): BrInventoryChildRouteParse {
  if (!params || !isBrInventoryChildMode(params)) {
    return { active: false, childDraftId: null, childPropiedad: null, parentPropiedad: null };
  }
  const childDraftId = readParam(params, BR_INVENTORY_CHILD_Q_DRAFT_ID) || null;
  const childPropiedad = parseBrNegocioPropiedadParam(readParam(params, BR_INVENTORY_CHILD_Q_PROPIEDAD));
  const parentPropiedad = parseBrNegocioPropiedadParam(readParam(params, BR_NEGOCIO_Q_PROPIEDAD));
  return {
    active: true,
    childDraftId,
    childPropiedad,
    parentPropiedad,
  };
}

export function writeBrInventoryChildContext(ctx: BrNegocioInventoryChildContext): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BR_INVENTORY_CHILD_SESSION_KEY, JSON.stringify(ctx));
  } catch {
    /* quota — URL params remain the routing identity */
  }
}

export function readBrInventoryChildContext(): BrNegocioInventoryChildContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(BR_INVENTORY_CHILD_SESSION_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as Partial<BrNegocioInventoryChildContext>;
    if (j.mode !== BR_INVENTORY_CHILD_MODE_VALUE) return null;
    const childDraftId = typeof j.childDraftId === "string" ? j.childDraftId.trim() : "";
    if (!childDraftId) return null;
    const parentPropiedad = parseBrNegocioPropiedadParam(j.parentPropiedad);
    if (!parentPropiedad) return null;
    return {
      mode: BR_INVENTORY_CHILD_MODE_VALUE,
      childDraftId,
      parentPropiedad,
      childPropiedad: parseBrNegocioPropiedadParam(j.childPropiedad ?? null),
      inventoryGroupId: typeof j.inventoryGroupId === "string" ? j.inventoryGroupId.trim() || null : null,
      lang: j.lang === "en" ? "en" : "es",
      savedAt: typeof j.savedAt === "number" ? j.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function clearBrInventoryChildContext(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(BR_INVENTORY_CHILD_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function createBrInventoryChildDraftId(): string {
  return newBrLocalPropertyDraftId();
}

/** Selector entry from Add property to inventory. */
export function buildBrInventoryChildSelectorHref(opts: {
  childDraftId: string;
  parentPropiedad: BrNegocioCategoriaPropiedad;
  lang: "es" | "en";
  inventoryGroupId?: string | null;
  /** Default highlight on selector (usually parent channel). */
  highlightPropiedad?: BrNegocioCategoriaPropiedad | null;
}): string {
  const qs = new URLSearchParams();
  qs.set(BR_INVENTORY_CHILD_Q_MODE, BR_INVENTORY_CHILD_MODE_VALUE);
  qs.set(BR_INVENTORY_CHILD_Q_DRAFT_ID, opts.childDraftId);
  qs.set(BR_NEGOCIO_Q_PROPIEDAD, opts.parentPropiedad);
  if (opts.highlightPropiedad) qs.set(BR_INVENTORY_CHILD_Q_PROPIEDAD, opts.highlightPropiedad);
  if (opts.inventoryGroupId?.trim()) qs.set("inventoryGroupId", opts.inventoryGroupId.trim());
  const path = `${BR_PUBLICAR_NEGOCIO_SELECTOR}?${qs.toString()}`;
  return withBrAgenteResLangParam(path, opts.lang);
}

/** After channel chosen — return to parent application and open child editor. */
export function buildBrInventoryChildReturnToParentHref(opts: {
  childDraftId: string;
  parentPropiedad: BrNegocioCategoriaPropiedad;
  childPropiedad: BrNegocioCategoriaPropiedad;
  lang: "es" | "en";
  inventoryGroupId?: string | null;
}): string {
  const qs = new URLSearchParams();
  qs.set(BR_NEGOCIO_Q_PROPIEDAD, opts.parentPropiedad);
  qs.set(BR_INVENTORY_CHILD_Q_MODE, BR_INVENTORY_CHILD_MODE_VALUE);
  qs.set(BR_INVENTORY_CHILD_Q_DRAFT_ID, opts.childDraftId);
  qs.set(BR_INVENTORY_CHILD_Q_PROPIEDAD, opts.childPropiedad);
  qs.set("focus", "inventory-pack");
  if (opts.inventoryGroupId?.trim()) qs.set("inventoryGroupId", opts.inventoryGroupId.trim());
  const path = `${BR_PUBLICAR_NEGOCIO}?${qs.toString()}`;
  return withBrAgenteResLangParam(path, opts.lang);
}

/** Cancel selector — parent inventory only (no child open). */
export function buildBrInventoryChildCancelHref(opts: {
  parentPropiedad: BrNegocioCategoriaPropiedad;
  lang: "es" | "en";
}): string {
  const qs = new URLSearchParams();
  qs.set(BR_NEGOCIO_Q_PROPIEDAD, opts.parentPropiedad);
  qs.set("focus", "inventory-pack");
  const path = `${BR_PUBLICAR_NEGOCIO}?${qs.toString()}`;
  return withBrAgenteResLangParam(path, opts.lang);
}

export function channelLabelForInventoryCard(
  categoria: BrNegocioCategoriaPropiedad | null | undefined,
  lang: "es" | "en",
): string {
  if (categoria === "comercial") return lang === "en" ? "Commercial" : "Comercial";
  if (categoria === "terreno_lote") return lang === "en" ? "Land / Lot" : "Terreno / lote";
  return lang === "en" ? "Residential" : "Residencial";
}

export function resolveChildDraftCategoria(
  draft: {
    propertyType?: string;
    propertyForm?: { categoriaPropiedad?: unknown } | null;
  } | null | undefined,
): BrNegocioCategoriaPropiedad {
  const fromForm = parseBrNegocioPropiedadParam(
    typeof draft?.propertyForm?.categoriaPropiedad === "string"
      ? draft.propertyForm.categoriaPropiedad
      : null,
  );
  if (fromForm) return fromForm;
  const pt = String(draft?.propertyType ?? "").trim();
  if (pt === "comercial") return "comercial";
  if (pt === "terreno") return "terreno_lote";
  return "residencial";
}
