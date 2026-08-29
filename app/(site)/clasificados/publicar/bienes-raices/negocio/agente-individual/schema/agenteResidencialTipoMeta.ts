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

/** Item 80 — "Un solo piso"/"Dos pisos" are story-count facts, not a property subtype (that's
 * what the separate `nivelesPropiedad` field is for), so they must not appear as selectable
 * options in the live "Subtipo" dropdown. `SUBTIPO_POR_TIPO` itself stays unchanged (closed
 * catalog, stored-value shape, `labelForSubtipo` for legacy reads) — this only filters which
 * options a NEW selection can pick from. If a draft already has a story-count value stored as
 * its subtipo (legacy), that value stays visible/selected in its own dropdown so editing an old
 * draft never silently blanks the field — it just can't be newly chosen going forward. */
export function selectableSubtipoOptionsForTipo(
  codigo: TipoPropiedadCodigo,
  currentValue?: string,
): ReadonlyArray<{ value: string; label: string }> {
  return SUBTIPO_POR_TIPO[codigo].filter(
    (o) => residencialSubtipoSemanticKind(o.value) !== "story_count" || o.value === currentValue,
  );
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

/**
 * Item 12 (Final Completion) — compatibility-safe semantic reclassification. Several stored
 * "subtipo" values are not actually a distinct property subtype (a different kind of home) —
 * they're a structural/physical/location attribute (story count, corner lot, floor level,
 * amenity, view) that happened to be modeled as a subtipo option historically.
 *
 * This is a display-layer adapter ONLY: `SUBTIPO_POR_TIPO` (the closed catalog, the stored
 * value shape, and every dropdown option) is completely unchanged — no destructive rename, no
 * migration, no stored-value change. Every legacy stored value still resolves to a label via
 * `labelForSubtipo`/`labelForSubtipoEn` exactly as before. This registry only changes which
 * ROW TITLE a preview renders the value's fact under (e.g. "Corner lot" under "Lot
 * characteristics" instead of implying it's a property subtype), and only when a caller opts in
 * via `residencialSubtipoDisplayGroup`.
 */
export type ResidencialSubtipoSemanticKind =
  | "subtype"
  | "story_count"
  | "corner_lot"
  | "floor_level"
  | "building_amenity"
  | "view";

const RESIDENCIAL_SUBTIPO_SEMANTIC_KIND: Record<string, ResidencialSubtipoSemanticKind> = {
  un_piso: "story_count",
  dos_pisos: "story_count",
  esquina: "corner_lot",
  planta_baja: "floor_level",
  elevador: "building_amenity",
  vista: "view",
};

export function residencialSubtipoSemanticKind(subvalor: string): ResidencialSubtipoSemanticKind {
  return RESIDENCIAL_SUBTIPO_SEMANTIC_KIND[String(subvalor ?? "").trim()] ?? "subtype";
}

const SUBTIPO_DISPLAY_GROUP_LABEL: Record<ResidencialSubtipoSemanticKind, { es: string; en: string }> = {
  subtype: { es: "Subtipo", en: "Subtype" },
  story_count: { es: "Detalle estructural", en: "Structural detail" },
  corner_lot: { es: "Característica del lote", en: "Lot characteristic" },
  floor_level: { es: "Nivel", en: "Floor level" },
  building_amenity: { es: "Amenidad del edificio", en: "Building amenity" },
  view: { es: "Vista", en: "View" },
};

/** The row title a preview should use for this stored subtipo value — "Subtipo" for a true
 * subtype, or a more accurate characteristic label for a value that was historically stored as
 * a subtipo but is really a structural/location/amenity attribute. */
export function residencialSubtipoDisplayGroup(subvalor: string, lang: "es" | "en" = "es"): string {
  const kind = residencialSubtipoSemanticKind(subvalor);
  return SUBTIPO_DISPLAY_GROUP_LABEL[kind][lang];
}
