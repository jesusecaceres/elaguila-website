/**
 * Rentas taxonomy: subcategorías, tipo de propiedad by subcategoría,
 * and field groups (residential, room/temporary, commercial, alternative).
 * Single source of truth for Rentas publish form. Clean Spanish; no slang.
 */

export type RentasSubcategoryOption = {
  key: string;
  label: { es: string; en: string };
};

export type RentasTipoOption = {
  value: string;
  label: { es: string; en: string };
};

/** Field group key: which detail field set to show. */
export type RentasFieldGroupKey = "residential" | "room" | "commercial" | "alternative";

/** Subcategories for Rentas. Order drives the Subcategoría dropdown. */
export const RENTAS_SUBCATEGORIES: RentasSubcategoryOption[] = [
  { key: "residenciales", label: { es: "Rentas residenciales", en: "Residential rentals" } },
  { key: "cuartos-temporal", label: { es: "Cuartos y vivienda temporal", en: "Rooms and temporary housing" } },
  { key: "comerciales", label: { es: "Espacios comerciales y utilitarios", en: "Commercial and utility spaces" } },
  { key: "alternativa", label: { es: "Vivienda alternativa", en: "Alternative housing" } },
];

/** Tipo de propiedad options per subcategoría. */
const TIPO_BY_SUBCAT: Record<string, RentasTipoOption[]> = {
  residenciales: [
    { value: "apartamento", label: { es: "Apartamento", en: "Apartment" } },
    { value: "estudio", label: { es: "Estudio", en: "Studio" } },
    { value: "casa", label: { es: "Casa", en: "House" } },
    { value: "condominio", label: { es: "Condominio", en: "Condominium" } },
    { value: "townhouse", label: { es: "Townhouse", en: "Townhouse" } },
    { value: "duplex-triplex", label: { es: "Dúplex / tríplex / cuádruplex", en: "Duplex / triplex / fourplex" } },
    { value: "casa-movil-renta", label: { es: "Casa móvil en renta", en: "Mobile home for rent" } },
  ],
  "cuartos-temporal": [
    { value: "cuarto-privado", label: { es: "Cuarto privado", en: "Private room" } },
    { value: "cuarto-compartido", label: { es: "Cuarto compartido", en: "Shared room" } },
    { value: "renta-temporal", label: { es: "Renta temporal", en: "Short-term rental" } },
    { value: "subarrendamiento", label: { es: "Subarrendamiento", en: "Sublease" } },
    { value: "vivienda-estudiantes", label: { es: "Vivienda para estudiantes", en: "Student housing" } },
    { value: "hospedaje-corto-plazo", label: { es: "Hospedaje de corto plazo", en: "Short-term stay" } },
  ],
  comerciales: [
    { value: "oficina", label: { es: "Oficina", en: "Office" } },
    { value: "local-comercial", label: { es: "Local comercial", en: "Retail space" } },
    { value: "bodega", label: { es: "Bodega", en: "Warehouse" } },
    { value: "nave-industrial", label: { es: "Nave / espacio industrial", en: "Industrial space" } },
    { value: "espacio-trabajo", label: { es: "Espacio de trabajo", en: "Workspace" } },
    { value: "terreno-comercial", label: { es: "Terreno comercial en renta", en: "Commercial land for rent" } },
  ],
  alternativa: [
    { value: "espacio-rv", label: { es: "Espacio para RV", en: "RV space" } },
    { value: "espacio-casa-movil", label: { es: "Espacio para casa móvil", en: "Mobile home space" } },
    { value: "tiny-home", label: { es: "Tiny home / casita", en: "Tiny home" } },
    { value: "cabana", label: { es: "Cabaña", en: "Cabin" } },
    { value: "rancho-finca", label: { es: "Rancho / finca para estancia", en: "Ranch / farm stay" } },
    { value: "otras-vivienda", label: { es: "Otras opciones de vivienda", en: "Other housing options" } },
  ],
};

