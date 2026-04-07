/**
 * En Venta — lightweight query expansion for lista search (Spanish + English cues).
 */

import type { EnVentaDepartmentKey } from "./categories";

const SYNONYM_GROUPS: string[][] = [
  ["iphone", "celular", "teléfono", "telefono", "android", "smartphone", "phone"],
  ["laptop", "macbook", "computadora", "pc", "notebook"],
  ["sofa", "sillón", "sillon", "couch"],
  ["bicicleta", "bike", "bici", "ciclismo"],
  ["carro", "coche", "auto", "truck", "troca", "camioneta"],
  ["herramienta", "taladro", "sierra", "tool", "drill"],
  ["mueble", "furniture", "mesa", "silla"],
  ["ropa", "clothes", "zapatos", "shoes", "tenis"],
  ["juguetes", "toys", "lego", "muñeca", "muneca"],
  ["consola", "playstation", "xbox", "nintendo", "videojuego"],
  ["cámara", "camara", "camera", "lente", "lens"],
];

/** Map loose tokens to canonical department hints for browse rail (optional). */
export const KEYWORD_TO_DEPT_HINT: Array<{ re: RegExp; dept: EnVentaDepartmentKey }> = [
  { re: /iphone|android|pixel|galaxy|tablet|ipad|macbook|laptop|tv|televisi[oó]n|headphone|aud[ií]fono/i, dept: "electronicos" },
  { re: /sofa|sill[oó]n|colch[oó]n|mesa|silla|escritorio|mueble/i, dept: "muebles" },
  { re: /ropa|zapatos|tenis|chamarra|vestido|bolsa/i, dept: "ropa-accesorios" },
  { re: /beb[eé]|ni[nñ]o|stroller|coche|car seat|cuna/i, dept: "bebes-ninos" },
  { re: /taladro|sierra|herramienta|dewalt|makita/i, dept: "herramientas" },
  { re: /llanta|rin|rine|freno|bater[ií]a|aceite|auto part/i, dept: "vehiculos-partes" },
  { re: /bici|bicicleta|pesa|gym|raqueta|bal[oó]n/i, dept: "deportes" },
  { re: /juguete|lego|mu[nñ]eca|consola|nintendo|playstation/i, dept: "juguetes-juegos" },
  { re: /colecci[oó]n|moneda|arte|antig/i, dept: "coleccionables" },
  { re: /guitar|piano|c[aá]mara|lente|tr[ií]pode/i, dept: "musica-foto-video" },
];

export function expandEnVentaSearchTerms(raw: string): string[] {
  const q = raw.trim().toLowerCase();
  if (!q) return [];
  const parts = new Set<string>([q]);
  for (const group of SYNONYM_GROUPS) {
    if (group.some((g) => q.includes(g))) {
      for (const g of group) parts.add(g);
    }
  }
  return [...parts];
}

export function inferDeptFromQuery(raw: string): EnVentaDepartmentKey | null {
  const q = raw.trim();
  if (!q) return null;
  for (const { re, dept } of KEYWORD_TO_DEPT_HINT) {
    if (re.test(q)) return dept;
  }
  return null;
}
