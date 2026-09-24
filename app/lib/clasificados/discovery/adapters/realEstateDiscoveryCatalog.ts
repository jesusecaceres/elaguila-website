/**
 * Leonix bilingual discovery — shared real-estate concept catalog (Rentas + Bienes Raíces), WAVE 4.
 *
 * Ids are the ones the rows already persist: Rentas `rentalTypeCode` (`RENTAS_TIPO_DE_RENTA_IDS`),
 * BR / Rentas `resultsPropertyKind` (casa | departamento | terreno | comercial) and the listing
 * operation (Rentas is always rent; BR carries `operationLabel`). Pure — no fetch, no server-only.
 */
import type { CatalogConcept } from "../catalogDiscovery";

export const RE_KIND = { propertyType: "propertyType", operation: "operation" } as const;

export const RE_OP_RENT = "rent";
export const RE_OP_SALE = "sale";

export const REAL_ESTATE_CONCEPT_CATALOG: readonly CatalogConcept[] = [
  { kind: RE_KIND.propertyType, id: "casa", es: "Casa", en: "House", aliases: ["home", "casa sola", "single family", "single-family", "vivienda", "hogar", "residencia"] },
  { kind: RE_KIND.propertyType, id: "apartamento", es: "Apartamento", en: "Apartment", aliases: ["departamento", "depa", "apto", "apt", "flat", "unit"] },
  { kind: RE_KIND.propertyType, id: "condominio", es: "Condominio", en: "Condo", aliases: ["condominium", "condo", "condos", "condominios"] },
  { kind: RE_KIND.propertyType, id: "townhome", es: "Casa adosada / townhome", en: "Townhome", aliases: ["townhouse", "town home", "town house", "casa adosada"] },
  { kind: RE_KIND.propertyType, id: "duplex_multifamiliar", es: "Dúplex / multifamiliar", en: "Duplex / multifamily", aliases: ["duplex", "multifamiliar", "multifamily", "multi-family", "fourplex", "triplex"] },
  { kind: RE_KIND.propertyType, id: "adu_casita", es: "ADU / casita", en: "ADU / guest house", aliases: ["adu", "casita", "guest house", "guesthouse", "granny flat", "in-law"] },
  { kind: RE_KIND.propertyType, id: "estudio", es: "Estudio", en: "Studio", aliases: ["studio", "efficiency"] },
  { kind: RE_KIND.propertyType, id: "cuarto_recamara", es: "Cuarto / recámara", en: "Room", aliases: ["cuarto", "cuartos", "recamara", "habitacion", "room", "rooms", "room for rent", "cuarto en renta"] },
  { kind: RE_KIND.propertyType, id: "cuarto_compartido", es: "Cuarto compartido", en: "Shared room", aliases: ["shared room", "cuarto", "room", "roommate", "roommates", "roomie", "compartido"] },
  { kind: RE_KIND.propertyType, id: "espacio_compartido", es: "Espacio compartido", en: "Shared space", aliases: ["shared space", "shared housing", "vivienda compartida"] },
  { kind: RE_KIND.propertyType, id: "garaje", es: "Garaje", en: "Garage", aliases: ["garage", "cochera"] },
  { kind: RE_KIND.propertyType, id: "estacionamiento", es: "Estacionamiento", en: "Parking", aliases: ["parking", "parqueo", "parking space", "lugar de estacionamiento"] },
  { kind: RE_KIND.propertyType, id: "bodega_almacen", es: "Bodega / almacén", en: "Storage unit", aliases: ["bodega", "almacen", "storage", "storage unit", "warehouse", "bodegas"] },
  { kind: RE_KIND.propertyType, id: "oficina", es: "Oficina", en: "Office", aliases: ["office", "offices", "oficinas", "office space"] },
  { kind: RE_KIND.propertyType, id: "local_comercial", es: "Local comercial", en: "Commercial space", aliases: ["commercial space", "storefront", "retail", "retail space", "local"] },
  { kind: RE_KIND.propertyType, id: "comercial", es: "Comercial", en: "Commercial", aliases: ["propiedad comercial", "commercial property", "local comercial", "commercial space", "negocio comercial"] },
  { kind: RE_KIND.propertyType, id: "terreno_lote", es: "Terreno / lote", en: "Land / lot", aliases: ["terreno", "terrenos", "lote", "land", "lot", "vacant land", "parcela", "parcel", "acreage"] },
  {
    kind: RE_KIND.operation,
    id: RE_OP_RENT,
    es: "Renta",
    en: "For rent",
    expandTerms: false,
    aliases: ["renta", "rentar", "en renta", "de renta", "para renta", "en alquiler", "alquiler", "alquilar", "for rent", "rent", "rental", "rentals", "to rent", "lease", "for lease", "rentas"],
  },
  {
    kind: RE_KIND.operation,
    id: RE_OP_SALE,
    es: "Venta",
    en: "For sale",
    expandTerms: false,
    aliases: ["venta", "en venta", "de venta", "a la venta", "for sale", "sale", "comprar", "compra", "buy", "to buy", "buying", "purchase"],
  },
];

/** BR / Rentas `resultsPropertyKind` → catalog property-type id. */
export function realEstateConceptIdForResultsKind(kind: string | null | undefined): string | null {
  switch (kind) {
    case "casa":
      return "casa";
    case "departamento":
      return "apartamento";
    case "terreno":
      return "terreno_lote";
    case "comercial":
      return "comercial";
    default:
      return null;
  }
}

/** `categoriaPropiedad` → the generic category concept (residencial carries no single property type). */
export function realEstateConceptIdForCategoria(cat: string | null | undefined): string | null {
  if (cat === "comercial") return "comercial";
  if (cat === "terreno_lote") return "terreno_lote";
  return null;
}