/** Which field group applies to each (subcat, tipo). */
const FIELD_GROUP_BY_SUBCAT_TIPO: Record<string, Record<string, RentasFieldGroupKey>> = {
  residenciales: {
    apartamento: "residential",
    estudio: "residential",
    casa: "residential",
    condominio: "residential",
    townhouse: "residential",
    "duplex-triplex": "residential",
    "casa-movil-renta": "residential",
  },
  "cuartos-temporal": {
    "cuarto-privado": "room",
    "cuarto-compartido": "room",
    "renta-temporal": "room",
    subarrendamiento: "room",
    "vivienda-estudiantes": "room",
    "hospedaje-corto-plazo": "room",
  },
  comerciales: {
    oficina: "commercial",
    "local-comercial": "commercial",
    bodega: "commercial",
    "nave-industrial": "commercial",
    "espacio-trabajo": "commercial",
    "terreno-comercial": "commercial",
  },
  alternativa: {
    "espacio-rv": "alternative",
    "espacio-casa-movil": "alternative",
    "tiny-home": "alternative",
    cabana: "alternative",
    "rancho-finca": "alternative",
    "otras-vivienda": "alternative",
  },
};

export function getTipoOptionsForSubcategory(subcategoryKey: string): RentasTipoOption[] {
  return TIPO_BY_SUBCAT[subcategoryKey] ?? [];
}

export function getRentasFieldGroupForTipo(
  subcategoryKey: string,
  tipoValue: string
): RentasFieldGroupKey | null {
  const byTipo = FIELD_GROUP_BY_SUBCAT_TIPO[subcategoryKey];
  if (!byTipo) return null;
  return byTipo[tipoValue] ?? null;
}

/** Branch: privado = Pro only; negocio = Business Standard / Business Plus. */
export type RentasBranch = "privado" | "negocio";

export const RENTAS_BRANCH_OPTIONS: RentasTipoOption[] = [
  { value: "privado", label: { es: "Privado (persona)", en: "Private (individual)" } },
  { value: "negocio", label: { es: "Negocio", en: "Business" } },
];

/** Detail field shape for Rentas (matches publish page DetailField). */
export type RentasDetailField = {
  key: string;
  label: { es: string; en: string };
  type: "text" | "number" | "select";
  placeholder?: { es: string; en: string };
  options?: Array<{ value: string; label: { es: string; en: string } }>;
};

/** Residential field group (apartamento, casa, etc.). */
export const RENTAS_FIELDS_RESIDENTIAL: RentasDetailField[] = [
  { key: "recamaras", label: { es: "Recámaras", en: "Bedrooms" }, type: "select", options: [
    { value: "studio", label: { es: "Estudio", en: "Studio" } },
    { value: "1", label: { es: "1", en: "1" } },
    { value: "2", label: { es: "2", en: "2" } },
    { value: "3", label: { es: "3", en: "3" } },
    { value: "4+", label: { es: "4+", en: "4+" } },
  ]},
  { key: "banos", label: { es: "Baños", en: "Bathrooms" }, type: "select", options: [
    { value: "1", label: { es: "1", en: "1" } },
    { value: "1.5", label: { es: "1.5", en: "1.5" } },
    { value: "2", label: { es: "2", en: "2" } },
    { value: "2.5", label: { es: "2.5", en: "2.5" } },
    { value: "3+", label: { es: "3+", en: "3+" } },
  ]},
  { key: "pies_cuadrados", label: { es: "Pies cuadrados / metros", en: "Square feet / meters" }, type: "text", placeholder: { es: "Ej: 1200", en: "e.g. 1200" } },
  { key: "amueblado", label: { es: "Amueblado", en: "Furnished" }, type: "select", options: [
    { value: "si", label: { es: "Sí", en: "Yes" } },
    { value: "no", label: { es: "No", en: "No" } },
  ]},
  { key: "estacionamiento", label: { es: "Estacionamiento", en: "Parking" }, type: "text", placeholder: { es: "Ej: 1 lugar incluido", en: "e.g. 1 space included" } },
  { key: "mascotas", label: { es: "Mascotas permitidas", en: "Pets allowed" }, type: "select", options: [
    { value: "si", label: { es: "Sí", en: "Yes" } },
    { value: "no", label: { es: "No", en: "No" } },
    { value: "gatos", label: { es: "Solo gatos", en: "Cats only" } },
    { value: "perros", label: { es: "Solo perros", en: "Dogs only" } },
  ]},
  { key: "servicios_incluidos", label: { es: "Servicios incluidos", en: "Utilities included" }, type: "text", placeholder: { es: "Ej: Agua, gas, luz", en: "e.g. Water, gas, electric" } },
  { key: "lavanderia", label: { es: "Lavandería", en: "Laundry" }, type: "select", options: [
    { value: "incluida", label: { es: "Incluida", en: "In unit" } },
    { value: "compartida", label: { es: "Compartida", en: "Shared" } },
    { value: "no", label: { es: "No", en: "No" } },
  ]},
  { key: "fumar", label: { es: "Fumar permitido", en: "Smoking" }, type: "select", options: [
    { value: "no", label: { es: "No", en: "No" } },
    { value: "exterior", label: { es: "Solo exterior", en: "Outside only" } },
    { value: "si", label: { es: "Sí", en: "Yes" } },
  ]},
  { key: "patio_balcon", label: { es: "Patio / balcón / jardín", en: "Patio / balcony / garden" }, type: "text", placeholder: { es: "Ej: Patio trasero", en: "e.g. Back patio" } },
  { key: "aire_calefaccion", label: { es: "Aire acondicionado / calefacción", en: "AC / heating" }, type: "text", placeholder: { es: "Ej: Central", en: "e.g. Central" } },
];

