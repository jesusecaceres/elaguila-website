/**
 * Tipos, subtipos y destacados para categorías Comercial y Terreno/lote (BR Negocio).
 * Sin opción «Otro».
 */

export type ComercialTipoCodigo =
  | "oficina"
  | "local"
  | "bodega"
  | "nave_industrial"
  | "uso_mixto"
  | "edificio_comercial";

export const COMERCIAL_TIPO_OPCIONES: ReadonlyArray<{ value: ComercialTipoCodigo; label: string }> = [
  { value: "oficina", label: "Oficina" },
  { value: "local", label: "Local" },
  { value: "bodega", label: "Bodega" },
  { value: "nave_industrial", label: "Nave industrial" },
  { value: "uso_mixto", label: "Uso mixto" },
  { value: "edificio_comercial", label: "Edificio comercial" },
];

export const COMERCIAL_SUBTIPO_POR_TIPO: Record<
  ComercialTipoCodigo,
  ReadonlyArray<{ value: string; label: string }>
> = {
  oficina: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "planta_abierta", label: "Planta abierta" },
    { value: "suite", label: "Suite" },
    { value: "piso_completo", label: "Piso completo" },
  ],
  local: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "frente_calle", label: "Frente a calle" },
    { value: "interior_plaza", label: "Interior de plaza" },
  ],
  bodega: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "con_rampa", label: "Con rampa / andén" },
    { value: "climatizada", label: "Climatizada" },
  ],
  nave_industrial: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "muelle", label: "Muelle de carga" },
    { value: "altura_libre", label: "Altura libre elevada" },
  ],
  uso_mixto: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "pb_comercio", label: "Planta baja comercio" },
    { value: "niveles_mixtos", label: "Niveles mixtos" },
  ],
  edificio_comercial: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "torre", label: "Torre" },
    { value: "strip", label: "Strip center" },
  ],
};

export const COMERCIAL_TIPO_LABEL_EN: Record<ComercialTipoCodigo, string> = {
  oficina: "Office",
  local: "Retail space",
  bodega: "Warehouse",
  nave_industrial: "Industrial building",
  uso_mixto: "Mixed use",
  edificio_comercial: "Commercial building",
};

export const COMERCIAL_SUBVALUE_LABEL_EN: Record<string, string> = {
  "": "— No extra detail",
  planta_abierta: "Open plan",
  suite: "Suite",
  piso_completo: "Full floor",
  frente_calle: "Street frontage",
  interior_plaza: "In plaza",
  con_rampa: "With ramp / dock",
  climatizada: "Climate-controlled",
  muelle: "Loading dock",
  altura_libre: "High clearance",
  pb_comercio: "Ground-floor retail",
  niveles_mixtos: "Mixed levels",
  torre: "Tower",
  strip: "Strip center",
};

export function labelComercialSubtipo(codigo: ComercialTipoCodigo, subvalor: string): string {
  const v = String(subvalor ?? "").trim();
  if (!v) return "";
  const hit = COMERCIAL_SUBTIPO_POR_TIPO[codigo].find((x) => x.value === v);
  return hit?.label ?? "";
}

export function labelComercialSubtipoEn(codigo: ComercialTipoCodigo, subvalor: string): string {
  const v = String(subvalor ?? "").trim();
  if (!v) return "";
  if (COMERCIAL_SUBVALUE_LABEL_EN[v]) return COMERCIAL_SUBVALUE_LABEL_EN[v];
  return labelComercialSubtipo(codigo, subvalor);
}

export type TerrenoTipoCodigo = "lote_residencial" | "lote_comercial" | "rancho" | "agricola" | "desarrollo";

export const TERRENO_TIPO_OPCIONES: ReadonlyArray<{ value: TerrenoTipoCodigo; label: string }> = [
  { value: "lote_residencial", label: "Lote residencial" },
  { value: "lote_comercial", label: "Lote comercial" },
  { value: "rancho", label: "Rancho" },
  { value: "agricola", label: "Terreno agrícola" },
  { value: "desarrollo", label: "Terreno para desarrollo" },
];

export const TERRENO_SUBTIPO_POR_TIPO: Record<
  TerrenoTipoCodigo,
  ReadonlyArray<{ value: string; label: string }>
> = {
  lote_residencial: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "esquina", label: "En esquina" },
    { value: "cul_de_sac", label: "Calle sin salida" },
  ],
  lote_comercial: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "esquina", label: "En esquina" },
    { value: "frente_vial", label: "Frente a vialidad" },
  ],
  rancho: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "con_casa", label: "Con vivienda" },
    { value: "pastizal", label: "Pastizal" },
  ],
  agricola: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "riegos", label: "Con riego" },
    { value: "secano", label: "Secano" },
  ],
  desarrollo: [
    { value: "", label: "— Sin detalle adicional" },
    { value: "urbanizable", label: "Urbanizable" },
    { value: "master_plan", label: "En master plan" },
  ],
};

