/**
 * Catálogo de tipo / subtipo residencial (BR Negocio · categoría Residencial).
 * Catálogo cerrado (sin tipo comodín).
 */

export type TipoPropiedadCodigo = "casa" | "condominio" | "townhome" | "apartamento" | "multifamiliar";

export const TIPO_PROPIEDAD_OPCIONES: ReadonlyArray<{ value: TipoPropiedadCodigo; label: string }> = [
  { value: "casa", label: "Casa" },
  { value: "condominio", label: "Condominio" },
  { value: "townhome", label: "Townhome" },
  { value: "apartamento", label: "Apartamento" },
  { value: "multifamiliar", label: "Multifamiliar" },
];

const ALL_TIPOS: TipoPropiedadCodigo[] = ["casa", "condominio", "townhome", "apartamento", "multifamiliar"];

/** Migra códigos legacy o desconocidos al catálogo actual (sin tipo comodín). */
export function normalizeResidencialTipoPropiedadCodigo(raw: unknown): TipoPropiedadCodigo {
  const v = typeof raw === "string" ? raw : "";
  if (String(v).toLowerCase() === "otro") return "casa";
  return ALL_TIPOS.includes(v as TipoPropiedadCodigo) ? (v as TipoPropiedadCodigo) : "casa";
}

/** Valor vacío = sin detalle adicional (opcional). */
export const SUBTIPO_POR_TIPO: Record<TipoPropiedadCodigo, ReadonlyArray<{ value: string; label: string }>> = {
  casa: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "un_piso", label: "Un solo piso" },
    { value: "dos_pisos", label: "Dos pisos" },
    { value: "duplex", label: "Dúplex / pareado" },
  ],
  condominio: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "unidad", label: "Unidad en condominio" },
    { value: "penthouse", label: "Penthouse" },
    { value: "planta_baja", label: "Planta baja" },
  ],
  townhome: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "adosado", label: "Adosado" },
    { value: "esquina", label: "En esquina" },
  ],
  apartamento: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "elevador", label: "Con elevador" },
    { value: "planta_baja", label: "Planta baja" },
    { value: "vista", label: "Con vista" },
  ],
  multifamiliar: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "varias_unidades", label: "Varias unidades en el sitio" },
    { value: "duplex", label: "Dúplex / dos unidades" },
  ],
};

export function labelForSubtipo(codigo: TipoPropiedadCodigo, subvalor: string): string {
  if (!String(subvalor ?? "").trim()) return "";
  const list = SUBTIPO_POR_TIPO[codigo];
  const hit = list.find((x) => x.value === subvalor);
  return hit?.label ?? "";
}

/** English labels for property type dropdown (locale toggle). */
export const TIPO_PROPIEDAD_LABEL_EN: Record<TipoPropiedadCodigo, string> = {
  casa: "House",
  condominio: "Condominium",
  townhome: "Townhome",
  apartamento: "Apartment",
  multifamiliar: "Multifamily",
};

/** English labels for subtype `value` keys (shared across types where values collide). */
export const SUBTIPO_SUBVALUE_LABEL_EN: Record<string, string> = {
  "": "— No extra detail",
  un_piso: "Single story",
  dos_pisos: "Two stories",
  duplex: "Duplex / two units",
  unidad: "Condo unit",
  penthouse: "Penthouse",
  planta_baja: "Ground floor",
  adosado: "Attached",
  esquina: "Corner lot",
  elevador: "With elevator",
  vista: "With view",
  varias_unidades: "Multiple units on site",
};

export function labelForSubtipoEn(codigo: TipoPropiedadCodigo, subvalor: string): string {
  const v = String(subvalor ?? "").trim();
  if (!v) return "";
  if (SUBTIPO_SUBVALUE_LABEL_EN[v]) return SUBTIPO_SUBVALUE_LABEL_EN[v];
  const list = SUBTIPO_POR_TIPO[codigo];
  const hit = list.find((x) => x.value === v);
  return hit ? SUBTIPO_SUBVALUE_LABEL_EN[v] ?? hit.label : "";
}
