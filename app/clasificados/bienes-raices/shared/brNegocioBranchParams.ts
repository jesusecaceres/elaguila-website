/**
 * BR Negocio branch selector + URL query contract (seller + property category).
 * Used by `/publicar/bienes-raices` → `clasificados/publicar/bienes-raices/negocio`.
 */

export type BrNegocioSellerTipo = "agente_individual" | "equipo_agentes" | "oficina_broker";

export type BrNegocioCategoriaPropiedad = "residencial" | "comercial" | "terreno_lote" | "otro";

export const BR_NEGOCIO_DEFAULT_SELLER: BrNegocioSellerTipo = "agente_individual";

export const BR_NEGOCIO_DEFAULT_CATEGORIA: BrNegocioCategoriaPropiedad = "residencial";

/** Query keys on the Negocio application URL. */
export const BR_NEGOCIO_Q_SELLER = "seller";

export const BR_NEGOCIO_Q_PROPIEDAD = "propiedad";

export function parseBrNegocioSellerParam(raw: string | null | undefined): BrNegocioSellerTipo | null {
  if (raw === "agente_individual" || raw === "equipo_agentes" || raw === "oficina_broker") return raw;
  return null;
}

export function parseBrNegocioPropiedadParam(raw: string | null | undefined): BrNegocioCategoriaPropiedad | null {
  if (raw === "residencial" || raw === "comercial" || raw === "terreno_lote" || raw === "otro") return raw;
  return null;
}

export function coerceBrNegocioSellerTipo(raw: unknown): BrNegocioSellerTipo {
  return parseBrNegocioSellerParam(typeof raw === "string" ? raw : null) ?? BR_NEGOCIO_DEFAULT_SELLER;
}

export function coerceBrNegocioCategoriaPropiedad(raw: unknown): BrNegocioCategoriaPropiedad {
  return parseBrNegocioPropiedadParam(typeof raw === "string" ? raw : null) ?? BR_NEGOCIO_DEFAULT_CATEGORIA;
}

export function applyBrNegocioBranchQuery<
  T extends { sellerTipo: BrNegocioSellerTipo; categoriaPropiedad: BrNegocioCategoriaPropiedad },
>(state: T, sp: { get(name: string): string | null } | null | undefined): T {
  if (!sp) return state;
  const seller = parseBrNegocioSellerParam(sp.get(BR_NEGOCIO_Q_SELLER));
  const prop = parseBrNegocioPropiedadParam(sp.get(BR_NEGOCIO_Q_PROPIEDAD));
  if (!seller && !prop) return state;
  return {
    ...state,
    ...(seller ? { sellerTipo: seller } : {}),
    ...(prop ? { categoriaPropiedad: prop } : {}),
  };
}
