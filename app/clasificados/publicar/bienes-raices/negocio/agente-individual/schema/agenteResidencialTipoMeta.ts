/**
 * Catálogo de tipo / subtipo residencial (solo esta variante).
 */

export type TipoPropiedadCodigo = "casa" | "condominio" | "townhome" | "apartamento" | "multifamiliar" | "otro";

export const TIPO_PROPIEDAD_OPCIONES: ReadonlyArray<{ value: TipoPropiedadCodigo; label: string }> = [
  { value: "casa", label: "Casa" },
  { value: "condominio", label: "Condominio" },
  { value: "townhome", label: "Townhome" },
  { value: "apartamento", label: "Apartamento" },
  { value: "multifamiliar", label: "Multifamiliar" },
  { value: "otro", label: "Otro" },
];

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
  otro: [],
};

export function labelForSubtipo(codigo: TipoPropiedadCodigo, subvalor: string): string {
  if (!String(subvalor ?? "").trim()) return "";
  const list = SUBTIPO_POR_TIPO[codigo];
  const hit = list.find((x) => x.value === subvalor);
  return hit?.label ?? "";
}
