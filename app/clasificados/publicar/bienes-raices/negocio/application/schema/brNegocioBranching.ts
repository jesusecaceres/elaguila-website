import type { BienesRaicesPublicationType, DeepDetailGroupKey } from "./bienesRaicesNegocioFormState";

const RESIDENTIAL_KEYS = new Set([
  "piscina",
  "cocinaRemodelada",
  "electrodomesticosLujo",
  "cuartoPrincipalGrande",
  "walkInCloset",
  "oficinaEnCasa",
  "chimenea",
  "lavanderia",
  "techosAltos",
]);

const TERRENO_EXCLUDE = new Set([
  ...RESIDENTIAL_KEYS,
  "balcon",
  "terraza",
  "gimnasio",
  "comunidadCerrada",
  "amenidadesDesarrollo",
  "elevador",
]);

const COMERCIAL_EXCLUDE = new Set([
  "piscina",
  "chimenea",
  "cuartoPrincipalGrande",
  "walkInCloset",
  "oficinaEnCasa",
  "amenidadesDesarrollo",
]);

/** Which preset highlight keys apply to the publication type (state is preserved when type changes). */
export function isBrNegocioHighlightKeyApplicable(
  key: string,
  pub: BienesRaicesPublicationType
): boolean {
  if (!pub || pub === "residencial_venta" || pub === "residencial_renta") return true;
  if (pub === "terreno") return !TERRENO_EXCLUDE.has(key);
  if (pub === "comercial") return !COMERCIAL_EXCLUDE.has(key);
  if (pub === "proyecto_nuevo") {
    if (key === "comunidadCerrada") return false;
    return true;
  }
  if (pub === "multifamiliar_inversion") {
    if (key === "cuartoPrincipalGrande" || key === "walkInCloset") return false;
    return true;
  }
  return true;
}

const ORDER_FULL: DeepDetailGroupKey[] = [
  "tipoYEstilo",
  "construccion",
  "interior",
  "exterior",
  "estacionamiento",
  "loteTerreno",
  "utilidades",
  "comunidadHoa",
  "financiera",
  "escuelasUbicacion",
  "identificadores",
  "observacionesAgente",
];

const ORDER_TERRENO: DeepDetailGroupKey[] = [
  "tipoYEstilo",
  "loteTerreno",
  "utilidades",
  "identificadores",
  "financiera",
  "observacionesAgente",
];

const ORDER_COMERCIAL: DeepDetailGroupKey[] = [
  "tipoYEstilo",
  "construccion",
  "interior",
  "exterior",
  "estacionamiento",
  "utilidades",
  "financiera",
  "identificadores",
  "observacionesAgente",
];

const ORDER_PROYECTO: DeepDetailGroupKey[] = [
  "tipoYEstilo",
  "construccion",
  "exterior",
  "comunidadHoa",
  "utilidades",
  "financiera",
  "escuelasUbicacion",
  "identificadores",
  "observacionesAgente",
];

const ORDER_MULTIFAM: DeepDetailGroupKey[] = [
  "tipoYEstilo",
  "construccion",
  "interior",
  "exterior",
  "estacionamiento",
  "utilidades",
  "comunidadHoa",
  "financiera",
  "identificadores",
  "observacionesAgente",
];

export function deepDetailGroupsForPublication(pub: BienesRaicesPublicationType): DeepDetailGroupKey[] {
  switch (pub) {
    case "terreno":
      return ORDER_TERRENO;
    case "comercial":
      return ORDER_COMERCIAL;
    case "proyecto_nuevo":
      return ORDER_PROYECTO;
    case "multifamiliar_inversion":
      return ORDER_MULTIFAM;
    default:
      return ORDER_FULL;
  }
}