/** Room / temporary field group. */
export const RENTAS_FIELDS_ROOM: RentasDetailField[] = [
  { key: "tipo_habitacion", label: { es: "Tipo de habitación", en: "Room type" }, type: "text", placeholder: { es: "Ej: Privada", en: "e.g. Private" } },
  { key: "bano_privado_compartido", label: { es: "Baño privado o compartido", en: "Private or shared bath" }, type: "select", options: [
    { value: "privado", label: { es: "Privado", en: "Private" } },
    { value: "compartido", label: { es: "Compartido", en: "Shared" } },
  ]},
  { key: "amueblado", label: { es: "Amueblado", en: "Furnished" }, type: "select", options: [
    { value: "si", label: { es: "Sí", en: "Yes" } },
    { value: "no", label: { es: "No", en: "No" } },
  ]},
  { key: "acceso_cocina", label: { es: "Acceso a cocina", en: "Kitchen access" }, type: "select", options: [
    { value: "si", label: { es: "Sí", en: "Yes" } },
    { value: "no", label: { es: "No", en: "No" } },
  ]},
  { key: "servicios_incluidos", label: { es: "Servicios incluidos", en: "Utilities included" }, type: "text", placeholder: { es: "Ej: Agua, internet", en: "e.g. Water, internet" } },
  { key: "internet_incluido", label: { es: "Internet incluido", en: "Internet included" }, type: "select", options: [
    { value: "si", label: { es: "Sí", en: "Yes" } },
    { value: "no", label: { es: "No", en: "No" } },
  ]},
  { key: "duracion_minima", label: { es: "Duración mínima", en: "Minimum stay" }, type: "text", placeholder: { es: "Ej: 1 mes", en: "e.g. 1 month" } },
  { key: "duracion_maxima", label: { es: "Duración máxima", en: "Maximum stay" }, type: "text", placeholder: { es: "Ej: 6 meses", en: "e.g. 6 months" } },
  { key: "numero_personas", label: { es: "Número de personas permitido", en: "Number of people allowed" }, type: "text", placeholder: { es: "Ej: 1-2", en: "e.g. 1-2" } },
];

