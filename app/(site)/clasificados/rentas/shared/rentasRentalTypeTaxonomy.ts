/**
 * Rentas "Tipo de renta" — stable IDs for drafts, machine pairs, and public mapping.
 */

import { getLaunchUiMessages } from "@/app/lib/i18n/launchUiDictionaries";
import type { OfficialLocale } from "@/app/lib/language";

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

export const RENTAS_TIPO_DE_RENTA_OPTIONS: { id: RentasTipoDeRentaId }[] = RENTAS_TIPO_DE_RENTA_IDS.map((id) => ({ id }));

export type RentasTipoCopyLang = OfficialLocale;

const RENTAS_TIPO_DE_RENTA_COPY_KEYS: Record<RentasTipoDeRentaId, keyof ReturnType<typeof getLaunchUiMessages>["rentas"]["rentalTypes"]> = {
  casa: "house",
  apartamento: "apartment",
  condominio: "condominium",
  townhome: "townhome",
  duplex_multifamiliar: "duplexMultifamily",
  adu_casita: "aduCasita",
  estudio: "studio",
  cuarto_recamara: "roomBedroom",
  cuarto_compartido: "sharedRoom",
  espacio_compartido: "sharedSpace",
  garaje: "garage",
  estacionamiento: "parking",
  bodega_almacen: "storageUnit",
  oficina: "office",
  local_comercial: "commercialSpace",
  terreno_lote: "landLot",
  otro: "other",
};

export function rentasTipoDeRentaOptionLabel(id: RentasTipoDeRentaId, lang: RentasTipoCopyLang): string {
  return getLaunchUiMessages(lang).rentas.rentalTypes[RENTAS_TIPO_DE_RENTA_COPY_KEYS[id]];
}

const LABEL_BY_ID = new Map(
  RENTAS_TIPO_DE_RENTA_OPTIONS.map((o) => [o.id, rentasTipoDeRentaOptionLabel(o.id, "es")] as const),
);

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