export const TERRENO_TIPO_LABEL_EN: Record<TerrenoTipoCodigo, string> = {
  lote_residencial: "Residential lot",
  lote_comercial: "Commercial lot",
  rancho: "Ranch",
  agricola: "Agricultural land",
  desarrollo: "Development land",
};

export const TERRENO_SUBVALUE_LABEL_EN: Record<string, string> = {
  "": "— No extra detail",
  esquina: "Corner lot",
  cul_de_sac: "Cul-de-sac",
  frente_vial: "Road frontage",
  con_casa: "With dwelling",
  pastizal: "Pasture",
  riegos: "Irrigated",
  secano: "Dryland",
  urbanizable: "Urbanizable",
  master_plan: "In master plan",
};

export function labelTerrenoSubtipo(codigo: TerrenoTipoCodigo, subvalor: string): string {
  const v = String(subvalor ?? "").trim();
  if (!v) return "";
  const hit = TERRENO_SUBTIPO_POR_TIPO[codigo].find((x) => x.value === v);
  return hit?.label ?? "";
}

export function labelTerrenoSubtipoEn(codigo: TerrenoTipoCodigo, subvalor: string): string {
  const v = String(subvalor ?? "").trim();
  if (!v) return "";
  if (TERRENO_SUBVALUE_LABEL_EN[v]) return TERRENO_SUBVALUE_LABEL_EN[v];
  return labelTerrenoSubtipo(codigo, subvalor);
}

export type ComercialDestacadoId =
  | "recepcion"
  | "elevador"
  | "acceso_carga"
  | "alto_trafico"
  | "senalizacion"
  | "seguridad"
  | "listo_operar"
  | "oficinas_privadas"
  | "sala_juntas"
  | "area_almacen";

export const COMERCIAL_DESTACADOS_DEFS: ReadonlyArray<{ id: ComercialDestacadoId; label: string }> = [
  { id: "recepcion", label: "Recepción" },
  { id: "elevador", label: "Elevador" },
  { id: "acceso_carga", label: "Acceso de carga" },
  { id: "alto_trafico", label: "Alto tráfico" },
  { id: "senalizacion", label: "Señalización" },
  { id: "seguridad", label: "Seguridad" },
  { id: "listo_operar", label: "Listo para operar" },
  { id: "oficinas_privadas", label: "Oficinas privadas" },
  { id: "sala_juntas", label: "Sala de juntas" },
  { id: "area_almacen", label: "Área de almacén" },
];

export const COMERCIAL_DESTACADO_EN: Record<ComercialDestacadoId, string> = {
  recepcion: "Reception",
  elevador: "Elevator",
  acceso_carga: "Loading access",
  alto_trafico: "High foot traffic",
  senalizacion: "Signage",
  seguridad: "Security",
  listo_operar: "Move-in ready",
  oficinas_privadas: "Private offices",
  sala_juntas: "Conference room",
  area_almacen: "Storage area",
};

export type TerrenoDestacadoId =
  | "pozo"
  | "arboles"
  | "arboles_frutales"
  | "vista"
  | "acceso_pavimentado"
  | "cercado"
  | "destacado_agricola"
  | "destacado_comercial"
  | "listo_construir"
  | "cerca_servicios";

export const TERRENO_DESTACADOS_DEFS: ReadonlyArray<{ id: TerrenoDestacadoId; label: string }> = [
  { id: "pozo", label: "Pozo" },
  { id: "arboles", label: "Árboles" },
  { id: "arboles_frutales", label: "Árboles frutales" },
  { id: "vista", label: "Vista" },
  { id: "acceso_pavimentado", label: "Acceso pavimentado" },
  { id: "cercado", label: "Cercado" },
  { id: "destacado_agricola", label: "Agrícola" },
  { id: "destacado_comercial", label: "Uso comercial viable" },
  { id: "listo_construir", label: "Listo para construir" },
  { id: "cerca_servicios", label: "Cerca de servicios" },
];

export const TERRENO_DESTACADO_EN: Record<TerrenoDestacadoId, string> = {
  pozo: "Well",
  arboles: "Trees",
  arboles_frutales: "Fruit trees",
  vista: "View",
  acceso_pavimentado: "Paved access",
  cercado: "Fenced",
  destacado_agricola: "Agricultural",
  destacado_comercial: "Commercial potential",
  listo_construir: "Ready to build",
  cerca_servicios: "Near utilities / services",
};

export function normalizeComercialTipoCodigo(raw: unknown): ComercialTipoCodigo {
  const v = typeof raw === "string" ? raw : "";
  return COMERCIAL_TIPO_OPCIONES.some((o) => o.value === v) ? (v as ComercialTipoCodigo) : "oficina";
}

export function normalizeTerrenoTipoCodigo(raw: unknown): TerrenoTipoCodigo {
  const v = typeof raw === "string" ? raw : "";
  return TERRENO_TIPO_OPCIONES.some((o) => o.value === v) ? (v as TerrenoTipoCodigo) : "lote_residencial";
}
