/**
 * BR Privado: subcategory buckets, type guards, and copy profiles for the unified publish flow.
 * Consumed by `publicar/[category]/page.tsx` orchestration.
 */

/** BR private: 6-bucket subcategory keys (source of truth for type-aware copy). */
export type BrSubcategoriaKey =
  | "residencial"
  | "condos-townhomes"
  | "multifamiliar"
  | "terrenos"
  | "comercial"
  | "industrial";

/** BR Privado: property type groups for conditional fields. */
const BR_RESIDENTIAL_TYPES = ["casa", "apartamento", "condo", "townhouse", "finca"];
const BR_LOTE_TYPES = ["lote"];
const BR_COMERCIAL_TYPES = ["oficina", "local-comercial"];
const BR_EDIFICIO_TYPES = ["edificio"];
const BR_PROYECTO_NUEVO_TYPES = ["proyecto-nuevo"];

export function isBrPrivadoResidential(propertyType: string): boolean {
  return BR_RESIDENTIAL_TYPES.includes((propertyType ?? "").trim().toLowerCase());
}

export function isBrPrivadoLote(propertyType: string): boolean {
  return BR_LOTE_TYPES.includes((propertyType ?? "").trim().toLowerCase());
}

export function isBrPrivadoComercial(propertyType: string): boolean {
  return BR_COMERCIAL_TYPES.includes((propertyType ?? "").trim().toLowerCase());
}

export function isBrPrivadoEdificio(propertyType: string): boolean {
  return BR_EDIFICIO_TYPES.includes((propertyType ?? "").trim().toLowerCase());
}

export function isBrPrivadoProyectoNuevo(propertyType: string): boolean {
  return BR_PROYECTO_NUEVO_TYPES.includes((propertyType ?? "").trim().toLowerCase());
}

/** Derive 6-bucket subcategory from property type value. Used when bienesRaicesSubcategoria is not set. */
export function getBrSubcategoriaFromPropertyType(propertyType: string): BrSubcategoriaKey {
  const pt = (propertyType ?? "").trim().toLowerCase();
  if (["casa", "apartamento", "finca"].includes(pt)) return "residencial";
  if (["condo", "townhouse"].includes(pt)) return "condos-townhomes";
  if (["edificio"].includes(pt)) return "multifamiliar";
  if (["lote"].includes(pt)) return "terrenos";
  if (["oficina", "local-comercial"].includes(pt)) return "comercial";
  if (["proyecto-nuevo"].includes(pt)) return "residencial";
  return "residencial";
}

/** BR private: copy profile per subcategory. Drives placeholders, helpers, and field emphasis. */
export const BR_PRIVATE_COPY_PROFILES: Record<
  BrSubcategoriaKey,
  {
    titlePlaceholder: { es: string; en: string };
    subtypePlaceholder: { es: string; en: string };
    descriptionHelper: { es: string; en: string };
    descriptionPlaceholder: { es: string; en: string };
    emphasize: string[];
    hideOrOptional: string[];
  }