/** Commercial / utilitario field group. */
export const RENTAS_FIELDS_COMMERCIAL: RentasDetailField[] = [
  { key: "tamano_espacio", label: { es: "Tamaño del espacio", en: "Space size" }, type: "text", placeholder: { es: "Ej: 500 pies²", en: "e.g. 500 sq ft" } },
  { key: "uso_espacio", label: { es: "Uso del espacio", en: "Use of space" }, type: "text", placeholder: { es: "Ej: Oficina, retail", en: "e.g. Office, retail" } },
  { key: "estacionamiento", label: { es: "Estacionamiento", en: "Parking" }, type: "text", placeholder: { es: "Ej: 2 lugares", en: "e.g. 2 spaces" } },
  { key: "acceso_carga", label: { es: "Acceso de carga", en: "Loading access" }, type: "select", options: [
    { value: "si", label: { es: "Sí", en: "Yes" } },
    { value: "no", label: { es: "No", en: "No" } },
  ]},
  { key: "banos", label: { es: "Baños", en: "Bathrooms" }, type: "text", placeholder: { es: "Ej: 2", en: "e.g. 2" } },
  { key: "servicios_incluidos", label: { es: "Servicios incluidos", en: "Utilities included" }, type: "text", placeholder: { es: "Ej: Agua, luz", en: "e.g. Water, electric" } },
  { key: "disponibilidad", label: { es: "Disponibilidad", en: "Availability" }, type: "text", placeholder: { es: "Ej: Inmediata", en: "e.g. Immediate" } },
  { key: "plazo_contrato", label: { es: "Plazo del contrato", en: "Lease term" }, type: "text", placeholder: { es: "Ej: 1 año", en: "e.g. 1 year" } },
];

/** Alternative housing field group. */
export const RENTAS_FIELDS_ALTERNATIVE: RentasDetailField[] = [
  { key: "tipo_espacio", label: { es: "Tipo de espacio", en: "Type of space" }, type: "text", placeholder: { es: "Ej: Lote para RV", en: "e.g. RV lot" } },
  { key: "capacidad", label: { es: "Capacidad", en: "Capacity" }, type: "text", placeholder: { es: "Ej: 2 personas", en: "e.g. 2 people" } },
  { key: "servicios_incluidos", label: { es: "Servicios incluidos", en: "Utilities included" }, type: "text", placeholder: { es: "Ej: Agua, electricidad", en: "e.g. Water, electric" } },
  { key: "estacionamiento", label: { es: "Estacionamiento", en: "Parking" }, type: "text", placeholder: { es: "Ej: Incluido", en: "e.g. Included" } },
  { key: "amueblado", label: { es: "Amueblado", en: "Furnished" }, type: "select", options: [
    { value: "si", label: { es: "Sí", en: "Yes" } },
    { value: "no", label: { es: "No", en: "No" } },
  ]},
  { key: "acceso_terreno_patio", label: { es: "Acceso a terreno / patio", en: "Access to land / patio" }, type: "text", placeholder: { es: "Ej: Sí, área común", en: "e.g. Yes, common area" } },
  { key: "duracion_estancia", label: { es: "Duración de estancia", en: "Length of stay" }, type: "text", placeholder: { es: "Ej: Noche, semana, mes", en: "e.g. Night, week, month" } },
  { key: "reglas_especiales", label: { es: "Reglas especiales", en: "Special rules" }, type: "text", placeholder: { es: "Ej: Sin mascotas", en: "e.g. No pets" } },
];

const RENTAS_FIELDS_BY_GROUP: Record<RentasFieldGroupKey, RentasDetailField[]> = {
  residential: RENTAS_FIELDS_RESIDENTIAL,
  room: RENTAS_FIELDS_ROOM,
  commercial: RENTAS_FIELDS_COMMERCIAL,
  alternative: RENTAS_FIELDS_ALTERNATIVE,
};

/** Returns detail fields for Rentas given subcategoría and tipo de propiedad. */
export function getRentasDetailFields(
  subcategoryKey: string,
  tipoValue: string
): RentasDetailField[] {
  const group = getRentasFieldGroupForTipo(subcategoryKey, tipoValue);
  if (!group) return [];
  return RENTAS_FIELDS_BY_GROUP[group] ?? [];
}

/** Resolve tipo display label for a given subcat + value. */
export function getRentasTipoLabel(
  subcategoryKey: string,
  tipoValue: string,
  lang: "es" | "en"
): string {
  const opts = getTipoOptionsForSubcategory(subcategoryKey);
  const opt = opts.find((o) => o.value === tipoValue);
  return opt ? opt.label[lang] : tipoValue;
}
