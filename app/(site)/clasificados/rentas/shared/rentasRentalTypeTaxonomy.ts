/**
 * Rentas "Tipo de renta" — stable IDs for drafts, machine pairs, and public mapping.
 */

export const RENTAS_TIPO_DE_RENTA_IDS = [
  "casa",
  "apartamento",
  "condominio",
  "townhome",
  "duplex_multifamiliar",
  "adu_casita",
  "estudio",
  "cuarto_recamara",
  "cuarto_compartido",
  "espacio_compartido",
  "garaje",
  "estacionamiento",
  "bodega_almacen",
  "oficina",
  "local_comercial",
  "terreno_lote",
  "otro",
] as const;

export type RentasTipoDeRentaId = (typeof RENTAS_TIPO_DE_RENTA_IDS)[number];

const ID_SET = new Set<string>(RENTAS_TIPO_DE_RENTA_IDS);

/** High-level UX / output grouping for a selected tipo. */
export type RentasRentalFlowGroup =
  | "unset"
  | "full_housing"
  | "room_shared"
  | "storage_parking"
  | "commercial_space"
  | "land_parcel";

export const RENTAS_TIPO_DE_RENTA_OPTIONS: { id: RentasTipoDeRentaId; label: string }[] = [
  { id: "casa", label: "Casa" },
  { id: "apartamento", label: "Apartamento" },
  { id: "condominio", label: "Condominio" },
  { id: "townhome", label: "Townhome" },
  { id: "duplex_multifamiliar", label: "Duplex / Multifamiliar" },
  { id: "adu_casita", label: "ADU / Casita" },
  { id: "estudio", label: "Estudio" },
  { id: "cuarto_recamara", label: "Cuarto / Recámara" },
  { id: "cuarto_compartido", label: "Cuarto compartido" },
  { id: "espacio_compartido", label: "Espacio compartido" },
  { id: "garaje", label: "Garaje" },
  { id: "estacionamiento", label: "Estacionamiento" },
  { id: "bodega_almacen", label: "Bodega / Almacén" },
  { id: "oficina", label: "Oficina" },
  { id: "local_comercial", label: "Local comercial" },
  { id: "terreno_lote", label: "Terreno / Lote" },
  { id: "otro", label: "Otro" },
];

const LABEL_BY_ID = new Map(RENTAS_TIPO_DE_RENTA_OPTIONS.map((o) => [o.id, o.label] as const));

export function coerceRentasTipoDeRentaId(raw: unknown): RentasTipoDeRentaId | "" {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v || !ID_SET.has(v)) return "";
  return v as RentasTipoDeRentaId;
}

export function rentasRentalFlowGroupForTipo(tipo: string | undefined | null): RentasRentalFlowGroup {
  const t = coerceRentasTipoDeRentaId(tipo);
  if (!t) return "unset";
  if (
    t === "casa" ||
    t === "apartamento" ||
    t === "condominio" ||
    t === "townhome" ||
    t === "duplex_multifamiliar" ||
    t === "adu_casita" ||
    t === "estudio"
  ) {
    return "full_housing";
  }
  if (t === "cuarto_recamara" || t === "cuarto_compartido" || t === "espacio_compartido") return "room_shared";
  if (t === "garaje" || t === "estacionamiento" || t === "bodega_almacen") return "storage_parking";
  if (t === "oficina" || t === "local_comercial") return "commercial_space";
  if (t === "terreno_lote") return "land_parcel";
  if (t === "otro") return "full_housing";
  return "full_housing";
}

/**
 * User-facing tipo label. For `otro`, returns trimmed custom text when present — never the literal "Otro" alone when custom exists.
 */
export function formatRentasTipoDeRentaDisplay(tipo: string | undefined | null, tipoOtro: string | undefined | null): string {
  const id = coerceRentasTipoDeRentaId(tipo);
  if (!id) return "";
  if (id === "otro") {
    const c = String(tipoOtro ?? "").trim();
    return c || "Otro";
  }
  return LABEL_BY_ID.get(id) ?? id;
}