> = {
  residencial: {
    titlePlaceholder: { es: "Ej: Casa 3 recámaras en zona tranquila", en: "e.g. 3-bedroom home in a quiet area" },
    subtypePlaceholder: { es: "Ej: Casa independiente, Duplex", en: "e.g. Single-family home, Duplex" },
    descriptionHelper: { es: "Describe la propiedad, su ubicación y características principales.", en: "Describe the property, location, and main features." },
    descriptionPlaceholder: { es: "Ej: Casa amplia con jardín, 3 recámaras, zona tranquila.", en: "e.g. Spacious home with garden, 3 bedrooms, quiet area." },
    emphasize: ["recámaras", "baños", "pies²", "niveles", "estacionamiento", "terreno"],
    hideOrOptional: [],
  },
  "condos-townhomes": {
    titlePlaceholder: { es: "Ej: Condo 2 recámaras cerca del centro", en: "e.g. 2-bedroom condo near downtown" },
    subtypePlaceholder: { es: "Ej: Condominio, Townhome", en: "e.g. Condo, Townhome" },
    descriptionHelper: { es: "Describe la unidad, ubicación y amenidades importantes.", en: "Describe the unit, location, and key amenities." },
    descriptionPlaceholder: { es: "Ej: Condo con área de asador, estacionamiento incluido.", en: "e.g. Condo with BBQ area, parking included." },
    emphasize: ["recámaras", "baños", "pies²", "estacionamiento"],
    hideOrOptional: ["terreno"],
  },
  multifamiliar: {
    titlePlaceholder: { es: "Ej: Propiedad multifamiliar con 2 unidades", en: "e.g. Multi-family property with 2 units" },
    subtypePlaceholder: { es: "Ej: Duplex, Triplex, Fourplex", en: "e.g. Duplex, Triplex, Fourplex" },
    descriptionHelper: { es: "Describe la propiedad, cantidad de unidades y sus características principales.", en: "Describe the property, number of units, and main features." },
    descriptionPlaceholder: { es: "Ej: Duplex con 2 unidades de 2 recámaras cada una.", en: "e.g. Duplex with 2 units, 2 bedrooms each." },
    emphasize: ["recámaras", "baños", "pies²", "estacionamiento"],
    hideOrOptional: [],
  },
  terrenos: {
    titlePlaceholder: { es: "Ej: Terreno residencial en buena ubicación", en: "e.g. Residential lot in a great location" },
    subtypePlaceholder: { es: "Ej: Lote residencial, Parcela", en: "e.g. Residential lot, Parcel" },
    descriptionHelper: { es: "Describe el terreno, ubicación, tamaño y usos posibles.", en: "Describe the lot, location, size, and possible uses." },
    descriptionPlaceholder: { es: "Ej: Terreno plano, servicios en la calle, zona residencial.", en: "e.g. Flat lot, utilities at street, residential zone." },
    emphasize: ["terreno", "zonificación", "servicios disponibles", "ubicación"],
    hideOrOptional: ["recámaras", "baños", "niveles"],
  },
  comercial: {
    titlePlaceholder: { es: "Ej: Oficina en zona comercial", en: "e.g. Office space in a commercial area" },
    subtypePlaceholder: { es: "Ej: Oficina, Local comercial", en: "e.g. Office, Retail space" },
    descriptionHelper: { es: "Describe el espacio, ubicación, tamaño y uso ideal.", en: "Describe the space, location, size, and ideal use." },
    descriptionPlaceholder: { es: "Ej: Oficina 800 pies², baño, estacionamiento.", en: "e.g. 800 sq ft office, restroom, parking." },
    emphasize: ["pies²", "estacionamiento", "zonificación", "ubicación"],
    hideOrOptional: ["recámaras"],
  },
  industrial: {
    titlePlaceholder: { es: "Ej: Bodega industrial con amplio espacio", en: "e.g. Industrial warehouse with ample space" },
    subtypePlaceholder: { es: "Ej: Bodega, Nave industrial, Taller", en: "e.g. Warehouse, Industrial space, Workshop" },
    descriptionHelper: { es: "Describe el espacio, tamaño, acceso y uso industrial.", en: "Describe the space, size, access, and industrial use." },
    descriptionPlaceholder: { es: "Ej: Bodega 5,000 pies², carga y descarga fácil.", en: "e.g. 5,000 sq ft warehouse, easy loading." },
    emphasize: ["pies²", "terreno", "estacionamiento", "zonificación"],
    hideOrOptional: ["recámaras"],
  },
};

/** Common amenities for BR; click to add/remove from comodidades (comma-separated). */
export const BR_COMODIDADES_OPTIONS: Array<{ es: string; en: string }> = [
  { es: "Estacionamiento", en: "Parking" },
  { es: "Jardín", en: "Garden" },
  { es: "A/C", en: "A/C" },
  { es: "Calefacción", en: "Heating" },
  { es: "Lavandería", en: "Laundry" },
  { es: "Seguridad 24h", en: "24h security" },
  { es: "Gimnasio", en: "Gym" },
  { es: "Alberca", en: "Pool" },
  { es: "Área de juegos", en: "Playground" },
  { es: "Mascotas permitidas", en: "Pets allowed" },
];
