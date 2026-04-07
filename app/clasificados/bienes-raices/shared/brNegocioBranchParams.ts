/**
 * BR Negocio branch: property category on the URL (`propiedad`).
 * Seller is always the standard agent flow (no top-level seller branching).
 */

export type BrNegocioSellerTipo = "agente_individual";

export type BrNegocioCategoriaPropiedad = "residencial" | "comercial" | "terreno_lote";

export const BR_NEGOCIO_DEFAULT_SELLER: BrNegocioSellerTipo = "agente_individual";

export const BR_NEGOCIO_DEFAULT_CATEGORIA: BrNegocioCategoriaPropiedad = "residencial";

/** Query key on the Negocio application URL (category only). */
export const BR_NEGOCIO_Q_PROPIEDAD = "propiedad";

/** @deprecated Legacy key; ignored for routing — seller is always base flow. */
export const BR_NEGOCIO_Q_SELLER = "seller";

export function parseBrNegocioPropiedadParam(raw: string | null | undefined): BrNegocioCategoriaPropiedad | null {
  if (raw === "residencial" || raw === "comercial" || raw === "terreno_lote") return raw;
  return null;
}

/** Unknown or legacy category values map to the default (structured categories only). */
export function coerceBrNegocioCategoriaPropiedad(raw: unknown): BrNegocioCategoriaPropiedad {
  const s = typeof raw === "string" ? raw : "";
  if (s === "residencial" || s === "comercial" || s === "terreno_lote") return s;
  return BR_NEGOCIO_DEFAULT_CATEGORIA;
}

export function coerceBrNegocioSellerTipo(_raw: unknown): BrNegocioSellerTipo {
  return BR_NEGOCIO_DEFAULT_SELLER;
}

export function applyBrNegocioBranchQuery<
  T extends { sellerTipo: BrNegocioSellerTipo; categoriaPropiedad: BrNegocioCategoriaPropiedad },
>(state: T, sp: { get(name: string): string | null } | null | undefined): T {
  if (!sp) return { ...state, sellerTipo: BR_NEGOCIO_DEFAULT_SELLER };
  const prop = parseBrNegocioPropiedadParam(sp.get(BR_NEGOCIO_Q_PROPIEDAD));
  return {
    ...state,
    sellerTipo: BR_NEGOCIO_DEFAULT_SELLER,
    ...(prop ? { categoriaPropiedad: prop } : {}),
  };
}
